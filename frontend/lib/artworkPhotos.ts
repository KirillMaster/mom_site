import type { ArtworkImage } from '@/lib/api';

export interface ArtworkPhoto {
  path: string;
  thumbPath: string;
}

interface WithImages {
  imagePath: string;
  thumbnailPath?: string;
  images?: ArtworkImage[];
}

// Ordered photos of an artwork (cover first). Works without an images list
// fall back to their single legacy cover so older data keeps rendering.
export const getArtworkPhotos = (artwork: WithImages): ArtworkPhoto[] => {
  const images = [...(artwork.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  if (images.length === 0) {
    return [{ path: artwork.imagePath, thumbPath: artwork.thumbnailPath || artwork.imagePath }];
  }
  return images.map((image) => ({ path: image.imagePath, thumbPath: image.thumbnailPath || image.imagePath }));
};
