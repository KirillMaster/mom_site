import { getGalleryData } from '@/hooks/useApi';
import GalleryClientPage from './GalleryClientPage';

export const dynamic = 'force-dynamic';

const GalleryPage = async () => {
  const galleryData = await getGalleryData();

  if (!galleryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">Не удалось загрузить данные</p>
        </div>
      </div>
    );
  }

  return <GalleryClientPage galleryData={galleryData} />;
};

export default GalleryPage;