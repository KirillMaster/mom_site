'use client';

import { Button } from '@/components/ui';
import { reachGoal, Goals } from '@/lib/analytics';

interface AskPriceButtonProps {
  title: string;
  id: number;
  variant?: 'price' | 'similar';
}

// A tiny client island: the artwork page itself stays a server component,
// but firing the analytics goal on click (S2-AS5) needs a browser event
// handler, which a server component cannot attach directly.
const AskPriceButton = ({ title, id, variant = 'price' }: AskPriceButtonProps) => {
  const similar = variant === 'similar';
  const href = similar
    ? `/contacts?artwork=${encodeURIComponent(title)}&similar=1`
    : `/contacts?artwork=${encodeURIComponent(title)}&id=${id}`;

  const handleClick = () => {
    reachGoal(Goals.ContactClick, { channel: similar ? 'order_similar' : 'ask_price', artwork: title });
  };

  return (
    <Button
      href={href}
      onClick={handleClick}
      data-ym-tracked={similar ? 'order-similar' : 'ask-price'}
      className="w-full sm:w-auto"
    >
      {similar ? 'Заказать похожую' : 'Узнать цену'}
    </Button>
  );
};

export default AskPriceButton;
