'use client';

import { useState, useEffect } from 'react';
import { Filter, Eye, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { getImageUrl } from '@/hooks/useApi';
import { GalleryData } from '@/lib/api';

const GalleryClientPage = ({ galleryData }: { galleryData: GalleryData }) => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; photoIndex: number }>({
    isOpen: false,
    photoIndex: 0
  });
  const [filteredArtworks, setFilteredArtworks] = useState<any[]>(galleryData.artworks || []);

  const artworksToDisplay = selectedCategory
    ? galleryData.artworks.filter(artwork => artwork.categoryId === selectedCategory)
    : galleryData.artworks;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const openLightbox = (index: number) => {
    setLightbox({ isOpen: true, photoIndex: index });
  };

  return (
    <div className="min-h-screen">
      
      {/* Header */}
      <section className="pt-24 pb-16 gradient-bg">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-gradient">
              {galleryData.bannerTitle || "Галерея работ"}
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {galleryData.bannerDescription || "Исследуйте коллекцию уникальных работ в стиле импрессионизма. Каждая картина создана с любовью и передает особую атмосферу."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Фильтр:</span>
            </div>
            
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                selectedCategory === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Все работы
            </button>
            
            {galleryData.categories && Array.isArray(galleryData.categories) && galleryData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory || 'all'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {artworksToDisplay.map((artwork, index) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={getImageUrl(artwork.thumbnailPath)}
                      alt={artwork.title}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                      <button
                        onClick={() => openLightbox(index)}
                        className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-200"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {artwork.isForSale && (
                        <button className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors duration-200">
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-primary-600 font-medium">
                        {artwork.category?.name || 'Без категории'}
                      </span>
                      {artwork.isForSale && typeof artwork.price === 'number' && (
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(artwork.price)}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-serif font-semibold mb-2 text-gray-900">
                      {artwork.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {artwork.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          
          {artworksToDisplay.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-xl text-gray-500">
                В выбранной категории пока нет работ
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        open={lightbox.isOpen}
        close={() => setLightbox({ isOpen: false, photoIndex: 0 })}
        index={lightbox.photoIndex}
        slides={artworksToDisplay.map(artwork => ({
          src: getImageUrl(artwork.imagePath),
          title: artwork.title,
          description: artwork.description
        }))}
      />

    </div>
  );
};

export default GalleryClientPage;
