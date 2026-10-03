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
  it('@US4-FE1 disabled button does not trigger onClick', () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    fireEvent.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });
  it('@US4-FE1 primary variant has bg-sea and hover:bg-sea-700', () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('bg-sea');
    expect(btn.className).toContain('hover:bg-sea-700');
  });
  it('@US4-FE1 secondary variant has border-sea and hover:bg-sea-50', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('border-sea');
    expect(btn.className).toContain('hover:bg-sea-50');
  });
  it('@US4-FE1 ghost variant has text-sea and hover:underline', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('text-sea');
    expect(btn.className).toContain('hover:underline');
  });
  it('@US4-FE1 link variant with href renders as <a> with type=button', () => {
    const { rerender } = render(<Button href="/contact">Contact</Button>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/contact');
    expect(link.tagName).toBe('A');
    rerender(<Button href="/">Home</Button>);
    const homeLink = screen.getByRole('link');
    expect(homeLink).toHaveAttribute('href', '/');
  });
  it('@US4-FE1 button without href renders as <button> with type="button"', () => {
    render(<Button type="submit">Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('type', 'submit');
  });
  it('@US4-FE1 button with type="reset" preserves the type', () => {
    render(<Button type="reset">Reset</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
  });
  it('@US4-FE1 aria-label and aria-describedby are forwarded', () => {
    render(<Button aria-label="Delete item" aria-describedby="desc">×</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Delete item');
    expect(btn).toHaveAttribute('aria-describedby', 'desc');
  });
  it('@US4-FE1 disabled state adds opacity-50 and pointer-events-none', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('disabled:opacity-50');
    expect(btn.className).toContain('disabled:pointer-events-none');
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
  it('@US4-FE2 Input without error has undefined aria-invalid', () => {
    render(<Input label="Email" name="e" />);
    const f = screen.getByLabelText('Email');
    expect(f.getAttribute('aria-invalid')).toBeNull();
  });
  it('@US4-FE2 Input with only hint does not have aria-invalid', () => {
    render(<Input label="Username" name="u" hint="Min 3 characters" />);
    const f = screen.getByLabelText('Username');
    expect(f).not.toHaveAttribute('aria-invalid');
    expect(f.getAttribute('aria-describedby')).toContain(screen.getByText('Min 3 characters').id);
  });
  it('@US4-FE2 Input with both error and hint links both in aria-describedby', () => {
    render(<Input label="Password" name="p" error="Too short" hint="Min 8 chars" />);
    const f = screen.getByLabelText('Password');
    const describedBy = f.getAttribute('aria-describedby');
    expect(describedBy).toContain(screen.getByText('Too short').id);
    expect(describedBy).toContain(screen.getByText('Min 8 chars').id);
  });
  it('@US4-FE2 Input forwards placeholder', () => {
    render(<Input label="Search" name="s" placeholder="Enter text..." />);
    const f = screen.getByLabelText('Search');
    expect(f).toHaveAttribute('placeholder', 'Enter text...');
  });
  it('@US4-FE2 Input forwards type="email"', () => {
    render(<Input label="Email" name="e" type="email" />);
    const f = screen.getByLabelText('Email');
    expect(f).toHaveAttribute('type', 'email');
  });
  it('@US4-FE2 Input forwards disabled state', () => {
    render(<Input label="Disabled" name="d" disabled />);
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });
  it('@US4-FE2 Textarea forwards maxLength', () => {
    render(<Textarea label="Message" name="m" maxLength={500} />);
    const f = screen.getByLabelText('Message');
    expect(f).toHaveAttribute('maxlength', '500');
  });
  it('@US4-FE2 Textarea forwards rows and cols', () => {
    render(<Textarea label="Feedback" name="fb" rows={5} cols={40} />);
    const f = screen.getByLabelText('Feedback');
    expect(f).toHaveAttribute('rows', '5');
    expect(f).toHaveAttribute('cols', '40');
  });
  it('@US4-FE2 Textarea with error shows aria-invalid=true', () => {
    render(<Textarea label="Review" name="r" error="Required" />);
    const f = screen.getByLabelText('Review');
    expect(f).toHaveAttribute('aria-invalid', 'true');
    expect(f.getAttribute('aria-describedby')).toContain(screen.getByText('Required').id);
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
  it('@US4-FE3 Card has rounded-md border', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('rounded-md');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-line');
  });
  it('@US4-FE3 Card background is paper-50 only', () => {
    render(<Card data-testid="card">Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-paper-50');
    expect(card.className).not.toContain('bg-paper ');
    expect(card.className).not.toContain('bg-white');
  });
  it('@US4-FE3 Card merges custom className', () => {
    render(<Card className="extra-class" data-testid="card">Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-paper-50', 'border-line', 'extra-class');
  });
  it('@US4-FE3 Section has correct vertical padding', () => {
    render(<Section data-testid="section">Section</Section>);
    const section = screen.getByTestId('section');
    expect(section).toHaveClass('py-16');
    expect(section).toHaveClass('md:py-24');
  });
  it('@US4-FE3 Section renders as <section> element', () => {
    render(<Section data-testid="section">Content</Section>);
    expect(screen.getByTestId('section').tagName).toBe('SECTION');
  });
  it('@US4-FE3 Container has max-w-6xl and px-4', () => {
    render(<Container data-testid="container">Content</Container>);
    const container = screen.getByTestId('container');
    expect(container).toHaveClass('max-w-6xl');
    expect(container).toHaveClass('px-4');
  });
  it('@US4-FE3 Container is full width with mx-auto', () => {
    render(<Container data-testid="container">Content</Container>);
    const container = screen.getByTestId('container');
    expect(container).toHaveClass('w-full');
    expect(container).toHaveClass('mx-auto');
  });
  it('@US4-FE3 Container merges custom className without overriding width', () => {
    render(<Container className="custom" data-testid="container">Content</Container>);
    const container = screen.getByTestId('container');
    expect(container).toHaveClass('w-full', 'max-w-6xl', 'px-4', 'custom');
  });
});
