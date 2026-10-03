import { Filter } from 'lucide-react';
import { Button } from '@/components/ui';
import type { CategoryDto } from '@/lib/api';
import { sukhorukikhCategory, SIZE_CLASSES, type CatalogueFilters, type SizeClass } from '@/lib/gallery';

interface GalleryFiltersProps {
  categories?: CategoryDto[];
  filters: CatalogueFilters;
  found: number;
  onChange: (next: Partial<CatalogueFilters>) => void;
  onReset: () => void;
}

const SIZE_LABELS: Record<SizeClass, string> = {
  S: 'S (до 40 см)',
  M: 'M (40–80 см)',
  L: 'L (от 80 см)',
};

const GalleryFilters = ({ categories, filters, found, onChange, onReset }: GalleryFiltersProps) => {
  const other = sukhorukikhCategory(categories);
  const mine = Array.isArray(categories) ? categories.filter((category) => category.id !== other?.id) : [];
  const active = filters.category !== null || filters.size !== null || filters.available;

  return (
    <section className="py-8 bg-paper-50 border-b border-line" data-testid="gallery-filters">
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-ink-600" />
            <span className="font-medium text-ink-600">Тема:</span>
          </div>
          <Button
            variant={filters.category === null ? 'primary' : 'secondary'}
            aria-pressed={filters.category === null}
            onClick={() => onChange({ category: null })}
          >
            Все работы
          </Button>
          {mine.map((category) => (
            <Button
              key={category.id}
              variant={filters.category === category.id ? 'primary' : 'secondary'}
              aria-pressed={filters.category === category.id}
              onClick={() => onChange({ category: category.id })}
            >
              {category.name}
            </Button>
          ))}
          {other && (
            <Button
              variant={filters.category === other.id ? 'primary' : 'secondary'}
              aria-pressed={filters.category === other.id}
              data-testid="sukhorukikh-tab"
              onClick={() => onChange({ category: other.id })}
            >
              Работы Всеволода Сухоруких
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-ink-600">Размер:</span>
          {SIZE_CLASSES.map((size) => (
            <Button
              key={size}
              variant={filters.size === size ? 'primary' : 'secondary'}
              aria-pressed={filters.size === size}
              onClick={() => onChange({ size: filters.size === size ? null : size })}
            >
              {SIZE_LABELS[size]}
            </Button>
          ))}
          <Button
            variant={filters.available ? 'primary' : 'secondary'}
            aria-pressed={filters.available}
            onClick={() => onChange({ available: !filters.available })}
          >
            Только в наличии
          </Button>
          {active && (
            <Button variant="ghost" onClick={onReset}>
              Сбросить
            </Button>
          )}
        </div>

        <p className="text-sm text-ink-500" data-testid="gallery-count" aria-live="polite">
          Найдено: {found}
        </p>
      </div>
    </section>
  );
};

export default GalleryFilters;
