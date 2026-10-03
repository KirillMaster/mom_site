import { render } from '@testing-library/react';
import ArtworkCarousel from './ArtworkCarousel';
import type { ArtworkDto } from '@/lib/api';

const artwork = (id: number) => ({ id, title: `Работа ${id}`, imagePath: `${id}.jpg` }) as unknown as ArtworkDto;

beforeAll(() => {
  window.matchMedia = ((query: string) => ({ matches: true, media: query })) as unknown as typeof window.matchMedia;
});

describe('@US1-AS2 карусель на главной', () => {
  it('ссылки и точки карусели имеют морское кольцо фокуса', () => {
    const { container } = render(<ArtworkCarousel artworks={[artwork(1), artwork(2)]} />);
    const focusables = container.querySelectorAll('a, button');
    expect(focusables.length).toBe(4);
    focusables.forEach((el) => {
      expect(el.className).toContain('focus-visible:ring-sea');
    });
  });
});

describe('@US1-AS3 карусель на главной идёт через оптимизатор', () => {
  it('img идут через /_next/image с sizes', () => {
    const { container } = render(<ArtworkCarousel artworks={[artwork(1), artwork(2)]} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(2);
    imgs.forEach((img) => {
      expect(img.getAttribute('src')).toMatch(/^\/_next\/image/);
      expect(img.getAttribute('sizes')).toBeTruthy();
    });
  });
});
