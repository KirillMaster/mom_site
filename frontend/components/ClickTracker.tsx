'use client';

import { useEffect } from 'react';
import { reachGoal, Goals } from '@/lib/analytics';

const SOCIAL_HOSTS = [
  'instagram.com',
  'vk.com',
  't.me',
  'telegram.me',
  'wa.me',
  'whatsapp.com',
  'youtube.com',
  'youtu.be',
];

function goalForHref(href: string): { goal: string; params: Record<string, unknown> } | null {
  if (href.startsWith('mailto:')) return { goal: Goals.ContactClick, params: { channel: 'email' } };
  if (href.startsWith('tel:')) return { goal: Goals.ContactClick, params: { channel: 'phone' } };

  try {
    const { hostname } = new URL(href, window.location.origin);
    const host = hostname.replace(/^www\./, '');
    const social = SOCIAL_HOSTS.find((s) => host === s || host.endsWith(`.${s}`));
    if (social) return { goal: Goals.SocialClick, params: { network: social } };
  } catch {
    return null;
  }

  return null;
}

// Contact and social links live in the footer, the contacts page and the header,
// so a single delegated listener is cheaper than wiring an onClick into each one
// and it keeps covering links added later.
export default function ClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a');
      const href = anchor?.getAttribute('href');
      if (!href) return;

      const hit = goalForHref(href);
      if (hit) reachGoal(hit.goal, hit.params);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
