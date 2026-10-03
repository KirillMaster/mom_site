import { ContactMessageAdmin } from '@/lib/api';

type TelegramFields = Pick<ContactMessageAdmin, 'telegramUsername' | 'telegramUserId'>;

export const telegramHref = ({ telegramUsername, telegramUserId }: TelegramFields): string | null => {
  const username = telegramUsername?.replace(/^@/, '').trim();
  if (username) return `https://t.me/${username}`;
  if (telegramUserId) return `tg://user?id=${telegramUserId}`;
  return null;
};

const TelegramLink = ({ message, className }: { message: TelegramFields; className?: string }) => {
  const href = telegramHref(message);
  if (!href) return null;
  const username = message.telegramUsername?.replace(/^@/, '').trim();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {username ? `@${username}` : `Telegram ID ${message.telegramUserId}`}
    </a>
  );
};

export default TelegramLink;
