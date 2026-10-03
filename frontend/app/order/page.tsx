import type { Metadata } from 'next';
import OrderForm from './OrderForm';

export const metadata: Metadata = {
  title: 'Картина на заказ в Севастополе — художник Анжела Моисеенко',
  description:
    'Картина маслом на заказ от художника из Севастополя: по вашему сюжету, фото или под интерьер. Согласуем эскиз, напишу работу и доставлю по Крыму и России.',
  alternates: { canonical: '/order' },
};

const STEPS = [
  'Сюжет — расскажите, что хотите увидеть на картине',
  'Эскиз — согласуем композицию и цвета',
  'Предоплата — фиксируем заказ',
  'Работа — пишу картину маслом',
  'Доставка — отправляю или передаю лично',
];

const SUBJECTS = [
  'Морской пейзаж или вид Севастополя и Крыма',
  'Натюрморт или цветы под цвета вашего интерьера',
  'Картина по вашей фотографии — памятное место, дом, сад',
  'Театральный или жанровый сюжет',
  'Повтор или вариация понравившейся работы из галереи',
];

const FAQ = [
  {
    q: 'Сколько стоит картина на заказ?',
    a: 'Стоимость зависит от размера, сложности сюжета и сроков. Опишите идею в форме ниже — я отвечу и назову цену до начала работы.',
  },
  {
    q: 'Сколько времени пишется картина?',
    a: 'Срок зависит от размера и сюжета, его мы фиксируем вместе с эскизом. Масляной живописи также нужно время, чтобы просохнуть перед отправкой.',
  },
  {
    q: 'Можно ли заказать картину по фотографии?',
    a: 'Да. Пришлите фото — я предложу композицию и формат, чтобы картина смотрелась живописно, а не как копия снимка.',
  },
  {
    q: 'Как получить картину, если я не в Севастополе?',
    a: 'Работу можно забрать лично в Севастополе или получить доставкой по Крыму и России. Картину бережно упаковывают для перевозки.',
  },
  {
    q: 'Можно ли увидеть работы вживую?',
    a: 'Да, в Севастополе можно договориться о встрече и посмотреть картины. Напишите, какие работы вас интересуют.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Картина маслом на заказ',
  serviceType: 'Живопись на заказ',
  url: 'https://angelamoiseenko.ru/order',
  provider: { '@type': 'Person', '@id': 'https://angelamoiseenko.ru/#artist', name: 'Анжела Моисеенко' },
  areaServed: [
    { '@type': 'City', name: 'Севастополь' },
    { '@type': 'AdministrativeArea', name: 'Крым' },
    { '@type': 'Country', name: 'Россия' },
  ],
};

const OrderPage = ({ searchParams }: { searchParams?: { artwork?: string | string[] } }) => {
  const raw = searchParams?.artwork;
  const artwork = (Array.isArray(raw) ? raw[0] : raw)?.trim() || undefined;

  return (
    <div className="min-h-screen bg-paper pt-32 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-ink mb-6">Картина на заказ в Севастополе</h1>
        <p className="text-xl text-ink-600 mb-4 prose-measure">
          Напишу картину маслом по вашему сюжету, размеру и под ваш интерьер.
        </p>
        <p className="text-ink-600 mb-8 prose-measure">
          Я живу и работаю в Севастополе. Пишу маслом на холсте в импрессионистской манере — с живым мазком, светом и
          цветом Крыма. Мои работы есть в частных коллекциях 12 стран. Заказную картину можно забрать лично или получить
          доставкой по Крыму и всей России.
        </p>

        <h2 className="text-2xl md:text-3xl font-serif font-medium text-ink mb-4">Как проходит заказ</h2>
        <ol className="mb-10 space-y-2 text-ink-600 list-decimal pl-6">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <h2 className="text-2xl md:text-3xl font-serif font-medium text-ink mb-4">Что можно заказать</h2>
        <ul className="mb-10 space-y-2 text-ink-600 list-disc pl-6">
          {SUBJECTS.map((subject) => (
            <li key={subject}>{subject}</li>
          ))}
        </ul>
        <p className="mb-12 text-ink-600 prose-measure">
          Посмотреть манеру и выбрать направление можно в{' '}
          <a href="/gallery" className="text-sea underline underline-offset-4 hover:text-sea-700">галерее работ</a>
          {' '}— если понравилась проданная картина, напишу похожую.
        </p>

        <OrderForm artwork={artwork} />

        <h2 className="mt-16 text-2xl md:text-3xl font-serif font-medium text-ink mb-6">Частые вопросы</h2>
        <dl className="space-y-6">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-semibold text-ink">{q}</dt>
              <dd className="mt-1 text-ink-600 prose-measure">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default OrderPage;
