import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, auth, API_BASE_URL, Artwork, Category, Video, VideoCategory, PageContent, HomeData, GalleryData, AboutData, ContactsData, VideosData, FooterData, ArtworkDto, CategoryDto, ArtworkAdminDto } from '../lib/api';
import { ContactMessage } from '../lib/api';

// Helper to get image URL
export const getImageUrl = (path: string) => {
  // If path is already a full URL (S3), return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Otherwise, prepend API base URL for local files
  return `${API_BASE_URL}${path}`;
};

// Public API Hooks
export async function getHomeData(): Promise<HomeData> {
  const response = await api.get('/public/home');
  return response.data;
}

export function useHomeData() {
  return useQuery<HomeData, Error>({
    queryKey: ['homeData'],
    queryFn: getHomeData,
  });
}

export async function getGalleryData(): Promise<GalleryData> {
  const response = await api.get('/public/gallery');
  console.log('Raw Gallery API Response:', response.data);
  return {
    ...response.data,
    artworks: response.data.artworks?.$values || response.data.artworks || [],
    categories: response.data.categories?.$values || response.data.categories || [],
  };
}

export function useGalleryData() {
  return useQuery<GalleryData, Error>({
    queryKey: ['galleryData'],
    queryFn: getGalleryData,
  });
}

export async function getAboutData(): Promise<AboutData> {
  const response = await api.get('/public/about');
  return {
    ...response.data,
    specialties: response.data.specialties?.$values || response.data.specialties || [],
  };
}

export function useAboutData() {
  return useQuery<AboutData, Error>({
    queryKey: ['aboutData'],
    queryFn: getAboutData,
  });
}

export async function getContactsData(): Promise<ContactsData> {
  const response = await api.get('/public/contacts');
  return response.data;
}

export function useContactsData() {
  return useQuery<ContactsData, Error>({
    queryKey: ['contactsData'],
    queryFn: getContactsData,
  });
}

export async function getFooterData(): Promise<FooterData> {
  const response = await api.get('/public/footer');
  return response.data;
}

export const useFooterData = () => {
  return useQuery({
    queryKey: ['footer'],
    queryFn: getFooterData,
  });
};

export async function getVideosData(): Promise<VideosData> {
  const response = await api.get('/public/videos');
  return {
    ...response.data,
    categories: response.data.categories || [],
    videos: response.data.videos || [],
  };
}

export function useVideosData() {
  return useQuery<VideosData, Error>({
    queryKey: ['videosData'],
    queryFn: getVideosData,
  });
}

export const sendContactMessage = async (message: ContactMessage) => {
  const response = await api.post('/public/contact-message', message);
  return response.data;
};

// Admin API Hooks
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<{
    token: string;
  }, Error, { username: string; password: string }>({
    mutationFn: async ({ username, password }) => {
      const response = await api.post('/admin/login', { username, password });
      return response.data;
    },
    onSuccess: (data) => {
      auth.setToken(data.token);
      queryClient.invalidateQueries();
    },
  });
}

export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/admin/categories');
      return response.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, { name: string; description?: string; displayOrder?: number }>({
    mutationFn: async (data) => {
      const response = await api.post('/admin/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, { id: number; data: { name?: string; description?: string; displayOrder?: number; isActive?: boolean } }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useArtworks() {
  return useQuery<ArtworkAdminDto[], Error>({
    queryKey: ['artworks'],
    queryFn: async () => {
      console.log('Fetching artworks...');
      console.log('Request headers for artworks:', api.defaults.headers.common);
      const response = await api.get('/admin/artworks');
      // Проверяем, является ли response.data массивом, если нет, то пытаемся получить $values
      return Array.isArray(response.data) ? response.data : response.data.$values || [];
    },
  });
}

export function useCreateArtwork() {
  const queryClient = useQueryClient();
  return useMutation<Artwork, Error, FormData>({
    mutationFn: async (data) => {
      const response = await api.post('/admin/artworks/create', data, { // Изменено: добавлен "/create"
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['galleryData'] });
    },
  });
}

export function useUpdateArtwork() {
  const queryClient = useQueryClient();
  return useMutation<Artwork, Error, { id: number; data: FormData }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/artworks/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['galleryData'] });
    },
  });
}

export function useDeleteArtwork() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/admin/artworks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['galleryData'] });
    },
  });
}









export function usePageContent(pageKey: string) {
  return useQuery<PageContent[], Error>({
    queryKey: ['pageContent', pageKey],
    queryFn: async () => {
      const response = await api.get(`/admin/page-content-by-key?pageKey=${pageKey}`);
      return response.data;
    },
  });
}

export function useUpdatePageContent() {
  const queryClient = useQueryClient();
  return useMutation<PageContent, Error, { id: number; data: FormData }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/page-content/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all pageContent queries since we don't know which pageKey was updated from FormData
      queryClient.invalidateQueries({ queryKey: ['pageContent'] });
    },
  });
}

export function useCreatePageContent() {
  const queryClient = useQueryClient();
  return useMutation<PageContent, Error, FormData>({
    mutationFn: async (data) => {
      const response = await api.post('/admin/page-content', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageContent'] });
    },
  });
}

export function useVideos() {
  return useQuery<Video[], Error>({
    queryKey: ['videos'],
    queryFn: async () => {
      const response = await api.get('/admin/videos');
      return response.data;
    },
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation<Video, Error, FormData>({
    mutationFn: async (data) => {
      const response = await api.post('/admin/videos', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videosData'] });
    },
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation<Video, Error, { id: number; data: FormData }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/videos/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videosData'] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/admin/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['videosData'] });
    },
  });
}

export function useVideoCategories() {
  return useQuery<VideoCategory[], Error>({
    queryKey: ['videoCategories'],
    queryFn: async () => {
      const response = await api.get('/admin/video-categories');
      return response.data.$values || response.data;
    },
  });
}

export function useCreateVideoCategory() {
  const queryClient = useQueryClient();
  return useMutation<VideoCategory, Error, { name: string; description?: string; displayOrder?: number }>({
    mutationFn: async (data) => {
      const response = await api.post('/admin/video-categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoCategories'] });
      queryClient.invalidateQueries({ queryKey: ['videosData'] });
      queryClient.refetchQueries({ queryKey: ['videoCategories'] });
    },
  });
}

export function useUpdateVideoCategory() {
  const queryClient = useQueryClient();
  return useMutation<VideoCategory, Error, { id: number; data: { name?: string; description?: string; displayOrder?: number; isActive?: boolean } }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/video-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoCategories'] });
      queryClient.invalidateQueries({ queryKey: ['videosData'] });
    },
  });
}


  export function useDeleteVideoCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.delete(`/admin/video-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoCategories'] });
      queryClient.invalidateQueries({ queryKey: ['videosData'] });
    },
  });
}