import { Metadata } from 'next';
import { loadOrBuildFallback } from '@/lib/buildPhase';
import type { ContactsData } from '@/lib/api';
import { getContactsData } from '@/hooks/useApi';
import ContactsClientPage from './ContactsClientPage';
import { maxProfileUrl } from '@/lib/social';

export const revalidate = 3600;

// Generate dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  try {
    const contactsData = await loadOrBuildFallback(getContactsData, { socialLinks: {}, email: '', phone: '0000000000', address: '', bannerTitle: '', bannerDescription: '', faq: [] });
    
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
      alternates: { canonical: '/contacts' },
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
  const contactsData = await loadOrBuildFallback(getContactsData, { socialLinks: {}, email: '', phone: '0000000000', address: '', bannerTitle: '', bannerDescription: '', faq: [] });


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
        addressLocality: contactsData.address || 'Севастополь',
        addressRegion: 'Крым',
        addressCountry: 'RU'
      },
      sameAs: [
        contactsData.socialLinks.instagram,
        contactsData.socialLinks.vk,
        contactsData.socialLinks.telegram,
        contactsData.socialLinks.whatsapp,
        contactsData.socialLinks.youtube,
        maxProfileUrl(contactsData.socialLinks.max, contactsData.phone)
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