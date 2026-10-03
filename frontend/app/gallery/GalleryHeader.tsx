const DEFAULT_TITLE = 'Галерея работ';
const DEFAULT_DESCRIPTION =
  'Исследуйте коллекцию уникальных работ в стиле импрессионизма. Каждая картина создана с любовью и передает особую атмосферу.';

const GalleryHeader = ({ title, description }: { title?: string; description?: string }) => (
  <section className="pt-24 pb-16 bg-paper">
    <div className="max-w-7xl mx-auto px-4">
      <div className="rise-in text-center">
        <h1 className="text-5xl md:text-6xl font-serif font-semibold mb-6 text-ink">
          {title || DEFAULT_TITLE}
        </h1>
        <p className="text-xl text-ink-600 max-w-3xl mx-auto">{description || DEFAULT_DESCRIPTION}</p>
      </div>
    </div>
  </section>
);

export default GalleryHeader;
