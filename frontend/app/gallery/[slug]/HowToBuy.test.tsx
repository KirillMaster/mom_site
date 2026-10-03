import { render, screen } from '@testing-library/react';
import HowToBuy from './HowToBuy';

describe('@US3-EC1 paragraphs split by a blank line, markup shown as plain text', () => {
  it('renders two paragraphs and escapes html', () => {
    const { container } = render(<HowToBuy text={'Первый\n\n<b>Второй</b>'} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[1].textContent).toBe('<b>Второй</b>');
    expect(container.querySelector('b')).toBeNull();
  });
});

describe('@US3-AS1 empty text shows defaults', () => {
  it('treats whitespace-only text as empty', () => {
    render(<HowToBuy text={'  \n\n '} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
});
