import { render, screen } from '@testing-library/react';
import ExhibitionPhotos from './ExhibitionPhotos';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, loading, sizes }: { src: string; alt: string; loading?: string; sizes?: string }) => (
    <img src={src} alt={alt} loading={loading} data-sizes={sizes} />
  ),
}));

const photo = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Фото ${id}`,
  imagePath: `image${id}.jpg`,
  thumbnailPath: `thumb${id}.jpg`,
  ...overrides,
});

describe('@US5-AS4 ExhibitionPhotos component - degradation mode', () => {
  it('US5-AS4 renders a grid with photos and heading', () => {
    const { container } = render(
      <ExhibitionPhotos photos={[photo(1), photo(2), photo(3)]} />
    );
    expect(screen.getByText('Фото с выставок')).toBeInTheDocument();
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(3);
  });

  it('US5-AS4 shows up to many photos in grid layout', () => {
    const photos = Array.from({ length: 20 }, (_, i) => photo(i + 1));
    const { container } = render(<ExhibitionPhotos photos={photos} />);
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(20);
  });

  it('US5-AS4 uses thumbnailPath when available, falls back to imagePath', () => {
    const { container } = render(
      <ExhibitionPhotos
        photos={[
          photo(1, { thumbnailPath: 'thumb1.jpg' }),
          photo(2, { thumbnailPath: null, imagePath: 'image2.jpg' }),
        ]}
      />
    );
    const images = container.querySelectorAll('img');
    expect(images[0].src).toContain('thumb1.jpg');
    expect(images[1].src).toContain('image2.jpg');
  });

  it('US5-AS4 first 4 images are eager, rest are lazy - degradation', () => {
    const photos = Array.from({ length: 10 }, (_, i) => photo(i + 1));
    const { container } = render(<ExhibitionPhotos photos={photos} />);
    const images = Array.from(container.querySelectorAll('img'));
    images.slice(0, 4).forEach((img) => {
      expect(img.getAttribute('loading')).toBe('eager');
    });
    images.slice(4).forEach((img) => {
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  it('US5-AS4 all images have sizes attribute for responsive layout', () => {
    const { container } = render(
      <ExhibitionPhotos photos={[photo(1), photo(2), photo(3)]} />
    );
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      expect(img.getAttribute('data-sizes')).toBeTruthy();
    });
  });

  it('US5-AS4 uses normalized title as alt text or default', () => {
    const { container } = render(
      <ExhibitionPhotos
        photos={[
          photo(1, { title: 'Вернисаж 2024' }),
          photo(2, { title: '"Выставка"' }),
          photo(3, { title: null }),
        ]}
      />
    );
    const images = Array.from(container.querySelectorAll('img'));
    expect(images[0].alt).toBeTruthy();
    expect(images[1].alt).toBeTruthy();
    expect(images[2].alt).toBe('Фото с выставки');
  });
});

describe('@US5-FE3 ExhibitionPhotos hidden without data - degradation mode', () => {
  it('US5-FE3 returns null for undefined photos', () => {
    const { container } = render(<ExhibitionPhotos photos={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('US5-FE3 returns null for null photos', () => {
    const { container } = render(<ExhibitionPhotos photos={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('US5-FE3 returns null for empty array', () => {
    const { container } = render(<ExhibitionPhotos photos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('US5-FE3 does not render section when photos is not an array', () => {
    const { container } = render(<ExhibitionPhotos photos={{ length: 0 } as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('US5-FE3 does not show "Фото с выставок" heading when no photos', () => {
    render(<ExhibitionPhotos photos={null} />);
    expect(screen.queryByText('Фото с выставок')).not.toBeInTheDocument();
  });
});

describe('@US5-AS4 ExhibitionPhotos rendering details - degradation mode', () => {
  it('US5-AS4 single photo renders correctly', () => {
    const { container } = render(<ExhibitionPhotos photos={[photo(1)]} />);
    expect(screen.getByText('Фото с выставок')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('US5-AS4 photo with empty title uses default alt text - degradation', () => {
    const { container } = render(
      <ExhibitionPhotos photos={[photo(1, { title: '' })]} />
    );
    const img = container.querySelector('img');
    expect(img?.alt).toBe('Фото с выставки');
  });

  it('US5-AS4 photo with special characters in title is handled - degradation', () => {
    const { container } = render(
      <ExhibitionPhotos
        photos={[photo(1, { title: 'Выставка "Свет & Тень"' })]}
      />
    );
    const img = container.querySelector('img');
    expect(img?.alt).toBeTruthy();
  });

  it('US5-AS4 exactly 5 photos render in grid without boundary issues - degradation', () => {
    const { container } = render(
      <ExhibitionPhotos photos={[photo(1), photo(2), photo(3), photo(4), photo(5)]} />
    );
    expect(container.querySelectorAll('img')).toHaveLength(5);
    expect(screen.getByText('Фото с выставок')).toBeInTheDocument();
  });

  it('US5-AS4 many photos (>20) render without performance issues - degradation', () => {
    const photos = Array.from({ length: 50 }, (_, i) => photo(i + 1));
    const { container } = render(<ExhibitionPhotos photos={photos} />);
    expect(container.querySelectorAll('img')).toHaveLength(50);
  });

  it('US5-AS4 photo without paths still renders with fallback - degradation', () => {
    const { container } = render(
      <ExhibitionPhotos photos={[photo(1, { imagePath: '', thumbnailPath: '' })]} />
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });
});
