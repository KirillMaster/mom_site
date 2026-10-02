import { render, screen } from '@testing-library/react';
import GalleryClientPage from '@/app/gallery/GalleryClientPage';

jest.mock('@/lib/analytics', () => ({ reachGoal: jest.fn(), Goals: { ContactClick: 'c', ArtworkView: 'a' } }));
jest.mock('yet-another-react-lightbox', () => ({ __esModule: true, default: () => null }));
jest.mock('yet-another-react-lightbox/plugins/zoom', () => ({ __esModule: true, default: {} }));
jest.mock('yet-another-react-lightbox/styles.css', () => ({}), { virtual: true });
jest.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => ({ children, className }: any) => <div className={className}>{children}</div> }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const img = (id: number, o: number) => ({ id: id * 10 + o, imagePath: `f${id}.jpg`, thumbnailPath: `t${id}.jpg`, sortOrder: o });
const art = (id: number, title: string, n: number) => ({
  id,
  title,
  isForSale: false,
  categoryId: 1,
  imagePath: `f${id}.jpg`,
  thumbnailPath: `t${id}.jpg`,
  images: Array.from({ length: n }, (_, i) => img(id, i)),
});

describe('@US4-AS11 photo-count badge in the grid', () => {
  it('shows badge 3 on multi-photo card, none on single, both with cover', () => {
    render(
      <GalleryClientPage
        galleryData={{ artworks: [art(1, 'Сирень', 3), art(2, 'Роза', 1)], categories: [{ id: 1, name: 'К' }] } as any}
      />
    );
    const badges = screen.getAllByTestId('photo-count-badge');
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent('3');
    expect(screen.getByAltText('Сирень')).toHaveAttribute('src', expect.stringContaining('t1.jpg'));
    expect(screen.getByAltText('Роза')).toHaveAttribute('src', expect.stringContaining('t2.jpg'));
  });
});
