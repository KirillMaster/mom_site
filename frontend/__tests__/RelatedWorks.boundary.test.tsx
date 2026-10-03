import { render, screen, within } from '@testing-library/react';
import RelatedWorks from '@/app/gallery/[slug]/RelatedWorks';

jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => (p.startsWith('http') ? p : `https://cdn.test${p}`)
}));

const artwork = (id: number, title: string) => ({
  id,
  title,
  imagePath: `/img-${id}.jpg`,
  thumbnailPath: `/thumb-${id}.jpg`
});

describe('@US4-AS12 RelatedWorks edge cases', () => {
  it('returns null when works array is empty', () => {
    const { container } = render(<RelatedWorks works={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders section when works array has items', () => {
    render(<RelatedWorks works={[artwork(1, 'Картина 1')]} />);
    const section = screen.getByRole('heading', { name: 'Другие работы этой категории' });
    expect(section).toBeInTheDocument();
  });

  it('displays all works in the list', () => {
    const works = [artwork(1, 'Картина 1'), artwork(2, 'Картина 2'), artwork(3, 'Картина 3')];
    render(<RelatedWorks works={works} />);
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    // 3 works + 3 internal links
    expect(links.filter(l => l.href.includes('/gallery/')).length).toBeGreaterThanOrEqual(3);
  });

  it('shows title for each work', () => {
    const works = [artwork(1, 'Сирень'), artwork(2, 'Роза'), artwork(3, 'Тюльпан')];
    render(<RelatedWorks works={works} />);
    expect(screen.getByText('«Сирень»')).toBeInTheDocument();
    expect(screen.getByText('«Роза»')).toBeInTheDocument();
    expect(screen.getByText('«Тюльпан»')).toBeInTheDocument();
  });

  it('includes correct gallery links for each work', () => {
    const works = [artwork(1, 'Картина'), artwork(2, 'Вторая')];
    render(<RelatedWorks works={works} />);
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    // Check that links contain the IDs
    const galleryLinks = links.filter(l => l.href.includes('/gallery/'));
    expect(galleryLinks.some(l => l.href.includes('-1'))).toBe(true);
    expect(galleryLinks.some(l => l.href.includes('-2'))).toBe(true);
  });

  it('uses thumbnailPath when available', () => {
    const works = [{ id: 1, title: 'Картина', imagePath: '/img.jpg', thumbnailPath: '/thumb.jpg' }];
    const { container } = render(<RelatedWorks works={works} />);
    const img = container.querySelector('img');
    expect(img?.src).toContain('thumb.jpg');
  });

  it('falls back to imagePath when thumbnailPath missing', () => {
    const works = [{ id: 1, title: 'Картина', imagePath: '/img.jpg' }];
    const { container } = render(<RelatedWorks works={works} />);
    const img = container.querySelector('img');
    expect(img?.src).toContain('img.jpg');
  });

  it('marks images as aria-hidden decorative', () => {
    const works = [artwork(1, 'Картина')];
    const { container } = render(<RelatedWorks works={works} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('aria-hidden', 'true');
  });

  it('preserves work order in display', () => {
    const works = [artwork(5, 'Пятая'), artwork(2, 'Вторая'), artwork(10, 'Десятая')];
    render(<RelatedWorks works={works} />);
    const section = screen.getByRole('heading', { name: 'Другие работы этой категории' }).parentElement;
    if (!section) throw new Error('Section not found');
    const items = within(section).getAllByRole('link').filter(l => (l as HTMLAnchorElement).href.includes('/gallery/')) as HTMLAnchorElement[];
    // First links should match the order
    expect(items[0].href).toContain('-5');
    expect(items[1].href).toContain('-2');
    expect(items[2].href).toContain('-10');
  });

  it('handles single work correctly', () => {
    const works = [artwork(1, 'Одна картина')];
    render(<RelatedWorks works={works} />);
    expect(screen.getByText('«Одна картина»')).toBeInTheDocument();
    const section = screen.getByRole('heading', { name: 'Другие работы этой категории' });
    expect(section).toBeInTheDocument();
  });

  it('@US5-AS1 caps a large number of works at 8', () => {
    const works = Array.from({ length: 100 }, (_, i) => artwork(i + 1, `Картина ${i + 1}`));
    render(<RelatedWorks works={works} />);
    const section = screen.getByRole('heading', { name: 'Другие работы этой категории' }).parentElement;
    if (!section) throw new Error('Section not found');
    const items = within(section).getAllByRole('link').filter(l => (l as HTMLAnchorElement).href.includes('/gallery/')) as HTMLAnchorElement[];
    expect(items).toHaveLength(8);
  });

  it('includes artwork links with proper href', () => {
    const works = [artwork(1, 'Картина с длинным названием')];
    render(<RelatedWorks works={works} />);
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    const artworkLink = links.find(l => l.href.includes('/gallery/'));
    expect(artworkLink).toBeDefined();
    expect(artworkLink!.href).toContain('/gallery/');
    expect(artworkLink!.href).toContain('-1');
  });

  it('renders grid layout classes for responsive design', () => {
    const works = [artwork(1, 'Картина')];
    const { container } = render(<RelatedWorks works={works} />);
    const ul = container.querySelector('ul');
    expect(ul?.className).toContain('grid');
    expect(ul?.className).toContain('grid-cols-2');
    expect(ul?.className).toContain('md:grid-cols-3');
    expect(ul?.className).toContain('lg:grid-cols-4');
  });
});
