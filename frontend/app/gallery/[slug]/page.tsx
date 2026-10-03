import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getGalleryData, getContactsData, getImageUrl } from '@/hooks/useApi';
import { loadOrBuildFallback } from '@/lib/buildPhase';
import { buildContactChannels } from '@/lib/contactChannels';
import MobileContactBar from './MobileContactBar';
import { resolveArtworkBySlug } from '@/lib/artworkSlug';
import { isExhibitionPhoto } from '@/lib/gallery';
import ArtworkInfoCard from './ArtworkInfoCard';
import { normalizeTitle } from '@/lib/normalizeTitle';
import { resolveStatus } from '@/lib/artworkStatus';
import ArtworkGallery from './ArtworkGallery';
import RelatedWorks from './RelatedWorks';
import {
  ARTIST_NAME,
  artworkPageUrl,
  buildArtworkSchema,
  buildBreadcrumbSchema,
  buildSeoDescription,
  buildSeoTitle,
} from './artworkSeo';
import type { ContactsData } from '@/lib/api';
import { getArtworkPhotos } from '@/lib/artworkPhotos';

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

interface ArtworkPageProps {
  params: { slug: string };
}

// Metadata must never throw for an unresolvable slug — the page itself
// renders the 404 via notFound(); metadata simply falls back to empty so a
// missing artwork never turns into a 500 (S3 constraint on graceful 404s).
export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  let galleryData;
  try {
    galleryData = await getGalleryData();
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {};
  }
  const artwork = galleryData ? resolveArtworkBySlug(params.slug, galleryData.artworks) : null;

  if (!artwork) {
    return {};
  }

  const title = buildSeoTitle(artwork);
  const description = buildSeoDescription(artwork);
  const url = artworkPageUrl(artwork);
  const imageUrl = getImageUrl(artwork.imagePath);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: `${ARTIST_NAME} - Художник-импрессионист`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: normalizeTitle(artwork.title),
        },
      ],
      locale: 'ru_RU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

const categoryIdOf = (artwork: any) => artwork.category?.id ?? artwork.categoryId;

const categoryNameOf = (artwork: any, categories: any[]) =>
  artwork.category?.name ?? categories?.find((category) => category.id === artwork.categoryId)?.name;

const ArtworkPage = async ({ params }: ArtworkPageProps) => {
  let galleryData;
  try {
    galleryData = await getGalleryData();
  } catch (error) {
    if ((error as any)?.response?.status === 404) {
      notFound();
    }
    throw error;
  }
  const artwork = galleryData ? resolveArtworkBySlug(params.slug, galleryData.artworks) : null;

  if (!artwork) {
    notFound();
  }

  const categories = galleryData?.categories || [];
  const displayTitle = normalizeTitle(artwork.title);

  const categoryName = categoryNameOf(artwork, categories);
  const photos = getArtworkPhotos(artwork);
  const showChannels = !isExhibitionPhoto(artwork, categories);
  const contacts = showChannels
    ? await loadOrBuildFallback(getContactsData, { socialLinks: {} } as ContactsData).catch(() => null)
    : null;
  const channels = contacts
    ? buildContactChannels({
        title: displayTitle,
        url: artworkPageUrl(artwork),
        socialLinks: contacts.socialLinks,
        phone: contacts.phone,
      })
    : [];

  // Other for-sale works from the same category, excluding this one and
  // exhibition photos (S2-AS6/S2-AS7): an artwork alone in its category
  // simply gets no section at all.
  const relatedWorks = (galleryData?.artworks || []).filter(
    (candidate: any) =>
      candidate.id !== artwork.id &&
      resolveStatus(candidate) === 'Available' &&
      !isExhibitionPhoto(candidate, categories) &&
      categoryIdOf(candidate) === categoryIdOf(artwork)
  );

  return (
    <div className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArtworkSchema(artwork, photos, categoryName)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(artwork)) }}
      />

      {/* pt-24 clears the fixed site header, which otherwise covers the top of
          the painting on this page. */}
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-24 md:pb-16">
        <nav aria-label="breadcrumbs" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ink-500">
          <Link href="/" className="transition-colors hover:text-sea">Главная</Link>
          <span aria-hidden="true">/</span>
          <Link href="/gallery" className="transition-colors hover:text-sea">Галерея</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">{displayTitle}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          <ArtworkGallery
            photos={photos.map((photo) => ({ src: getImageUrl(photo.path), thumb: getImageUrl(photo.thumbPath) }))}
            title={displayTitle}
          />

          <ArtworkInfoCard artwork={artwork} categoryName={categoryName} categories={categories} channels={channels} />
        </div>

        <RelatedWorks works={relatedWorks} categoryId={categoryIdOf(artwork)} />
      </div>

      {showChannels && <MobileContactBar channels={channels} artwork={displayTitle} artworkId={artwork.id} />}
    </div>
  );
};

export default ArtworkPage;
