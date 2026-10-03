import { render, screen, fireEvent } from '@testing-library/react';
import GalleryClientPage from './GalleryClientPage';
import ArtworkPage from './[slug]/page';
import { getGalleryData } from '@/hooks/useApi';

jest.mock('@/hooks/useApi', () => ({
  getGalleryData: jest.fn(),
  getContactsData: jest.fn(),
  getImageUrl: (path: string) => path,
}));
jest.mock('next/navigation', () => ({ notFound: jest.fn(), useRouter: () => ({ replace: jest.fn() }), useSearchParams: () => new URLSearchParams() }));
jest.mock('@/lib/analytics', () => ({ reachGoal: jest.fn(), Goals: { ContactClick: 'c', ArtworkView: 'a' } }));
jest.mock('yet-another-react-lightbox', () => ({ __esModule: true, default: () => null }));
jest.mock('yet-another-react-lightbox/plugins/zoom', () => ({ __esModule: true, default: {} }));
jest.mock('yet-another-react-lightbox/styles.css', () => ({}), { virtual: true });

const art = (id: number, extra: Record<string, unknown> = {}) => ({
  id, title: id === 1 ? 'Закат' : `Работа ${id}`, technique: 'масло', support: 'холст',
  widthCm: 80, heightCm: 70, year: 2026, price: 45000, status: 'Available', isForSale: true,
  categoryId: 1, category: { id: 1, name: 'Пейзаж' }, imagePath: `f${id}.jpg`, thumbnailPath: `t${id}.jpg`, images: [], ...extra,
});
const data = (artworks: unknown[]) => ({ artworks, categories: [{ id: 1, name: 'Пейзаж' }] }) as any;
const FORBIDDEN = /(^|[\s"'])(?:[a-z-:]*)?(primary|secondary|purple|indigo|blue|orange)-|gradient/;
const lines = (el: Element) =>
  Array.from(el.querySelectorAll('[data-label-line]')).map((n) => (n.textContent ?? '').replace(/\s/g, ' '));
const EXPECTED = ['«Закат»', 'масло, холст', '80 × 70 см', '2026', '45 000 ₽'];

describe('@US3-AS1 label identical in gallery card, artwork page and related works', () => {
  it('gallery card', () => {
    const { container } = render(<GalleryClientPage galleryData={data([art(1)])} />);
    expect(lines(container.querySelector('a[href^="/gallery/"]')!)).toEqual(EXPECTED);
  });

  it('artwork page and related works', async () => {
    (getGalleryData as jest.Mock).mockResolvedValue(data([art(1), art(2, { title: 'Закат', id: 2 })]));
    const { container } = render(await ArtworkPage({ params: { slug: 'zakat-1' } }));
    expect(lines(container.querySelector('aside')!)).toEqual(EXPECTED);
    expect(lines(container.querySelector('section ul')!)).toEqual(EXPECTED);
  });
});

describe('@US3-FE5 single h1 on the artwork page', () => {
  it('has exactly one h1 with the title, not duplicated in the label', async () => {
    (getGalleryData as jest.Mock).mockResolvedValue(data([art(1), art(2)]));
    const { container } = render(await ArtworkPage({ params: { slug: 'zakat-1' } }));
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')).toHaveTextContent('«Закат»');
    expect(container.querySelector('aside')!.textContent!.match(/«Закат»/g)).toHaveLength(1);
  });
});

describe('@US1-AS3 card price is ochre', () => {
  it('price has text-ochre-700', () => {
    render(<GalleryClientPage galleryData={data([art(1)])} />);
    expect(screen.getByText(/45.000.₽/).className).toContain('text-ochre-700');
  });
});

describe('@US4-FE7 gallery and artwork page actions use Button', () => {
  const many = Array.from({ length: 30 }, (_, i) => art(i + 1));

  it('shows 24 cards and a sea Show more button, no forbidden classes', () => {
    const { container } = render(<GalleryClientPage galleryData={data(many)} />);
    expect(container.querySelectorAll('a[href^="/gallery/"]')).toHaveLength(24);
    const more = screen.getByRole('button', { name: /Показать ещё/ });
    expect(more.className).toMatch(/bg-sea/);
    fireEvent.click(more);
    expect(container.querySelectorAll('a[href^="/gallery/"]')).toHaveLength(30);
    const classes = Array.from(container.querySelectorAll('[class]')).map((n) => n.getAttribute('class')).join(' ');
    expect(classes).not.toMatch(FORBIDDEN);
  });

  it('artwork page Узнать цену is bg-sea, no forbidden classes', async () => {
    (getGalleryData as jest.Mock).mockResolvedValue(data([art(1), art(2)]));
    const { container } = render(await ArtworkPage({ params: { slug: 'zakat-1' } }));
    expect(screen.getByRole('link', { name: 'Узнать цену' }).className).toContain('bg-sea');
    const root = container.querySelector('aside')!.parentElement!.parentElement!;
    const classes = Array.from(root.querySelectorAll('[class]')).map((n) => n.getAttribute('class')).join(' ');
    expect(classes).not.toMatch(FORBIDDEN);
  });
});

describe('GalleryCard boundary: photo count badge', () => {
  it('does not show photo badge when images.length is 0', () => {
    render(<GalleryClientPage galleryData={data([art(1, { images: [] })])} />);
    expect(screen.queryByTestId('photo-count-badge')).not.toBeInTheDocument();
  });
  it('does not show photo badge when images.length is 1', () => {
    render(<GalleryClientPage galleryData={data([art(1, { images: [{ id: 1 }] as any })])} />);
    expect(screen.queryByTestId('photo-count-badge')).not.toBeInTheDocument();
  });
  it('shows photo badge when images.length is 2', () => {
    render(<GalleryClientPage galleryData={data([art(1, { images: [{ id: 1 }, { id: 2 }] as any })])} />);
    expect(screen.getByTestId('photo-count-badge')).toBeInTheDocument();
    expect(screen.getByTestId('photo-count-badge')).toHaveTextContent('📷 2');
  });
  it('shows correct count for many images', () => {
    const images = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })) as any;
    render(<GalleryClientPage galleryData={data([art(1, { images })])} />);
    expect(screen.getByTestId('photo-count-badge')).toHaveTextContent('📷 10');
  });
});

describe('GalleryCard boundary: missing data', () => {
  it('renders category fallback when category is missing', () => {
    render(<GalleryClientPage galleryData={data([art(1, { category: null })])} />);
    expect(screen.getByText('Без категории')).toBeInTheDocument();
  });
  it('renders card with missing category.name', () => {
    render(<GalleryClientPage galleryData={data([art(1, { category: { id: 1, name: null } as any })])} />);
    expect(screen.getByText('Без категории')).toBeInTheDocument();
  });
  it('applies correct link structure for card', () => {
    render(<GalleryClientPage galleryData={data([art(1)])} />);
    const link = screen.getByRole('link', { name: 'Закат' });
    expect((link as HTMLAnchorElement).href).toContain('/gallery/');
    expect(link.className).toContain('block');
  });
  it('applies correct image classes for responsive sizing', () => {
    const { container } = render(<GalleryClientPage galleryData={data([art(1)])} />);
    const image = container.querySelector('img[alt="Закат"]');
    expect(image?.className).toContain('w-full');
    expect(image?.className).toContain('h-full');
    expect(image?.className).toContain('object-contain');
  });
});

describe('GalleryCard boundary: image loading attributes', () => {
  it('first 4 cards use eager loading', () => {
    const many = Array.from({ length: 6 }, (_, i) => art(i + 1));
    const { container } = render(<GalleryClientPage galleryData={data(many)} />);
    const images = Array.from(container.querySelectorAll('img[alt]'));
    expect(images[0].getAttribute('loading')).toBe('eager');
    expect(images[0].getAttribute('decoding')).toBe('auto');
    expect(images[3].getAttribute('loading')).toBe('eager');
  });
  it('cards after the first 4 use lazy loading', () => {
    const many = Array.from({ length: 6 }, (_, i) => art(i + 1));
    const { container } = render(<GalleryClientPage galleryData={data(many)} />);
    const images = Array.from(container.querySelectorAll('img[alt]'));
    if (images.length > 4) {
      expect(images[4].getAttribute('loading')).toBe('lazy');
      expect(images[4].getAttribute('decoding')).toBe('async');
    }
  });
});

describe('GalleryCard boundary: hover effects', () => {
  it('card link has group class for hover coordination', () => {
    render(<GalleryClientPage galleryData={data([art(1)])} />);
    const link = screen.getByRole('link', { name: 'Закат' });
    expect(link.className).toContain('group');
  });
  it('image has hover:scale-105 class for interaction', () => {
    const { container } = render(<GalleryClientPage galleryData={data([art(1)])} />);
    const image = container.querySelector('img[alt="Закат"]');
    expect(image?.className).toContain('hover:scale-105');
  });
  it('card has border and rounded classes', () => {
    render(<GalleryClientPage galleryData={data([art(1)])} />);
    const link = screen.getByRole('link', { name: 'Закат' });
    expect(link.className).toContain('border');
    expect(link.className).toContain('rounded-md');
  });
});

describe('GalleryCard boundary: aspect ratio and dimensions', () => {
  it('aspect-square class ensures square images', () => {
    const { container } = render(<GalleryClientPage galleryData={data([art(1)])} />);
    const aspect = container.querySelector('.aspect-square');
    expect(aspect).toBeInTheDocument();
  });
  it('overflow-hidden prevents image overflow', () => {
    const { container } = render(<GalleryClientPage galleryData={data([art(1)])} />);
    const parent = container.querySelector('.overflow-hidden.aspect-square');
    expect(parent).toBeInTheDocument();
  });
});
