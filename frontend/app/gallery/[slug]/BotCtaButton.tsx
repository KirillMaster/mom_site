'use client';

import { FaTelegram } from 'react-icons/fa';
import { reachGoal, Goals } from '@/lib/analytics';
import { artworkBotLink } from '@/lib/funnelBot';

interface Props {
  artworkId: number;
  artwork: string;
}

export const BOT_CTA_LABEL = 'Спросить в Telegram';
export const BOT_CHANNEL = 'telegram_bot';

const BotCtaButton = ({ artworkId, artwork }: Props) => (
  <a
    href={artworkBotLink(artworkId)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={BOT_CTA_LABEL}
    data-testid="bot-cta"
    data-ym-tracked="channel-telegram_bot"
    onClick={() => reachGoal(Goals.ContactClick, { channel: BOT_CHANNEL, artwork })}
    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-sea px-4 py-3 font-medium text-paper transition-colors hover:bg-sea-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
  >
    <FaTelegram className="h-5 w-5" aria-hidden="true" />
    {BOT_CTA_LABEL}
  </a>
);

export default BotCtaButton;
