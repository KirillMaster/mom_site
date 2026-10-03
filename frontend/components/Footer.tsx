import Link from 'next/link';
import { Palette, Mail, Phone } from 'lucide-react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import MaxIcon from '@/components/MaxIcon';
import { maxProfileUrl } from '@/lib/social';
import { useFooterData } from '@/hooks/useApi';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { data: footerData, isLoading } = useFooterData();

  return (
    <footer className="bg-ink text-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-sea rounded-md flex items-center justify-center">
                <Palette className="w-6 h-6 text-paper" />
              </div>
              <span className="text-xl font-serif font-semibold">
                Анжела Моисеенко
              </span>
            </div>
            <p className="text-paper/80 mb-6 max-w-md">
              {footerData?.description || "Художник-импрессионист, создающий уникальные работы в стиле импрессионизма. Специализируюсь на театральных картинах и натюрмортах."}
            </p>
            <div className="flex space-x-4">
              {footerData?.socialLinks?.instagram && (
                <a
                  href={footerData.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-ink-700 text-paper rounded-md flex items-center justify-center hover:bg-sea transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              )}
              {footerData?.socialLinks?.vk && (
                <a
                  href={footerData.socialLinks.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-ink-700 text-paper rounded-md flex items-center justify-center hover:bg-sea transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                >
                  <FaVk className="w-5 h-5" />
                </a>
              )}
              {footerData?.socialLinks?.telegram && (
                <a
                  href={footerData.socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-ink-700 text-paper rounded-md flex items-center justify-center hover:bg-sea transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                >
                  <FaTelegram className="w-5 h-5" />
                </a>
              )}
              {footerData?.socialLinks?.whatsapp && (
                <a
                  href={footerData.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-ink-700 text-paper rounded-md flex items-center justify-center hover:bg-sea transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </a>
              )}
              {footerData?.socialLinks?.youtube && (
                <a
                  href={footerData.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-ink-700 text-paper rounded-md flex items-center justify-center hover:bg-sea transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                >
                  <FaYoutube className="w-5 h-5" />
                </a>
              )}
              {maxProfileUrl(footerData?.socialLinks?.max, footerData?.phone) && (
                <a
                  href={maxProfileUrl(footerData?.socialLinks?.max, footerData?.phone)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="MAX"
                  className="w-10 h-10 bg-ink-700 text-paper rounded-md flex items-center justify-center hover:bg-sea transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                >
                  <MaxIcon className="w-5 h-5" />
                </a>
              )}
              {footerData?.email && (
                <a
                  href={`mailto:${footerData.email}`}
                  className="w-10 h-10 bg-ink-700 text-paper rounded-md flex items-center justify-center hover:bg-sea transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
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
                <Link href="/" className="text-paper/80 hover:text-paper transition-colors duration-200">
                  Главная
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-paper/80 hover:text-paper transition-colors duration-200">
                  Галерея
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-paper/80 hover:text-paper transition-colors duration-200">
                  Обо мне
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-paper/80 hover:text-paper transition-colors duration-200">
                  Видео
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-paper/80 hover:text-paper transition-colors duration-200">
                  Блог
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-paper/80 hover:text-paper transition-colors duration-200">
                  Отзывы
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-paper/80 hover:text-paper transition-colors duration-200">
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
                  <Mail className="w-5 h-5 text-paper/80" />
                  <a
                    href={`mailto:${footerData.email}`}
                    className="text-paper/80 hover:text-paper transition-colors duration-200"
                  >
                    {footerData.email}
                  </a>
                </div>
              )}
              {footerData?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-paper/80" />
                  <a
                    href={`tel:${footerData.phone}`}
                    className="text-paper/80 hover:text-paper transition-colors duration-200"
                  >
                    {footerData.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-ink-600 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-paper/60 text-sm">
              © {currentYear} Анжела Моисеенко. Все права защищены.
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 