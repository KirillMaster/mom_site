import { notFound } from 'next/navigation';
import { getGalleryData } from '@/hooks/useApi';
import { resolveArtworkBySlug } from '@/lib/artworkSlug';

export const dynamic = 'force-dynamic';

interface ArtworkPageProps {
  params: { slug: string };
}

const ArtworkPage = async ({ params }: ArtworkPageProps) => {
  const galleryData = await getGalleryData();
  const artwork = galleryData ? resolveArtworkBySlug(params.slug, galleryData.artworks) : null;

  if (!artwork) {
    notFound();
  }

  const getAskPriceHref = () =>
    `/contacts?artwork=${encodeURIComponent(artwork.title)}&id=${artwork.id}`;

  return (
    <div className="min-h-screen">
      <h1>{artwork.title}</h1>
      {artwork.isForSale && (
        <a href={getAskPriceHref()}>Узнать цену</a>
      )}
    </div>
  );
};

export default ArtworkPage;
