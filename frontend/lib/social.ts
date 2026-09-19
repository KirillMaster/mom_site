import { SITE_PHONE } from '@/components/PhoneLink';

// MAX profiles are addressed by phone number, so the account link can always be
// derived from the site phone. The admin panel can still override it with an
// explicit "max" social link.
export function maxProfileUrl(explicitUrl?: string | null, phone?: string | null): string | null {
  if (explicitUrl) return explicitUrl;

  const digits = (phone || SITE_PHONE).replace(/\D/g, '');
  if (digits.length < 10) return null;

  return `https://max.ru/+${digits}`;
}
