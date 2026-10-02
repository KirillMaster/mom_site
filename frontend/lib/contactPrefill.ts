import { normalizeTitle } from '@/lib/normalizeTitle';

export const SUBJECT_MAX = 200;
const TITLE_MAX = 150;

export interface ContactPrefill {
  subject: string;
  message: string;
}

export function buildArtworkPrefill(rawArtwork: string | null): ContactPrefill {
  const title = normalizeTitle(rawArtwork).slice(0, TITLE_MAX);
  if (!title) return { subject: '', message: '' };
  return {
    subject: `Картина «${title}»`.slice(0, SUBJECT_MAX),
    message: `Здравствуйте! Интересует картина «${title}». Подскажите, пожалуйста, стоимость и условия покупки.`,
  };
}
