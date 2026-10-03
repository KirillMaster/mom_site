export const FUNNEL_BOT_USERNAME = process.env.NEXT_PUBLIC_FUNNEL_BOT_USERNAME || 'angela_moiseenko_bot';

// payload: Telegram deep-link `start` parameter (art_<id>, site, ...). Unknown
// payloads make the bot run the full scenario, so any short label is safe.
export function botLink(payload?: string | null): string {
  const base = `https://t.me/${FUNNEL_BOT_USERNAME}`;
  return payload ? `${base}?start=${encodeURIComponent(payload)}` : base;
}

export const artworkBotLink = (artworkId: number | string): string => botLink(`art_${artworkId}`);
