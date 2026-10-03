const FACTS = [
  'Член Союза художников России',
  'Работы в музейных собраниях',
  'Коллекционеры в 12 странах',
];

const TrustStrip = () => (
  <section aria-label="Доверие" className="bg-paper-50 border-y border-line">
    <ul className="max-w-7xl mx-auto px-4 py-6 grid gap-4 sm:grid-cols-3 text-center">
      {FACTS.map((fact) => (
        <li key={fact} className="flex items-center justify-center gap-3 text-ink font-medium">
          <span className="w-2 h-2 rounded-full bg-ochre shrink-0" aria-hidden="true" />
          <span>{fact}</span>
        </li>
      ))}
    </ul>
  </section>
);

export default TrustStrip;
