import { render, screen } from '@testing-library/react';
import VideosClientPage from './VideosClientPage';

jest.mock('next/navigation', () => ({
  usePathname: () => '/videos',
}));

jest.mock('react-player', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => {
        const Component = ({ children, ...rest }: any) => <div {...stripMotionProps(rest)}>{children}</div>;
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function stripMotionProps(props: Record<string, unknown>) {
  const { initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, viewport, layout, ...rest } =
    props;
  return rest;
}

const videosData = {
  videos: [
    {
      id: 1,
      title: 'В мастерской',
      description: 'Как рождается картина',
      videoPath: 'v.mp4',
      thumbnailPath: 'v.jpg',
      videoCategoryId: 1,
    },
  ],
  categories: [{ id: 1, name: 'Процесс', description: 'Съёмки в мастерской' }],
} as any;

describe('VideosClientPage', () => {
  it('keeps every thumbnail in a square frame whatever the source ratio', () => {
    render(<VideosClientPage videosData={videosData} />);

    const thumbnail = screen.getByAltText('В мастерской');

    expect(thumbnail.parentElement).toHaveClass('aspect-square');
    // A fixed height inside the square would squash portrait thumbnails again.
    expect(thumbnail).toHaveClass('h-full', 'object-cover');
  });
});
