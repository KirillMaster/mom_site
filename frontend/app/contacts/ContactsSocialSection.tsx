import type { ComponentType } from 'react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import MaxIcon from '@/components/MaxIcon';
import { maxProfileUrl } from '@/lib/social';
import { botLink } from '@/lib/funnelBot';
import { ContactsData } from '@/lib/api';

interface SocialItem {
  href: string | null | undefined;
  label: string;
  hoverClass: string;
  Icon: ComponentType<{ className?: string }>;
}

const buildItems = ({ socialLinks, phone }: ContactsData): SocialItem[] => [
  { href: socialLinks.instagram, label: 'Instagram', hoverClass: 'hover:text-pink-600', Icon: FaInstagram },
  { href: socialLinks.vk, label: 'ВКонтакте', hoverClass: 'hover:text-blue-600', Icon: FaVk },
  { href: socialLinks.telegram, label: 'Telegram', hoverClass: 'hover:text-blue-400', Icon: FaTelegram },
  { href: botLink('site'), label: 'Telegram-бот', hoverClass: 'hover:text-sky-600', Icon: FaTelegram },
  { href: socialLinks.whatsapp, label: 'WhatsApp', hoverClass: 'hover:text-green-500', Icon: FaWhatsapp },
  { href: socialLinks.youtube, label: 'YouTube', hoverClass: 'hover:text-red-600', Icon: FaYoutube },
  { href: maxProfileUrl(socialLinks.max, phone), label: 'MAX', hoverClass: 'hover:text-indigo-500', Icon: MaxIcon },
];

const ContactsSocialSection = ({ contactsData }: { contactsData: ContactsData }) => (
  <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="reveal text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
          Мои социальные сети
        </h2>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Следите за моим творчеством и будьте в курсе новостей!
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {buildItems(contactsData).map(({ href, label, hoverClass, Icon }) =>
          href ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`reveal flex flex-col items-center space-y-2 text-gray-700 ${hoverClass} transition-colors`}
            >
              <Icon className="w-12 h-12" />
              <span className="text-lg font-medium">{label}</span>
            </a>
          ) : null
        )}
      </div>
    </div>
  </section>
);

export default ContactsSocialSection;
