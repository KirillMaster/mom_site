import Link from 'next/link';
import type { BlogPublicCategory } from '@/types/blog';

interface CategoryTabsProps {
  categories: BlogPublicCategory[];
  activeSlug?: string;
}

export default function CategoryTabs({ categories, activeSlug }: CategoryTabsProps) {
  if (!categories.length) return null;
  const tabs: { slug?: string; name: string; href: string }[] = [
    { name: 'Все', href: '/blog' },
    ...categories.map((c) => ({ slug: c.slug, name: c.name, href: `/blog/category/${c.slug}` })),
  ];
  return (
    <nav aria-label="Рубрики" className="mb-8 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.slug === activeSlug;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-sm font-medium ${
              active ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 ring-1 ring-black/10 hover:bg-gray-100'
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
