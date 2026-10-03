import { render, screen } from '@testing-library/react';
import MuseumLabel from './MuseumLabel';

const base: any = {
  id: 1, title: 'Закат', technique: 'масло', support: 'холст',
  widthCm: 80, heightCm: 70, year: 2026, price: 45000, status: 'Available',
};
const texts = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('[data-label-line]')).map((n) => (n.textContent ?? '').replace(/\s/g, ' '));

describe('@US3-AS1 label line order', () => {
  it('renders title, medium, size, year, price in order', () => {
    const { container } = render(<MuseumLabel artwork={base} />);
    expect(texts(container)).toEqual(['«Закат»', 'масло, холст', '80 × 70 см', '2026', '45 000 ₽']);
  });
});

describe('@US3-AS2 empty lines omitted', () => {
  it('skips technique, support and year', () => {
    const { container } = render(
      <MuseumLabel artwork={{ ...base, technique: '', support: null, year: null }} />
    );
    expect(texts(container)).toEqual(['«Закат»', '80 × 70 см', '45 000 ₽']);
    expect(container.textContent).not.toMatch(/,\s*$|^,|·|\|/);
  });
  it('keeps one medium part without a comma', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, support: '' }} />);
    expect(texts(container)[1]).toBe('масло');
  });
});

describe('@US3-AS3 sold shows status in ochre', () => {
  it('shows Продана with ochre class and no price', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, status: 'Sold' }} />);
    const last = screen.getByText('Продана');
    expect(last.className).toContain('text-ochre-700');
    expect(container.textContent).not.toMatch(/45.000/);
  });
});

describe('@US3-AS4 price on request', () => {
  it('shows цена по запросу for zero price', () => {
    render(<MuseumLabel artwork={{ ...base, price: 0 }} />);
    expect(screen.getByText('цена по запросу')).toBeInTheDocument();
  });
});

describe('@US3-EC2 long title wraps', () => {
  it('title has break-words', () => {
    const title = 'Очень длинное название '.repeat(4).slice(0, 80);
    render(<MuseumLabel artwork={{ ...base, title }} />);
    expect(screen.getByText(`«${title.trim()}»`).className).toContain('break-words');
  });
});

describe('@US3-EC3 exhibition photo', () => {
  it('shows only title and year', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, year: 2024 }} exhibition />);
    expect(texts(container)).toEqual(['«Закат»', '2024']);
  });
});

describe('@US3-FE4 title quotes', () => {
  it('collapses straight quotes into guillemets, serif italic', () => {
    render(<MuseumLabel artwork={{ ...base, title: '"Закат"' }} />);
    const el = screen.getByText('«Закат»');
    expect(el.className).toContain('font-serif');
    expect(el.className).toContain('italic');
    expect(el.textContent).not.toContain('"');
  });
  it('honors the as prop', () => {
    render(<MuseumLabel artwork={base} as="h3" />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('«Закат»');
  });
});

describe('@US3-FE5 single h1', () => {
  it('as=h1 renders the only title, not duplicated', () => {
    const { container } = render(<MuseumLabel artwork={base} as="h1" size="md" />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getAllByText('«Закат»')).toHaveLength(1);
  });
});

describe('@US1-AS3 price in ochre', () => {
  it('price has text-ochre-700', () => {
    render(<MuseumLabel artwork={base} />);
    expect(screen.getByText(/45.000.₽/).className).toContain('text-ochre-700');
  });
});

describe('MuseumLabel boundary: year edge cases', () => {
  it('does not render year when year is 0', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, year: 0 }} />);
    expect(texts(container)).not.toContain('0');
  });
  it('does not render year line when year is null', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, year: null }} />);
    expect(texts(container)).toEqual(['«Закат»', 'масло, холст', '80 × 70 см', '45 000 ₽']);
  });
  it('does not render year line when year is undefined', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, year: undefined }} />);
    expect(texts(container)).toEqual(['«Закат»', 'масло, холст', '80 × 70 см', '45 000 ₽']);
  });
  it('renders year as single line when only year and title present', () => {
    const { container } = render(
      <MuseumLabel artwork={{ ...base, technique: '', support: '', widthCm: null, heightCm: null, price: 0 }} />
    );
    expect(texts(container)).toEqual(['«Закат»', '2026', 'цена по запросу']);
  });
});

describe('MuseumLabel boundary: price edge cases', () => {
  it('shows цена по запросу when price is null', () => {
    render(<MuseumLabel artwork={{ ...base, price: null }} />);
    expect(screen.getByText('цена по запросу')).toBeInTheDocument();
  });
  it('shows цена по запросу when price is undefined', () => {
    render(<MuseumLabel artwork={{ ...base, price: undefined }} />);
    expect(screen.getByText('цена по запросу')).toBeInTheDocument();
  });
  it('formats large prices with proper spacing', () => {
    render(<MuseumLabel artwork={{ ...base, price: 1234567 }} />);
    expect(screen.getByText('1 234 567 ₽')).toBeInTheDocument();
  });
  it('price border-t is rendered only when priceOrStatus exists', () => {
    const { container: c1 } = render(<MuseumLabel artwork={base} />);
    const borderLine = c1.querySelector('.border-t');
    expect(borderLine).toBeInTheDocument();

    const { container: c2 } = render(
      <MuseumLabel artwork={{ ...base, price: 0, status: 'Sold' }} exhibition />
    );
    expect(c2.querySelector('.border-t')).not.toBeInTheDocument();
  });
});

describe('MuseumLabel boundary: status edge cases', () => {
  it('shows Продана for Sold status', () => {
    render(<MuseumLabel artwork={{ ...base, status: 'Sold' }} />);
    expect(screen.getByText('Продана')).toBeInTheDocument();
  });
  it('shows В частной коллекции for PrivateCollection status', () => {
    render(<MuseumLabel artwork={{ ...base, status: 'PrivateCollection' }} />);
    expect(screen.getByText('В частной коллекции')).toBeInTheDocument();
  });
  it('shows Не продаётся for NotForSale status', () => {
    render(<MuseumLabel artwork={{ ...base, status: 'NotForSale' }} />);
    expect(screen.getByText('Не продаётся')).toBeInTheDocument();
  });
  it('does not show price when status is Sold', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, status: 'Sold', price: 45000 }} />);
    expect(container.textContent).not.toMatch(/45.000/);
  });
  it('does not show price when status is PrivateCollection', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, status: 'PrivateCollection', price: 45000 }} />);
    expect(container.textContent).not.toMatch(/45.000/);
  });
  it('status text is ochre-700', () => {
    render(<MuseumLabel artwork={{ ...base, status: 'Sold' }} />);
    expect(screen.getByText('Продана').className).toContain('text-ochre-700');
  });
});

describe('MuseumLabel boundary: dimensions edge cases', () => {
  it('does not render size line when widthCm is missing', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, widthCm: null }} />);
    expect(container.textContent).not.toContain('×');
  });
  it('does not render size line when heightCm is missing', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, heightCm: null }} />);
    expect(container.textContent).not.toContain('×');
  });
  it('does not render size line when both missing', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, widthCm: null, heightCm: null }} />);
    expect(container.textContent).not.toContain('×');
  });
  it('renders size correctly with both dimensions present', () => {
    render(<MuseumLabel artwork={{ ...base, widthCm: 100, heightCm: 50 }} />);
    expect(screen.getByText('100 × 50 см')).toBeInTheDocument();
  });
});

describe('MuseumLabel boundary: size prop variants', () => {
  it('size=sm applies smaller text classes', () => {
    const { container } = render(<MuseumLabel artwork={base} size="sm" />);
    const title = screen.getByText('«Закат»');
    expect(title.className).toContain('text-lg');
    expect(title.className).not.toContain('text-3xl');
  });
  it('size=md applies larger text classes', () => {
    const { container } = render(<MuseumLabel artwork={base} size="md" />);
    const title = screen.getByText('«Закат»');
    expect(title.className).toContain('text-3xl');
  });
  it('price styling differs by size', () => {
    const { container: c1 } = render(<MuseumLabel artwork={base} size="sm" />);
    const price1 = c1.querySelector('.text-sm.text-ochre-700');

    const { container: c2 } = render(<MuseumLabel artwork={base} size="md" />);
    const price2 = c2.querySelector('.text-xl.text-ochre-700');

    expect(c1.textContent).toMatch(/45\s*000/);
    expect(c2.textContent).toMatch(/45\s*000/);
  });
});

describe('MuseumLabel boundary: title edge cases', () => {
  it('does not render title when title is empty', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, title: '' }} />);
    const titleElement = container.querySelector('p, h1, h2, h3');
    expect(titleElement?.textContent).not.toContain('«');
  });
  it('does not render title when title is null', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, title: null }} />);
    const titleElement = container.querySelector('p, h1, h2, h3');
    expect(titleElement?.textContent).not.toContain('«');
  });
  it('title element varies by as prop: h2', () => {
    render(<MuseumLabel artwork={base} as="h2" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('«Закат»');
  });
  it('title element as p when as=p', () => {
    const { container } = render(<MuseumLabel artwork={base} as="p" />);
    expect(container.querySelector('p')).toHaveTextContent('«Закат»');
  });
});

describe('MuseumLabel boundary: exhibition mode edge cases', () => {
  it('exhibition=true hides medium line', () => {
    const { container: c1 } = render(<MuseumLabel artwork={base} exhibition={false} />);
    expect(texts(c1)).toContain('масло, холст');

    const { container: c2 } = render(<MuseumLabel artwork={base} exhibition={true} />);
    expect(texts(c2)).not.toContain('масло, холст');
  });
  it('exhibition=true hides dimensions', () => {
    const { container: c1 } = render(<MuseumLabel artwork={base} exhibition={false} />);
    expect(texts(c1)).toContain('80 × 70 см');

    const { container: c2 } = render(<MuseumLabel artwork={base} exhibition={true} />);
    expect(texts(c2)).not.toContain('80 × 70 см');
  });
  it('exhibition=true shows year if present', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, year: 2023 }} exhibition={true} />);
    expect(texts(container)).toContain('2023');
  });
  it('exhibition=true hides price line', () => {
    const { container: c1 } = render(<MuseumLabel artwork={base} exhibition={false} />);
    expect(c1.textContent).toMatch(/45\s*000/);

    const { container: c2 } = render(<MuseumLabel artwork={base} exhibition={true} />);
    expect(c2.textContent).not.toMatch(/45\s*000/);
  });
  it('exhibition=true with year=0 renders just title', () => {
    const { container } = render(<MuseumLabel artwork={{ ...base, year: 0 }} exhibition={true} />);
    expect(texts(container)).toEqual(['«Закат»']);
  });
});

describe('MuseumLabel boundary: medium filtering edge cases', () => {
  it('filters out empty strings from technique and support', () => {
    const { container } = render(
      <MuseumLabel artwork={{ ...base, technique: '  ', support: '' }} />
    );
    const lines = texts(container);
    expect(lines).not.toContain(',');
    expect(lines[1]).not.toMatch(/^\s*,\s*$|,\s*$/);
  });
  it('handles whitespace in technique/support correctly', () => {
    const { container } = render(
      <MuseumLabel artwork={{ ...base, technique: '  масло  ', support: '  холст  ' }} />
    );
    const lines = texts(container);
    expect(lines[1]).toBe('масло, холст');
  });
  it('renders only technique when support is empty', () => {
    const { container } = render(
      <MuseumLabel artwork={{ ...base, technique: 'акварель', support: '' }} />
    );
    expect(texts(container)[1]).toBe('акварель');
  });
  it('renders only support when technique is empty', () => {
    const { container } = render(
      <MuseumLabel artwork={{ ...base, technique: '', support: 'папір' }} />
    );
    expect(texts(container)[1]).toBe('папір');
  });
});

describe('MuseumLabel boundary: css class integrity', () => {
  it('all label lines have data-label-line attribute', () => {
    const { container } = render(<MuseumLabel artwork={base} />);
    const lines = container.querySelectorAll('[data-label-line]');
    expect(lines.length).toBeGreaterThan(0);
    Array.from(lines).forEach(line => {
      expect(line.hasAttribute('data-label-line')).toBe(true);
    });
  });
  it('title has font-serif and italic classes', () => {
    const { container } = render(<MuseumLabel artwork={base} />);
    const title = screen.getByText('«Закат»');
    expect(title.className).toContain('font-serif');
    expect(title.className).toContain('italic');
  });
  it('title has break-words class regardless of length', () => {
    render(<MuseumLabel artwork={{ ...base, title: 'Короткое' }} />);
    expect(screen.getByText('«Короткое»').className).toContain('break-words');
  });
  it('price line has mt-2, border-t, pt-2, font-medium classes', () => {
    const { container } = render(<MuseumLabel artwork={base} />);
    const priceLine = container.querySelector('.text-ochre-700');
    expect(priceLine?.className).toContain('mt-2');
    expect(priceLine?.className).toContain('border-t');
    expect(priceLine?.className).toContain('pt-2');
    expect(priceLine?.className).toContain('font-medium');
  });
});
