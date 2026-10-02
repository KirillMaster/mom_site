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

describe('@US2-AS6 desktop thumbnail switches the main photo', () => {
  it('marks the clicked thumbnail aria-current and shows its photo', () => {
    const { container } = render(<ArtworkGallery photos={photos(4)} title="Сирень" />);
    const thumbs = screen.getAllByTestId('gallery-thumb');
    expect(thumbs).toHaveLength(4);
    fireEvent.click(thumbs[2]);
    expect(main(container)).toHaveAttribute('src', '/full/3.jpg');
    expect(screen.getAllByTestId('gallery-thumb')[2]).toHaveAttribute('aria-current', 'true');
    expect(screen.getAllByTestId('gallery-thumb')[0]).not.toHaveAttribute('aria-current');
  });
});

describe('@US2-AS7 lightbox pages through all photos', () => {
  it('opens at the current photo and arrows/keys move, Esc closes', () => {
    const { container } = render(<ArtworkGallery photos={photos(4)} title="Сирень" />);
    fireEvent.click(screen.getAllByTestId('gallery-thumb')[1]);
    fireEvent.click(main(container));
    const box = screen.getByTestId('lightbox');
    expect(box).toHaveAttribute('data-index', '1');
    expect(box).toHaveAttribute('data-slides', '4');
    expect(box).toHaveTextContent('arrows');
    fireEvent.keyDown(box, { key: 'ArrowRight' });
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '2');
    fireEvent.keyDown(screen.getByTestId('lightbox'), { key: 'ArrowLeft' });
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '1');
    fireEvent.keyDown(screen.getByTestId('lightbox'), { key: 'Escape' });
    expect(screen.queryByTestId('lightbox')).toBeNull();
  });
});

describe('@US2-AS8 mobile swipe carousel with dots', () => {
  it('uses scroll-snap, shows dots following scroll, thumbnails hidden on mobile', () => {
    render(<ArtworkGallery photos={photos(4)} title="Сирень" />);
    const track = screen.getByTestId('gallery-track');
    expect(track.className).toContain('snap-x');
    expect(screen.getByTestId('gallery-thumbs').className).toMatch(/\bhidden\b/);
    const dots = screen.getAllByTestId('gallery-dot');
    expect(dots).toHaveLength(4);
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
    track.scrollLeft = 600;
    fireEvent.scroll(track);
    expect(screen.getAllByTestId('gallery-dot')[2]).toHaveAttribute('aria-current', 'true');
  });
});

describe('@US2-AS9 single photo keeps the old page', () => {
  it('has no thumbs, dots or arrows and still opens the lightbox', () => {
    const { container } = render(<ArtworkGallery photos={photos(1)} title="Сирень" />);
    expect(screen.queryByTestId('gallery-thumbs')).toBeNull();
    expect(screen.queryByTestId('gallery-dot')).toBeNull();
    fireEvent.click(main(container));
    const box = screen.getByTestId('lightbox');
    expect(box).toHaveAttribute('data-slides', '1');
    expect(box).toHaveTextContent('no-arrows');
  });
});

describe('@US3-AS10 all photos are in server HTML', () => {
  it('renders every photo with numbered alt via renderToString', () => {
    (globalThis as any).TextEncoder ??= NodeTextEncoder;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { renderToString } = require('react-dom/server');
    const html = renderToString(<ArtworkGallery photos={photos(3)} title="Сирень" />);
    for (const n of [1, 2, 3]) expect(html).toContain(`alt="Сирень — фото ${n}"`);
    expect(html.match(/alt="Сирень — фото \d"/g)).toHaveLength(3);
  });
});

describe('@US3-FR13 loading priority and single-photo alt', () => {
  it('first photo eager+high priority, rest lazy', () => {
    render(<ArtworkGallery photos={photos(3)} title="Сирень" />);
    const imgs = within(screen.getByTestId('gallery-track')).getAllByRole('img');
    expect(imgs[0]).toHaveAttribute('loading', 'eager');
    expect(imgs[0]).toHaveAttribute('fetchpriority', 'high');
    expect(imgs[1]).toHaveAttribute('loading', 'lazy');
    expect(imgs[2]).toHaveAttribute('loading', 'lazy');
  });
  it('single photo alt equals the title', () => {
    render(<ArtworkGallery photos={photos(1)} title="Сирень" />);
    expect(screen.getByRole('img', { name: 'Сирень' })).toBeInTheDocument();
  });
});
