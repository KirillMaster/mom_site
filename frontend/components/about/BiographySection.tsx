import { getImageUrl } from '@/hooks/useApi';
import { fullBio } from '@/data/biography';

const tags = ['Импрессионизм', 'Театральное искусство', 'Натюрморты'];

export default function BiographySection({ artistPhoto }: { artistPhoto: string }) {
  return (
    <section className="py-16 md:py-24 bg-paper-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="reveal">
            {/* The portrait keeps the face in the top third of the frame, so a
                centred crop inside this wide box cut the eyes off. */}
            <img
              src={getImageUrl(artistPhoto)}
              alt="Анжела Моисеенко - Художник-импрессионист"
              className="w-full h-96 object-cover object-top rounded-md border border-line"
            />
          </div>

          <div className="reveal">
            <h2 className="mb-6">Анжела Моисеенко</h2>
            {/* The biography is a long, factual history kept in the repo;
                the CMS still supplies the banner, the photo and the quote. */}
            <div className="prose-measure">
              {fullBio.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-lg text-ink-600 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>

            <ul className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <li key={tag} className="border border-line bg-paper-200 text-ink-600 px-4 py-2 rounded-full text-sm font-medium">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
