import { render, screen } from '@testing-library/react';
import ArtworkSpecs from './ArtworkSpecs';

describe('@US1-AS1 all five specs are shown', () => {
  it('renders size, technique, support, year and status', () => {
    const { container } = render(
      <ArtworkSpecs
        artwork={{
          widthCm: 80,
          heightCm: 70,
          technique: 'масло',
          support: 'холст на подрамнике',
          year: 2026,
          status: 'Available',
        }}
      />
    );
    expect(container.querySelector('dl')).not.toBeNull();
    expect(screen.getByText('80 × 70 см')).toBeInTheDocument();
    expect(screen.getByText('масло')).toBeInTheDocument();
    expect(screen.getByText('холст на подрамнике')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('В наличии')).toBeInTheDocument();
  });
});

describe('@US1-AS2 empty specs are not rendered', () => {
  it('shows only size and status, no placeholders', () => {
    const { container } = render(
      <ArtworkSpecs artwork={{ widthCm: 80, heightCm: 70, status: 'Available' }} />
    );
    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(screen.getByText('Размер')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.queryByText('Техника')).not.toBeInTheDocument();
    expect(screen.queryByText('Год')).not.toBeInTheDocument();
    expect(container.textContent).not.toContain('—');
  });

  it('hides size when only width is set', () => {
    render(<ArtworkSpecs artwork={{ widthCm: 80, status: 'Available' }} />);
    expect(screen.queryByText('Размер')).not.toBeInTheDocument();
  });
});

describe('@US1-AS3 status label for a sold work', () => {
  it('shows "Продана"', () => {
    render(<ArtworkSpecs artwork={{ status: 'Sold' }} />);
    expect(screen.getByText('Продана')).toBeInTheDocument();
  });
});

describe('@US1-EC1 only status is filled', () => {
  it('shows only the status row', () => {
    const { container } = render(<ArtworkSpecs artwork={{ status: 'Available' }} />);
    expect(container.querySelectorAll('dt')).toHaveLength(1);
    expect(screen.getByText('В наличии')).toBeInTheDocument();
  });

  it('falls back to isForSale for legacy payloads', () => {
    render(<ArtworkSpecs artwork={{ isForSale: false }} />);
    expect(screen.getByText('Не продаётся')).toBeInTheDocument();
  });
});
