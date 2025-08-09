'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Edit } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageContent } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { usePageContent, useUpdatePageContent, getImageUrl } from '@/hooks/useApi';

const PageContentManagement = () => {
  const [selectedPage, setSelectedPage] = useState('home');
  const queryClient = useQueryClient();

  const { data: pageContent, isLoading, error: pageContentError } = usePageContent(selectedPage);

  const mutation = useUpdatePageContent();

  const handleUpdate = (id: number, data: any) => {
    mutation.mutate({ id, data });
  };

  const pageKeys = ['home', 'about', 'contacts'];

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center space-x-3 mb-8">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Управление контентом страниц</h1>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {pageKeys.map(pageKey => (
              <button
                key={pageKey}
                onClick={() => setSelectedPage(pageKey)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedPage === pageKey
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                {pageKey.charAt(0).toUpperCase() + pageKey.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {isLoading && <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}
        {pageContentError && <div className="text-red-500 text-center">Ошибка: {pageContentError?.message || 'Неизвестная ошибка'}</div>}

        <div className="space-y-6">
          {pageContent && Array.isArray(pageContent) && pageContent.map(content => (
            <ContentItem key={content.id} content={content} onUpdate={handleUpdate} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const ContentItem = ({ content, onUpdate }: { content: PageContent, onUpdate: (id: number, data: any) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState(content);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleSave = () => {
    const formData = new FormData();
    if (formState.textContent !== null) formData.append('textContent', formState.textContent || '');
    if (formState.linkUrl !== null) formData.append('linkUrl', formState.linkUrl || '');
    formData.append('isActive', formState.isActive.toString());
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    onUpdate(content.id, formData);
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{content.contentKey}</h3>
          <p className="text-sm text-gray-500">{content.pageKey}</p>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className="text-gray-500 hover:text-gray-700">
          <Edit className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-4">
        {isEditing ? (
          <div className="space-y-4">
            {content.textContent !== null && (
              <textarea value={formState.textContent || ''} onChange={e => setFormState({...formState, textContent: e.target.value})} className="w-full p-2 border rounded-md" />
            )}
            {content.imagePath !== null && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Изображение</label>
                <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                {content.imagePath && !selectedImage && (
                  <img src={getImageUrl(content.imagePath)} alt="Current" className="mt-2 max-h-24 rounded-md" />
                )}
                {selectedImage && (
                  <img src={URL.createObjectURL(selectedImage)} alt="New" className="mt-2 max-h-24 rounded-md" />
                )}
              </div>
            )}
            {content.linkUrl !== null && (
              <input type="text" value={formState.linkUrl || ''} onChange={e => setFormState({...formState, linkUrl: e.target.value})} className="w-full p-2 border rounded-md" />
            )}
            <div className="flex items-center">
              <input type="checkbox" checked={formState.isActive} onChange={e => setFormState({...formState, isActive: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label className="ml-2 block text-sm text-gray-900">Активно</label>
            </div>
            <button onClick={handleSave} className="btn-primary">Сохранить</button>
          </div>
        ) : (
          <div className="space-y-2">
            {content.textContent && <p className="text-gray-700">{content.textContent}</p>}
            {content.imagePath && <img src={getImageUrl(content.imagePath)} alt="" className="max-h-40 rounded-md"/>}
            {content.linkUrl && <a href={content.linkUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{content.linkUrl}</a>}
            <p className={`text-sm font-medium ${content.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {content.isActive ? 'Активно' : 'Неактивно'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PageContentManagement;