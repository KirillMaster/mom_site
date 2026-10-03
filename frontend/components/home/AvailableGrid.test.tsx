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
