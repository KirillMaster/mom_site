'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import AdminPageShell from '@/components/AdminPageShell';
import ReviewsList from '@/components/ReviewsList';
import {
  useAdminReviews,
  usePublishReview,
  useUnpublishReview,
  useUpdateReview,
  useDeleteReview,
} from '@/hooks/useApi';
import { ReviewAdmin } from '@/lib/api';

const queryClient = new QueryClient();

const ReviewsPageContent = () => {
  const [editing, setEditing] = useState<ReviewAdmin | null>(null);
  const [editText, setEditText] = useState('');

  const { data, isLoading, isError } = useAdminReviews();
  const publishMutation = usePublishReview();
  const unpublishMutation = useUnpublishReview();
  const updateMutation = useUpdateReview();
  const deleteMutation = useDeleteReview();

  const handleEdit = (review: ReviewAdmin) => {
    setEditing(review);
    setEditText(review.text);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing.id, payload: { text: editText } });
    setEditing(null);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div className="text-red-500 p-8">Ошибка загрузки отзывов.</div>;

  return (
    <AdminPageShell
      overlay={
        editing && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 w-full max-w-lg bg-white"
            >
              <h2 className="text-xl font-semibold mb-4">Редактировать отзыв</h2>
              <label className="block text-sm text-gray-700 mb-1" htmlFor="review-edit-text">
                Текст отзыва
              </label>
              <textarea
                id="review-edit-text"
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm mb-4"
                rows={5}
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => setEditing(null)} className="btn-secondary">
                  Отмена
                </button>
                <button onClick={handleSaveEdit} className="btn-primary">
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )
      }
    >
      <div className="card p-6">
        <ReviewsList
          reviews={data ?? []}
          onPublish={(id) => publishMutation.mutate(id)}
          onUnpublish={(id) => unpublishMutation.mutate(id)}
          onEdit={handleEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>
    </AdminPageShell>
  );
};

const ReviewsPage = () => (
  <AdminAuthGuard>
    <QueryClientProvider client={queryClient}>
      <ReviewsPageContent />
    </QueryClientProvider>
  </AdminAuthGuard>
);

export default ReviewsPage;
