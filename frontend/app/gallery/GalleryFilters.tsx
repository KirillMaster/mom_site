import { Filter } from 'lucide-react';
import type { CategoryDto } from '@/lib/api';

interface GalleryFiltersProps {
  categories?: CategoryDto[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

const buttonClass = (active: boolean) =>
  `px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
    active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`;

const GalleryFilters = ({ categories, selected, onSelect }: GalleryFiltersProps) => (
  <section className="py-8 bg-white border-b">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Фильтр:</span>
        </div>
        <button onClick={() => onSelect(null)} className={buttonClass(selected === null)}>
          Все работы
        </button>
        {Array.isArray(categories) &&
          categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className={buttonClass(selected === category.id)}
            >
              {category.name}
            </button>
          ))}
      </div>
    </div>
  </section>
);

export default GalleryFilters;
