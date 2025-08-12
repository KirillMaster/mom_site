'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Palette, Award, Heart, Camera } from 'lucide-react';
import { getImageUrl } from '@/hooks/useApi';
import { AboutData } from '@/lib/api';

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
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {aboutData.biography}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {aboutData.additionalBiography}
              </p>
              
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
              "Искусство - это способ передать красоту мира через призму собственного восприятия. 
              Каждый мазок кисти - это эмоция, каждый цвет - это настроение, 
              а каждая картина - это история, которую я хочу рассказать зрителю."
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
