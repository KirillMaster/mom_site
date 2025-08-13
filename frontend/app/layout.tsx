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
        url: '/images/og-image.jpg',
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
    images: ['/images/og-image.jpg'],
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
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
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
              "image": "https://angelamoiseenko.ru/images/artist-photo.jpg",
              "sameAs": [
                "https://instagram.com/angelamoiseenko",
                "https://vk.com/angelamoiseenko",
                "https://t.me/angelamoiseenko"
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