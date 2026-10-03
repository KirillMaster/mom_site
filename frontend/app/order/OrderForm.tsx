'use client';

import { useState } from 'react';
import { sendContactMessage } from '@/hooks/useApi';
import { getStoredUtm } from '@/lib/utm';
import { Goals, reachGoal } from '@/lib/analytics';
import { botLink } from '@/lib/funnelBot';
import { Button, Input, Textarea } from '@/components/ui';
import type { ContactMessage } from '@/lib/api';

export const ORDER_SUBJECT = 'Картина на заказ';

export interface OrderValues {
  name: string;
  contact: string;
  subjectText: string;
  size: string;
  comment: string;
}

type Errors = Partial<Record<'name' | 'contact' | 'subjectText', string>>;

const contactFields = (contact: string): Pick<ContactMessage, 'email' | 'phone' | 'telegramUsername'> => {
  const value = contact.trim();
  if (value.includes('@') && !value.startsWith('@')) return { email: value };
  if (value.startsWith('@')) return { telegramUsername: value };
  if (/\d/.test(value)) return { phone: value };
  return { telegramUsername: value };
};

export const buildOrderRequest = (values: OrderValues): ContactMessage => {
  const lines = [`Сюжет: ${values.subjectText.trim()}`];
  if (values.size.trim()) lines.push(`Размер: ${values.size.trim()}`);
  if (values.comment.trim()) lines.push(`Комментарий: ${values.comment.trim()}`);
  return {
    name: values.name.trim(),
    ...contactFields(values.contact),
    subject: ORDER_SUBJECT,
    message: lines.join('\n'),
  };
};

const validate = (values: OrderValues): Errors => {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'Укажите имя';
  if (!values.contact.trim()) errors.contact = 'Укажите телефон, email или мессенджер';
  if (!values.subjectText.trim()) errors.subjectText = 'Опишите желаемый сюжет';
  return errors;
};

const OrderForm = ({ artwork }: { artwork?: string }) => {
  const [values, setValues] = useState<OrderValues>({
    name: '',
    contact: '',
    subjectText: '',
    size: '',
    comment: artwork ? `Хочу похожую на «${artwork}»` : '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const bind = (key: keyof OrderValues) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus('sending');
    try {
      const utm = getStoredUtm();
      await sendContactMessage({ ...buildOrderRequest(values), ...utm });
      reachGoal(Goals.CustomOrderSubmit, { ...utm });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <p role="status" className="rounded-md border border-line bg-paper-50 p-6 text-ink">
        Спасибо! Заявка отправлена, я свяжусь с вами в ближайшее время.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input label="Имя" required autoComplete="name" error={errors.name} {...bind('name')} />
      <Input
        label="Как с вами связаться"
        required
        hint="Телефон, email или @ник в Telegram"
        error={errors.contact}
        {...bind('contact')}
      />
      <Textarea label="Сюжет" required rows={3} error={errors.subjectText} {...bind('subjectText')} />
      <Input label="Размер" hint="Например, 60x80 см" {...bind('size')} />
      <Textarea label="Комментарий" rows={3} {...bind('comment')} />
      {status === 'error' && (
        <p role="alert" className="text-sm text-red-700">
          Не удалось отправить заявку. Попробуйте ещё раз или напишите мне в{' '}
          <a href={botLink('order')} target="_blank" rel="noopener noreferrer" className="underline">
            мессенджер
          </a>
          .
        </p>
      )}
      <Button type="submit" disabled={status === 'sending'}>
        Отправить
      </Button>
    </form>
  );
};

export default OrderForm;
