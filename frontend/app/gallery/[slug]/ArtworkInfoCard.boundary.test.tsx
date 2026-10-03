import { render, screen } from '@testing-library/react';
import ArtworkInfoCard from './ArtworkInfoCard';
import type { ArtworkDto, GalleryData } from '@/lib/api';

jest.mock('@/lib/gallery', () => ({
  isExhibitionPhoto: (artwork: ArtworkDto, categories: any[]) =>
    artwork.categoryId === 999
}));
jest.mock('@/lib/artworkStatus', () => ({
  resolveStatus: (artwork: ArtworkDto) => artwork.status,
  statusLabel: (status: string) => {
    const labels: Record<string, string> = {
      Sold: 'Продана',
      PrivateCollection: 'В частной коллекции',
      NotForSale: 'Не продаётся'
    };
    return labels[status] || 'Available';
  }
}));
jest.mock('@/components/artwork/MuseumLabel', () =>
  function DummyMuseumLabel({ artwork, exhibition }: any) {
    return <div data-testid="museum-label">{artwork.title} (exhibition={String(exhibition)})</div>;
  }
);
jest.mock('./AskPriceButton', () =>
  function DummyAskPriceButton({ title, variant }: any) {
    return <div data-testid="ask-price">{title} ({variant})</div>;
  }
);
jest.mock('./ContactChannels', () =>
  function DummyContactChannels({ channels }: any) {
    return <div data-testid="contact-channels">{channels?.length || 0} channels</div>;
  }
);

const artwork = (overrides?: Partial<ArtworkDto>): ArtworkDto => ({
  id: 1,
  title: 'Закат',
  status: 'Available',
  isForSale: true,
  categoryId: 1,
  widthCm: 80,
  heightCm: 70,
  price: 45000,
  ...overrides,
} as ArtworkDto);

const categories: GalleryData['categories'] = [
  { id: 1, name: 'Пейзаж' },
  { id: 999, name: 'Выставка' }
];

describe('ArtworkInfoCard boundary: exhibition vs available', () => {
  it('shows museum label with exhibition=false for available artwork', () => {
    render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    expect(screen.getByTestId('museum-label')).toHaveTextContent('exhibition=false');
  });

  it('shows museum label with exhibition=true for exhibition artwork', () => {
    render(<ArtworkInfoCard artwork={artwork({ categoryId: 999 })} categories={categories} />);
    expect(screen.getByTestId('museum-label')).toHaveTextContent('exhibition=true');
  });

  it('shows ask price button for available artwork', () => {
    render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    expect(screen.getByTestId('ask-price')).toHaveTextContent('(price)');
  });

  it('shows similar works button for unavailable artwork', () => {
    render(<ArtworkInfoCard artwork={artwork({ status: 'Sold' })} categories={categories} />);
    expect(screen.getByTestId('ask-price')).toHaveTextContent('(similar)');
  });
});

describe('ArtworkInfoCard boundary: exhibition mode hides pricing UI', () => {
  it('hides ask price button for exhibition artwork', () => {
    render(<ArtworkInfoCard artwork={artwork({ categoryId: 999 })} categories={categories} />);
    expect(screen.queryByTestId('ask-price')).not.toBeInTheDocument();
  });

  it('hides contact channels for exhibition artwork', () => {
    render(<ArtworkInfoCard artwork={artwork({ categoryId: 999 })} categories={categories} />);
    expect(screen.queryByTestId('contact-channels')).not.toBeInTheDocument();
  });

  it('shows ask price button for non-exhibition artwork even when Sold', () => {
    render(<ArtworkInfoCard artwork={artwork({ status: 'Sold' })} categories={categories} />);
    expect(screen.getByTestId('ask-price')).toBeInTheDocument();
  });
});

describe('ArtworkInfoCard boundary: category display', () => {
  it('shows category name when provided', () => {
    render(<ArtworkInfoCard artwork={artwork()} categoryName="Портреты" categories={categories} />);
    expect(screen.getByText('Портреты')).toBeInTheDocument();
  });

  it('does not render category section when categoryName is undefined', () => {
    const { container } = render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    const categoryElement = container.querySelector('.uppercase.tracking-wide');
    expect(categoryElement).not.toBeInTheDocument();
  });

  it('does not render category section when categoryName is empty string', () => {
    const { container } = render(<ArtworkInfoCard artwork={artwork()} categoryName="" categories={categories} />);
    const categoryElement = container.querySelector('.uppercase.tracking-wide');
    expect(categoryElement).not.toBeInTheDocument();
  });
});

describe('ArtworkInfoCard boundary: descriptions', () => {
  it('shows short description when provided', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork({ shortDescription: 'Короткое описание' })}
        categories={categories}
      />
    );
    expect(screen.getByText('Короткое описание')).toBeInTheDocument();
  });

  it('does not render short description when missing', () => {
    const { container } = render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    expect(screen.queryByText(/Короткое/)).not.toBeInTheDocument();
  });

  it('shows full description when provided', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork({ description: 'Полное описание работы' })}
        categories={categories}
      />
    );
    expect(screen.getByText('Полное описание работы')).toBeInTheDocument();
  });

  it('does not render full description when missing', () => {
    const { container } = render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    const textContent = container.textContent;
    expect(textContent).not.toContain('Полное описание работы');
  });

  it('renders both descriptions when both present', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork({
          shortDescription: 'Краткое',
          description: 'Полное'
        })}
        categories={categories}
      />
    );
    expect(screen.getByText('Краткое')).toBeInTheDocument();
    expect(screen.getByText('Полное')).toBeInTheDocument();
  });
});

describe('ArtworkInfoCard boundary: contact channels', () => {
  it('shows contact channels when provided', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork()}
        categories={categories}
        channels={[{ id: 1, type: 'email' }] as any}
      />
    );
    expect(screen.getByTestId('contact-channels')).toHaveTextContent('1 channels');
  });

  it('defaults to empty channels when not provided', () => {
    render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    expect(screen.getByTestId('contact-channels')).toHaveTextContent('0 channels');
  });

  it('shows multiple channels', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork()}
        categories={categories}
        channels={[
          { id: 1, type: 'email' },
          { id: 2, type: 'phone' }
        ] as any}
      />
    );
    expect(screen.getByTestId('contact-channels')).toHaveTextContent('2 channels');
  });

  it('shows channels for sold artwork (not hidden by status)', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork({ status: 'Sold' })}
        categories={categories}
        channels={[{ id: 1, type: 'email' }] as any}
      />
    );
    expect(screen.getByTestId('contact-channels')).toHaveTextContent('1 channels');
  });
});

describe('ArtworkInfoCard boundary: layout and structure', () => {
  it('renders aside element with sticky positioning', () => {
    const { container } = render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('lg:sticky');
  });

  it('renders back link to gallery', () => {
    render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    const backLink = screen.getByRole('link', { name: /Вернуться в галерею/ });
    expect(backLink.href).toContain('/gallery');
  });

  it('back link has correct styling', () => {
    render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    const backLink = screen.getByRole('link', { name: /Вернуться в галерею/ });
    expect(backLink.className).toContain('text-sea');
    expect(backLink.className).toContain('hover:underline');
  });

  it('renders main card container with border and padding', () => {
    const { container } = render(<ArtworkInfoCard artwork={artwork()} categories={categories} />);
    const card = container.querySelector('.border.bg-paper-50');
    expect(card).toBeInTheDocument();
  });
});

describe('ArtworkInfoCard boundary: conditional UI based on status', () => {
  it('shows pricing UI for Available status', () => {
    render(<ArtworkInfoCard artwork={artwork({ status: 'Available' })} categories={categories} />);
    expect(screen.getByTestId('ask-price')).toBeInTheDocument();
  });

  it('shows pricing UI but with similar variant for Sold status', () => {
    render(<ArtworkInfoCard artwork={artwork({ status: 'Sold' })} categories={categories} />);
    expect(screen.getByTestId('ask-price')).toBeInTheDocument();
    expect(screen.getByTestId('ask-price')).toHaveTextContent('(similar)');
  });

  it('passes correct variant to AskPriceButton for available', () => {
    render(<ArtworkInfoCard artwork={artwork({ status: 'Available' })} categories={categories} />);
    expect(screen.getByTestId('ask-price')).toHaveTextContent('(price)');
  });

  it('passes correct variant to AskPriceButton for unavailable', () => {
    render(<ArtworkInfoCard artwork={artwork({ status: 'PrivateCollection' })} categories={categories} />);
    expect(screen.getByTestId('ask-price')).toHaveTextContent('(similar)');
  });
});

describe('ArtworkInfoCard boundary: edge cases', () => {
  it('handles artwork with null shortDescription', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork({ shortDescription: null })}
        categories={categories}
      />
    );
    expect(screen.queryByTestId('museum-label')).toBeInTheDocument();
  });

  it('handles artwork with empty descriptions', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork({ shortDescription: '', description: '' })}
        categories={categories}
      />
    );
    expect(screen.getByTestId('museum-label')).toBeInTheDocument();
  });

  it('handles categories array being empty', () => {
    render(<ArtworkInfoCard artwork={artwork({ categoryId: 999 })} categories={[]} />);
    expect(screen.getByTestId('museum-label')).toBeInTheDocument();
  });

  it('renders correctly with minimal data', () => {
    render(
      <ArtworkInfoCard
        artwork={artwork()}
        categories={categories}
      />
    );
    expect(screen.getByTestId('museum-label')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Вернуться/ })).toBeInTheDocument();
  });
});
