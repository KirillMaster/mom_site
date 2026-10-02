'use client';

import { reachGoal, Goals } from '@/lib/analytics';

interface BlogCtaProps {
  slug: string;
}

export default function BlogCta({ slug }: BlogCtaProps) {
  return (
    <aside className="mt-12 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <p className="mb-4 text-lg text-gray-700">Понравилась работа или хотите картину на заказ? Напишите мне.</p>
      <a
        href="/contacts"
        onClick={() => reachGoal(Goals.BlogCta, { post: slug })}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
      >
        Связаться с художником
      </a>
    </aside>
  );
}
