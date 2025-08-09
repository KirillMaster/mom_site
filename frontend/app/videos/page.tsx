'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Play, ExternalLink } from 'lucide-react';
import ReactPlayer from 'react-player';
import { useVideosData } from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getImageUrl } from '@/hooks/useApi';

const VideosPage = () => {
  const { data: videosData, isLoading, isError } = useVideosData();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);

  useEffect(() => {
    console.log('videosData in useEffect:', videosData); // Add this line
    if (videosData && Array.isArray(videosData.videos) && Array.isArray(videosData.categories)) {
      const videosWithCategories = videosData.videos.map(video => ({
        ...video,
        videoCategory: videosData.categories.find(cat => cat.id === video.videoCategoryId)
      }));

      if (selectedCategory) {
        setFilteredVideos(videosWithCategories.filter(video => video.videoCategoryId === selectedCategory));
      } else {
        setFilteredVideos(videosWithCategories);
      }
      console.log('Filtered Videos:', videosWithCategories); // Add this line
    } else {
      setFilteredVideos([]);
    }
  }, [selectedCategory, videosData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !videosData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">{isError ? "Произошла ошибка при загрузке данных" : 'Не удалось загрузить данные'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const openVideo = (video: any) => {
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
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
              Видеогалерея
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Смотрите видео о процессе создания картин, выставках и интервью о творчестве
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
              Все видео
            </button>
            
            {videosData.categories && Array.isArray(videosData.categories) && videosData.categories.map((category) => (
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

      {/* Videos Grid */}
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
              {filteredVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card group cursor-pointer"
                  onClick={() => openVideo(video)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={video.thumbnailPath ? getImageUrl(video.thumbnailPath) : '/images/video-placeholder.jpg'}
                      alt={video.title}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {video.videoCategory?.name || 'Без категории'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-serif font-semibold mb-3 text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                      {video.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {video.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {video.videoCategory?.name || 'Без категории'}
                      </span>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors duration-200" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
          
          {filteredVideos.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-xl text-gray-500">
                В выбранной категории пока нет видео
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeVideo}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl bg-white rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <ReactPlayer
                  url={getImageUrl(selectedVideo.videoPath)}
                  width="100%"
                  height="400px"
                  controls
                  playing
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-serif font-bold mb-3 text-gray-900">
                  {selectedVideo.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {selectedVideo.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedVideo.videoCategory.name}
                  </span>
                  
                  <button
                    onClick={closeVideo}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Info */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Категории видео
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Исследуйте разные аспекты моего творчества через видео
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {videosData?.categories && Array.isArray(videosData.categories) && videosData.categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-8 text-center hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3 text-gray-900">
                  {category.name}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      </div>
  );
};

export default VideosPage; 