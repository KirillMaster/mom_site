import Link from 'next/link';
import type { ComponentType } from 'react';
import { Palette, Mail, Phone } from 'lucide-react';
import { FaInstagram, FaVk, FaTelegram, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import MaxIcon from '@/components/MaxIcon';
import { maxProfileUrl } from '@/lib/social';
import { useFooterData } from '@/hooks/useApi';
import { NAV_ITEMS } from './navItems';

type IconType = ComponentType<{ className?: string }>;

interface SocialIconLinkProps {
  href: string;
  Icon: IconType;
  external?: boolean;
  label?: string;
}

const SocialIconLink = ({ href, Icon, external = true, label }: SocialIconLinkProps) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    aria-label={label}
    className="w-10 h-10 bg-ink-700 text-paper rounded-md flex items-center justify-center hover:bg-sea transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper"
  >
    <Icon className="w-5 h-5" />
  </a>
);

const MUTED_LINK_CLASS = 'text-paper/80 hover:text-paper transition-colors duration-200';

const ContactRow = ({ Icon, href, text }: { Icon: IconType; href: string; text: string }) => (
  <div className="flex items-center space-x-3">
    <Icon className="w-5 h-5 text-paper/80" />
    <a href={href} className={MUTED_LINK_CLASS}>
      {text}
    </a>
  </div>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { data: footerData } = useFooterData();
  const social = footerData?.socialLinks;
  const maxUrl = maxProfileUrl(social?.max, footerData?.phone);

  const socialLinks: { href?: string | null; Icon: IconType }[] = [
    { href: social?.instagram, Icon: FaInstagram },
    { href: social?.vk, Icon: FaVk },
    { href: social?.telegram, Icon: FaTelegram },
    { href: social?.whatsapp, Icon: FaWhatsapp },
    { href: social?.youtube, Icon: FaYoutube },
  ];

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
              {socialLinks.map(({ href, Icon }) =>
                href ? <SocialIconLink key={href} href={href} Icon={Icon} /> : null
              )}
              {maxUrl && <SocialIconLink href={maxUrl} Icon={MaxIcon} label="MAX" />}
              {footerData?.email && (
                <SocialIconLink href={`mailto:${footerData.email}`} Icon={Mail} external={false} />
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Навигация</h3>
            <ul className="space-y-2">
              {NAV_ITEMS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={MUTED_LINK_CLASS}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Контакты</h3>
            <div className="space-y-3">
              {footerData?.email && (
                <ContactRow Icon={Mail} href={`mailto:${footerData.email}`} text={footerData.email} />
              )}
              {footerData?.phone && (
                <ContactRow Icon={Phone} href={`tel:${footerData.phone}`} text={footerData.phone} />
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
