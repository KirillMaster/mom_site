'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Video as VideoIcon } from 'lucide-react';
import { useVideos, useCreateVideo, useUpdateVideo, useDeleteVideo, useVideoCategories } from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getImageUrl } from '@/hooks/useApi'; // Added

const queryClient = new QueryClient();

const VideoManagementPageContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    videoFile: null as File | null,
    videoCategoryId: 0,
    displayOrder: 0,
  });

  const { data: videos, isLoading: isLoadingVideos, isError: isErrorVideos } = useVideos();
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories } = useVideoCategories();
  const createVideoMutation = useCreateVideo();
  const updateVideoMutation = useUpdateVideo();
  const deleteVideoMutation = useDeleteVideo();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (e.target instanceof HTMLInputElement) {
      const inputElement = e.target as HTMLInputElement;
      if (inputElement.type === 'file' && inputElement.files && inputElement.files.length > 0) {
        const file = inputElement.files[0];
        setVideoData(prev => ({ ...prev, videoFile: file }));
      } else {
        setVideoData(prev => ({ ...prev, [name]: name === 'videoCategoryId' || name === 'displayOrder' ? Number(value) : value }));
      }
    } else {
      setVideoData(prev => ({ ...prev, [name]: name === 'videoCategoryId' || name === 'displayOrder' ? Number(value) : value }));
    }
  };

  const handleAddEditVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', videoData.title);
    formData.append('description', videoData.description);
    formData.append('videoCategoryId', videoData.videoCategoryId.toString());
    formData.append('displayOrder', videoData.displayOrder.toString());
    if (videoData.videoFile) {
      formData.append('videoFile', videoData.videoFile);
    }

    if (editingVideo) {
      await updateVideoMutation.mutateAsync({ id: editingVideo.id, data: formData });
    } else {
      await createVideoMutation.mutateAsync(formData);
    }
    setIsModalOpen(false);
    setEditingVideo(null);
    setVideoData({ title: '', description: '', videoFile: null, videoCategoryId: 0, displayOrder: 0 });
  };

  const openEditModal = (video: any) => {
    setEditingVideo(video);
    setVideoData({
      title: video.title,
      description: video.description || '',
      videoFile: null, // Video files are not pre-filled for security reasons
      videoCategoryId: video.videoCategoryId,
      displayOrder: video.displayOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleDeleteVideo = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить это видео?')) {
      await deleteVideoMutation.mutateAsync(id);
    }
  };

  if (isLoadingVideos || isLoadingCategories) return <LoadingSpinner />;
  if (isErrorVideos || isErrorCategories) return <div className="text-red-500">Ошибка загрузки видео или категорий.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-3xl font-serif font-bold mb-8 text-gray-900">Управление видео</h1>

        <button
          onClick={() => { setEditingVideo(null); setVideoData({ title: '', description: '', videoFile: null, videoCategoryId: 0, displayOrder: 0 }); setIsModalOpen(true); }}
          className="btn-primary mb-6 flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" /> Добавить новое видео
        </button>

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Список видео</h2>
          {videos?.length === 0 ? (
            <p className="text-gray-600">Видео пока нет.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Превью</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL видео</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Категория</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Порядок</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {videos?.map((video) => (
                    <tr key={video.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{video.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                        {video.thumbnailPath ? (
                          <img src={getImageUrl(video.thumbnailPath)} alt="Превью" className="h-16 w-16 object-cover rounded" />
                        ) : (
                          <span>Нет превью</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{video.videoCategory?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{video.displayOrder}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openEditModal(video)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteVideo(video.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4">{editingVideo ? 'Редактировать видео' : 'Добавить видео'}</h2>
            <form onSubmit={handleAddEditVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Название</label>
                <input
                  type="text"
                  name="title"
                  value={videoData.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Описание</label>
                <textarea
                  name="description"
                  value={videoData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Видео файл (MP4)</label>
                <input
                  type="file"
                  name="videoFile"
                  accept="video/mp4"
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required={!editingVideo} // Required only for new videos
                />
                {editingVideo?.videoPath && (
                  <p className="mt-2 text-sm text-gray-500">Текущий файл: <a href={editingVideo.videoPath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{editingVideo.videoPath.split('/').pop()}</a></p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Категория</label>
                <select
                  name="videoCategoryId"
                  value={videoData.videoCategoryId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Порядок отображения</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={videoData.displayOrder}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createVideoMutation.isPending || updateVideoMutation.isPending}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createVideoMutation.isPending || updateVideoMutation.isPending ? <LoadingSpinner size="sm" /> : (editingVideo ? 'Сохранить изменения' : 'Добавить')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const VideoManagementPage = () => (
  <QueryClientProvider client={queryClient}>
    <VideoManagementPageContent />
  </QueryClientProvider>
);

export default VideoManagementPage;
