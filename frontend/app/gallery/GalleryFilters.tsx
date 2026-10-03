import type { ReactNode } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui";
import type { CategoryDto } from "@/lib/api";
import {
  sukhorukikhCategory,
  SIZE_CLASSES,
  type CatalogueFilters,
  type SizeClass,
} from "@/lib/gallery";

interface GalleryFiltersProps {
  categories?: CategoryDto[];
  filters: CatalogueFilters;
  found: number;
  onChange: (next: Partial<CatalogueFilters>) => void;
  onReset: () => void;
}

const SIZE_LABELS: Record<SizeClass, string> = {
  S: "S (до 40 см)",
  M: "M (40–80 см)",
  L: "L (от 80 см)",
};

interface ToggleButtonProps {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  "data-testid"?: string;
}

const ToggleButton = ({ pressed, ...props }: ToggleButtonProps) => (
  <Button
    variant={pressed ? "primary" : "secondary"}
    aria-pressed={pressed}
    {...props}
  />
);

const GalleryFilters = ({
  categories,
  filters,
  found,
  onChange,
  onReset,
}: GalleryFiltersProps) => {
  const other = sukhorukikhCategory(categories);
  const mine = Array.isArray(categories)
    ? categories.filter((category) => category.id !== other?.id)
    : [];
  const active =
    filters.category !== null || filters.size !== null || filters.available;

  return (
    <section
      className="py-8 bg-paper-50 border-b border-line"
      data-testid="gallery-filters"
    >
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-ink-600" />
            <span className="font-medium text-ink-600">Тема:</span>
          </div>
          <ToggleButton
            pressed={filters.category === null}
            onClick={() => onChange({ category: null })}
          >
            Все работы
          </ToggleButton>
          {mine.map((category) => (
            <ToggleButton
              key={category.id}
              pressed={filters.category === category.id}
              onClick={() => onChange({ category: category.id })}
            >
              {category.name}
            </ToggleButton>
          ))}
          {other && (
            <ToggleButton
              pressed={filters.category === other.id}
              data-testid="sukhorukikh-tab"
              onClick={() => onChange({ category: other.id })}
            >
              Работы Всеволода Сухоруких
            </ToggleButton>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-ink-600">Размер:</span>
          {SIZE_CLASSES.map((size) => (
            <ToggleButton
              key={size}
              pressed={filters.size === size}
              onClick={() =>
                onChange({ size: filters.size === size ? null : size })
              }
            >
              {SIZE_LABELS[size]}
            </ToggleButton>
          ))}
          <ToggleButton
            pressed={filters.available}
            onClick={() => onChange({ available: !filters.available })}
          >
            Только в наличии
          </ToggleButton>
          {active && (
            <Button variant="ghost" onClick={onReset}>
              Сбросить
            </Button>
          )}
        </div>

        <p
          className="text-sm text-ink-500"
          data-testid="gallery-count"
          aria-live="polite"
        >
          Найдено: {found}
        </p>
      </div>
    </section>
  );
};

export default GalleryFilters;
