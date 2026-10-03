import Link from 'next/link';
import { isExhibitionPhoto } from '@/lib/gallery';
import { normalizeTitle } from '@/lib/normalizeTitle';
import MuseumLabel from '@/components/artwork/MuseumLabel';
import { resolveStatus } from '@/lib/artworkStatus';
import type { ArtworkDto, GalleryData } from '@/lib/api';
import AskPriceButton from './AskPriceButton';
import ContactChannels from './ContactChannels';
import type { ContactChannel } from '@/lib/contactChannels';

interface Props {
  artwork: ArtworkDto;
  categoryName?: string;
  categories: GalleryData['categories'];
  channels?: ContactChannel[];
}

const ArtworkInfoCard = ({ artwork, categoryName, categories, channels = [] }: Props) => {
  const isExhibition = isExhibitionPhoto(artwork, categories);
  const available = resolveStatus(artwork) === 'Available';

  return (
    <aside className="lg:sticky lg:top-28">
      <div className="rounded-md border border-line bg-paper-50 p-6 md:p-8">
        {categoryName && (
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-sea">{categoryName}</p>
        )}

        <MuseumLabel artwork={artwork} exhibition={isExhibition} as="h1" size="md" />

        {artwork.shortDescription && <p className="mt-4 text-lg text-ink-600">{artwork.shortDescription}</p>}

        {artwork.description && <p className="prose-measure mt-4 leading-relaxed text-ink-600">{artwork.description}</p>}

        {!isExhibition && (
          <div className="mt-6">
            <AskPriceButton
              title={normalizeTitle(artwork.title)}
              id={artwork.id}
              variant={available ? 'price' : 'similar'}
            />
            <ContactChannels channels={channels} artwork={normalizeTitle(artwork.title)} />
          </div>
        )}

        <Link
          href="/gallery"
          className="mt-6 inline-block text-sm font-medium text-sea transition-colors hover:text-sea-700 hover:underline"
        >
          ← Вернуться в галерею
        </Link>
      </div>
    </aside>
  );
};

export default ArtworkInfoCard;
