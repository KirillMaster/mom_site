import { Metadata } from 'next';
import { getContactsData } from '@/hooks/useApi';
import ContactsClientPage from './ContactsClientPage';

export const dynamic = 'force-dynamic';

// Generate dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const contactsData = await getContactsData();
    
    if (!contactsData) {
      return {
        title: 'Контакты | Анжела Моисеенко - Художник-импрессионист',
        description: 'Свяжитесь с художником-импрессионистом Анжелой Моисеенко.',
      };
    }

    const title = 'Контакты | Анжела Моисеенко - Художник-импрессионист';
    const description = 'Свяжитесь с художником-импрессионистом Анжелой Моисеенко. Контактная информация, социальные сети и форма обратной связи.';

    return {
      title,
      description,
      keywords: 'контакты, художник, связь, Анжела Моисеенко, импрессионизм, заказать картину',
      openGraph: {
        title,
        description,
        type: 'website',
        url: 'https://angelamoiseenko.ru/contacts',
        images: [
          {
            url: 'https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg',
            width: 1200,
            height: 630,
            alt: 'Контакты - Анжела Моисеенко',
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
      title: 'Контакты | Анжела Моисеенко - Художник-импрессионист',
      description: 'Свяжитесь с художником-импрессионистом Анжелой Моисеенко.',
    };
  }
}

const ContactsPage = async () => {
  const contactsData = await getContactsData();

  if (!contactsData) {
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
    '@type': 'ContactPage',
    name: 'Контакты - Анжела Моисеенко',
    description: 'Страница контактов художника-импрессиониста Анжелы Моисеенко',
    url: 'https://angelamoiseenko.ru/contacts',
    mainEntity: {
      '@type': 'Person',
      name: 'Анжела Моисеенко',
      jobTitle: 'Художник-импрессионист',
      email: contactsData.email,
      telephone: contactsData.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: contactsData.address
      },
      sameAs: [
        contactsData.socialLinks.instagram,
        contactsData.socialLinks.vk,
        contactsData.socialLinks.telegram,
        contactsData.socialLinks.whatsapp,
        contactsData.socialLinks.youtube
      ].filter(Boolean)
    },
    potentialAction: {
      '@type': 'ContactAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'mailto:' + contactsData.email
      },
      contactType: 'customer service'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactsClientPage contactsData={contactsData} />
    </>
  );
};

export default ContactsPage;