import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://angelamoiseenko.ru/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const auth = {
  setToken: (token: string) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },
  removeToken: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  },
};

// Check for token on app load
if (typeof window !== 'undefined' && auth.getToken()) {
  const token = auth.getToken();
  auth.setToken(token!);
  console.log('Token restored from localStorage:', token);
}

// Backend Models (for reference, not directly used in frontend data fetching)
export interface Artwork {
  id: number;
  title: string;
  description?: string;
  imagePath: string;
  thumbnailPath: string;
  price?: number;
  isForSale: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  category?: Category; // Original backend model might have this
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  artworks?: Artwork[]; // Original backend model might have this
}



export interface Video {
  id: number;
  title: string;
  description?: string;
  videoPath: string;
  thumbnailPath?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  videoCategoryId: number;
  videoCategory?: VideoCategory;
}

export interface VideoCategory {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  videos?: Video[];
}

export interface PageContent {
  id: number;
  pageKey: string;
  contentKey: string;
  textContent?: string;
  imagePath?: string;
  linkUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// DTOs for frontend consumption
export interface ArtworkDto {
  id: number;
  title: string;
  description?: string;
  imagePath: string;
  thumbnailPath: string;
  price?: number;
  isForSale: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  category?: CategoryDto; // Ссылка на DTO категории
}

export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ArtworkAdminDto {
  id: number;
  title: string;
  description?: string;
  imagePath: string;
  thumbnailPath: string;
  price?: number;
  isForSale: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  category?: CategoryDto; // Включаем DTO категории
}



export interface VideoDto {
  id: number;
  title: string;
  description?: string;
  videoPath: string;
  thumbnailPath?: string;
  videoCategoryId: number;
  videoCategory?: VideoCategoryDto;
}

export interface VideoCategoryDto {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
}

// Frontend Data Interfaces
export interface HomeData {
  welcomeMessage: string;
  bannerImage: string;
  biographyText: string;
  authorPhoto: string;
  artworks: ArtworkDto[];
  contacts: ContactsData;
}

export interface GalleryData {
  artworks: ArtworkDto[];
  categories: CategoryDto[];
  bannerTitle: string;
  bannerDescription: string;
}

export interface AboutData {
  biography: string;
  artistPhoto: string;
  bannerTitle: string;
  bannerDescription: string;
  additionalBiography: string;
  philosophy: string;
}

export interface ContactsData {
  socialLinks: SocialLinks;
  email?: string;
  phone?: string;
  address?: string;
  bannerTitle: string;
  bannerDescription: string;
  faq: FAQItem[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SocialLinks {
  instagram?: string;
  vk?: string;
  telegram?: string;
  whatsapp?: string;
  youtube?: string;
}

export interface VideosData {
  videos: VideoDto[]; // Изменено на VideoDto
  categories: VideoCategoryDto[]; // Изменено на VideoCategoryDto
}

export interface FooterData {
  description: string;
  socialLinks: SocialLinks;
  email?: string;
  phone?: string;
}

export interface Specialty {
  title: string;
  description: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}
