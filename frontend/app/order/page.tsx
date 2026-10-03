import type { Metadata } from 'next';
import OrderForm from './OrderForm';

export const metadata: Metadata = {
  title: 'Картина на заказ — Анжела Моисеенко',
  description:
    'Закажите картину маслом по своему сюжету: согласуем эскиз, после предоплаты напишу работу и доставлю её вам.',
  alternates: { canonical: '/order' },
};

const STEPS = [
  'Сюжет — расскажите, что хотите увидеть на картине',
  'Эскиз — согласуем композицию и цвета',
  'Предоплата — фиксируем заказ',
  'Работа — пишу картину маслом',
  'Доставка — отправляю или передаю лично',
];

const OrderPage = ({ searchParams }: { searchParams?: { artwork?: string | string[] } }) => {
  const raw = searchParams?.artwork;
  const artwork = (Array.isArray(raw) ? raw[0] : raw)?.trim() || undefined;

  return (
    <div className="min-h-screen bg-paper pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-ink mb-6">Картина на заказ</h1>
        <p className="text-xl text-ink-600 mb-8 prose-measure">
          Напишу картину по вашему сюжету, размеру и под ваш интерьер.
        </p>
        <ol className="mb-12 space-y-2 text-ink-600 list-decimal pl-6">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <OrderForm artwork={artwork} />
      </div>
    </div>
  );
};

export default OrderPage;
