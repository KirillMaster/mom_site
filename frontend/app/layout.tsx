import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import LayoutContent from '@/components/LayoutContent';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Анжела Моисеенко - Художник-импрессионист',
  description: 'Добро пожаловать в мир искусства! Уникальные работы в стиле импрессионизма, театральные картины и натюрморты от художника Анжелы Моисеенко.',
  keywords: 'художник, импрессионизм, картины, театральные работы, натюрморты, искусство, живопись',
  authors: [{ name: 'Анжела Моисеенко' }],
  creator: 'Анжела Моисеенко',
  publisher: 'Анжела Моисеенко',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://angelamoiseenko.ru'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Анжела Моисеенко - Художник-импрессионист',
    description: 'Добро пожаловать в мир искусства! Уникальные работы в стиле импрессионизма, театральные картины и натюрморты.',
    url: 'https://angelamoiseenko.ru',
    siteName: 'Анжела Моисеенко - Художник-импрессионист',
    images: [
      {
        url: 'https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg',
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
    title: 'Анжела Моисеенко - Художник-импрессионист',
    description: 'Добро пожаловать в мир искусства! Уникальные работы в стиле импрессионизма.',
    images: ['https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg'],
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
  verification: {
    google: 'iUFRReYnB38EqymLybNGbe4grCcbL4yYi4MgZtJxIvI',
    yandex: '0c3c665f720a33b6',
  },
}

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Анжела Моисеенко",
              "jobTitle": "Художник-импрессионист",
              "description": "Художник-импрессионист, специализирующийся на театральных работах и натюрмортах",
              "url": "https://angelamoiseenko.ru",
              "image": "https://s3.twcstorage.ru/577cc034-8ff38061-52e3-42ed-af0c-f06c744e4e66/2025/08/13/54c8e902-28cf-40f4-a6d1-29fe7739ea7b_page-content/fd3b2327-6328-47ec-ad68-a058fddcb07c.jpg",
              "sameAs": [
                "https://instagram.com/anzhela.moiseenko",
                "https://vk.com/daritenastoyashee",
                "https://t.me/Angelamois"
              ],
              "worksFor": {
                "@type": "Organization",
                "name": "Анжела Моисеенко - Художник"
              }
            })
          }}
        />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Анжела Моисеенко - Художник-импрессионист",
              "url": "https://angelamoiseenko.ru",
              "description": "Официальный сайт художника-импрессиониста Анжелы Моисеенко",
              "author": {
                "@type": "Person",
                "name": "Анжела Моисеенко"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://angelamoiseenko.ru/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <LayoutContent>
              {children}
            </LayoutContent>
          </div>
        </Providers>
      </body>
    </html>
  )
} 