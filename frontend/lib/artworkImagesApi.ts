import { api, ArtworkImage } from '@/lib/api';

interface ImagesResponse {
  images: ArtworkImage[];
}

const base = (artworkId: number) => `/admin/artworks/${artworkId}/images`;

export async function uploadArtworkImages(artworkId: number, files: File[]): Promise<ArtworkImage[]> {
  const form = new FormData();
  files.forEach((file) => form.append('Images', file));
  const { data } = await api.post<ImagesResponse>(base(artworkId), form);
  return data.images;
}

export async function deleteArtworkImage(artworkId: number, imageId: number): Promise<ArtworkImage[]> {
  const { data } = await api.delete<ImagesResponse>(`${base(artworkId)}/${imageId}`);
  return data.images;
}

export async function reorderArtworkImages(artworkId: number, imageIds: number[]): Promise<ArtworkImage[]> {
  const { data } = await api.put<ImagesResponse>(`${base(artworkId)}/order`, { imageIds });
  return data.images;
}
