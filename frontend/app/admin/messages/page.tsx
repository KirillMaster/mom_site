'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import AdminPageShell from '@/components/AdminPageShell';
import MessagesList from '@/components/MessagesList';
import {
  useContactMessages,
  useOpenContactMessage,
  useArchiveContactMessage,
} from '@/hooks/useApi';
import { ContactMessageAdmin } from '@/lib/api';

const queryClient = new QueryClient();

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ru-RU');
  } catch {
    return iso;
  }
};

const MessagesPageContent = () => {
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [selected, setSelected] = useState<ContactMessageAdmin | null>(null);

  const { data, isLoading, isError } = useContactMessages(filter);
  const openMutation = useOpenContactMessage();
  const archiveMutation = useArchiveContactMessage();

  const handleOpen = async (id: number) => {
    const message = await openMutation.mutateAsync(id);
    setSelected(message);
  };

  const handleArchive = async (id: number) => {
    const message = await archiveMutation.mutateAsync(id);
    setSelected(message);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div className="text-red-500 p-8">Ошибка загрузки заявок.</div>;

  return (
    <AdminPageShell
      overlay={
        selected && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 w-full max-w-lg bg-white"
            >
              <h2 className="text-xl font-semibold mb-2">{selected.subject}</h2>
              <p className="text-sm text-gray-500 mb-4">
                {selected.name} · {selected.email} · {formatDate(selected.createdAt)}
              </p>
              <p className="whitespace-pre-wrap text-gray-800 mb-6">{selected.message}</p>

              <div className="flex justify-end space-x-3">
                {selected.status !== 'Archived' && (
                  <button onClick={() => handleArchive(selected.id)} className="btn-secondary">
                    Архивировать
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="btn-primary">
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )
      }
    >
      <div className="card p-6">
        <MessagesList
          messages={data?.items ?? []}
          unreadCount={data?.unreadCount ?? 0}
          filter={filter}
          onFilterChange={setFilter}
          onOpen={handleOpen}
          onArchive={handleArchive}
        />
      </div>
    </AdminPageShell>
  );
};

const MessagesPage = () => (
  <AdminAuthGuard>
    <QueryClientProvider client={queryClient}>
      <MessagesPageContent />
    </QueryClientProvider>
  </AdminAuthGuard>
);

export default MessagesPage;
