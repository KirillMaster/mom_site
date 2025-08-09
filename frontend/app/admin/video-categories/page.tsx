'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useVideoCategories, useCreateVideoCategory, useUpdateVideoCategory, useDeleteVideoCategory } from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const VideoCategoryManagementPageContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryData, setCategoryData] = useState({
    name: '',
    description: '',
    displayOrder: 0,
  });

  const { data: categories, isLoading, isError } = useVideoCategories();
  const createCategoryMutation = useCreateVideoCategory();
  const updateCategoryMutation = useUpdateVideoCategory();
  const deleteCategoryMutation = useDeleteVideoCategory();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryData(prev => ({ ...prev, [name]: name === 'displayOrder' ? Number(value) : value }));
  };

  const handleAddEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data: categoryData });
    } else {
      await createCategoryMutation.mutateAsync(categoryData);
    }
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryData({ name: '', description: '', displayOrder: 0 });
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setCategoryData({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
      await deleteCategoryMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div className="text-red-500">Ошибка загрузки категорий видео.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-3xl font-serif font-bold mb-8 text-gray-900">Управление категориями видео</h1>

        <button
          onClick={() => { setEditingCategory(null); setCategoryData({ name: '', description: '', displayOrder: 0 }); setIsModalOpen(true); }}
          className="btn-primary mb-6 flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" /> Добавить новую категорию
        </button>

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Список категорий видео</h2>
          {categories?.length === 0 ? (
            <p className="text-gray-600">Категорий видео пока нет.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Порядок</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories?.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.displayOrder}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openEditModal(category)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4">{editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}</h2>
            <form onSubmit={handleAddEditCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Название</label>
                <input
                  type="text"
                  name="name"
                  value={categoryData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Описание</label>
                <textarea
                  name="description"
                  value={categoryData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Порядок отображения</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={categoryData.displayOrder}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending ? <LoadingSpinner size="sm" /> : (editingCategory ? 'Сохранить изменения' : 'Добавить')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const VideoCategoryManagementPage = () => (
  <QueryClientProvider client={queryClient}>
    <VideoCategoryManagementPageContent />
  </QueryClientProvider>
);

export default VideoCategoryManagementPage;
