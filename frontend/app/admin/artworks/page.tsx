'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, XCircle, ChevronLeft } from 'lucide-react';
import { useArtworks, useCategories, useDeleteArtwork } from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getImageUrl } from '@/hooks/useApi';
import Link from 'next/link';
import { ArtworkAdminDto } from '@/lib/api'; // Добавлен импорт
import ArtworkForm from '@/components/admin/ArtworkForm';
import { buildArtworkSlug } from '@/lib/artworkSlug';

const AdminArtworksPage = () => {
  const { data: artworks, isLoading, isError, refetch: refetchArtworks } = useArtworks();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const deleteArtworkMutation = useDeleteArtwork();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentArtwork, setCurrentArtwork] = useState<any>(null);

  const openModal = (artwork?: any) => {
    setCurrentArtwork(artwork ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSaved = () => {
    refetchArtworks();
    closeModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту картину?')) {
      try {
        await deleteArtworkMutation.mutateAsync(id);
        refetchArtworks();
      } catch (error) {
        console.error('Error deleting artwork:', error);
        // TODO: Display error message to user
      }
    }
  };

  if (isLoading || isLoadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">Произошла ошибка при загрузке данных о картинах.</p>
          <button
            onClick={() => refetchArtworks()}
            className="btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin" className="text-blue-600 hover:underline flex items-center mb-4">
          <ChevronLeft className="w-5 h-5 mr-1" /> Назад в админ-панель
        </Link>
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">Управление картинами</h1>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Добавить картину
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Изображение</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Категория</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">В продаже</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {artworks && Array.isArray(artworks) && artworks.map((artwork: ArtworkAdminDto) => (
                <tr key={artwork.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={getImageUrl(artwork.thumbnailPath)} alt={artwork.title} className="h-16 w-16 object-cover rounded-md" />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {artwork.title}
                    <a
                      href={`/gallery/${buildArtworkSlug(artwork.title, artwork.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-xs font-normal text-indigo-600 hover:text-indigo-900"
                    >
                      /gallery/{buildArtworkSlug(artwork.title, artwork.id)}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artwork.category?.name || 'Без категории'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {artwork.isForSale ? (
                      artwork.price && artwork.price > 0 ? `${artwork.price} ₽` : 'Цена: договорная'
                    ) : (
                      'Не продается'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {artwork.isForSale ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Да</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Нет</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(artwork)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(artwork.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal for Add/Edit Artwork — overlay itself scrolls so the
            submit button is always reachable, even on short viewports
            with an image preview. */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto p-4">
            <div className="min-h-full flex items-start justify-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl relative my-8"
              >
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                  {currentArtwork ? 'Редактировать картину' : 'Добавить новую картину'}
                </h2>

                <ArtworkForm
                  key={currentArtwork?.id ?? 'new'}
                  artwork={currentArtwork}
                  categories={categories}
                  onSaved={handleSaved}
                />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArtworksPage;
