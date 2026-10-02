export type BlogStatus = 'Draft' | 'Scheduled' | 'Published';

export interface BlogCategoryRef {
  slug: string;
  name: string;
}

export interface BlogPostListItem {
  slug: string;
  title: string;
  excerpt: string;
  coverImagePath?: string | null;
  coverAlt?: string | null;
  category: BlogCategoryRef;
  publishedAt: string;
  readingMinutes: number;
}

export interface BlogPostPage {
  items: BlogPostListItem[];
  total: number;
  page: number;
  pageSize: number;
  category?: (BlogCategoryRef & { description?: string | null }) | null;
}

export interface BlogPost extends BlogPostListItem {
  bodyHtml: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  updatedAt: string;
}

export interface BlogRelatedArtwork {
  id: number;
  title: string;
  thumbnailPath: string;
  isForSale: boolean;
  slug: string;
}

export interface BlogPublicPost {
  post: BlogPost;
  artworks: BlogRelatedArtwork[];
}

export interface BlogPublicCategory extends BlogCategoryRef {
  postCount: number;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  postCount: number;
}

export interface BlogCategorySave {
  name: string;
  slug: string;
  description?: string | null;
  displayOrder?: number;
}

export interface BlogPostAdminListItem {
  id: number;
  title: string;
  slug: string;
  status: BlogStatus;
  publishedAt?: string | null;
  updatedAt: string;
  blogCategoryId: number;
  categoryName: string;
}

export interface BlogCover {
  imagePath?: string | null;
  alt?: string | null;
}

export interface BlogSeo {
  title?: string | null;
  description?: string | null;
}

export interface BlogPostAdmin extends BlogPostAdminListItem {
  bodyHtml: string;
  excerpt?: string | null;
  cover: BlogCover;
  seo: BlogSeo;
  artworkIds: number[];
}

export interface BlogPostSave {
  title: string;
  slug: string;
  bodyHtml: string;
  excerpt?: string | null;
  cover?: BlogCover;
  seo?: BlogSeo;
  blogCategoryId?: number | null;
  artworkIds?: number[];
  publishedAt?: string | null;
}

export type BlogFieldErrors = Record<string, string>;
