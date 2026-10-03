import { render, screen } from '@testing-library/react';
import AvailableGrid from './AvailableGrid';
import type { ArtworkDto } from '@/lib/api';

jest.mock('@/hooks/useApi', () => ({
  getImageUrl: (p: string) => `https://s3.twcstorage.ru/bucket/${p}`,
}));

const art = (id: number) =>
  ({ id, title: `Работа ${id}`, imagePath: `${id}.jpg`, thumbnailPath: `t${id}.jpg`, price: 1000 * id, isForSale: true }) as unknown as ArtworkDto;

describe('@US1-AS2 сетка «Сейчас в наличии»', () => {
  it('показывает 8 карточек с этикеткой и ссылкой на страницу работы', () => {
    const { container } = render(<AvailableGrid artworks={Array.from({ length: 8 }, (_, i) => art(i + 1))} />);
    expect(screen.getByRole('heading', { name: 'Сейчас в наличии' })).toBeInTheDocument();
    const links = container.querySelectorAll('a[href^="/gallery/"]');
    expect(links).toHaveLength(8);
    expect(links[0].getAttribute('href')).toBe('/gallery/rabota-1-1');
    expect(container.querySelectorAll('[data-label-line]').length).toBeGreaterThanOrEqual(8);
  });
});

describe('@US1-AS3 изображения сетки идут через оптимизатор', () => {
  it('нет img с исходным URL S3, src начинается с /_next/image, задан sizes', () => {
    const { container } = render(<AvailableGrid artworks={[art(1), art(2)]} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(2);
    imgs.forEach((img) => {
      expect(img.getAttribute('src')).toMatch(/^\/_next\/image/);
      expect(img.getAttribute('src')).not.toMatch(/^https:\/\/s3\./);
      expect(img.getAttribute('sizes')).toBeTruthy();
    });
  });
});

describe('@US1-EC1 нет работ в наличии', () => {
  it('блок скрыт при пустом массиве и при undefined', () => {
    expect(render(<AvailableGrid artworks={[]} />).container).toBeEmptyDOMElement();
    expect(render(<AvailableGrid artworks={undefined} />).container).toBeEmptyDOMElement();
  });
});

describe('@US1-EC2 меньше шести работ', () => {
  it('показывает ровно 3 карточки без заглушек', () => {
    const { container } = render(<AvailableGrid artworks={[art(1), art(2), art(3)]} />);
    expect(container.querySelectorAll('a[href^="/gallery/"]')).toHaveLength(3);
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });
});

// ====== Degradation Mode Boundary Tests for AvailableGrid ======

describe('@US1-AS2 @US1-EC2 сетка — boundary cases (1, 7 items)', () => {
  it('shows single artwork card without placeholders', () => {
    const { container } = render(<AvailableGrid artworks={[art(1)]} />);
    expect(screen.getByRole('heading', { name: 'Сейчас в наличии' })).toBeInTheDocument();
    expect(container.querySelectorAll('a[href^="/gallery/"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-label-line]').length).toBeGreaterThanOrEqual(1);
  });

  it('shows 7 cards without padding for 8th card', () => {
    const { container } = render(<AvailableGrid artworks={Array.from({ length: 7 }, (_, i) => art(i + 1))} />);
    const links = container.querySelectorAll('a[href^="/gallery/"]');
    expect(links).toHaveLength(7);
    expect(container.querySelectorAll('li')).toHaveLength(7);
  });

  it('shows exactly 5 cards', () => {
    const { container } = render(<AvailableGrid artworks={Array.from({ length: 5 }, (_, i) => art(i + 1))} />);
    expect(container.querySelectorAll('a[href^="/gallery/"]')).toHaveLength(5);
    expect(container.querySelectorAll('li')).toHaveLength(5);
  });
});

describe('@US1-AS3 AvailableGrid images — boundary & edge cases', () => {
  it('single artwork image has sizes attribute', () => {
    const { container } = render(<AvailableGrid artworks={[art(1)]} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('sizes')).toBeTruthy();
  });

  it('all images have different src patterns (next/image wrapped)', () => {
    const { container } = render(<AvailableGrid artworks={[art(1), art(2), art(3)]} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThanOrEqual(3);
    imgs.forEach((img, idx) => {
      expect(img.getAttribute('src')).toMatch(/^\/_next\/image/);
      expect(img.getAttribute('alt')).toBeTruthy();
    });
  });
});

describe('@US1-AS2 AvailableGrid links — slug generation', () => {
  it('each card links to correct slug', () => {
    const { container } = render(<AvailableGrid artworks={[art(1), art(2)]} />);
    const links = Array.from(container.querySelectorAll('a[href^="/gallery/"]'));
    expect(links[0].getAttribute('href')).toBe('/gallery/rabota-1-1');
    expect(links[1].getAttribute('href')).toBe('/gallery/rabota-2-2');
  });

  it('handles 8 items with correct hrefs', () => {
    const artworks = Array.from({ length: 8 }, (_, i) => art(i + 1));
    const { container } = render(<AvailableGrid artworks={artworks} />);
    const links = Array.from(container.querySelectorAll('a[href^="/gallery/"]'));
    expect(links.length).toBe(8);
    links.forEach((link, idx) => {
      expect(link.getAttribute('href')).toMatch(/^\/gallery\/rabota-\d+-\d+$/);
    });
  });
});
