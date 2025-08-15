import { MetadataRoute } from 'next';
import { getHomeData, getGalleryData, getAboutData, getContactsData, getVideosData } from '@/hooks/useApi';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://angelamoiseenko.ru';
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacts`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  try {
    // Get dynamic data for artworks
    const galleryData = await getGalleryData();
    const artworkPages = galleryData?.artworks?.map((artwork) => ({
      url: `${baseUrl}/gallery?artwork=${artwork.id}`,
      lastModified: new Date(artwork.updatedAt || artwork.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) || [];

    // Get dynamic data for videos
    const videosData = await getVideosData();
    const videoPages = videosData?.videos?.map((video) => ({
      url: `${baseUrl}/videos?video=${video.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })) || [];

    return [...staticPages, ...artworkPages, ...videoPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
