import { HomeData } from '@/lib/api';

interface StructuredDataProps {
  homeData: HomeData;
}

export default function StructuredData({ homeData }: StructuredDataProps) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Анжела Моисеенко",
    "jobTitle": "Художник-импрессионист",
    "description": homeData.biographyText || "Художник-импрессионист, специализирующийся на театральных работах и натюрмортах",
    "url": "https://angelamoiseenko.ru",
    "image": homeData.authorPhoto || homeData.bannerImage || "https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg",
    "sameAs": [
      homeData.contacts?.socialLinks?.instagram && `https://instagram.com/${homeData.contacts.socialLinks.instagram}`,
      homeData.contacts?.socialLinks?.vk && `https://vk.com/${homeData.contacts.socialLinks.vk}`,
      homeData.contacts?.socialLinks?.telegram && `https://t.me/${homeData.contacts.socialLinks.telegram}`,
      homeData.contacts?.socialLinks?.youtube && `https://youtube.com/${homeData.contacts.socialLinks.youtube}`,
    ].filter(Boolean),
    "worksFor": {
      "@type": "Organization",
      "name": "Анжела Моисеенко - Художник"
    },
    "knowsAbout": ["Импрессионизм", "Живопись", "Театральные работы", "Натюрморты", "Искусство"],
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Художник-импрессионист",
      "occupationLocation": {
        "@type": "Place",
        "name": "Россия"
      }
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Анжела Моисеенко - Художник-импрессионист",
    "url": "https://angelamoiseenko.ru",
    "description": homeData.welcomeMessage || "Официальный сайт художника-импрессиониста Анжелы Моисеенко",
    "author": {
      "@type": "Person",
      "name": "Анжела Моисеенко"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://angelamoiseenko.ru/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Анжела Моисеенко - Художник-импрессионист",
    "url": "https://angelamoiseenko.ru",
    "logo": homeData.authorPhoto || homeData.bannerImage || "https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg",
    "description": homeData.biographyText || "Художник-импрессионист, создающий уникальные работы в стиле импрессионизма",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": homeData.contacts?.email,
      "telephone": homeData.contacts?.phone
    },
    "address": homeData.contacts?.address ? {
      "@type": "PostalAddress",
      "addressLocality": "Россия",
      "addressCountry": "RU"
    } : undefined,
    "sameAs": [
      homeData.contacts?.socialLinks?.instagram && `https://instagram.com/${homeData.contacts.socialLinks.instagram}`,
      homeData.contacts?.socialLinks?.vk && `https://vk.com/${homeData.contacts.socialLinks.vk}`,
      homeData.contacts?.socialLinks?.telegram && `https://t.me/${homeData.contacts.socialLinks.telegram}`,
      homeData.contacts?.socialLinks?.youtube && `https://youtube.com/${homeData.contacts.socialLinks.youtube}`,
    ].filter(Boolean)
  };

  // Create artworks schema if there are artworks
  const artworksSchema = homeData.artworks && homeData.artworks.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Коллекция работ Анжелы Моисеенко",
    "description": "Уникальные работы в стиле импрессионизма",
    "numberOfItems": homeData.artworks.length,
    "itemListElement": homeData.artworks.map((artwork: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "CreativeWork",
        "name": artwork.title,
        "description": artwork.description,
        "image": artwork.imagePath,
        "creator": {
          "@type": "Person",
          "name": "Анжела Моисеенко"
        },
        "dateCreated": artwork.createdAt,
        "genre": "Импрессионизм"
      }
    }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      {artworksSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(artworksSchema)
          }}
        />
      )}
    </>
  );
}
