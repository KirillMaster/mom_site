'use client';

import { ArrowRight, Star, Quote } from 'lucide-react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube, FaEnvelope } from 'react-icons/fa';
import MaxIcon from '@/components/MaxIcon';
import { maxProfileUrl } from '@/lib/social';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/hooks/useApi';
import { HomeData } from '@/lib/api';
import ArtworkCarousel from '@/components/ArtworkCarousel';
import { shortBio } from '@/data/biography';

const homeHighlights = [
  'Член Союза художников России и АИАП ЮНЕСКО',
  'Председатель Севастопольского отделения СХР, 2018–2023',
  'Работы в музее имени М. П. Крошицкого и частных коллекциях 12 стран',
  'Картины «Муза» и «Дамские штучки» — символы фестиваля «ЗАЗЕРКАЛЬЕ»',
];

const HomeClientPage = ({ homeData }: { homeData: HomeData }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Banner - Full Screen */}
      <section className="relative flex items-center justify-center overflow-hidden h-screen pt-32 bg-[#3d2b1a]">
        <Image
          src={getImageUrl(homeData.bannerImage)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1
            className="rise-in text-5xl md:text-7xl font-serif font-bold mb-6"
          >
            Анжела Моисеенко
          </h1>
          
          <p
            className="rise-in [animation-delay:100ms] text-xl md:text-2xl mb-8 text-balance"
          >
            Художник-импрессионист
          </p>
          
          <div className="rise-in [animation-delay:200ms]">
            <Link href="/gallery" className="btn-primary inline-flex items-center space-x-2">
              <span>Смотреть галерею</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div
            className="scroll-hint w-6 h-10 border-2 border-white rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </section>

    {/* Artwork Carousel Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2
            className="reveal text-4xl md:text-5xl font-serif font-bold mb-12 text-gradient">
                        Исследуйте мою галерею

          </h2>

          {homeData.artworks && homeData.artworks.length > 0 ? (
            <ArtworkCarousel artworks={homeData.artworks} />
          ) : (
            <p className="text-xl text-gray-700">
              Пока нет избранных работ для отображения.
            </p>
          )}
        </div>
      </section>

    {/* Biography Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:space-x-12">
            {/* Left: Biography Text */}
            <div
              className="reveal md:w-1/2 text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900">
                Обо мне
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                {homeData.biographyText || shortBio}
              </p>
              {/* The first thing a visitor wants to know about an artist they
                  have never heard of is who vouches for her. */}
              <ul className="text-gray-700 space-y-2 mb-8">
                {homeHighlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3 justify-center md:justify-start">
                    <span className="mt-2 w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <Link href="/about" className="btn-outline inline-flex items-center space-x-2">
                <span>Биография и выставки</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right: Author Photo */}
            <div
              className="reveal md:w-1/2 flex justify-center">
              {homeData.authorPhoto ? (
                <img
                  src={getImageUrl(homeData.authorPhoto)}
                  alt="Фотография автора"
                  className="rounded-lg shadow-lg max-w-full h-auto"
                />
              ) : (
                <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  Нет фотографии
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    {/* Contacts Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2
            className="reveal text-4xl md:text-5xl font-serif font-bold mb-12 text-gradient">
            Свяжитесь со мной
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {homeData.contacts.socialLinks.instagram && (
              <a
                href={homeData.contacts.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-pink-600 transition-colors">
                <FaInstagram className="w-12 h-12" />
                <span className="text-lg font-medium">Instagram</span>
              </a>
            )}
            {homeData.contacts.socialLinks.vk && (
              <a
                href={homeData.contacts.socialLinks.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-blue-600 transition-colors">
                <FaVk className="w-12 h-12" />
                <span className="text-lg font-medium">ВКонтакте</span>
              </a>
            )}
            {homeData.contacts.socialLinks.telegram && (
              <a
                href={homeData.contacts.socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-blue-400 transition-colors">
                <FaTelegram className="w-12 h-12" />
                <span className="text-lg font-medium">Telegram</span>
              </a>
            )}
            {homeData.contacts.socialLinks.whatsapp && (
              <a
                href={homeData.contacts.socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-green-500 transition-colors">
                <FaWhatsapp className="w-12 h-12" />
                <span className="text-lg font-medium">WhatsApp</span>
              </a>
            )}
            {homeData.contacts.socialLinks.youtube && (
              <a
                href={homeData.contacts.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-red-600 transition-colors">
                <FaYoutube className="w-12 h-12" />
                <span className="text-lg font-medium">YouTube</span>
              </a>
            )}
            {maxProfileUrl(homeData.contacts.socialLinks.max, homeData.contacts.phone) && (
              <a
                href={maxProfileUrl(homeData.contacts.socialLinks.max, homeData.contacts.phone)!}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-indigo-500 transition-colors">
                <MaxIcon className="w-12 h-12" />
                <span className="text-lg font-medium">MAX</span>
              </a>
            )}
            {homeData.contacts.email && (
              <a
                href={`mailto:${homeData.contacts.email}`}
                className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-indigo-600 transition-colors">
                <FaEnvelope className="w-12 h-12" />
                <span className="text-lg font-medium">Email</span>
              </a>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomeClientPage;