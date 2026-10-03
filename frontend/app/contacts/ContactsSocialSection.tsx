import type { ComponentType } from 'react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import MaxIcon from '@/components/MaxIcon';
import { maxProfileUrl } from '@/lib/social';
import { ContactsData } from '@/lib/api';

interface SocialItem {
  href: string | null | undefined;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

const buildItems = ({ socialLinks, phone }: ContactsData): SocialItem[] => [
  { href: socialLinks.instagram, label: 'Instagram', Icon: FaInstagram },
  { href: socialLinks.vk, label: 'ВКонтакте', Icon: FaVk },
  { href: socialLinks.telegram, label: 'Telegram', Icon: FaTelegram },
  { href: socialLinks.whatsapp, label: 'WhatsApp', Icon: FaWhatsapp },
  { href: socialLinks.youtube, label: 'YouTube', Icon: FaYoutube },
  { href: maxProfileUrl(socialLinks.max, phone), label: 'MAX', Icon: MaxIcon },
];

const ContactsSocialSection = ({ contactsData }: { contactsData: ContactsData }) => (
  <section className="py-20 bg-paper-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="reveal text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-semibold text-ink mb-6">
          Мои социальные сети
        </h2>
        <p className="text-xl text-ink-600 max-w-3xl mx-auto">
          Следите за моим творчеством и будьте в курсе новостей!
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {buildItems(contactsData).map(({ href, label, Icon }) =>
          href ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="reveal flex flex-col items-center space-y-2 text-ink-600 hover:text-sea transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
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
