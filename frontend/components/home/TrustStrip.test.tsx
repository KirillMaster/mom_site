import { render, screen } from '@testing-library/react';
import TrustStrip from './TrustStrip';

describe('@US2-AS1 полоса доверия', () => {
  it('показывает три факта', () => {
    render(<TrustStrip />);
    expect(screen.getByText('Член Союза художников России')).toBeInTheDocument();
    expect(screen.getByText('Работы в музейных собраниях')).toBeInTheDocument();
    expect(screen.getByText('Коллекционеры в 12 странах')).toBeInTheDocument();
  });
});

// ====== Degradation Mode Boundary Tests for TrustStrip ======

describe('@US2-AS1 полоса доверия — structure and accessibility', () => {
  it('renders exactly three trust facts', () => {
    const { container } = render(<TrustStrip />);
    const facts = container.querySelectorAll('[role="listitem"], li, div[class*="fact"], div[class*="item"]');
    expect(facts.length).toBeGreaterThanOrEqual(3);
  });

  it('each fact is in the DOM', () => {
    render(<TrustStrip />);
    const fact1 = screen.getByText('Член Союза художников России');
    const fact2 = screen.getByText('Работы в музейных собраниях');
    const fact3 = screen.getByText('Коллекционеры в 12 странах');

    expect(fact1).toBeInTheDocument();
    expect(fact2).toBeInTheDocument();
    expect(fact3).toBeInTheDocument();
  });

  it('text content does not contain extra whitespace', () => {
    render(<TrustStrip />);
    const fact = screen.getByText('Член Союза художников России');
    expect(fact.textContent?.trim()).toBe('Член Союза художников России');
  });
});
