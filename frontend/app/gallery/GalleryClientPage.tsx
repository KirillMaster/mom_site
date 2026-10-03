'use client';

import { useState, useEffect } from 'react';
import { GalleryData } from '@/lib/api';
import { artworksForSale } from '@/lib/gallery';
import { useGalleryPaging } from '@/lib/useGalleryPaging';
import GalleryGrid from './GalleryGrid';
import GalleryHeader from './GalleryHeader';
import GalleryFilters from './GalleryFilters';

// ?category=<id> preselects a category (the "Смотреть все" link of RelatedWorks).
const categoryFromUrl = (): number | null => {
  const raw = new URLSearchParams(window.location.search).get('category');
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
};

const GalleryClientPage = ({ galleryData }: { galleryData: GalleryData }) => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl());
  }, []);

  const artworksToDisplay = selectedCategory
    ? galleryData.artworks.filter(artwork => artwork.categoryId === selectedCategory)
    : artworksForSale(galleryData);
  const { visible, remaining, showMore } = useGalleryPaging(artworksToDisplay, selectedCategory);

  return (
    <div className="min-h-screen">
      <GalleryHeader title={galleryData.bannerTitle} description={galleryData.bannerDescription} />

      <GalleryFilters
        categories={galleryData.categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <GalleryGrid
        artworks={visible}
        categories={galleryData.categories}
        remaining={remaining}
        total={artworksToDisplay.length}
        categoryKey={selectedCategory}
        onShowMore={showMore}
      />
    </div>
  );
};

export default GalleryClientPage;
