'use client';

import { Phone } from 'lucide-react';
import { reachGoal, Goals } from '@/lib/analytics';

export const SITE_PHONE = '+7 (978) 545-86-50';

type PhoneLinkProps = {
  place: string;
  className?: string;
  showNumberFrom?: 'always' | 'md';
};

export default function PhoneLink({ place, className, showNumberFrom = 'always' }: PhoneLinkProps) {
  return (
    <a
      href={`tel:${SITE_PHONE.replace(/[^+\d]/g, '')}`}
      className={className}
      data-ym-tracked="phone"
      onClick={() => reachGoal(Goals.ContactClick, { channel: 'phone', place })}
    >
      <Phone className="w-4 h-4 flex-shrink-0" />
      <span className={showNumberFrom === 'md' ? 'hidden lg:inline' : ''}>{SITE_PHONE}</span>
      {showNumberFrom === 'md' && <span className="sr-only">Позвонить {SITE_PHONE}</span>}
    </a>
  );
}
