'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { getImageUrl } from '@/hooks/useApi';
import { AboutData } from '@/lib/api';
import ArtistCredentials from '@/components/ArtistCredentials';
import ExhibitionTimeline from '@/components/ExhibitionTimeline';
import { collections, fullBio, publications, stonePanels } from '@/data/biography';

const AboutClientPage = ({ aboutData }: { aboutData: AboutData }) => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 gradient-bg">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-gradient">
              {aboutData.bannerTitle || "Обо мне"}
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {aboutData.bannerDescription || "Познакомьтесь с художником и узнайте больше о моем творческом пути"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Artist Info */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={getImageUrl(aboutData.artistPhoto)}
                  alt="Анжела Моисеенко - Художник-импрессионист"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                <Palette className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Biography */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-gray-900">
                Анжела Моисеенко
              </h2>
              {/* The biography is a long, factual history kept in the repo;
                  the CMS still supplies the banner, the photo and the quote. */}
              {fullBio.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-lg text-gray-700 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}

              <div className="flex flex-wrap gap-4">
                <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                  Импрессионизм
                </div>
                <div className="bg-secondary-50 text-secondary-700 px-4 py-2 rounded-full text-sm font-medium">
                  Театральное искусство
                </div>
                <div className="bg-warm-50 text-warm-700 px-4 py-2 rounded-full text-sm font-medium">
                  Натюрморты
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Memberships & awards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold mb-12 text-center text-gray-900"
          >
            Членство и признание
          </motion.h2>
          <ArtistCredentials />
        </div>
      </section>

      {/* Stone panels */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="border-l-4 border-primary-600 pl-6"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-gray-900">
              {stonePanels.title}
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">{stonePanels.text}</p>
          </motion.div>
        </div>
      </section>

      {/* Exhibitions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold mb-4 text-gray-900"
          >
            Выставки
          </motion.h2>
          <p className="text-gray-600 mb-12">
            Ежегодные персональные выставки во Дворце культуры рыбаков; картины — в постоянной
            экспозиции Севастопольского центра культуры и искусства.
          </p>
          <ExhibitionTimeline />
        </div>
      </section>

      {/* Publications */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold mb-12 text-gray-900"
          >
            Публикации о творчестве
          </motion.h2>
          <ul className="space-y-4">
            {publications.map((publication) => (
              <li
                key={`${publication.year}-${publication.text}`}
                className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-gray-100 pb-4"
              >
                <span className="text-primary-600 font-semibold shrink-0 w-24">
                  {publication.year}
                </span>
                <span className="text-gray-700 leading-relaxed">{publication.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Collections */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold mb-12 text-gray-900"
          >
            Работы в собраниях
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-serif font-semibold mb-4 text-gray-900">Музеи</h3>
              <ul className="space-y-2">
                {collections.museums.map((museum) => (
                  <li key={museum} className="text-gray-700 leading-relaxed">
                    {museum}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold mb-4 text-gray-900">
                Частные коллекции
              </h3>
              <div className="flex flex-wrap gap-2">
                {collections.countries.map((country) => (
                  <span
                    key={country}
                    className="bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-full text-sm"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">
              Моя философия
            </h2>
            <blockquote className="text-xl md:text-2xl leading-relaxed italic mb-8">
              "{aboutData.philosophy}"
            </blockquote>
            <p className="text-lg opacity-90">
              — Анжела Моисеенко
            </p>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-gray-900">
              Хотите увидеть мои работы?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Исследуйте галерею и найдите то, что тронет ваше сердце
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/gallery"
                className="btn-primary inline-flex items-center justify-center"
              >
                Посмотреть галерею
              </a>
              <a
                href="/contacts"
                className="btn-outline inline-flex items-center justify-center"
              >
                Связаться со мной
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default AboutClientPage;
