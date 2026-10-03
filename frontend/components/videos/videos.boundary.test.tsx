import { render, screen, fireEvent } from '@testing-library/react';
import CategoriesInfo from './CategoriesInfo';
import VideoModal from './VideoModal';
import VideosClientPage from '@/app/videos/VideosClientPage';

jest.mock('next/navigation', () => ({ usePathname: () => '/videos' }));
jest.mock('@/components/Navigation', () => () => null);
jest.mock('@/components/Footer', () => () => null);
jest.mock('@/hooks/useApi', () => ({ getImageUrl: (p: string) => `https://cdn.test/${p}` }));
const playerProps: any[] = [];
jest.mock('react-player', () => ({
  __esModule: true,
  default: (props: any) => {
    playerProps.push(props);
    return <div data-testid="player" />;
  },
}));

const cats = [
  { id: 1, name: 'Процесс', description: 'Съёмки' },
  { id: 2, name: 'Выставки', description: 'Вернисажи' },
];
const videos = [
  { id: 10, title: 'Первое', description: 'd1', videoPath: 'a.mp4', thumbnailPath: 'a.jpg', videoCategoryId: 1 },
  { id: 11, title: 'Второе', description: 'd2', videoPath: 'b.mp4', thumbnailPath: '', videoCategoryId: 2 },
  { id: 12, title: 'Третье', description: 'd3', videoPath: 'c.mp4', thumbnailPath: 'c.jpg', videoCategoryId: 99 },
];
const data = { videos, categories: cats } as any;

describe('@US1-FE5 videos page filter', () => {
  it('shows every video and marks "Все видео" active by default', () => {
    render(<VideosClientPage videosData={data} />);
    expect(screen.getByAltText('Первое')).toBeInTheDocument();
    expect(screen.getByAltText('Второе')).toBeInTheDocument();
    expect(screen.getByAltText('Третье')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Все видео' })).toHaveClass('bg-sea', 'text-white');
    expect(screen.getByRole('button', { name: 'Процесс' })).not.toHaveClass('bg-sea');
    expect(screen.getByRole('button', { name: 'Процесс' })).toHaveClass('bg-paper-200');
  });

  it('filters by category and moves the active state', () => {
    render(<VideosClientPage videosData={data} />);
    fireEvent.click(screen.getByRole('button', { name: 'Выставки' }));
    expect(screen.queryByAltText('Первое')).not.toBeInTheDocument();
    expect(screen.getByAltText('Второе')).toBeInTheDocument();
    expect(screen.queryByAltText('Третье')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выставки' })).toHaveClass('bg-sea');
    expect(screen.getByRole('button', { name: 'Все видео' })).not.toHaveClass('bg-sea');
    expect(screen.getByRole('button', { name: 'Процесс' })).not.toHaveClass('bg-sea');
  });

  it('returns to all videos on "Все видео"', () => {
    render(<VideosClientPage videosData={data} />);
    fireEvent.click(screen.getByRole('button', { name: 'Процесс' }));
    expect(screen.queryByAltText('Второе')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Все видео' }));
    expect(screen.getByAltText('Второе')).toBeInTheDocument();
    expect(screen.getByAltText('Первое')).toBeInTheDocument();
  });

  it('shows the empty message only when the category has no videos', () => {
    render(<VideosClientPage videosData={{ videos: [videos[0]], categories: cats } as any} />);
    expect(screen.queryByText('В выбранной категории пока нет видео')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Выставки' }));
    expect(screen.getByText('В выбранной категории пока нет видео')).toBeInTheDocument();
  });

  it('shows the empty message for empty or malformed data', () => {
    const { unmount } = render(<VideosClientPage videosData={{ videos: [], categories: [] } as any} />);
    expect(screen.getByText('В выбранной категории пока нет видео')).toBeInTheDocument();
    unmount();
    render(<VideosClientPage videosData={{ videos: null, categories: cats } as any} />);
    expect(screen.getByText('В выбранной категории пока нет видео')).toBeInTheDocument();
  });

  it('uses the placeholder without thumbnail and a fallback label for unknown category', () => {
    render(<VideosClientPage videosData={data} />);
    expect((screen.getByAltText('Второе') as HTMLImageElement).getAttribute('src')).toBe('/images/video-placeholder.jpg');
    expect((screen.getByAltText('Первое') as HTMLImageElement).getAttribute('src')).toBe('https://cdn.test/a.jpg');
    expect(screen.getAllByText('Без категории')).toHaveLength(2);
  });

  it('opens the modal on card click and closes it with the close button', () => {
    render(<VideosClientPage videosData={data} />);
    expect(screen.queryByTestId('player')).not.toBeInTheDocument();
    fireEvent.click(screen.getByAltText('Первое'));
    expect(screen.getByTestId('player')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByTestId('player')).not.toBeInTheDocument();
  });
});

describe('@US1-FE5 VideoModal', () => {
  const video = { ...videos[0], videoCategory: cats[0] };

  it('passes media urls to the player and renders the details', () => {
    playerProps.length = 0;
    render(<VideoModal video={video} onClose={jest.fn()} />);
    const p = playerProps[0];
    expect(p.url).toBe('https://cdn.test/a.mp4');
    expect(p.controls).toBe(true);
    expect(p.playing).toBe(true);
    expect(p.config.file.attributes.playsInline).toBe(true);
    expect(p.config.file.attributes.poster).toBe('https://cdn.test/a.jpg');
    expect(screen.getByText('Первое')).toBeInTheDocument();
    expect(screen.getByText('d1')).toBeInTheDocument();
    expect(screen.getByText('Процесс')).toBeInTheDocument();
  });

  it('closes on backdrop click and close button but not on content click', () => {
    const onClose = jest.fn();
    const { container } = render(<VideoModal video={video} onClose={onClose} />);
    fireEvent.click(screen.getByText('Первое'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(container.firstElementChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('@US1-FE5 CategoriesInfo', () => {
  it('renders one card per category', () => {
    render(<CategoriesInfo categories={cats} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Процесс' })).toBeInTheDocument();
    expect(screen.getByText('Вернисажи')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it.each([undefined, [] as any[], null as any, {} as any])('renders no cards for %p', (c) => {
    render(<CategoriesInfo categories={c} />);
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 2, name: 'Категории видео' })).toBeInTheDocument();
  });
});
