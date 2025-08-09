'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash, Tag, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Category } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { useCategories, useDeleteCategory, useCreateCategory, useUpdateCategory } from '@/hooks/useApi';

const CategoriesManagementPage = () => {
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error: categoriesError } = useCategories();
  console.log('Categories data:', categories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleOpenModal = (category: Category | null = null) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedCategory(null);
    setIsModalOpen(false);
  };

  const deleteMutation = useDeleteCategory();

  const handleDelete = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;
  }

  if (categoriesError) {
    return <div className="text-red-500 text-center mt-10">Ошибка загрузки данных: {categoriesError?.message || 'Неизвестная ошибка'}</div>;
  }

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Управление категориями</h1>
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Добавить категорию</span>
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Порядок</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Активно</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories && Array.isArray(categories) && categories.map(category => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.displayOrder}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {category.isActive ? 'Да' : 'Нет'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(category)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900"><Trash className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {isModalOpen && (
        <CategoryModal
          category={selectedCategory}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

const CategoryModal = ({ category, onClose }: { category: Category | null, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive || false,
  });

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      updateMutation.mutate({ id: category.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">{category ? 'Редактировать категорию' : 'Добавить новую категорию'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Название</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea name="description" id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"></textarea>
          </div>
          <div>
            <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">Порядок отображения</label>
            <input type="number" name="displayOrder" id="displayOrder" value={formData.displayOrder} onChange={e => setFormData({ ...formData, displayOrder: Number(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          {category && ( // Only show isActive checkbox for existing categories
            <div className="flex items-center">
              <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Активно</label>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="btn-secondary mr-4">
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriesManagementPage;
