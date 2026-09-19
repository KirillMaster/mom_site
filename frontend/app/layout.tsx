import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import UtmTracker from '@/components/UtmTracker'
import YandexMetrica from '@/components/YandexMetrica'
import ClickTracker from '@/components/ClickTracker'
import LayoutContent from '@/components/LayoutContent';
import { Toaster } from 'react-hot-toast';

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
        {/* Favicon — only the SVG is bundled; raster fallbacks are not shipped */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data */}
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        <Providers>
          <UtmTracker />
          <YandexMetrica />
          <ClickTracker />
          <Toaster position="top-right" />
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