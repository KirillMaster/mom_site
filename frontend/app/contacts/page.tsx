import { Metadata } from 'next';
import { getContactsData } from '@/hooks/useApi';
import ContactsClientPage from './ContactsClientPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Контакты | Анжела Моисеенко - Художник-импрессионист',
  description: 'Свяжитесь с художником-импрессионистом Анжелой Моисеенко. Контактная информация, социальные сети и форма обратной связи.',
  keywords: 'контакты, художник, связь, Анжела Моисеенко, импрессионизм, заказать картину',
  openGraph: {
    title: 'Контакты | Анжела Моисеенко - Художник-импрессионист',
    description: 'Свяжитесь с художником-импрессионистом Анжелой Моисеенко. Контактная информация и форма обратной связи.',
    type: 'website',
    url: 'https://angelamoiseenko.ru/contacts',
    images: [
      {
        url: '/images/contact-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Контакты - Анжела Моисеенко',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Контакты | Анжела Моисеенко - Художник-импрессионист',
    description: 'Свяжитесь с художником-импрессионистом Анжелой Моисеенко.',
    images: ['/images/contact-image.jpg'],
  },
};

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