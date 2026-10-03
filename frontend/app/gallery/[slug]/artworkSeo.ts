import { getImageUrl } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import type { ArtworkPhoto } from '@/lib/artworkPhotos';
import { normalizeTitle } from '@/lib/normalizeTitle';
import type { ArtworkDto } from '@/lib/api';

type SeoArtwork = Pick<ArtworkDto, 'id' | 'title' | 'description'>;
type SchemaArtwork = SeoArtwork & Partial<Pick<ArtworkDto, 'isForSale' | 'price'>>;
interface ArtworkSchema {
  '@context': string;
  '@type': string;
  name: string;
  image: string[];
  description: string;
  creator: { '@type': string; name: string };
  artMedium?: string;
  offers?: { '@type': string; price: number; priceCurrency: string; availability: string; url: string };
}

export const SITE_URL = 'https://angelamoiseenko.ru';
export const ARTIST_NAME = 'Анжела Моисеенко';

export const artworkPageUrl = (artwork: Pick<ArtworkDto, 'id' | 'title'>) => `${SITE_URL}/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`;

// SEO title/description are per-artwork (S3-AS1): unique, contain the
// artwork title and the commercial term "купить", kept close to the usual
// <title>/<meta description> length budgets.
export const buildSeoTitle = (artwork: Pick<ArtworkDto, 'title'>) => `Купить картину «${normalizeTitle(artwork.title)}» — ${ARTIST_NAME}`;

export const buildSeoDescription = (artwork: Pick<ArtworkDto, 'title' | 'description'>) => {
  const details = artwork.description ? `${artwork.description}. ` : '';
  const text = `«${normalizeTitle(artwork.title)}» — ${details}Купить картину художника ${ARTIST_NAME} с доставкой.`;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
};

// schema.org markup (S3-AS4/S3-AS5/S3-AS6): the artwork block only gets an
// "offers" entry when it is actually for sale with a known price — an
// artwork without a price stays honest and omits the whole offers key
// rather than inventing one.
export const buildArtworkSchema = (artwork: SchemaArtwork, photos: ArtworkPhoto[], categoryName?: string) => {
  const schema: ArtworkSchema = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: normalizeTitle(artwork.title),
    image: photos.map((photo) => getImageUrl(photo.path)),
    description: artwork.description || categoryName || normalizeTitle(artwork.title),
    creator: {
      '@type': 'Person',
      name: ARTIST_NAME,
    },
  };
  if (artwork.description) {
    schema.artMedium = artwork.description;
  }
  if (artwork.isForSale && artwork.price) {
    schema.offers = {
      '@type': 'Offer',
      price: artwork.price,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
      url: artworkPageUrl(artwork),
    };
  }
  return schema;
};

export const buildBreadcrumbSchema = (artwork: Pick<ArtworkDto, 'id' | 'title'>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Галерея', item: `${SITE_URL}/gallery` },
    { '@type': 'ListItem', position: 3, name: normalizeTitle(artwork.title), item: artworkPageUrl(artwork) },
  ],
});
