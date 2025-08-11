import { getGalleryData, getImageUrl } from '@/hooks/useApi';
import GalleryClientPage from './GalleryClientPage';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Галерея Работ | Имя Художника',
  description: 'Исследуйте коллекцию уникальных работ в стиле импрессионизма. Каждая картина создана с любовью и передает особую атмосферу.',
  openGraph: {
    title: 'Галерея Работ',
    description: 'Коллекция работ в стиле импрессионизма.',
    type: 'website',
    url: 'https://momsite.com/gallery', // Замените на реальный URL
    images: [
      {
        url: 'https://momsite.com/og-image.jpg', // Замените на реальный URL
        width: 1200,
        height: 630,
        alt: 'Галерея Работ',
      },
    ],
  },
};

const GalleryPage = async () => {
  const galleryData = await getGalleryData();

  if (!galleryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить данные</p>
        </div>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Галерея работ',
    description: 'Исследуйте коллекцию уникальных работ в стиле импрессионизма. Каждая картина создана с любовью и передает особую атмосферу.',
    url: 'https://momsite.com/gallery', // Замените на реальный URL
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: galleryData.artworks.map((artwork, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'ImageObject',
          name: artwork.title,
          description: artwork.description,
          contentUrl: getImageUrl(artwork.imagePath),
          thumbnailUrl: getImageUrl(artwork.thumbnailPath),
          author: {
            '@type': 'Person',
            name: 'Имя Художника', // Замените на реальное имя
          },
          datePublished: artwork.createdAt,
          keywords: artwork.category?.name,
          inLanguage: 'ru',
          isFamilyFriendly: 'true',
          ...(artwork.isForSale && {
            offers: {
              '@type': 'Offer',
              price: artwork.price,
              priceCurrency: 'RUB',
              availability: 'https://schema.org/InStock',
            },
          }),
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GalleryClientPage galleryData={galleryData} />
    </>
  );
};

export default GalleryPage;
