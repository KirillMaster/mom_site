'use client';

import { reachGoal, Goals } from '@/lib/analytics';
import { Button } from '@/components/ui';

interface BlogCtaProps {
  slug: string;
}

export default function BlogCta({ slug }: BlogCtaProps) {
  return (
    <aside className="mt-12 rounded-md border border-line bg-paper-50 p-6 text-center">
      <p className="mb-4 text-lg text-ink-600">Понравилась работа или хотите картину на заказ? Напишите мне.</p>
      <Button href="/contacts" onClick={() => reachGoal(Goals.BlogCta, { post: slug })} className="min-h-[44px]">
        Связаться с художником
      </Button>
    </aside>
  );
}
