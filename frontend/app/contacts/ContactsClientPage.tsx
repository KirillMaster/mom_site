'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import MaxIcon from '@/components/MaxIcon';
import { maxProfileUrl } from '@/lib/social';
import { ContactsData } from '@/lib/api';
import ContactFormFields, { ContactFormState } from './ContactFormFields';
import { buildArtworkPrefill } from '@/lib/contactPrefill';
import { sendContactMessage } from '@/hooks/useApi';
import { getStoredUtm } from '@/lib/utm';
import { Goals, reachGoal } from '@/lib/analytics';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// useSearchParams requires a Suspense boundary, otherwise Next.js fails the
// production build with "missing suspense boundary" for this route.
const ContactsClientPage = ({ contactsData }: { contactsData: ContactsData }) => (
  <Suspense fallback={null}>
    <ContactsForm contactsData={contactsData} />
  </Suspense>
);

const ContactsForm = ({ contactsData }: { contactsData: ContactsData }) => {
  const searchParams = useSearchParams();
  const prefill = buildArtworkPrefill(searchParams.get('artwork'));

  const [formData, setFormData] = useState<ContactFormState>({
    name: '',
    email: '',
    phone: '',
    subject: prefill.subject,
    message: prefill.message,
    website: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<'success' | 'error' | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('Произошла ошибка при отправке сообщения.');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() && !formData.phone.trim()) {
      setValidationError('Укажите телефон, мессенджер или email');
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const utm = getStoredUtm();
      await sendContactMessage({ ...formData, ...utm });
      reachGoal(Goals.ContactFormSubmit, { ...utm });
      setSubmissionResult('success');
      alert('Сообщение успешно отправлено!');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
    } catch (error: any) {
      setSubmissionResult('error');
      const status = error?.response?.status;
      const message = status === 429
        ? 'Слишком много запросов. Пожалуйста, попробуйте немного позже.'
        : 'Произошла ошибка при отправке сообщения.';
      setErrorMessage(message);
      alert(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-24 pb-16 bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="rise-in text-center"
            >
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">
                {contactsData.bannerTitle || "Свяжитесь со мной"}
              </h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                {contactsData.bannerDescription || "Буду рада ответить на ваши вопросы и обсудить идеи!"}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Contact Details */}
              <div
                className="reveal bg-gray-50 p-8 rounded-lg shadow-lg"
              >
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8 text-gray-900">
                  Мои контакты
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                      <a
                        href={`mailto:${contactsData.email || ''}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      >
                        {contactsData.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Телефон</h3>
                      <a
                        href={`tel:${contactsData.phone || ''}`}
                        className="text-green-600 hover:text-green-800 transition-colors duration-200"
                      >
                        {contactsData.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div
                className="reveal bg-white p-8 rounded-lg shadow-xl"
              >
                <h3 className="text-3xl font-serif font-bold mb-6 text-gray-900">
                  Напишите мне сообщение
                </h3>
                
                <ContactFormFields
                  formData={formData}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  submissionResult={submissionResult}
                  errorMessage={errorMessage}
                  validationError={validationError}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="reveal text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
                Мои социальные сети
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Следите за моим творчеством и будьте в курсе новостей!
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              {contactsData.socialLinks.instagram && (
                <a
                  href={contactsData.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-pink-600 transition-colors"
                >
                  <FaInstagram className="w-12 h-12" />
                  <span className="text-lg font-medium">Instagram</span>
                </a>
              )}
              {contactsData.socialLinks.vk && (
                <a
                  href={contactsData.socialLinks.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <FaVk className="w-12 h-12" />
                  <span className="text-lg font-medium">ВКонтакте</span>
                </a>
              )}
              {contactsData.socialLinks.telegram && (
                <a
                  href={contactsData.socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-blue-400 transition-colors"
                >
                  <FaTelegram className="w-12 h-12" />
                  <span className="text-lg font-medium">Telegram</span>
                </a>
              )}
              {contactsData.socialLinks.whatsapp && (
                <a
                  href={contactsData.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-green-500 transition-colors"
                >
                  <FaWhatsapp className="w-12 h-12" />
                  <span className="text-lg font-medium">WhatsApp</span>
                </a>
              )}
              {contactsData.socialLinks.youtube && (
                <a
                  href={contactsData.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <FaYoutube className="w-12 h-12" />
                  <span className="text-lg font-medium">YouTube</span>
                </a>
              )}
              {maxProfileUrl(contactsData.socialLinks.max, contactsData.phone) && (
                <a
                  href={maxProfileUrl(contactsData.socialLinks.max, contactsData.phone)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reveal flex flex-col items-center space-y-2 text-gray-700 hover:text-indigo-500 transition-colors"
                >
                  <MaxIcon className="w-12 h-12" />
                  <span className="text-lg font-medium">MAX</span>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="reveal text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
                Часто задаваемые вопросы
              </h2>
            </div>

            <div className="space-y-8">
              {contactsData.faq.map((item, index) => (
                <div
                  key={index}
                  className="reveal bg-white p-8 rounded-lg shadow-md"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {item.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default ContactsClientPage;
