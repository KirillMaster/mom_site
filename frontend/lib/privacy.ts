import { DEFAULT_PRIVACY_POLICY, PrivacySection } from '@/data/privacyPolicy';
import type { PrivacyData } from '@/lib/api';

export interface ResolvedPrivacy {
  sections: PrivacySection[];
  updatedAt: string | null;
  isCustom: boolean;
}

const splitParagraphs = (text: string): string[] =>
  text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export function resolvePrivacy(data?: PrivacyData | null): ResolvedPrivacy {
  const paragraphs = data?.text ? splitParagraphs(data.text) : [];
  if (paragraphs.length === 0) {
    return { sections: DEFAULT_PRIVACY_POLICY, updatedAt: null, isCustom: false };
  }
  return {
    sections: [{ heading: '', paragraphs }],
    updatedAt: data?.updatedAt ?? null,
    isCustom: true,
  };
}
