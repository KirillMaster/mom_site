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
      <h1 className="text-3xl font-serif font-semibold text-ink mb-4">Отзывы</h1>

      {reviews.length === 0 ? (
        <div className="card p-6 text-center text-ink-500" data-testid="empty-state">
          Отзывов пока нет.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-paper-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Автор</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Текст</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Рейтинг</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-paper-50 divide-y divide-line">
              {reviews.map((review) => (
                <tr key={review.id} data-testid={`review-row-${review.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">{formatDate(review.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-ink">
                    <div>{review.authorName}</div>
                    {review.authorCity && <div className="text-xs text-ink-500">{review.authorCity}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink max-w-md">{review.text}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">{review.rating} / 5</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      data-testid={`review-status-${review.id}`}
                      className={
                        review.isPublished
                          ? 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'
                          : 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-paper-200 text-ink-700'
                      }
                    >
                      {review.isPublished ? 'Опубликован' : 'Не опубликован'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {review.isPublished ? (
                      <button onClick={() => onUnpublish(review.id)} className="text-ochre-700 hover:text-ink">
                        Снять с публикации
                      </button>
                    ) : (
                      <button onClick={() => onPublish(review.id)} className="text-green-600 hover:text-green-900">
                        Опубликовать
                      </button>
                    )}
                    <button onClick={() => onEdit(review)} className="text-sea hover:text-sea-700">
                      Редактировать
                    </button>
                    {pendingDeleteId === review.id ? (
                      <span className="inline-flex items-center space-x-2">
                        <span className="text-xs text-ink-500">Удалить?</span>
                        <button onClick={() => executeDelete(review.id)} className="text-red-600 hover:text-red-900">
                          Да
                        </button>
                        <button onClick={cancelDelete} className="text-ink-500 hover:text-ink-600">
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
