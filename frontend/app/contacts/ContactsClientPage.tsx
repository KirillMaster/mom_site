'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  ExternalLink
} from 'lucide-react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { ContactsData, ContactMessage } from '@/lib/api';
import { sendContactMessage } from '@/hooks/useApi';
import { useState } from 'react';

const ContactsClientPage = ({ contactsData }: { contactsData: ContactsData }) => {
  const [formData, setFormData] = useState<ContactMessage>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<'success' | 'error' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      await sendContactMessage(formData);
      setSubmissionResult('success');
      alert('Сообщение успешно отправлено!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmissionResult('error');
      alert('Произошла ошибка при отправке сообщения.');
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
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 mb-6">
                {contactsData.bannerTitle || "Свяжитесь со мной"}
              </h1>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                {contactsData.bannerDescription || "Буду рада ответить на ваши вопросы и обсудить идеи!"}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Contact Details */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-gray-50 p-8 rounded-lg shadow-lg"
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
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-white p-8 rounded-lg shadow-xl"
              >
                <h3 className="text-3xl font-serif font-bold mb-6 text-gray-900">
                  Напишите мне сообщение
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Имя *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Тема
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Сообщение *
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
                  </button>
                  {submissionResult === 'success' && (
                    <p className="text-green-600 text-center mt-4">Сообщение успешно отправлено!</p>
                  )}
                  {submissionResult === 'error' && (
                    <p className="text-red-600 text-center mt-4">Произошла ошибка при отправке сообщения.</p>
                  )}
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.3 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
                Мои социальные сети
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Следите за моим творчеством и будьте в курсе новостей!
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8">
              {contactsData.socialLinks.instagram && (
                <motion.a
                  href={contactsData.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center space-y-2 text-gray-700 hover:text-pink-600 transition-colors"
                >
                  <FaInstagram className="w-12 h-12" />
                  <span className="text-lg font-medium">Instagram</span>
                </motion.a>
              )}
              {contactsData.socialLinks.vk && (
                <motion.a
                  href={contactsData.socialLinks.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center space-y-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <FaVk className="w-12 h-12" />
                  <span className="text-lg font-medium">ВКонтакте</span>
                </motion.a>
              )}
              {contactsData.socialLinks.telegram && (
                <motion.a
                  href={contactsData.socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center space-y-2 text-gray-700 hover:text-blue-400 transition-colors"
                >
                  <FaTelegram className="w-12 h-12" />
                  <span className="text-lg font-medium">Telegram</span>
                </motion.a>
              )}
              {contactsData.socialLinks.whatsapp && (
                <motion.a
                  href={contactsData.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center space-y-2 text-gray-700 hover:text-green-500 transition-colors"
                >
                  <FaWhatsapp className="w-12 h-12" />
                  <span className="text-lg font-medium">WhatsApp</span>
                </motion.a>
              )}
              {contactsData.socialLinks.youtube && (
                <motion.a
                  href={contactsData.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center space-y-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <FaYoutube className="w-12 h-12" />
                  <span className="text-lg font-medium">YouTube</span>
                </motion.a>
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.3 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
                Часто задаваемые вопросы
              </h2>
            </motion.div>

            <div className="space-y-8">
              {contactsData.faq.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 rounded-lg shadow-md"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {item.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {item.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default ContactsClientPage;
