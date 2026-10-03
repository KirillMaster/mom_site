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

  it('@US2-AS2 three paragraphs separated by double newlines', () => {
    const text = 'Para 1\n\nPara 2\n\nPara 3';
    const { container } = render(<HowToBuy text={text} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0].textContent).toBe('Para 1');
    expect(paragraphs[1].textContent).toBe('Para 2');
    expect(paragraphs[2].textContent).toBe('Para 3');
  });

  it('@US2-FE1 preserves internal line breaks within paragraphs', () => {
    const text = 'Line 1\nLine 2\n\nPara 2';
    const { container } = render(<HowToBuy text={text} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toContain('Line 1');
    expect(paragraphs[0].textContent).toContain('Line 2');
  });

  it('@US6-AS3 single paragraph without blank lines', () => {
    const { container } = render(<HowToBuy text={'Single paragraph text'} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0].textContent).toBe('Single paragraph text');
  });

  it('@US6-EC2 multiple blank lines treated as single paragraph break', () => {
    const text = 'Para 1\n\n\n\nPara 2';
    const { container } = render(<HowToBuy text={text} />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
  });
});

describe('@US3-AS1 empty text shows defaults', () => {
  it('treats whitespace-only text as empty', () => {
    render(<HowToBuy text={'  \n\n '} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('null text shows defaults', () => {
    render(<HowToBuy text={null} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('undefined text shows defaults', () => {
    render(<HowToBuy />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('empty string shows defaults', () => {
    render(<HowToBuy text={''} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('renders correct default text items', () => {
    render(<HowToBuy text={null} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Доставка: СДЭК по России или лично в руки по Крыму');
    expect(items[1]).toHaveTextContent('Оплата: переводом на карту после согласования');
    expect(items[2]).toHaveTextContent('Сертификат подлинности прилагается к каждой работе');
    expect(items[3]).toHaveTextContent('Возврат: 14 дней, если работа не подошла');
  });

  it('has correct heading and region attributes', () => {
    render(<HowToBuy text={null} />);
    expect(screen.getByTestId('how-to-buy')).toHaveAttribute('role', 'region');
    expect(screen.getByTestId('how-to-buy')).toHaveAttribute('aria-labelledby', 'how-to-buy-heading');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Как купить');
  });
});
