'use client';

import { ContactMessageAdmin } from '@/lib/api';

interface MessagesListProps {
  messages: ContactMessageAdmin[];
  unreadCount?: number;
  onOpen: (id: number) => void;
  onArchive: (id: number) => void;
  filter: 'active' | 'archived';
  onFilterChange: (filter: 'active' | 'archived') => void;
}

const statusLabel: Record<ContactMessageAdmin['status'], string> = {
  New: 'Новая',
  Read: 'Прочитана',
  Archived: 'В архиве',
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ru-RU');
  } catch {
    return iso;
  }
};

const MessagesList = ({ messages, unreadCount, onOpen, onArchive, filter, onFilterChange }: MessagesListProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-serif font-bold text-gray-900 flex items-center">
          Заявки с сайта
          {!!unreadCount && (
            <span
              data-testid="unread-badge"
              className="ml-3 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-red-500 text-white"
            >
              {unreadCount}
            </span>
          )}
        </h1>

        <div className="flex space-x-2">
          <button
            onClick={() => onFilterChange('active')}
            className={filter === 'active' ? 'btn-primary' : 'btn-secondary'}
          >
            Активные
          </button>
          <button
            onClick={() => onFilterChange('archived')}
            className={filter === 'archived' ? 'btn-primary' : 'btn-secondary'}
          >
            Архив
          </button>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="card p-6 text-center text-gray-600" data-testid="empty-state">
          {filter === 'archived' ? 'В архиве пока нет заявок.' : 'Заявок пока нет.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тема</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.map((message) => (
                <tr
                  key={message.id}
                  data-testid={`message-row-${message.id}`}
                  className={message.status === 'New' ? 'font-semibold bg-primary-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(message.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{message.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{message.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{statusLabel[message.status]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onClick={() => onOpen(message.id)} className="text-indigo-600 hover:text-indigo-900">
                      Открыть
                    </button>
                    {message.status !== 'Archived' && (
                      <button onClick={() => onArchive(message.id)} className="text-red-600 hover:text-red-900">
                        Архивировать
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

export default MessagesList;
