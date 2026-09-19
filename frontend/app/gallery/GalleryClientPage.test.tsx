import { render, screen, fireEvent } from '@testing-library/react';
import GalleryClientPage from './GalleryClientPage';
import { reachGoal, Goals } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ContactClick: 'contact_click', ArtworkView: 'artwork_view' },
}));

jest.mock('yet-another-react-lightbox', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('yet-another-react-lightbox/styles.css', () => ({}), { virtual: true });

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

// framer-motion swallows its own animation props; forwarding them to a plain div
// would make React warn about unknown DOM attributes and drown the output.
function stripMotionProps(props: Record<string, unknown>) {
  const { initial, animate, exit, transition, variants, whileHover, whileTap, layout, ...rest } = props;
  return rest;
}

const artwork = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  title: 'Осенний сад',
  description: 'Холст, масло',
  imagePath: 'a.jpg',
  thumbnailPath: 'a-thumb.jpg',
  isForSale: true,
  price: null,
  categoryId: 1,
  category: { id: 1, name: 'Пейзаж' },
  ...overrides,
});

const galleryData = (artworks: unknown[]) =>
  ({
    artworks,
    categories: [
      { id: 1, name: 'Пейзаж' },
      { id: 4, name: 'Фото с выставок' },
    ],
  } as any);

const exhibitionPhoto = (overrides: Record<string, unknown> = {}) => ({
  id: 9,
  title: 'Открытие выставки',
  description: 'Фотоотчёт',
  imagePath: 'b.jpg',
  thumbnailPath: 'b-thumb.jpg',
  isForSale: true,
  price: null,
  categoryId: 4,
  category: { id: 4, name: 'Фото с выставок' },
  ...overrides,
});

describe('GalleryClientPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('invites the visitor to ask for the price of a painting that is for sale', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    const link = screen.getByRole('link', { name: 'Узнать цену' });
    expect(link).toHaveAttribute(
      'href',
      `/contacts?artwork=${encodeURIComponent('Осенний сад')}&id=7`
    );
  });

  it('says nothing about the price when none is set', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    expect(screen.queryByText(/договорн/i)).not.toBeInTheDocument();
  });

  it('shows the price when the painting has one', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork({ price: 45000 })])} />);

    expect(screen.getByText(/45\s?000/)).toBeInTheDocument();
  });

  it('offers nothing to ask about when the painting is not for sale', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork({ isForSale: false })])} />);

    expect(screen.queryByRole('link', { name: 'Узнать цену' })).not.toBeInTheDocument();
  });

  it('reports which painting the visitor asked about', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    fireEvent.click(screen.getByRole('link', { name: 'Узнать цену' }));

    expect(reachGoal).toHaveBeenCalledWith(Goals.ContactClick, {
      channel: 'ask_price',
      artwork: 'Осенний сад',
    });
  });

  it('shows the whole painting in a square frame whatever the canvas ratio', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    const image = screen.getByAltText('Осенний сад');

    expect(image.parentElement).toHaveClass('aspect-square');
    // A fixed height plus object-cover cropped tall canvases to a strip.
    expect(image).toHaveClass('h-full', 'object-contain');
  });

  it('hides exhibition photos from the all-works view but keeps paintings visible', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork(), exhibitionPhoto()])} />);

    expect(screen.getByText('Осенний сад')).toBeInTheDocument();
    expect(screen.queryByText('Открытие выставки')).not.toBeInTheDocument();
  });

  it('@S2-AS1 links each gallery card straight to the artwork page', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    const link = screen.getByRole('link', { name: 'Осенний сад' });
    expect(link).toHaveAttribute('href', '/gallery/osenniy-sad-7');
  });

  it('shows exhibition photos without an ask-price button when that category is selected', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork(), exhibitionPhoto()])} />);

    fireEvent.click(screen.getByRole('button', { name: 'Фото с выставок' }));

    expect(screen.getByText('Открытие выставки')).toBeInTheDocument();
    expect(screen.queryByText('Осенний сад')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Узнать цену' })).not.toBeInTheDocument();
  });

  it('keeps the card to the title alone and leaves the description to the artwork page', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    expect(screen.getByText('Осенний сад')).toBeInTheDocument();
    expect(screen.queryByText('Холст, масло')).not.toBeInTheDocument();
  });

  it('sends the visitor to the slug page for the full description', () => {
    render(<GalleryClientPage galleryData={galleryData([artwork()])} />);

    expect(screen.getByRole('link', { name: /Перейти к описанию/ })).toHaveAttribute(
      'href',
      '/gallery/osenniy-sad-7'
    );
  });
});
