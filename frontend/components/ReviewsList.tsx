'use client';

import { useState } from 'react';
import { ReviewAdmin } from '@/lib/api';

interface ReviewsListProps {
  reviews: ReviewAdmin[];
  onPublish: (id: number) => void;
  onUnpublish: (id: number) => void;
  onEdit: (review: ReviewAdmin) => void;
  onDelete: (id: number) => void;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ru-RU');
  } catch {
    return iso;
  }
};

const ReviewsList = ({ reviews, onPublish, onUnpublish, onEdit, onDelete }: ReviewsListProps) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const confirmDelete = (id: number) => {
    setPendingDeleteId(id);
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
  };

  const executeDelete = (id: number) => {
    onDelete(id);
    setPendingDeleteId(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">Отзывы</h1>

      {reviews.length === 0 ? (
        <div className="card p-6 text-center text-gray-600" data-testid="empty-state">
          Отзывов пока нет.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Автор</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Текст</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Рейтинг</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review) => (
                <tr key={review.id} data-testid={`review-row-${review.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(review.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{review.authorName}</div>
                    {review.authorCity && <div className="text-xs text-gray-500">{review.authorCity}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md">{review.text}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.rating} / 5</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      data-testid={`review-status-${review.id}`}
                      className={
                        review.isPublished
                          ? 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'
                          : 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800'
                      }
                    >
                      {review.isPublished ? 'Опубликован' : 'Не опубликован'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {review.isPublished ? (
                      <button onClick={() => onUnpublish(review.id)} className="text-amber-600 hover:text-amber-900">
                        Снять с публикации
                      </button>
                    ) : (
                      <button onClick={() => onPublish(review.id)} className="text-green-600 hover:text-green-900">
                        Опубликовать
                      </button>
                    )}
                    <button onClick={() => onEdit(review)} className="text-indigo-600 hover:text-indigo-900">
                      Редактировать
                    </button>
                    {pendingDeleteId === review.id ? (
                      <span className="inline-flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Удалить?</span>
                        <button onClick={() => executeDelete(review.id)} className="text-red-600 hover:text-red-900">
                          Да
                        </button>
                        <button onClick={cancelDelete} className="text-gray-500 hover:text-gray-700">
                          Отмена
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => confirmDelete(review.id)} className="text-red-600 hover:text-red-900">
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
