'use client';

import { ArrowRight, Star, Quote } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/hooks/useApi';
import { HomeData } from '@/lib/api';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const HomeClientPage = ({ homeData }: { homeData: HomeData }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Banner - Full Screen */}
      <section className="flex-1 relative flex items-center justify-center overflow-hidden min-h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${getImageUrl(homeData.bannerImage)})`,
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-serif font-bold mb-6"
          >
            Анжела Моисеенко
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-balance"
          >
            Художник-импрессионист
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link href="/gallery" className="btn-primary inline-flex items-center space-x-2">
              <span>Смотреть галерею</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </motion.div>
        </div>
      </section>

    {/* Artwork Carousel Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif font-bold mb-12 text-gradient"
          >
                        Исследуйте мою галерею

          </motion.h2>

          {homeData.artworks && homeData.artworks.length > 0 ? (
            <div className="relative">
              <Slider {...settings}>
                {homeData.artworks.map((artwork, index) => (
                  <div key={artwork.id} className="px-2">
                    <Link href="/gallery">
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="card p-4"
                      >
                        <img
                          src={getImageUrl(artwork.imagePath)}
                          alt={artwork.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <h3 className="text-lg font-semibold text-gray-900">{artwork.title}</h3>
                        <p className="text-sm text-gray-600">{artwork.category?.name}</p>
                      </motion.div>
                    </Link>
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <p className="text-xl text-gray-700">
              Пока нет избранных работ для отображения.
            </p>
          )}
        </div>
      </section>

    </div>
  );
};

export default HomeClientPage;
