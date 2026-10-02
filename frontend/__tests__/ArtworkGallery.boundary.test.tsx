import { render, screen, fireEvent, within } from '@testing-library/react';
import { TextEncoder as NodeTextEncoder } from 'util';
import ArtworkGallery from '@/app/gallery/[slug]/ArtworkGallery';

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ArtworkView: 'artwork_view' },
}));
jest.mock('yet-another-react-lightbox/styles.css', () => ({}), { virtual: true });
jest.mock('yet-another-react-lightbox/plugins/zoom', () => ({ __esModule: true, default: {} }));
jest.mock('yet-another-react-lightbox', () => ({
  __esModule: true,
  default: ({ open, index, slides, close, on, render: r }: any) => {
    if (!open) return null;
    const move = (d: number) => on?.view?.({ index: (index + d + slides.length) % slides.length });
    return (
      <div
        data-testid="lightbox"
        data-index={index}
        data-slides={slides.length}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') move(1);
          if (e.key === 'ArrowLeft') move(-1);
          if (e.key === 'Escape') close();
        }}
      >
        {r?.buttonNext ? 'no-arrows' : 'arrows'}
      </div>
    );
  },
}));

const photos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ src: `/full/${i + 1}.jpg`, thumb: `/t/${i + 1}.jpg` }));

const main = (container: HTMLElement) =>
  container.querySelector('[data-active="true"] img') as HTMLImageElement;

describe('@US2-AS8 ArtworkGallery scroll edge cases', () => {
  it('clamps scroll position to valid slide when scrolling past end', () => {
    const { container } = render(<ArtworkGallery photos={photos(3)} title="Тест" />);
    const track = screen.getByTestId('gallery-track');
    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
    // Scroll way past the end
    track.scrollLeft = 10000;
    fireEvent.scroll(track);
    expect(screen.getAllByTestId('gallery-dot')[2]).toHaveAttribute('aria-current', 'true');
  });

  it('handles zero clientWidth scroll gracefully', () => {
    const { container } = render(<ArtworkGallery photos={photos(3)} title="Тест" />);
    const track = screen.getByTestId('gallery-track');
    Object.defineProperty(track, 'clientWidth', { value: 0, configurable: true });
    // Should not crash when clientWidth is 0
    track.scrollLeft = 100;
    fireEvent.scroll(track);
    // Should still have dots
    expect(screen.getAllByTestId('gallery-dot')).toHaveLength(3);
  });

  it('rounds scroll position to nearest slide', () => {
    const { container } = render(<ArtworkGallery photos={photos(4)} title="Тест" />);
    const track = screen.getByTestId('gallery-track');
    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
    // Scroll to 1.4 slides (should round to 1)
    track.scrollLeft = 420;
    fireEvent.scroll(track);
    expect(screen.getAllByTestId('gallery-dot')[1]).toHaveAttribute('aria-current', 'true');
  });
});

describe('@US2-AS9 ArtworkGallery single photo behavior', () => {
  it('renders single photo without navigation elements', () => {
    render(<ArtworkGallery photos={photos(1)} title="Единственное фото" />);
    expect(screen.queryByTestId('gallery-thumbs')).toBeNull();
    expect(screen.queryByTestId('gallery-dots')).toBeNull();
    expect(screen.queryByTestId('gallery-dot')).toBeNull();
  });

  it('still renders the main image for single photo', () => {
    render(<ArtworkGallery photos={photos(1)} title="Единственное фото" />);
    const img = main(screen.getByTestId('gallery-track').parentElement!);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/full/1.jpg');
  });

  it('single photo uses title as alt text without numbering', () => {
    render(<ArtworkGallery photos={photos(1)} title="Одна картина" />);
    const img = screen.getByRole('img', { name: 'Одна картина' });
    expect(img).toBeInTheDocument();
  });

  it('single photo lightbox still opens without arrows', () => {
    const { container } = render(<ArtworkGallery photos={photos(1)} title="Картина" />);
    const img = main(container);
    fireEvent.click(img);
    const box = screen.getByTestId('lightbox');
    expect(box).toHaveAttribute('data-index', '0');
    expect(box).toHaveAttribute('data-slides', '1');
    expect(box).toHaveTextContent('no-arrows');
  });
});

describe('@US3-AS10 ArtworkGallery rendering all photos in HTML', () => {
  it('renders every photo visible in server HTML for multi-photo', () => {
    (globalThis as any).TextEncoder ??= NodeTextEncoder;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderToString } = require('react-dom/server');
    const html = renderToString(<ArtworkGallery photos={photos(5)} title="Картина" />);
    // All 5 photos should be in the HTML
    for (const n of [1, 2, 3, 4, 5]) {
      expect(html).toContain(`alt="Картина — фото ${n}"`);
      expect(html).toContain(`/full/${n}.jpg`);
    }
  });

  it('renders single photo HTML correctly', () => {
    (globalThis as any).TextEncoder ??= NodeTextEncoder;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderToString } = require('react-dom/server');
    const html = renderToString(<ArtworkGallery photos={photos(1)} title="Единственная" />);
    expect(html).toContain('Единственная');
    expect(html).toContain('/full/1.jpg');
    // Should not contain numbered alt for single
    expect(html).not.toContain('фото 1');
  });

  it('all photos have exact numbered alts in multi-photo', () => {
    (globalThis as any).TextEncoder ??= NodeTextEncoder;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderToString } = require('react-dom/server');
    const html = renderToString(<ArtworkGallery photos={photos(10)} title="Набор" />);
    const matches = html.match(/alt="Набор — фото \d+"/g) || [];
    expect(matches).toHaveLength(10);
    expect(new Set(matches).size).toBe(10); // All unique
  });
});

describe('@US3-FR13 ArtworkGallery loading priority', () => {
  it('first photo loads eagerly, rest lazily', () => {
    render(<ArtworkGallery photos={photos(5)} title="Картина" />);
    const track = screen.getByTestId('gallery-track');
    const imgs = within(track).getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('loading', 'eager');
    expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
    for (let i = 1; i < imgs.length; i++) {
      expect(imgs[i]).toHaveAttribute('loading', 'lazy');
      expect(imgs[i]).not.toHaveAttribute('fetchpriority');
    }
  });

  it('single photo loads eagerly with high priority', () => {
    render(<ArtworkGallery photos={photos(1)} title="Картина" />);
    const img = screen.getByRole('img', { name: 'Картина' });
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });
});

describe('@US2-AS6 ArtworkGallery thumbnail interaction at boundaries', () => {
  it('switching to first thumbnail marks only first as active', () => {
    render(<ArtworkGallery photos={photos(3)} title="Тест" />);
    const thumbs = screen.getAllByTestId('gallery-thumb');
    fireEvent.click(thumbs[2]);
    fireEvent.click(thumbs[0]);
    expect(thumbs[0]).toHaveAttribute('aria-current', 'true');
    expect(thumbs[1]).not.toHaveAttribute('aria-current');
    expect(thumbs[2]).not.toHaveAttribute('aria-current');
  });

  it('switching to last thumbnail marks only last as active', () => {
    render(<ArtworkGallery photos={photos(3)} title="Тест" />);
    const thumbs = screen.getAllByTestId('gallery-thumb');
    fireEvent.click(thumbs[2]);
    expect(thumbs[2]).toHaveAttribute('aria-current', 'true');
    expect(thumbs[0]).not.toHaveAttribute('aria-current');
  });

  it('repeated clicks on same thumbnail keep it active', () => {
    render(<ArtworkGallery photos={photos(3)} title="Тест" />);
    const thumbs = screen.getAllByTestId('gallery-thumb');
    fireEvent.click(thumbs[1]);
    fireEvent.click(thumbs[1]);
    expect(thumbs[1]).toHaveAttribute('aria-current', 'true');
  });
});

describe('@US2-AS7 ArtworkGallery lightbox navigation at boundaries', () => {
  it('next arrow at last photo wraps to first', () => {
    const { container } = render(<ArtworkGallery photos={photos(4)} title="Тест" />);
    fireEvent.click(screen.getAllByTestId('gallery-thumb')[3]);
    fireEvent.click(main(container));
    const box = screen.getByTestId('lightbox');
    expect(box).toHaveAttribute('data-index', '3');
    fireEvent.keyDown(box, { key: 'ArrowRight' });
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '0');
  });

  it('previous arrow at first photo wraps to last', () => {
    const { container } = render(<ArtworkGallery photos={photos(4)} title="Тест" />);
    fireEvent.click(main(container));
    const box = screen.getByTestId('lightbox');
    expect(box).toHaveAttribute('data-index', '0');
    fireEvent.keyDown(box, { key: 'ArrowLeft' });
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '3');
  });

  it('multiple arrow presses in sequence navigate correctly', () => {
    const { container } = render(<ArtworkGallery photos={photos(4)} title="Тест" />);
    fireEvent.click(main(container));
    const box = screen.getByTestId('lightbox');
    fireEvent.keyDown(box, { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByTestId('lightbox'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByTestId('lightbox'), { key: 'ArrowLeft' });
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '1');
  });
});
