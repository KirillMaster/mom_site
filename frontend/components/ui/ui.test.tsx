import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { Button, Card, Section, Container, Input, Textarea } from '@/components/ui';

describe('@US4-FE1 Button', () => {
  it('variants map to classes with focus ring', () => {
    const { rerender } = render(<Button variant="primary">A</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-sea', 'focus-visible:ring-sea');
    rerender(<Button variant="secondary">A</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-sea', 'focus-visible:ring-sea');
    rerender(<Button variant="ghost">A</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-sea', 'focus-visible:ring-sea');
  });
  it('renders link with href and button otherwise', () => {
    const { rerender } = render(<Button href="/gallery">Go</Button>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/gallery');
    rerender(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
  it('forwards onClick, disabled, aria and className', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick} aria-label="x" className="extra">A</Button>);
    const b = screen.getByLabelText('x');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalled();
    expect(b.className.endsWith('extra')).toBe(true);
    render(<Button disabled>D</Button>);
    expect(screen.getByText('D')).toBeDisabled();
  });
});

describe('@US4-FE2 Input and Textarea', () => {
  it('links label and error', () => {
    render(<Input label="Имя" error="Обязательное поле" name="n" />);
    const f = screen.getByLabelText('Имя');
    expect(f).toHaveAttribute('aria-invalid', 'true');
    const err = screen.getByText('Обязательное поле');
    expect(err).toHaveAttribute('role', 'alert');
    expect(f.getAttribute('aria-describedby')).toContain(err.id);
  });
  it('has no aria-invalid without error; forwards props and ref', () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = jest.fn();
    render(<Input label="Имя" name="n" value="a" onChange={onChange} required ref={ref} hint="подсказка" />);
    const f = screen.getByLabelText(/Имя/);
    expect(f).not.toHaveAttribute('aria-invalid');
    expect(f).toHaveAttribute('name', 'n');
    expect(f).toBeRequired();
    expect(ref.current).toBe(f);
    expect(f.getAttribute('aria-describedby')).toBe(screen.getByText('подсказка').id);
    fireEvent.change(f, { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalled();
  });
  it('Textarea behaves the same', () => {
    const onChange = jest.fn();
    render(<Textarea label="Сообщение" error="Ошибка" name="m" value="" onChange={onChange} />);
    const f = screen.getByLabelText('Сообщение');
    expect(f.tagName).toBe('TEXTAREA');
    expect(f).toHaveAttribute('aria-invalid', 'true');
    expect(f.getAttribute('aria-describedby')).toBe(screen.getByText('Ошибка').id);
    fireEvent.change(f, { target: { value: 'x' } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe('@US4-FE3 Card Section Container', () => {
  it('apply unified classes', () => {
    render(<><Card data-testid="c">c</Card><Section data-testid="s">s</Section><Container data-testid="k">k</Container></>);
    expect(screen.getByTestId('c')).toHaveClass('bg-paper-50', 'border-line');
    expect(screen.getByTestId('c')).not.toHaveClass('shadow-lg');
    expect(screen.getByTestId('s')).toHaveClass('py-16', 'md:py-24');
    expect(screen.getByTestId('k')).toHaveClass('max-w-6xl', 'px-4');
  });
});
