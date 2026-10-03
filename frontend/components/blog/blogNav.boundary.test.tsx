import { render, screen } from '@testing-library/react';
import Pagination from './Pagination';
import CategoryTabs from './CategoryTabs';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('@US1-FE5 Pagination boundaries', () => {
  it.each([
    [0, 10],
    [1, 10],
    [10, 10],
  ])('renders nothing for total=%i pageSize=%i', (total, pageSize) => {
    const { container } = render(<Pagination basePath="/blog" page={1} total={total} pageSize={pageSize} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders two pages when total exceeds one page by one', () => {
    render(<Pagination basePath="/blog" page={1} total={11} pageSize={10} />);
    expect(screen.getByLabelText('Страницы блога').children).toHaveLength(2);
  });

  it('marks the current page, links the others, page 1 to the base path', () => {
    render(<Pagination basePath="/blog" page={2} total={30} pageSize={10} />);
    const current = screen.getByText('2');
    expect(current.tagName).toBe('SPAN');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('bg-sea', 'text-white');
    const first = screen.getByText('1') as HTMLAnchorElement;
    expect(first.getAttribute('href')).toBe('/blog');
    expect(first).not.toHaveAttribute('aria-current');
    expect(first).toHaveClass('bg-paper-50');
    expect((screen.getByText('3') as HTMLAnchorElement).getAttribute('href')).toBe('/blog?page=3');
  });

  it('keeps a custom base path', () => {
    render(<Pagination basePath="/blog/category/x" page={1} total={20} pageSize={10} />);
    expect((screen.getByText('2') as HTMLAnchorElement).getAttribute('href')).toBe('/blog/category/x?page=2');
  });
});

describe('@US1-FE5 CategoryTabs boundaries', () => {
  const categories = [
    { slug: 'a', name: 'Альфа' },
    { slug: 'b', name: 'Бета' },
  ] as any;

  it('renders nothing without categories', () => {
    const { container } = render(<CategoryTabs categories={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks only "Все" active when activeSlug is undefined', () => {
    render(<CategoryTabs categories={categories} />);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    const active = document.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe('Все');
    expect((screen.getByText('Все') as HTMLAnchorElement).getAttribute('href')).toBe('/blog');
    expect((screen.getByText('Альфа') as HTMLAnchorElement).getAttribute('href')).toBe('/blog/category/a');
  });

  it('marks only the active category', () => {
    render(<CategoryTabs categories={categories} activeSlug="b" />);
    const active = document.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe('Бета');
    expect(active[0]).toHaveClass('bg-sea', 'text-white');
    expect(screen.getByText('Все')).not.toHaveClass('bg-sea');
    expect(screen.getByText('Альфа')).toHaveClass('bg-paper-50');
  });

  it('marks no category when activeSlug is unknown', () => {
    render(<CategoryTabs categories={categories} activeSlug="zzz" />);
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(0);
  });
});
