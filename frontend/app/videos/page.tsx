import { Metadata } from 'next';
import { getVideosData, getImageUrl } from '@/hooks/useApi';
import VideosClientPage from './VideosClientPage';

export const dynamic = 'force-dynamic';

// Generate dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const videosData = await getVideosData();
    
    if (!videosData) {
      return {
        title: 'Видеогалерея | Анжела Моисеенко - Художник-импрессионист',
        description: 'Смотрите видео о процессе создания картин и выставках.',
      };
    }

    const title = 'Видеогалерея | Анжела Моисеенко - Художник-импрессионист';
    const description = 'Смотрите видео о процессе создания картин, выставках и интервью о творчестве художника-импрессиониста Анжелы Моисеенко.';

    return {
      title,
      description,
      keywords: 'видео, художник, процесс создания, выставки, интервью, импрессионизм, Анжела Моисеенко',
      openGraph: {
        title,
        description,
        type: 'website',
        url: 'https://angelamoiseenko.ru/videos',
        images: [
          {
            url: 'https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg',
            width: 1200,
            height: 630,
            alt: 'Видеогалерея - Анжела Моисеенко',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Видеогалерея | Анжела Моисеенко - Художник-импрессионист',
      description: 'Смотрите видео о процессе создания картин и выставках.',
    };
  }
}

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