'use client';

import { FaTelegram } from 'react-icons/fa';
import { reachGoal, Goals } from '@/lib/analytics';
import { artworkBotLink } from '@/lib/funnelBot';
import type { ContactChannel } from '@/lib/contactChannels';

interface Props {
  channels: ContactChannel[];
  artwork: string;
  artworkId?: number;
}

const BUTTON_CLASS =
  'flex-1 rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors';

const MobileContactBar = ({ channels, artwork, artworkId }: Props) => {
  const write = channels.find((c) => c.channel === 'whatsapp') ?? channels.find((c) => c.channel === 'telegram');
  const call = channels.find((c) => c.channel === 'phone');
  if (!write && !call && artworkId == null) return null;

  const track = (channel: string) => () => reachGoal(Goals.ContactClick, { channel, artwork });

  return (
    <div
      data-testid="mobile-contact-bar"
      className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-gray-200 bg-white px-4 pt-3 md:hidden"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      {write && (
        <a
          href={write.href}
          target="_blank"
          rel="noopener noreferrer"
          data-ym-tracked="mobile-bar-write"
          onClick={track(write.channel)}
          className={`${BUTTON_CLASS} bg-primary-600 text-white hover:bg-primary-700`}
        >
          Написать
        </a>
      )}
      {artworkId != null && (
        <a
          href={artworkBotLink(artworkId)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Спросить в Telegram"
          data-ym-tracked="mobile-bar-bot"
          onClick={track('telegram_bot')}
          className="flex w-12 flex-none items-center justify-center rounded-lg bg-sky-600 text-white hover:bg-sky-700"
        >
          <FaTelegram className="h-6 w-6" aria-hidden="true" />
        </a>
      )}
      {call && (
        <a
          href={call.href}
          data-ym-tracked="mobile-bar-call"
          onClick={track('phone')}
          className={`${BUTTON_CLASS} border border-gray-300 text-gray-900 hover:bg-gray-50`}
        >
          Позвонить
        </a>
      )}
    </div>
  );
};

export default MobileContactBar;
