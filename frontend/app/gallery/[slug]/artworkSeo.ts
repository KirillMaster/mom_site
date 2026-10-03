import { getImageUrl } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import type { ArtworkPhoto } from '@/lib/artworkPhotos';
import { resolveStatus } from '@/lib/artworkStatus';

export const SITE_URL = 'https://angelamoiseenko.ru';
export const ARTIST_NAME = 'Анжела Моисеенко';

export const artworkPageUrl = (artwork: any) => `${SITE_URL}/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`;

// SEO title/description are per-artwork (S3-AS1): unique, contain the
// artwork title and the commercial term "купить", kept close to the usual
// <title>/<meta description> length budgets.
export const buildSeoTitle = (artwork: any) => `Купить картину «${artwork.title}» — ${ARTIST_NAME}`;

export const buildSeoDescription = (artwork: any) => {
  const lead = artwork.shortDescription || artwork.description;
  const details = lead ? `${lead}. ` : '';
  const text = `«${artwork.title}» — ${details}Купить картину художника ${ARTIST_NAME} с доставкой.`;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
};

const cmValue = (value: number) => ({ '@type': 'QuantitativeValue', value, unitCode: 'CMT' });

// schema.org markup (S3-AS4/S3-AS5/S3-AS6): the artwork block only gets an
// "offers" entry when it is actually for sale with a known price — an
// artwork without a price stays honest and omits the whole offers key
// rather than inventing one.
export const buildArtworkSchema = (artwork: any, photos: ArtworkPhoto[], categoryName?: string) => {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    image: photos.map((photo) => getImageUrl(photo.path)),
    description: artwork.description || categoryName || artwork.title,
    creator: {
      '@type': 'Person',
      name: ARTIST_NAME,
    },
  };
  const medium = artwork.technique || artwork.description;
  if (medium) schema.artMedium = medium;
  if (artwork.support) schema.artworkSurface = artwork.support;
  if (artwork.widthCm) schema.width = cmValue(artwork.widthCm);
  if (artwork.heightCm) schema.height = cmValue(artwork.heightCm);
  if (artwork.year) schema.dateCreated = String(artwork.year);
  const status = resolveStatus(artwork);
  if (artwork.price && (status === 'Available' || status === 'Sold')) {
    schema.offers = {
      '@type': 'Offer',
      price: artwork.price,
      priceCurrency: 'RUB',
      availability: `https://schema.org/${status === 'Available' ? 'InStock' : 'SoldOut'}`,
      url: artworkPageUrl(artwork),
    };
  }
  return schema;
};

export const buildBreadcrumbSchema = (artwork: any) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Главная', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Галерея', item: `${SITE_URL}/gallery` },
    { '@type': 'ListItem', position: 3, name: artwork.title, item: artworkPageUrl(artwork) },
  ],
});
