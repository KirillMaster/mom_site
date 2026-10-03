'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Filter, Play, ExternalLink } from 'lucide-react';
import VideoModal from '@/components/videos/VideoModal';
import CategoriesInfo from '@/components/videos/CategoriesInfo';
import { getImageUrl } from '@/hooks/useApi';
import { VideosData } from '@/lib/api';

const VideosClientPage = ({ videosData }: { videosData: VideosData }) => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);

  useEffect(() => {
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
    } else {
      setFilteredVideos([]);
    }
  }, [selectedCategory, videosData]);

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
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div
            className="rise-in text-center"
          >
            <h1 className="mb-6">
              Видеогалерея
            </h1>
            <p className="text-xl text-ink-600 max-w-3xl mx-auto">
              Смотрите видео о процессе создания картин, выставках и интервью о творчестве
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-paper-50 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-ink-500" />
              <span className="font-medium text-ink-600">Фильтр:</span>
            </div>
            
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sea transition-colors duration-200 ${
                selectedCategory === null
                  ? 'bg-sea text-white'
                  : 'bg-paper-200 text-ink-600 hover:bg-line'
              }`}
            >
              Все видео
            </button>
            
            {videosData.categories && Array.isArray(videosData.categories) && videosData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sea transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-sea text-white'
                    : 'bg-paper-200 text-ink-600 hover:bg-line'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="py-16 bg-paper-200">
        <div className="max-w-7xl mx-auto px-4">
          <div
            key={selectedCategory || 'all'}
            className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="rise-in card group cursor-pointer"
                  onClick={() => openVideo(video)}
                >
                  {/* A square frame: the thumbnails arrive in mixed aspect
                      ratios, and a fixed height squashed the portrait ones. */}
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={video.thumbnailPath ? getImageUrl(video.thumbnailPath) : '/images/video-placeholder.jpg'}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 bg-paper-50/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-sea text-white px-3 py-1 rounded-full text-sm font-medium">
                        {video.videoCategory?.name || 'Без категории'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3 text-ink group-hover:text-ochre-700 transition-colors duration-200">
                      {video.title}
                    </h3>
                    
                    <p className="text-ink-500 text-sm leading-relaxed mb-4">
                      {video.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-500">
                        {video.videoCategory?.name || 'Без категории'}
                      </span>
                      <ExternalLink className="w-4 h-4 text-ink-500 group-hover:text-ochre-700 transition-colors duration-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          
          {filteredVideos.length === 0 && (
            <div
              className="rise-in text-center py-16"
            >
              <p className="text-xl text-ink-500">
                В выбранной категории пока нет видео
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedVideo && <VideoModal video={selectedVideo} onClose={closeVideo} />}

      <CategoriesInfo categories={videosData?.categories} />
    </div>
  );
};

export default VideosClientPage;
