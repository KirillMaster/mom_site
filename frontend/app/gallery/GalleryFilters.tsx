import { Filter } from 'lucide-react';
import { Button } from '@/components/ui';
import type { CategoryDto } from '@/lib/api';

interface GalleryFiltersProps {
  categories?: CategoryDto[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

const GalleryFilters = ({ categories, selected, onSelect }: GalleryFiltersProps) => (
  <section className="py-8 bg-paper-50 border-b border-line">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-ink-600" />
          <span className="font-medium text-ink-600">Фильтр:</span>
        </div>
        <Button
          variant={selected === null ? 'primary' : 'secondary'}
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
        >
          Все работы
        </Button>
        {Array.isArray(categories) &&
          categories.map((category) => (
            <Button
              key={category.id}
              variant={selected === category.id ? 'primary' : 'secondary'}
              aria-pressed={selected === category.id}
              onClick={() => onSelect(category.id)}
            >
              {category.name}
            </Button>
          ))}
      </div>
    </div>
  </section>
);

export default GalleryFilters;
