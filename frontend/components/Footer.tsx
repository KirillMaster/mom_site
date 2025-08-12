import Link from 'next/link';
import { Palette, Mail, Phone } from 'lucide-react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { useFooterData } from '@/hooks/useApi';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { data: footerData, isLoading } = useFooterData();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-serif font-semibold">
                Анжела Моисеенко
              </span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              {footerData?.description || "Художник-импрессионист, создающий уникальные работы в стиле импрессионизма. Специализируюсь на театральных картинах и натюрмортах."}
            </p>
            <div className="flex space-x-4">
              {footerData?.socialLinks?.instagram && (
                <a
                  href={footerData.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              )}
              {footerData?.socialLinks?.vk && (
                <a
                  href={footerData.socialLinks.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
                >
                  <FaVk className="w-5 h-5" />
                </a>
              )}
              {footerData?.socialLinks?.telegram && (
                <a
                  href={footerData.socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
                >
                  <FaTelegram className="w-5 h-5" />
                </a>
              )}
              {footerData?.socialLinks?.whatsapp && (
                <a
                  href={footerData.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </a>
              )}
              {footerData?.socialLinks?.youtube && (
                <a
                  href={footerData.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
                >
                  <FaYoutube className="w-5 h-5" />
                </a>
              )}
              {footerData?.email && (
                <a
                  href={`mailto:${footerData.email}`}
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
                >
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Главная
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Галерея
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Обо мне
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Видео
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Контакты</h3>
            <div className="space-y-3">
              {footerData?.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary-400" />
                  <a
                    href={`mailto:${footerData.email}`}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {footerData.email}
                  </a>
                </div>
              )}
              {footerData?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary-400" />
                  <a
                    href={`tel:${footerData.phone}`}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {footerData.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Анжела Моисеенко. Все права защищены.
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 