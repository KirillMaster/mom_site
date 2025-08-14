'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Upload } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://angelamoiseenko.ru';


interface PageContent {
  id: number;
  pageKey: string;
  contentKey: string;
  textContent?: string;
  imagePath?: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

interface PageField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'image';
  required?: boolean;
}

const pageFields: Record<string, PageField[]> = {
  home: [
    { key: 'welcome_message', label: 'Приветственное сообщение', type: 'textarea' },
    { key: 'banner_image', label: 'Изображение баннера', type: 'image' },
    { key: 'home_biography_text', label: 'Текст биографии', type: 'textarea' },
    { key: 'home_author_photo', label: 'Фото автора', type: 'image' }
  ],
  gallery: [
    { key: 'banner_title', label: 'Заголовок баннера', type: 'text', required: true },
    { key: 'banner_description', label: 'Описание баннера', type: 'textarea' }
  ],
  about: [
    { key: 'banner_title', label: 'Заголовок баннера', type: 'text', required: true },
    { key: 'banner_description', label: 'Описание баннера', type: 'textarea' },
    { key: 'biography', label: 'Биография', type: 'textarea' },
    { key: 'additional_biography', label: 'Дополнительная биография', type: 'textarea' },
    { key: 'philosophy', label: 'Философия', type: 'textarea' },
    { key: 'artist_photo', label: 'Фото художника', type: 'image' }
  ],
  contacts: [
    { key: 'banner_title', label: 'Заголовок баннера', type: 'text', required: true },
    { key: 'banner_description', label: 'Описание баннера', type: 'textarea' },
    { key: 'phone', label: 'Номер телефона', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'faq_question_1', label: 'Вопрос 1', type: 'text' },
    { key: 'faq_answer_1', label: 'Ответ 1', type: 'textarea' },
    { key: 'faq_question_2', label: 'Вопрос 2', type: 'text' },
    { key: 'faq_answer_2', label: 'Ответ 2', type: 'textarea' },
    { key: 'faq_question_3', label: 'Вопрос 3', type: 'text' },
    { key: 'faq_answer_3', label: 'Ответ 3', type: 'textarea' },
    { key: 'faq_question_4', label: 'Вопрос 4', type: 'text' },
    { key: 'faq_answer_4', label: 'Ответ 4', type: 'textarea' }
  ],
  social: [
    { key: 'instagram', label: 'Instagram ссылка', type: 'url' },
    { key: 'vk', label: 'VK ссылка', type: 'url' },
    { key: 'telegram', label: 'Telegram ссылка', type: 'url' },
    { key: 'whatsapp', label: 'WhatsApp ссылка', type: 'url' },
    { key: 'youtube', label: 'YouTube ссылка', type: 'url' }
  ],
  footer: [
    { key: 'description', label: 'Описание в футере', type: 'textarea' }
  ]
};

const pageNames: Record<string, string> = {
  home: 'Главная',
  gallery: 'Галерея',
  about: 'Обо мне',
  contacts: 'Контакты',
  social: 'Социальные сети',
  footer: 'Футер'
};

export default function PageContentManagement() {
  const [selectedPage, setSelectedPage] = useState('home');
  const [pageContent, setPageContent] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    fetchPageContent();
  }, [selectedPage]);

  const fetchPageContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/page-content-by-key?pageKey=${selectedPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPageContent(data);
        
        // Initialize form data
        const initialData: Record<string, string> = {};
        data.forEach((item: PageContent) => {
          if (item.textContent) initialData[item.contentKey] = item.textContent;
          if (item.linkUrl) initialData[item.contentKey] = item.linkUrl;
          if (item.imagePath) initialData[item.contentKey] = item.imagePath;
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFiles(prev => ({
      ...prev,
      [key]: file
    }));
  };

  const saveContent = async () => {
    try {
      setSaving(true);
      
      // Find existing content items
      const existingItems = pageContent.filter(item => 
        pageFields[selectedPage].some(field => field.key === item.contentKey)
      );

      // Update existing items
      for (const item of existingItems) {
        const field = pageFields[selectedPage].find(f => f.key === item.contentKey);
        if (field && formData[item.contentKey] !== undefined) {
          const formDataToSend = new FormData();
          
          if (field.type === 'url') {
            formDataToSend.append('linkUrl', formData[item.contentKey]);
          } else if (field.type === 'image') {
            if (files[item.contentKey]) {
              formDataToSend.append('image', files[item.contentKey]!);
            } else if (formData[item.contentKey]) {
              formDataToSend.append('imagePath', formData[item.contentKey]);
            }
          } else {
            formDataToSend.append('textContent', formData[item.contentKey]);
          }

          formDataToSend.append('isActive', 'true');
          formDataToSend.append('displayOrder', item.displayOrder.toString());

          await fetch(`${API_BASE_URL}/api/admin/page-content/${item.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formDataToSend
          });
        }
      }

      // Create new items for missing fields
      const existingKeys = existingItems.map(item => item.contentKey);
      const missingFields = pageFields[selectedPage].filter(field => !existingKeys.includes(field.key));

      for (const field of missingFields) {
        if (formData[field.key]) {
          const formDataToSend = new FormData();
          formDataToSend.append('pageKey', selectedPage);
          formDataToSend.append('contentKey', field.key);
          formDataToSend.append('displayOrder', (pageFields[selectedPage].findIndex(f => f.key === field.key) + 1).toString());
          formDataToSend.append('isActive', 'true');

          if (field.type === 'url') {
            formDataToSend.append('linkUrl', formData[field.key]);
          } else if (field.type === 'image') {
            if (files[field.key]) {
              formDataToSend.append('image', files[field.key]!);
            } else if (formData[field.key]) {
              formDataToSend.append('imagePath', formData[field.key]);
            }
          } else {
            formDataToSend.append('textContent', formData[field.key]);
          }

          await fetch(`${API_BASE_URL}/api/admin/page-content`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formDataToSend
          });
        }
      }

      await fetchPageContent();
      alert('Контент успешно сохранен!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Ошибка при сохранении контента');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
  return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
          </div>
          </div>
      </div>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Назад</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Управление контентом страниц</h1>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex space-x-2 mb-8">
          {Object.entries(pageNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setSelectedPage(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPage === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Content Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Редактирование контента: {pageNames[selectedPage]}
            </h2>
            <button
              onClick={saveContent}
              disabled={saving}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
            </button>
        </div>

          <div className="space-y-6">
            {pageFields[selectedPage].map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
          <textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Введите ${field.label.toLowerCase()}`}
                  />
                ) : field.type === 'image' ? (
                  <div className="space-y-2">
          <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(field.key, e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData[field.key] && (
                      <div className="mt-2">
                        <img 
                          src={formData[field.key]} 
                          alt={field.label}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
          />
        </div>
                    )}
        </div>
                ) : (
          <input
                    type={field.type === 'url' ? 'url' : 'text'}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={field.type === 'url' ? 'https://example.com' : `Введите ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
        </div>
  );
}
