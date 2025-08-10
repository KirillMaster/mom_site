'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Palette, FileText, Video, Users, Settings, Tag } from 'lucide-react';
import { auth } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLogin, useArtworks, useCategories, useVideos } from '@/hooks/useApi';
import Link from 'next/link';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: ''
  });

  const { mutate: login, isPending, isError, error } = useLogin();

  const { data: artworks, isLoading: isLoadingArtworks } = useArtworks();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: videos, isLoading: isLoadingVideos } = useVideos();
  

  const artworksCount = artworks?.length || 0;
  const categoriesCount = categories?.length || 0;
  const videosCount = videos?.length || 0;
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    login(credentials, {
      onSuccess: () => {
        setIsAuthenticated(true);
      },
    });
  };

  const handleLogout = () => {
    auth.removeToken();
    setIsAuthenticated(false);
    setCredentials({ username: 'admin', password: '' });
  };

  useEffect(() => {
    if (!!auth.getToken()) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">
                Админ-панель
              </h1>
              <p className="text-gray-600 mt-2">
                Войдите для управления контентом сайта
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error?.message || 'Неизвестная ошибка'}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold text-gray-900">Админ-панель</h1>
          <div className="flex space-x-4">
            <Link href="/" className="btn-secondary">
              Вернуться на сайт
            </Link>
            <button onClick={handleLogout} className="btn-primary">
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl font-serif font-bold mb-8 text-gray-900">
            Управление контентом
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Artworks Management */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="card p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Картины</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Управление галереей картин, категориями и ценами
              </p>
              <Link href="/admin/artworks" className="btn-primary w-full text-center">
                Управлять
              </Link>
            </motion.div>

            {/* Page Content Management */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="card p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-warm-500 to-warm-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Контент страниц</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Редактирование текстов, изображений и ссылок на страницах
              </p>
              <Link href="/admin/pages" className="btn-primary w-full text-center">
                Управлять
              </Link>
            </motion.div>

            {/* Videos Management */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="card p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Видео</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Управление видеогалереей и категориями видео
              </p>
              <Link href="/admin/videos" className="btn-primary w-full text-center">
                Управлять
              </Link>
            </motion.div>

            {/* Video Categories Management */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="card p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Категории видео</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Управление категориями видео для видеогалереи
              </p>
              <Link href="/admin/video-categories" className="btn-primary w-full text-center">
                Управлять
              </Link>
            </motion.div>

            {/* Reviews Management */}
            

            {/* Categories Management */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="card p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Категории</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Управление категориями картин
              </p>
              <Link href="/admin/categories" className="btn-primary w-full text-center">
                Управлять
              </Link>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="mt-12">
            <h2 className="text-2xl font-serif font-bold mb-6 text-gray-900">
              Статистика
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">{artworksCount}</div>
                <div className="text-gray-600">Картин в галерее</div>
              </div>
              <div className="card p-6">
                <div className="text-3xl font-bold text-secondary-600 mb-2">{categoriesCount}</div>
                <div className="text-gray-600">Категории картин</div>
              </div>
              <div className="card p-6">
                <div className="text-3xl font-bold text-warm-600 mb-2">{videosCount}</div>
                <div className="text-gray-600">Видео в галерее</div>
              </div>
              
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminPage;