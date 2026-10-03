import { ChangeEvent, FormEvent } from 'react';
import { Button, Input, Textarea } from '@/components/ui';

export interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website: string;
}

interface Props {
  formData: ContactFormState;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isSubmitting: boolean;
  submissionResult: 'success' | 'error' | null;
  errorMessage: string;
  validationError: string | null;
}

const ContactFormFields = ({
  formData, onChange, onSubmit, isSubmitting, submissionResult, errorMessage, validationError,
}: Props) => (
  <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/*
        Honeypot anti-spam field (@S3-AS1/@S3-AS2). Kept in the
        accessibility tree removed and out of the tab order so
        screen-reader/keyboard users never encounter it, but not
        display:none/visibility:hidden, since some bots skip
        fields hidden that way. Left empty by humans; any bot
        that fills every input trips it and the server silently
        discards the submission.
      */}
      <div
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
        aria-hidden="true"
      >
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={onChange}
        />
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Имя *" id="name" name="name" type="text" required value={formData.name} onChange={onChange} />
        <Input label="Email" id="email" name="email" type="email" value={formData.email} onChange={onChange} />
      </div>

      <Input
        label="Телефон или мессенджер"
        id="phone"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={onChange}
        placeholder="Телефон, Telegram, WhatsApp или MAX"
        hint="Укажите телефон, мессенджер или email — как вам удобнее получить ответ."
        error={validationError ?? undefined}
      />

      <Input label="Тема" id="subject" name="subject" type="text" value={formData.subject} onChange={onChange} />

      <Textarea label="Сообщение *" id="message" name="message" rows={6} required value={formData.message} onChange={onChange} className="resize-none" />

      <Button type="submit" disabled={isSubmitting} className="w-full py-3">
        {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
      </Button>
      {submissionResult === 'success' && (
        <p className="text-sea text-center mt-4">Сообщение успешно отправлено!</p>
      )}
      {submissionResult === 'error' && (
        <p className="text-red-700 text-center mt-4">{errorMessage}</p>
      )}
    </form>
);

export default ContactFormFields;
