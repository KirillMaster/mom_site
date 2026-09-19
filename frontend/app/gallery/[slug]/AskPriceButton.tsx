'use client';

import { reachGoal, Goals } from '@/lib/analytics';

interface AskPriceButtonProps {
  title: string;
  id: number;
}

// A tiny client island: the artwork page itself stays a server component,
// but firing the analytics goal on click (S2-AS5) needs a browser event
// handler, which a server component cannot attach directly.
const AskPriceButton = ({ title, id }: AskPriceButtonProps) => {
  const href = `/contacts?artwork=${encodeURIComponent(title)}&id=${id}`;

  const handleClick = () => {
    reachGoal(Goals.ContactClick, { channel: 'ask_price', artwork: title });
  };

  return (
    <a href={href} onClick={handleClick} data-ym-tracked="ask-price">
      Узнать цену
    </a>
  );
};

export default AskPriceButton;
