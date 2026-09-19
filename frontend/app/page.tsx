import { getHomeData } from '@/hooks/useApi';
import HomeClientPage from './HomeClientPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import StructuredData from '@/components/StructuredData';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// The homepage's SEO title/description are admin-editable fields, decoupled
// from welcomeMessage (which is free-form marketing copy shown on the page,
// not tuned for a <title>/<meta description>). These defaults are used
// whenever the admin has not set (or has cleared) the SEO fields.
const DEFAULT_HOME_SEO_TITLE = 'Купить картину маслом — художник Анжела Моисеенко';
const DEFAULT_HOME_SEO_DESCRIPTION =
  'Купить картину маслом от художника Анжелы Моисеенко: авторские натюрморты, пейзажи и портреты. Галерея работ, актуальные цены и оформление заказа прямо на сайте.';

// Generate dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const homeData = await getHomeData();

    if (!homeData) {
      return {
        title: DEFAULT_HOME_SEO_TITLE,
        description: DEFAULT_HOME_SEO_DESCRIPTION,
      };
    }

    const title = homeData.seoTitle?.trim() ? homeData.seoTitle : DEFAULT_HOME_SEO_TITLE;

    const description = homeData.seoDescription?.trim()
      ? homeData.seoDescription
      : DEFAULT_HOME_SEO_DESCRIPTION;

    const imageUrl = homeData.bannerImage || homeData.authorPhoto || 'https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg';

    return {
      title,
      description,
      keywords: 'художник, импрессионизм, картины, театральные работы, натюрморты, искусство, живопись, Анжела Моисеенко',
      authors: [{ name: 'Анжела Моисеенко' }],
      creator: 'Анжела Моисеенко',
      publisher: 'Анжела Моисеенко',
      metadataBase: new URL('https://angelamoiseenko.ru'),
      alternates: {
        canonical: '/',
      },
      openGraph: {
        title,
        description,
        url: 'https://angelamoiseenko.ru',
        siteName: 'Анжела Моисеенко - Художник-импрессионист',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Анжела Моисеенко - Художник-импрессионист',
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
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: DEFAULT_HOME_SEO_TITLE,
      description: DEFAULT_HOME_SEO_DESCRIPTION,
    };
  }
}

const HomePage = async () => {
  const homeData = await getHomeData();

  if (!homeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить данные</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StructuredData homeData={homeData} />
      <HomeClientPage homeData={homeData} />
    </>
  );
};

export default HomePage;