import { Metadata } from 'next';
import { getAboutData } from '@/hooks/useApi';
import AboutClientPage from './AboutClientPage';
import LoadingSpinner from '@/components/LoadingSpinner';

export const dynamic = 'force-dynamic';

// Generate dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const aboutData = await getAboutData();
    
    if (!aboutData) {
      return {
        title: 'О себе | Анжела Моисеенко - Художник-импрессионист',
        description: 'Познакомьтесь с художником-импрессионистом Анжелой Моисеенко.',
      };
    }

    const title = 'О себе | Анжела Моисеенко - Художник-импрессионист';
    const description = aboutData.biography 
      ? `${aboutData.biography.substring(0, 160)}...`
      : 'Познакомьтесь с художником-импрессионистом Анжелой Моисеенко. Узнайте о творческом пути, специализациях и философии искусства.';

    const imageUrl = aboutData.artistPhoto || 'https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg';

    return {
      title,
      description,
      keywords: 'художник, импрессионизм, биография, творческий путь, живопись, искусство, Анжела Моисеенко',
      openGraph: {
        title,
        description,
        type: 'website',
        url: 'https://angelamoiseenko.ru/about',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: 'Анжела Моисеенко - Художник-импрессионист',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'О себе | Анжела Моисеенко - Художник-импрессионист',
      description: 'Познакомьтесь с художником-импрессионистом Анжелой Моисеенко.',
    };
  }
}

const AboutPage = async () => {
  const aboutData = await getAboutData();

  if (!aboutData) {
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
    '@type': 'Person',
    name: 'Анжела Моисеенко',
    jobTitle: 'Художник-импрессионист',
    description: aboutData.biography || 'Художник-импрессионист, специализирующийся на театральных работах и натюрмортах',
    url: 'https://angelamoiseenko.ru/about',
    image: aboutData.artistPhoto || 'https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg',
    knowsAbout: ['Импрессионизм', 'Театральное искусство', 'Натюрморты', 'Живопись'],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Художник-импрессионист',
      description: 'Создание картин в стиле импрессионизма'
    },
    worksFor: {
      '@type': 'Organization',
      name: 'Анжела Моисеенко - Художник'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutClientPage aboutData={aboutData} />
    </>
  );
};

export default AboutPage; 