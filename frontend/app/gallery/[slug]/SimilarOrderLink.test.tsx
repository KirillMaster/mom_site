import { render, screen } from '@testing-library/react';
import SimilarOrderLink from './SimilarOrderLink';

describe('@US3-EC1 SimilarOrderLink encodes artwork title in URL', () => {
  it('renders button with href containing encoded title', () => {
    render(<SimilarOrderLink title="Закат над морем" />);
    const link = screen.getByTestId('similar-order-link');
    expect(link).toHaveAttribute('href', '/order?artwork=%D0%97%D0%B0%D0%BA%D0%B0%D1%82%20%D0%BD%D0%B0%D0%B4%20%D0%BC%D0%BE%D1%80%D0%B5%D0%BC');
  });

  it('@US2-AS2 encodes special characters in title', () => {
    render(<SimilarOrderLink title="Работа & Art (2024)" />);
    const link = screen.getByTestId('similar-order-link');
    expect(link).toHaveAttribute('href', expect.stringContaining('%26'));
    // Note: () are not encoded by encodeURIComponent but & is
    expect(link.getAttribute('href')).toContain('(2024)');
  });

  it('@US2-FE1 handles title with spaces and punctuation', () => {
    render(<SimilarOrderLink title="Работа, выполненная в стиле импрессионизма!" />);
    const link = screen.getByTestId('similar-order-link');
    expect(link.getAttribute('href')).toMatch(/\/order\?artwork=/);
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Работа, выполненная в стиле импрессионизма!');
  });

  it('@US6-AS3 simple ASCII title', () => {
    render(<SimilarOrderLink title="Sunset Painting" />);
    const link = screen.getByTestId('similar-order-link');
    expect(link).toHaveAttribute('href', '/order?artwork=Sunset%20Painting');
  });

  it('@US6-EC2 single character title', () => {
    render(<SimilarOrderLink title="А" />);
    const link = screen.getByTestId('similar-order-link');
    expect(link).toHaveAttribute('href', expect.stringContaining('/order?artwork='));
  });
});

describe('@US3-AS1 SimilarOrderLink button appearance', () => {
  it('renders button with correct text', () => {
    render(<SimilarOrderLink title="Test Artwork" />);
    expect(screen.getByRole('link')).toHaveTextContent('Хочу похожую');
  });

  it('renders with secondary variant', () => {
    render(<SimilarOrderLink title="Test Artwork" />);
    const link = screen.getByTestId('similar-order-link');
    expect(link.className).toContain('border');
    expect(link.className).toContain('sea');
  });

  it('has test id attribute', () => {
    render(<SimilarOrderLink title="Artwork" />);
    expect(screen.getByTestId('similar-order-link')).toBeInTheDocument();
  });

  it('renders as Link component (href present)', () => {
    render(<SimilarOrderLink title="Artwork" />);
    const element = screen.getByTestId('similar-order-link');
    expect(element.tagName).toBe('A');
  });
});
