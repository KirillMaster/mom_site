import { Metadata } from 'next';
import { getVideosData, getImageUrl } from '@/hooks/useApi';
import VideosClientPage from './VideosClientPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Видеогалерея | Анжела Моисеенко - Художник-импрессионист',
  description: 'Смотрите видео о процессе создания картин, выставках и интервью о творчестве художника-импрессиониста Анжелы Моисеенко.',
  keywords: 'видео, художник, процесс создания, выставки, интервью, импрессионизм, Анжела Моисеенко',
  openGraph: {
    title: 'Видеогалерея | Анжела Моисеенко - Художник-импрессионист',
    description: 'Смотрите видео о процессе создания картин, выставках и интервью о творчестве.',
    type: 'website',
    url: 'https://angelamoiseenko.ru/videos',
    images: [
      {
        url: '/images/video-gallery.jpg',
        width: 1200,
        height: 630,
        alt: 'Видеогалерея - Анжела Моисеенко',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Видеогалерея | Анжела Моисеенко - Художник-импрессионист',
    description: 'Смотрите видео о процессе создания картин и выставках.',
    images: ['/images/video-gallery.jpg'],
  },
};

const VideosPage = async () => {
  const videosData = await getVideosData();

  if (!videosData) {
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
    name: 'Видеогалерея - Анжела Моисеенко',
    description: 'Видеогалерея художника-импрессиониста Анжелы Моисеенко',
    url: 'https://angelamoiseenko.ru/videos',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: videosData.videos.map((video, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'VideoObject',
          name: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailPath ? getImageUrl(video.thumbnailPath) : '/images/video-placeholder.jpg',
          contentUrl: getImageUrl(video.videoPath),
          uploadDate: new Date().toISOString(), // Используем текущую дату как fallback
          duration: 'PT5M', // Примерная длительность
          creator: {
            '@type': 'Person',
            name: 'Анжела Моисеенко',
            jobTitle: 'Художник-импрессионист'
          },
          genre: video.videoCategory?.name || 'Искусство',
          keywords: ['живопись', 'импрессионизм', 'художник', 'творчество'],
          inLanguage: 'ru',
          isFamilyFriendly: 'true'
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
      <VideosClientPage videosData={videosData} />
    </>
  );
};

export default VideosPage; 