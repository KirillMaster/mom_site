import { render, screen } from '@testing-library/react';
import HomeClientPage from './HomeClientPage';

jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => `https://s3.twcstorage.ru/bucket/${p}`,
}));

beforeAll(() => {
  window.matchMedia = ((query: string) => ({ matches: true, media: query })) as unknown as typeof window.matchMedia;
});

const art = (id: number) => ({ id, title: `Работа ${id}`, imagePath: `${id}.jpg`, thumbnailPath: `t${id}.jpg` });
const base = {
  welcomeMessage: '', bannerImage: 'banner.jpg', biographyText: 'Био', authorPhoto: 'author.jpg',
  artworks: [art(1), art(2)], availableArtworks: [art(3), art(4), art(5)],
  contacts: { socialLinks: {} },
} as any;
const review = (id: number) => ({ id, authorName: `А${id}`, text: `Т${id}`, rating: 5, createdAt: '', sortOrder: id });

describe('@US1-AS1 hero', () => {
  it('подзаголовок и две кнопки', () => {
    render(<HomeClientPage homeData={base} />);
    expect(screen.getByText('Живопись маслом из Крыма. Работы в коллекциях 12 стран')).toBeInTheDocument();
    const choose = screen.getByRole('link', { name: /Выбрать картину/ });
    expect(choose.getAttribute('href')).toMatch(/^\/gallery(\?available=1)?$/);
    expect(screen.getByRole('link', { name: /Заказать картину/ })).toHaveAttribute('href', '/order');
  });
});

describe('@US1-AS2 блок в наличии на главной', () => {
  it('рендерит карточки из availableArtworks', () => {
    const { container } = render(<HomeClientPage homeData={base} />);
    expect(screen.getByRole('heading', { name: 'Сейчас в наличии' })).toBeInTheDocument();
    expect(container.querySelectorAll('li a[href^="/gallery/"]')).toHaveLength(3);
  });
});

describe('@US1-AS3 на главной нет img с прямым S3 URL', () => {
  it('все изображения работ идут через /_next/image с sizes', () => {
    const { container } = render(<HomeClientPage homeData={base} />);
    container.querySelectorAll('img').forEach((img) => {
      expect(img.getAttribute('src')).not.toMatch(/^https?:/);
      expect(img.getAttribute('src')).toMatch(/^\/_next\/image/);
      expect(img.getAttribute('sizes')).toBeTruthy();
    });
  });
});

describe('@US1-EC1 блок скрыт, остальное на месте', () => {
  it.each([[[]], [undefined]])('availableArtworks=%p', (available) => {
    render(<HomeClientPage homeData={{ ...base, availableArtworks: available }} />);
    expect(screen.queryByRole('heading', { name: 'Сейчас в наличии' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Обо мне' })).toBeInTheDocument();
    expect(screen.getByText('Коллекционеры в 12 странах')).toBeInTheDocument();
  });
});

describe('@US2-AS1 @US2-AS3 доверие и отзывы на главной', () => {
  it('показывает полосу доверия и 3 отзыва из 5', () => {
    const { container } = render(<HomeClientPage homeData={base} reviews={[1, 2, 3, 4, 5].map(review)} />);
    expect(screen.getByText('Член Союза художников России')).toBeInTheDocument();
    expect(container.querySelectorAll('blockquote')).toHaveLength(3);
  });
});

describe('@US2-EC1 без отзывов', () => {
  it('блок отзывов скрыт, полоса доверия остаётся', () => {
    const { container } = render(<HomeClientPage homeData={base} />);
    expect(container.querySelectorAll('blockquote')).toHaveLength(0);
    expect(screen.queryByRole('link', { name: /Все отзывы/ })).toBeNull();
    expect(screen.getByText('Работы в музейных собраниях')).toBeInTheDocument();
  });
});
