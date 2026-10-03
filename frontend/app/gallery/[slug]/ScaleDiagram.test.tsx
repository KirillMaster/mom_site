import { render, screen } from '@testing-library/react';
import ScaleDiagram from './ScaleDiagram';

const num = (id: string, attr: string) => Number(screen.getByTestId(id).getAttribute(attr));

describe('@US4-AS1 scale diagram is proportional to the size', () => {
  it('80 x 60 is 40% / 30% of the 200 cm sofa with caption', () => {
    render(<ScaleDiagram widthCm={80} heightCm={60} />);
    const sofa = num('scale-sofa', 'width');
    expect(num('scale-artwork', 'width') / sofa).toBeCloseTo(0.4);
    expect(num('scale-artwork', 'height') / sofa).toBeCloseTo(0.3);
    expect(screen.getByTestId('scale-caption')).toHaveTextContent('80 × 60 см');
  });

  it('@US2-AS2 small artwork 20 x 15 scales correctly', () => {
    render(<ScaleDiagram widthCm={20} heightCm={15} />);
    const sofa = num('scale-sofa', 'width');
    expect(num('scale-artwork', 'width') / sofa).toBeCloseTo(0.1);
    expect(num('scale-artwork', 'height') / sofa).toBeCloseTo(0.075);
  });

  it('@US2-FE1 square artwork 60 x 60 maintains aspect ratio', () => {
    render(<ScaleDiagram widthCm={60} heightCm={60} />);
    const w = num('scale-artwork', 'width');
    const h = num('scale-artwork', 'height');
    expect(w).toBe(h);
  });
});

describe('@US4-EC2 a very large artwork stays inside the SVG', () => {
  it('400 x 100 is clamped to the 300 cm area', () => {
    render(<ScaleDiagram widthCm={400} heightCm={100} />);
    const viewW = Number(screen.getByRole('img').getAttribute('viewBox')!.split(' ')[2]);
    const x = num('scale-artwork', 'x');
    const w = num('scale-artwork', 'width');
    expect(w).toBe(300);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(viewW);
    expect(screen.getByTestId('scale-caption')).toHaveTextContent('400 × 100 см');
  });

  it('@US6-AS3 very large height is clamped to sofa top', () => {
    render(<ScaleDiagram widthCm={100} heightCm={300} />);
    const h = num('scale-artwork', 'height');
    expect(h).toBeLessThanOrEqual(215); // SOFA_TOP - 10
  });

  it('@US6-EC2 extremely large artwork is fully constrained', () => {
    render(<ScaleDiagram widthCm={1000} heightCm={1000} />);
    const img = screen.getByRole('img');
    const viewBox = img.getAttribute('viewBox')!.split(' ').map(Number);
    const x = num('scale-artwork', 'x');
    const y = num('scale-artwork', 'y');
    const w = num('scale-artwork', 'width');
    const h = num('scale-artwork', 'height');
    expect(x + w).toBeLessThanOrEqual(viewBox[2]);
    expect(y + h).toBeLessThanOrEqual(viewBox[3]);
  });
});

describe('@US4-EC1 invalid sizes render nothing', () => {
  it.each([[80, null], [null, 60], [0, 60], [60, 0], [-5, 60], [60, -10], [NaN, 60], [60, NaN]])('%p x %p', (w, h) => {
    const { container } = render(<ScaleDiagram widthCm={w} heightCm={h} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('@US2-AS2 Infinity is treated as invalid', () => {
    const { container } = render(<ScaleDiagram widthCm={Infinity} heightCm={60} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('@US2-FE1 -Infinity is treated as invalid', () => {
    const { container } = render(<ScaleDiagram widthCm={60} heightCm={-Infinity} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('@US6-AS3 very small positive values render diagram', () => {
    render(<ScaleDiagram widthCm={0.1} heightCm={0.1} />);
    expect(screen.getByTestId('scale-diagram')).toBeInTheDocument();
    expect(screen.getByTestId('scale-artwork')).toBeInTheDocument();
  });
});

describe('@US4-AS1 caption and diagram labels are correct', () => {
  it('renders caption with width and height', () => {
    render(<ScaleDiagram widthCm={150} heightCm={120} />);
    expect(screen.getByTestId('scale-caption')).toHaveTextContent('150 × 120 см');
  });

  it('renders diagram with proper role and label', () => {
    render(<ScaleDiagram widthCm={100} heightCm={80} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('aria-label', expect.stringContaining('200 см'));
  });

  it('renders figure element with diagram', () => {
    render(<ScaleDiagram widthCm={100} heightCm={80} />);
    expect(screen.getByTestId('scale-diagram')).toHaveProperty('tagName', 'FIGURE');
  });
});
