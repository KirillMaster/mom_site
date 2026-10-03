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
