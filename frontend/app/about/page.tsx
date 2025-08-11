import { Metadata } from 'next';
import { getAboutData } from '@/hooks/useApi';
import AboutClientPage from './AboutClientPage';
import LoadingSpinner from '@/components/LoadingSpinner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'О себе | Анжела Моисеенко - Художник-импрессионист',
  description: 'Познакомьтесь с художником-импрессионистом Анжелой Моисеенко. Узнайте о творческом пути, специализациях и философии искусства.',
  keywords: 'художник, импрессионизм, биография, творческий путь, живопись, искусство, Анжела Моисеенко',
  openGraph: {
    title: 'О себе | Анжела Моисеенко - Художник-импрессионист',
    description: 'Познакомьтесь с художником-импрессионистом Анжелой Моисеенко. Узнайте о творческом пути и философии искусства.',
    type: 'website',
    url: 'https://angelamoiseenko.ru/about',
    images: [
      {
        url: '/images/artist-photo.jpg',
        width: 1200,
        height: 630,
        alt: 'Анжела Моисеенко - Художник-импрессионист',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'О себе | Анжела Моисеенко - Художник-импрессионист',
    description: 'Познакомьтесь с художником-импрессионистом Анжелой Моисеенко.',
    images: ['/images/artist-photo.jpg'],
  },
};

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
    description: 'Художник-импрессионист, специализирующийся на театральных работах и натюрмортах',
    url: 'https://angelamoiseenko.ru/about',
    image: 'https://angelamoiseenko.ru/images/artist-photo.jpg',
    sameAs: [
      'https://instagram.com/angelamoiseenko',
      'https://vk.com/angelamoiseenko',
      'https://t.me/angelamoiseenko'
    ],
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