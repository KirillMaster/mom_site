'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, XCircle, ChevronLeft } from 'lucide-react';
import { useArtworks, useCategories, useCreateArtwork, useUpdateArtwork, useDeleteArtwork } from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getImageUrl } from '@/hooks/useApi';
import Link from 'next/link';
import { ArtworkAdminDto } from '@/lib/api'; // Добавлен импорт

const AdminArtworksPage = () => {
  const { data: artworks, isLoading, isError, refetch: refetchArtworks } = useArtworks();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  console.log('Artworks data:', artworks);
  console.log('Categories data (Artworks page):', categories);
  const createArtworkMutation = useCreateArtwork();
  const updateArtworkMutation = useUpdateArtwork();
  const deleteArtworkMutation = useDeleteArtwork();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentArtwork, setCurrentArtwork] = useState<any>(null);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    price: '',
    isForSale: true,
    categoryId: '',
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const openModal = (artwork?: any) => {
    if (artwork) {
      setIsEditMode(true);
      setCurrentArtwork(artwork);
      setFormState({
        title: artwork.title,
        description: artwork.description || '',
        price: artwork.price ? String(artwork.price) : '',
        isForSale: artwork.isForSale,
        categoryId: String(artwork.categoryId),
        image: null,
      });
      setImagePreview(getImageUrl(artwork.imagePath));
    } else {
      setIsEditMode(false);
      setCurrentArtwork(null);
      setFormState({
        title: '',
        description: '',
        price: '',
        isForSale: true,
        categoryId: '',
        image: null,
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormState({
      title: '',
      description: '',
      price: '',
      isForSale: true,
      categoryId: '',
      image: null,
    });
    setImagePreview(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormState({ ...formState, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormState({ ...formState, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormState({ ...formState, image: file });
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormState({ ...formState, image: null });
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', formState.title);
    formData.append('description', formState.description);
    formData.append('price', formState.price);
    formData.append('isForSale', String(formState.isForSale));
    formData.append('categoryId', formState.categoryId);
    if (formState.image) {
      formData.append('image', formState.image);
    }

    try {
      if (isEditMode && currentArtwork) {
        await updateArtworkMutation.mutateAsync({ id: currentArtwork.id, data: formData });
      } else {
        await createArtworkMutation.mutateAsync(formData);
      }
      refetchArtworks();
      closeModal();
    } catch (error) {
      console.error('Error saving artwork:', error);
      // TODO: Display error message to user
    } finally {
      refetchArtworks();
      closeModal();
      console.log('Artworks after refetch:', artworks);
    }
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{artwork.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artwork.category?.name || 'Без категории'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{artwork.price ? `${artwork.price} ₽` : 'Не указана'}</td>
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

        {/* Modal for Add/Edit Artwork */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                {isEditMode ? 'Редактировать картину' : 'Добавить новую картину'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Название</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formState.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formState.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formState.categoryId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories && Array.isArray(categories) && categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isForSale"
                    name="isForSale"
                    checked={formState.isForSale}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isForSale" className="ml-2 block text-sm text-gray-900">В продаже</label>
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">Изображение</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required={!isEditMode} // Image is required only for new artworks
                  />
                  {imagePreview && (
                    <div className="mt-4">
                      <img src={imagePreview} alt="Предпросмотр" className="max-w-xs h-auto rounded-md shadow-md" />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center"
                  disabled={createArtworkMutation.isPending || updateArtworkMutation.isPending}
                >
                  {(createArtworkMutation.isPending || updateArtworkMutation.isPending) && <LoadingSpinner size="sm" className="mr-2" />}
                  {isEditMode ? 'Сохранить изменения' : 'Добавить картину'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArtworksPage;
