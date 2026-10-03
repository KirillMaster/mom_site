export const DEFAULT_HOW_TO_BUY = [
  'Доставка: СДЭК по России или лично в руки по Крыму',
  'Оплата: переводом на карту после согласования',
  'Сертификат подлинности прилагается к каждой работе',
  'Возврат: 14 дней, если работа не подошла',
];

const paragraphsOf = (text?: string | null): string[] =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

const HowToBuy = ({ text }: { text?: string | null }) => {
  const paragraphs = paragraphsOf(text);

  return (
    <div role="region" aria-labelledby="how-to-buy-heading" data-testid="how-to-buy" className="rounded-md border border-line bg-paper-50 p-6">
      <h2 id="how-to-buy-heading" className="mb-4 font-serif text-2xl font-medium text-ink">
        Как купить
      </h2>
      {paragraphs.length > 0 ? (
        <div className="space-y-3 leading-relaxed text-ink-600">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <ul className="space-y-2 text-ink-600">
          {DEFAULT_HOW_TO_BUY.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-ochre" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HowToBuy;
