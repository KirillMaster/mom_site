'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  ExternalLink,
  MessageSquare,
  Send
} from 'lucide-react';
import { ContactsData } from '@/lib/api';

const ContactsClientPage = ({ contactsData }: { contactsData: ContactsData }) => {
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
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Имя *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-300 shadow-md"
                  >
                    Отправить сообщение
                  </button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Instagram', url: contactsData.socialLinks.instagram, icon: Instagram, color: 'from-pink-500 to-purple-600', description: 'Следите за моим творчеством' },
                { name: 'VK', url: contactsData.socialLinks.vk, icon: Send, color: 'from-blue-500 to-blue-600', description: 'Присоединяйтесь к сообществу' },
                { name: 'Telegram', url: contactsData.socialLinks.telegram, icon: MessageSquare, color: 'from-cyan-500 to-blue-500', description: 'Быстрая связь' },
                { name: 'WhatsApp', url: contactsData.socialLinks.whatsapp, icon: MessageSquare, color: 'from-green-500 to-green-600', description: 'Мессенджер' },
                { name: 'YouTube', url: contactsData.socialLinks.youtube, icon: Youtube, color: 'from-red-500 to-red-600', description: 'Видео контент' }
              ].filter(social => social.url).map((social, index) => (
                social.url && (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 group flex items-center space-x-4"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${social.color} group-hover:scale-110 transition-transform duration-200`}>
                    <social.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {social.name}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors duration-200" />
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {social.description}
                    </p>
                  </div>
                </motion.a>
              )))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
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

            <div className="space-y-6">
              {[
                {
                  question: "Как заказать картину?",
                  answer: "Свяжитесь со мной любым удобным способом - по телефону, email или через социальные сети. Мы обсудим ваши пожелания, размеры и сроки выполнения."
                },
                {
                  question: "Сколько времени занимает создание картины?",
                  answer: "Время создания зависит от сложности работы и размера. Обычно это занимает от 2 до 4 недель. Точные сроки обговариваются индивидуально."
                },
                {
                  question: "Возможна ли доставка картин?",
                  answer: "Да, я организую безопасную доставку картин по России. Стоимость доставки рассчитывается индивидуально в зависимости от размера и места назначения."
                },
                {
                  question: "Проводите ли вы мастер-классы?",
                  answer: "Да, я провожу мастер-классы по живописи для всех уровней подготовки. Следите за анонсами в социальных сетях или свяжитесь со мной для уточнения деталей."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 p-6 rounded-lg shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
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
