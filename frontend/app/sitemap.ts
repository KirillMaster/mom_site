import { MetadataRoute } from 'next';
import { getGalleryData } from '@/hooks/useApi';
import { artworksForSale } from '@/lib/gallery';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import { getBlogCategories, getLatestBlogPosts } from '@/lib/blogApi';

export const revalidate = 3600;

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
      url: `${baseUrl}/order`,
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
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  const blogPages = await blogSitemap(baseUrl);

  try {
    // Get dynamic data for artworks
    const galleryData = await getGalleryData();
    // Exhibition photo reports share the gallery page and are not works for
    // sale, so they do not earn a crawl budget of their own.
    const artworkPages = (galleryData ? artworksForSale(galleryData) : []).map((artwork) => ({
      url: `${baseUrl}/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`,
      lastModified: new Date(artwork.updatedAt || artwork.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    // Video query URLs (/videos?video=N) canonicalise to /videos, so listing
    // them would only feed search engines non-canonical duplicates.
    return [...staticPages, ...blogPages, ...artworkPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [...staticPages, ...blogPages];
  }
}

async function blogSitemap(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const [posts, categories] = await Promise.all([getLatestBlogPosts(), getBlogCategories()]);
    const postPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
    const categoryPages = categories
      .filter((category) => category.postCount > 0)
      .map((category) => ({
        url: `${baseUrl}/blog/category/${category.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }));
    return [...postPages, ...categoryPages];
  } catch (error) {
    console.error('Error adding blog to sitemap:', error);
    return [];
  }
}
