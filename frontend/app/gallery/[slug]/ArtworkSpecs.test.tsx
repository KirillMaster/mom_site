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

describe('@US1-EC4 all status values render correct labels', () => {
  it('renders Sold status label', () => {
    render(<ArtworkSpecs artwork={{ status: 'Sold' }} />);
    expect(screen.getByText('Продана')).toBeInTheDocument();
  });

  it('renders PrivateCollection status label', () => {
    render(<ArtworkSpecs artwork={{ status: 'PrivateCollection' }} />);
    expect(screen.getByText('В частной коллекции')).toBeInTheDocument();
  });

  it('renders NotForSale status label', () => {
    render(<ArtworkSpecs artwork={{ status: 'NotForSale' }} />);
    expect(screen.getByText('Не продаётся')).toBeInTheDocument();
  });

  it('renders Unavailable status label', () => {
    render(<ArtworkSpecs artwork={{ status: 'Unavailable' }} />);
    expect(screen.getByText('Недоступна')).toBeInTheDocument();
  });

  it('renders NotMine status label', () => {
    render(<ArtworkSpecs artwork={{ status: 'NotMine' }} />);
    expect(screen.getByText('Не моя работа')).toBeInTheDocument();
  });
});

describe('@US1-EC5 size handling at boundaries', () => {
  it('shows size when both width and height are 1 (minimum valid)', () => {
    render(<ArtworkSpecs artwork={{ widthCm: 1, heightCm: 1, status: 'Available' }} />);
    expect(screen.getByText('1 × 1 см')).toBeInTheDocument();
  });

  it('shows size when both dimensions are at 1000 (maximum valid)', () => {
    render(<ArtworkSpecs artwork={{ widthCm: 1000, heightCm: 1000, status: 'Available' }} />);
    expect(screen.getByText('1000 × 1000 см')).toBeInTheDocument();
  });

  it('hides size when widthCm is 0 (below minimum)', () => {
    const { container } = render(<ArtworkSpecs artwork={{ widthCm: 0, heightCm: 50, status: 'Available' }} />);
    expect(screen.queryByText(/0.*см/)).not.toBeInTheDocument();
  });

  it('hides size when heightCm is 0 (below minimum)', () => {
    const { container } = render(<ArtworkSpecs artwork={{ widthCm: 50, heightCm: 0, status: 'Available' }} />);
    expect(screen.queryByText(/0.*см/)).not.toBeInTheDocument();
  });

  it('hides size when widthCm is undefined but heightCm is set', () => {
    render(<ArtworkSpecs artwork={{ heightCm: 50, status: 'Available' }} />);
    expect(screen.queryByText('Размер')).not.toBeInTheDocument();
  });

  it('hides size when heightCm is undefined but widthCm is set', () => {
    render(<ArtworkSpecs artwork={{ widthCm: 50, status: 'Available' }} />);
    expect(screen.queryByText('Размер')).not.toBeInTheDocument();
  });

  it('hides size when both dimensions are null', () => {
    render(<ArtworkSpecs artwork={{ widthCm: null, heightCm: null, status: 'Available' }} />);
    expect(screen.queryByText('Размер')).not.toBeInTheDocument();
  });
});

describe('@US1-EC6 year boundary values', () => {
  it('renders year at 1950 (assumed minimum)', () => {
    render(<ArtworkSpecs artwork={{ year: 1950, status: 'Available' }} />);
    expect(screen.getByText('1950')).toBeInTheDocument();
  });

  it('renders year at current year', () => {
    const currentYear = new Date().getFullYear();
    render(<ArtworkSpecs artwork={{ year: currentYear, status: 'Available' }} />);
    expect(screen.getByText(currentYear.toString())).toBeInTheDocument();
  });

  it('renders year at far future (2100)', () => {
    render(<ArtworkSpecs artwork={{ year: 2100, status: 'Available' }} />);
    expect(screen.getByText('2100')).toBeInTheDocument();
  });

  it('does not render year 0', () => {
    const { container } = render(<ArtworkSpecs artwork={{ year: 0, status: 'Available' }} />);
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });
});

describe('@US1-EC7 technique and support with whitespace', () => {
  it('hides technique when it is empty string', () => {
    render(<ArtworkSpecs artwork={{ technique: '', status: 'Available' }} />);
    expect(screen.queryByText('Техника')).not.toBeInTheDocument();
  });

  it('hides technique when it is only whitespace', () => {
    render(<ArtworkSpecs artwork={{ technique: '   ', status: 'Available' }} />);
    expect(screen.queryByText('Техника')).not.toBeInTheDocument();
  });

  it('hides support when it is empty string', () => {
    render(<ArtworkSpecs artwork={{ support: '', status: 'Available' }} />);
    expect(screen.queryByText('Основа')).not.toBeInTheDocument();
  });

  it('hides support when it is only whitespace', () => {
    render(<ArtworkSpecs artwork={{ support: '  \t\n  ', status: 'Available' }} />);
    expect(screen.queryByText('Основа')).not.toBeInTheDocument();
  });

  it('shows technique with leading/trailing whitespace trimmed', () => {
    render(<ArtworkSpecs artwork={{ technique: '  масло  ', status: 'Available' }} />);
    expect(screen.getByText('масло')).toBeInTheDocument();
  });

  it('shows support with leading/trailing whitespace trimmed', () => {
    render(<ArtworkSpecs artwork={{ support: '\n холст \n', status: 'Available' }} />);
    expect(screen.getByText('холст')).toBeInTheDocument();
  });
});
