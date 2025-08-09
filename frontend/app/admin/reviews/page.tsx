'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash, Star, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Review } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { useReviews, useDeleteReview, useCreateReview, useUpdateReview } from '@/hooks/useApi';

const ReviewsManagementPage = () => {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading, error: reviewsError } = useReviews();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const handleOpenModal = (review: Review | null = null) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedReview(null);
    setIsModalOpen(false);
  };

  const deleteMutation = useDeleteReview();

  const handleDelete = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;
  }

  if (reviewsError) {
    return <div className="text-red-500 text-center mt-10">Ошибка загрузки данных: {reviewsError?.message || 'Неизвестная ошибка'}</div>;
  }

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Управление отзывами</h1>
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Добавить отзыв</span>
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Автор</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Отзыв</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Рейтинг</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Активно</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews && Array.isArray(reviews) && reviews.map(review => (
                <tr key={review.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{review.authorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.content}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.rating}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {review.isActive ? 'Да' : 'Нет'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(review)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(review.id)} className="text-red-600 hover:text-red-900"><Trash className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {isModalOpen && (
        <ReviewModal
          review={selectedReview}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

const ReviewModal = ({ review, onClose }: { review: Review | null, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    authorName: review?.authorName || '',
    content: review?.content || '',
    rating: review?.rating || 5,
    isActive: review?.isActive || false,
  });

  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (review) {
      updateMutation.mutate({ id: review.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">{review ? 'Редактировать отзыв' : 'Добавить отзыв'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields here */}
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-gray-700">Автор</label>
            <input type="text" name="authorName" id="authorName" value={formData.authorName} onChange={e => setFormData({ ...formData, authorName: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Отзыв</label>
            <textarea name="content" id="content" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required></textarea>
          </div>
          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Рейтинг</label>
            <input type="number" name="rating" id="rating" value={formData.rating} onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })} min="1" max="5" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          <div className="flex items-center">
            <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Активно</label>
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="btn-secondary mr-4">
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
        </form>
      </div>
    </div>
  );
};

export default ReviewsManagementPage;