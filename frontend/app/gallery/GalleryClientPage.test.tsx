import { render, screen, fireEvent } from '@testing-library/react';
import GalleryClientPage from './GalleryClientPage';

const artwork = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  title: 'Осенний сад',
  description: 'Холст, масло',
  imagePath: 'a.jpg',
  thumbnailPath: 'a-thumb.jpg',
  isForSale: true,
  price: null,
  categoryId: 1,
  category: { id: 1, name: 'Пейзаж' },
  images: [],
  ...overrides,
});

const many = (count: number, overrides: Record<string, unknown> = {}, idBase = 0) =>
  Array.from({ length: count }, (_, i) =>
    artwork({ id: idBase + i + 1, title: `Работа ${idBase + i + 1}`, ...overrides })
  );

const galleryData = (artworks: unknown[]) =>
  ({
    artworks,
    categories: [
      { id: 1, name: 'Пейзаж' },
      { id: 2, name: 'Портрет' },
      { id: 4, name: 'Фото с выставок' },
    ],
  } as any);

const exhibitionPhoto = (overrides: Record<string, unknown> = {}) =>
  artwork({
    id: 9,
    title: 'Открытие выставки',
    categoryId: 4,
    category: { id: 4, name: 'Фото с выставок' },
    ...overrides,
  });

const cardLinks = () =>
  screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/gallery/'));

const clickShowMore = () => fireEvent.click(screen.getByRole('button', { name: /Показать ещё/ }));

describe('GalleryClientPage', () => {
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('@US4-AS1 shows the first 24 works and a "Показать ещё (36)" button', () => {
    render(<GalleryClientPage galleryData={galleryData(many(60))} />);

    expect(cardLinks()).toHaveLength(24);
    expect(screen.getByRole('button', { name: 'Показать ещё (36)' })).toBeInTheDocument();
  });

  it('@US4-AS2 "Показать ещё" adds 24 at a time until everything is shown', () => {
    render(<GalleryClientPage galleryData={galleryData(many(60))} />);

    clickShowMore();
    expect(cardLinks()).toHaveLength(48);

    clickShowMore();
    expect(cardLinks()).toHaveLength(60);
    expect(screen.queryByRole('button', { name: /Показать ещё/ })).not.toBeInTheDocument();
  });

  it('@US4-AS3 the card is a single link with size and "цена по запросу"', () => {
    render(
      <GalleryClientPage galleryData={galleryData([artwork({ widthCm: 80, heightCm: 70 })])} />
    );

    const links = cardLinks();
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/gallery/osenniy-sad-7');
    expect(links[0]).toHaveTextContent('80 × 70 см');
    expect(links[0]).toHaveTextContent('цена по запросу');
    expect(screen.queryByText(/Перейти к описанию/)).not.toBeInTheDocument();
    expect(screen.queryByText('Узнать цену')).not.toBeInTheDocument();
    expect(links[0].querySelector('button')).toBeNull();
  });

  it('@US4-AS3 shows the price as "15 000 ₽" when set', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork({ price: 15000 })])} />);

    expect(screen.getByText(/^15\s000\s₽$/)).toBeInTheDocument();
    expect(screen.queryByText('цена по запросу')).not.toBeInTheDocument();
  });

  it('@US4-AS3 omits the size when it is not filled', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    expect(screen.queryByText(/см$/)).not.toBeInTheDocument();
  });

  it('@US4-AS4 changing the category resets the counter to the first page', () => {
    const portraits = many(60, { categoryId: 2, category: { id: 2, name: 'Портрет' } }, 100);
    render(<GalleryClientPage galleryData={galleryData([...many(60), ...portraits])} />);

    clickShowMore();
    clickShowMore();
    expect(cardLinks()).toHaveLength(72);

    fireEvent.click(screen.getByRole('button', { name: 'Портрет' }));
    expect(cardLinks()).toHaveLength(24);
    expect(screen.getByRole('button', { name: 'Показать ещё (36)' })).toBeInTheDocument();
  });

  it('@US4-AS5 first 4 images are eager, the rest lazy with async decoding', () => {
    const { container } = render(<GalleryClientPage galleryData={galleryData(many(10))} />);

    const images = Array.from(container.querySelectorAll('img'));
    expect(images).toHaveLength(10);
    images.slice(0, 4).forEach((img) => expect(img).toHaveAttribute('loading', 'eager'));
    images.slice(4).forEach((img) => {
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('decoding', 'async');
    });
  });

  it('@US4-EC6 no "Показать ещё" for 24 works or fewer', () => {
    render(<GalleryClientPage galleryData={galleryData(many(24))} />);

    expect(cardLinks()).toHaveLength(24);
    expect(screen.queryByRole('button', { name: /Показать ещё/ })).not.toBeInTheDocument();
  });

  it('@US5-AS2 ?category=<id> preselects that category', () => {
    window.history.replaceState({}, '', '/gallery?category=2');
    const portrait = artwork({ id: 50, title: 'Дама', categoryId: 2, category: { id: 2, name: 'Портрет' } });
    render(<GalleryClientPage galleryData={galleryData([artwork(), portrait])} />);

    expect(screen.getByText('Дама')).toBeInTheDocument();
    expect(screen.queryByText('Осенний сад')).not.toBeInTheDocument();
  });

  it('@US5-AS2 ignores a garbage ?category value', () => {
    window.history.replaceState({}, '', '/gallery?category=abc');
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    expect(screen.getByText('Осенний сад')).toBeInTheDocument();
  });

  it('@US8-AS3 shows a quoted title without the quotes', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork({ title: '"Утро"' })])} />);

    expect(screen.getByText('Утро')).toBeInTheDocument();
    expect(screen.getByAltText('Утро')).toBeInTheDocument();
    expect(screen.queryByText('"Утро"')).not.toBeInTheDocument();
  });

  it('hides exhibition photos from the all-works view but keeps paintings visible', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork(), exhibitionPhoto()])} />);

    expect(screen.getByText('Осенний сад')).toBeInTheDocument();
    expect(screen.queryByText('Открытие выставки')).not.toBeInTheDocument();
  });

  it('shows exhibition photos without any price when that category is selected', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork(), exhibitionPhoto()])} />);

    fireEvent.click(screen.getByRole('button', { name: 'Фото с выставок' }));

    expect(screen.getByText('Открытие выставки')).toBeInTheDocument();
    expect(screen.queryByText('Осенний сад')).not.toBeInTheDocument();
    expect(screen.queryByText('цена по запросу')).not.toBeInTheDocument();
  });

  it('keeps the card to the title and leaves the description to the artwork page', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    expect(screen.queryByText('Холст, масло')).not.toBeInTheDocument();
  });
});

describe('@T025 status badge', () => {
  it('shows badge for Sold and none for Available', () => {
    render(
      <GalleryClientPage
        galleryData={galleryData([
          artwork({ id: 1, title: 'Продана', status: 'Sold', isForSale: false }),
          artwork({ id: 2, title: 'Доступна', status: 'Available', isForSale: true }),
        ])}
      />
    );
    const badges = screen.getAllByTestId('status-badge');
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent('Продана');
  });
});
