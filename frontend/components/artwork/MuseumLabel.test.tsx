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
