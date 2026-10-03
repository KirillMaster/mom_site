import { collections, publications, stonePanels } from '@/data/biography';

const shell = 'max-w-4xl mx-auto px-4';

export function StonePanelsSection() {
  return (
    <section className="py-16 md:py-24 bg-paper-50">
      <div className={shell}>
        <div className="reveal border-l-4 border-ochre pl-6">
          <h2 className="mb-6">{stonePanels.title}</h2>
          <p className="text-lg text-ink-600 leading-relaxed prose-measure">{stonePanels.text}</p>
        </div>
      </div>
    </section>
  );
}

export function PublicationsSection() {
  return (
    <section className="py-16 md:py-24 bg-paper-50">
      <div className={shell}>
        <h2 className="reveal mb-12">Публикации о творчестве</h2>
        <ul className="space-y-4">
          {publications.map((publication) => (
            <li
              key={`${publication.year}-${publication.text}`}
              className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-line pb-4"
            >
              <span className="text-ochre-700 font-semibold shrink-0 w-24">{publication.year}</span>
              <span className="text-ink-600 leading-relaxed">{publication.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CollectionsSection() {
  return (
    <section className="py-16 md:py-24 bg-paper-200">
      <div className={shell}>
        <h2 className="reveal mb-12">Работы в собраниях</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-xl font-semibold mb-4">Музеи</h3>
            <ul className="space-y-2">
              {collections.museums.map((museum) => (
                <li key={museum} className="text-ink-600 leading-relaxed">
                  {museum}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Частные коллекции</h3>
            <div className="flex flex-wrap gap-2">
              {collections.countries.map((country) => (
                <span key={country} className="bg-paper-50 text-ink-600 border border-line px-3 py-1 rounded-full text-sm">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
