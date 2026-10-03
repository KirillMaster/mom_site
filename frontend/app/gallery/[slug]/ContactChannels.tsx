'use client';

import { FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { Phone } from 'lucide-react';
import MaxIcon from '@/components/MaxIcon';
import { reachGoal, Goals } from '@/lib/analytics';
import type { ContactChannel, ContactChannelId } from '@/lib/contactChannels';

interface Props {
  channels: ContactChannel[];
  artwork: string;
}

const LABELS: Record<ContactChannelId, string> = {
  telegram: 'Написать в Telegram',
  whatsapp: 'Написать в WhatsApp',
  max: 'Написать в MAX',
  phone: 'Позвонить',
};

const ICON_CLASS = 'h-5 w-5';

const ICONS: Record<ContactChannelId, JSX.Element> = {
  telegram: <FaTelegram className={ICON_CLASS} aria-hidden="true" />,
  whatsapp: <FaWhatsapp className={ICON_CLASS} aria-hidden="true" />,
  max: <MaxIcon className={ICON_CLASS} />,
  phone: <Phone className={ICON_CLASS} aria-hidden="true" />,
};

const ContactChannels = ({ channels, artwork }: Props) => {
  if (channels.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2" data-testid="contact-channels">
      {channels.map(({ channel, href }) => {
        const isWeb = href.startsWith('http');
        return (
          <a
            key={channel}
            href={href}
            aria-label={LABELS[channel]}
            title={LABELS[channel]}
            data-ym-tracked={`channel-${channel}`}
            {...(isWeb ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={() => reachGoal(Goals.ContactClick, { channel, artwork })}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink-600 transition-colors hover:border-sea hover:text-sea focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
          >
            {ICONS[channel]}
          </a>
        );
      })}
    </div>
  );
};

export default ContactChannels;
