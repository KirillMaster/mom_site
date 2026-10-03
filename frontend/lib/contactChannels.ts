import { SITE_PHONE } from '@/lib/site';
import { maxProfileUrl } from '@/lib/social';
import type { SocialLinks } from '@/lib/api';

export type ContactChannelId = 'telegram' | 'whatsapp' | 'max' | 'phone';

export interface ContactChannel {
  channel: ContactChannelId;
  href: string;
  prefilledText?: string;
}

interface BuildParams {
  title: string;
  url: string;
  socialLinks?: SocialLinks | null;
  phone?: string | null;
}

export function buildPrefilledMessage(title: string, url: string): string {
  return `Здравствуйте! Интересует картина «${title}» ${url}`;
}

const digitsOf = (value?: string | null) => (value ?? '').replace(/\D/g, '');

function whatsappHref(explicit: string | undefined, phone: string, text: string): string | null {
  const explicitDigits = explicit ? digitsOf(explicit.replace(/\?.*$/, '')) : '';
  const digits = explicitDigits.length >= 10 ? explicitDigits : digitsOf(phone);
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function phoneHref(phone: string): string | null {
  const cleaned = phone.replace(/[^+\d]/g, '');
  return digitsOf(cleaned).length >= 10 ? `tel:${cleaned}` : null;
}

export function buildContactChannels({ title, url, socialLinks, phone }: BuildParams): ContactChannel[] {
  const links = socialLinks ?? {};
  const sitePhone = phone || SITE_PHONE;
  const text = buildPrefilledMessage(title, url);

  const candidates: Array<[ContactChannelId, string | null | undefined]> = [
    ['telegram', links.telegram],
    ['whatsapp', whatsappHref(links.whatsapp, sitePhone, text)],
    ['max', maxProfileUrl(links.max, sitePhone)],
    ['phone', phoneHref(sitePhone)],
  ];

  return candidates
    .filter((entry): entry is [ContactChannelId, string] => Boolean(entry[1]))
    .map(([channel, href]) => ({ channel, href, prefilledText: text }));
}
