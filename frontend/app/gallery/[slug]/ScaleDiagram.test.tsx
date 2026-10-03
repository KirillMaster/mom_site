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
});

describe('@US4-EC1 invalid sizes render nothing', () => {
  it.each([[80, null], [null, 60], [0, 60], [-5, 60], [NaN, 60]])('%p x %p', (w, h) => {
    const { container } = render(<ScaleDiagram widthCm={w} heightCm={h} />);
    expect(container).toBeEmptyDOMElement();
  });
});
