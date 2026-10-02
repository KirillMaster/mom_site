'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminAuthGuard from '@/components/AdminAuthGuard';
import PostEditor from '@/components/blog/admin/PostEditor';

const queryClient = new QueryClient();

const BlogPostEditPage = ({ params }: { params: { id: string } }) => {
  const id = params.id === 'new' ? null : Number(params.id);
  return (
    <AdminAuthGuard>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 p-3 sm:p-8">
          {id !== null && Number.isNaN(id)
            ? <p role="alert" className="text-red-600">Такой новости нет.</p>
            : <PostEditor key={params.id} postId={id} />}
        </div>
      </QueryClientProvider>
    </AdminAuthGuard>
  );
};

export default BlogPostEditPage;
