import { Play } from 'lucide-react';
import { Card } from '@/components/ui';

export default function CategoriesInfo({ categories }: { categories?: any[] }) {
  return (
    <section className="py-16 md:py-24 bg-paper-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="reveal text-center mb-16">
          <h2 className="mb-6">Категории видео</h2>
          <p className="text-xl text-ink-500 max-w-3xl mx-auto">
            Исследуйте разные аспекты моего творчества через видео
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories && Array.isArray(categories) && categories.map((category) => (
            <Card key={category.id} className="reveal p-8 text-center">
              <div className="w-16 h-16 bg-sea rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{category.name}</h3>
              <p className="text-ink-500 leading-relaxed">{category.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
