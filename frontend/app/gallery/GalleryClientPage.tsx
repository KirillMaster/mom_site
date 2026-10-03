'use client';

import { useState, useEffect } from 'react';
import { GalleryData } from '@/lib/api';
import {
  filterArtworks,
  filtersToQuery,
  sukhorukikhCategory,
  parseFilters,
  NO_FILTERS,
  type CatalogueFilters,
} from '@/lib/gallery';
import { useGalleryPaging } from '@/lib/useGalleryPaging';
import GalleryGrid from './GalleryGrid';
import GalleryHeader from './GalleryHeader';
import GalleryFilters from './GalleryFilters';

const AUTHORSHIP = 'Работы Всеволода Сухоруких — автор не Анжела Моисеенко.';

// Filters live in the address (?category=<id>&size=M&available=1) so a filtered
// view survives a reload and can be shared. The URL is read after mount to keep
// the server-rendered markup identical to the first client render.
const GalleryClientPage = ({ galleryData }: { galleryData: GalleryData }) => {
  const [filters, setFilters] = useState<CatalogueFilters>(NO_FILTERS);

  useEffect(() => {
    setFilters(parseFilters(window.location.search));
  }, []);

  const apply = (next: CatalogueFilters) => {
    setFilters(next);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${filtersToQuery(next)}`);
  };

  const artworksToDisplay = filterArtworks(galleryData, filters);
  const pagingKey = `${filters.category}|${filters.size}|${filters.available}`;
  const { visible, remaining, showMore } = useGalleryPaging(artworksToDisplay, pagingKey);
  const other = sukhorukikhCategory(galleryData.categories);
  const sukhorukikhSelected = !!other && filters.category === other.id;

  return (
    <div className="min-h-screen">
      <GalleryHeader title={galleryData.bannerTitle} description={galleryData.bannerDescription} />

      <GalleryFilters
        categories={galleryData.categories}
        filters={filters}
        found={artworksToDisplay.length}
        onChange={(next) => apply({ ...filters, ...next })}
        onReset={() => apply(NO_FILTERS)}
      />

      <GalleryGrid
        artworks={visible}
        categories={galleryData.categories}
        remaining={remaining}
        total={artworksToDisplay.length}
        categoryKey={filters.category}
        onShowMore={showMore}
        onReset={() => apply(NO_FILTERS)}
        attribution={sukhorukikhSelected ? AUTHORSHIP : null}
      />
    </div>
  );
};

export default GalleryClientPage;
