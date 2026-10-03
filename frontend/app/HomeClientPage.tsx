'use client';

import type { ComponentType } from 'react';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube, FaEnvelope } from 'react-icons/fa';
import MaxIcon from '@/components/MaxIcon';
import { maxProfileUrl } from '@/lib/social';
import Image from 'next/image';
import { getImageUrl } from '@/hooks/useApi';
import { HomeData, ReviewDto } from '@/lib/api';
import ArtworkCarousel from '@/components/ArtworkCarousel';
import { shortBio } from '@/data/biography';
import { Button } from '@/components/ui';
import AvailableGrid from '@/components/home/AvailableGrid';
import TrustStrip from '@/components/home/TrustStrip';
import ReviewsPreview from '@/components/home/ReviewsPreview';

const homeHighlights = [
  'Член Союза художников России и АИАП ЮНЕСКО',
  'Председатель Севастопольского отделения СХР, 2018–2023',
  'Работы в музее имени М. П. Крошицкого и частных коллекциях 12 стран',
  'Картины «Муза» и «Дамские штучки» — символы фестиваля «ЗАЗЕРКАЛЬЕ»',
];

type SocialItem = { key: string; href: string; label: string; Icon: ComponentType<{ className?: string }> };

const socialItems = ({ contacts }: HomeData): SocialItem[] => {
  const { socialLinks, phone, email } = contacts;
  const max = maxProfileUrl(socialLinks.max, phone);
  const items: (SocialItem | null)[] = [
    socialLinks.instagram ? { key: 'instagram', href: socialLinks.instagram, label: 'Instagram', Icon: FaInstagram } : null,
    socialLinks.vk ? { key: 'vk', href: socialLinks.vk, label: 'ВКонтакте', Icon: FaVk } : null,
    socialLinks.telegram ? { key: 'telegram', href: socialLinks.telegram, label: 'Telegram', Icon: FaTelegram } : null,
    socialLinks.whatsapp ? { key: 'whatsapp', href: socialLinks.whatsapp, label: 'WhatsApp', Icon: FaWhatsapp } : null,
    socialLinks.youtube ? { key: 'youtube', href: socialLinks.youtube, label: 'YouTube', Icon: FaYoutube } : null,
    max ? { key: 'max', href: max, label: 'MAX', Icon: MaxIcon } : null,
    email ? { key: 'email', href: `mailto:${email}`, label: 'Email', Icon: FaEnvelope } : null,
  ];
  return items.filter((item): item is SocialItem => item !== null);
};

const HomeClientPage = ({ homeData, reviews }: { homeData: HomeData; reviews?: ReviewDto[] }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Banner - Full Screen */}
      <section className="relative flex items-center justify-center overflow-hidden h-screen pt-32 bg-sea-800">
        <Image
          src={getImageUrl(homeData.bannerImage)}
          alt="Картина маслом Анжелы Моисеенко"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1
            className="rise-in text-5xl md:text-7xl font-serif font-medium mb-6 text-white"
          >
            Анжела Моисеенко
            <span className="block mt-3 text-2xl md:text-3xl">художник, картины маслом — Севастополь</span>
          </h1>
          
          <p
            className="rise-in [animation-delay:100ms] text-xl md:text-2xl mb-8 text-balance"
          >
            Живопись маслом из Крыма. Работы в коллекциях 12 стран
          </p>

          <div className="rise-in [animation-delay:200ms] flex flex-wrap justify-center gap-4">
            <Button href="/gallery" className="px-6 py-3">
              <span>Выбрать картину</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button href="/order" variant="secondary" className="px-6 py-3 bg-paper text-sea hover:bg-sea-50">
              <span>Заказать картину</span>
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div
            className="scroll-hint w-6 h-10 border-2 border-white rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-paper-50 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      <AvailableGrid artworks={homeData.availableArtworks} />

      <TrustStrip />

      {/* Artwork Carousel Section */}
      <section className="py-20 bg-paper-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="reveal text-4xl md:text-5xl font-serif font-medium mb-12">
            Исследуйте мою галерею
          </h2>

          {homeData.artworks && homeData.artworks.length > 0 ? (
            <ArtworkCarousel artworks={homeData.artworks} />
          ) : (
            <p className="text-xl text-ink-600">
              Пока нет избранных работ для отображения.
            </p>
          )}
        </div>
      </section>

      {/* Biography Section */}
      <section className="py-20 bg-paper-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:space-x-12">
            {/* Left: Biography Text */}
            <div
              className="reveal md:w-1/2 text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-4xl md:text-5xl font-serif font-medium mb-6 text-ink">
                Обо мне
              </h2>
              <p className="text-xl text-ink-600 leading-relaxed mb-6 prose-measure">
                {homeData.biographyText || shortBio}
              </p>
              {/* The first thing a visitor wants to know about an artist they
                  have never heard of is who vouches for her. */}
              <ul className="text-ink-600 space-y-2 mb-8">
                {homeHighlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3 justify-center md:justify-start">
                    <span className="mt-2 w-2 h-2 rounded-full bg-ochre shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <Button href="/about" variant="secondary">
                <span>Биография и выставки</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Right: Author Photo */}
            <div
              className="reveal md:w-1/2 flex justify-center">
              {homeData.authorPhoto ? (
                <Image
                  src={getImageUrl(homeData.authorPhoto)}
                  alt="Фотография автора"
                  width={640}
                  height={800}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="rounded-md max-w-full h-auto"
                />
              ) : (
                <div className="w-64 h-64 bg-line rounded-lg flex items-center justify-center text-ink-500">
                  Нет фотографии
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ReviewsPreview reviews={reviews} />

      {/* Contacts Section */}
      <section className="py-20 bg-paper-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="reveal text-4xl md:text-5xl font-serif font-medium mb-12">
            Свяжитесь со мной
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {socialItems(homeData).map(({ key, href, label, Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal flex flex-col items-center space-y-2 text-ink-600 hover:text-sea transition-colors"
              >
                <Icon className="w-12 h-12" />
                <span className="text-lg font-medium">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomeClientPage;