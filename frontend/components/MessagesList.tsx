'use client';

import { useMemo, useState } from 'react';
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

// UTM badges for a lead's source; falls back to a plain-text label so the
// column never renders as an empty gap when the visitor came in directly.
const LeadSource = ({ message }: { message: ContactMessageAdmin }) => {
  const { utmSource, utmMedium, utmCampaign } = message;
  if (!utmSource && !utmMedium && !utmCampaign) {
    return <span className="text-xs text-gray-500">Источник: прямой заход</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {utmSource && (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {utmSource}
        </span>
      )}
      {utmMedium && (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
          {utmMedium}
        </span>
      )}
      {utmCampaign && (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
          {utmCampaign}
        </span>
      )}
    </div>
  );
};

// IP/user-agent are diagnostic, not something the owner reads day-to-day —
// tucked behind <details> so the table stays scannable.
const TechDetails = ({ message }: { message: ContactMessageAdmin }) => {
  if (!message.ipAddress && !message.userAgent) return null;

  return (
    <details className="mt-1">
      <summary className="text-xs text-gray-400 cursor-pointer select-none">Технические данные</summary>
      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
        {message.ipAddress && <div>IP: {message.ipAddress}</div>}
        {message.userAgent && <div className="break-all">User-Agent: {message.userAgent}</div>}
      </div>
    </details>
  );
};

const matchesQuery = (message: ContactMessageAdmin, query: string) => {
  const haystack = `${message.name} ${message.email} ${message.subject} ${message.message}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
};

const MessagesList = ({ messages, unreadCount, onOpen, onArchive, filter, onFilterChange }: MessagesListProps) => {
  const [search, setSearch] = useState('');

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    return messages.filter((message) => matchesQuery(message, search));
  }, [messages, search]);

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

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по имени, email, теме или тексту заявки"
          aria-label="Поиск по заявкам"
          className="w-full sm:w-96 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
        />
      </div>

      {filteredMessages.length === 0 ? (
        <div className="card p-6 text-center text-gray-600" data-testid="empty-state">
          {messages.length === 0
            ? filter === 'archived'
              ? 'В архиве пока нет заявок.'
              : 'Заявок пока нет.'
            : 'Ничего не найдено по вашему запросу.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Контакт</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тема</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Источник</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMessages.map((message) => (
                <tr
                  key={message.id}
                  data-testid={`message-row-${message.id}`}
                  className={message.status === 'New' ? 'font-semibold bg-primary-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(message.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{message.name}</div>
                    <a href={`mailto:${message.email}`} className="text-indigo-600 hover:text-indigo-900 font-normal">
                      {message.email}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{message.subject}</div>
                    <TechDetails message={message} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <LeadSource message={message} />
                  </td>
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
