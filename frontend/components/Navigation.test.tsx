import { render, screen } from '@testing-library/react';
import Navigation from './Navigation';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('@S4-AS9 в Header (Navigation) есть ссылка на /reviews', () => {
  it('рендерит ссылку на /reviews', () => {
    render(<Navigation />);
    const links = screen.getAllByRole('link', { name: 'Отзывы' });
    expect(links.some((link) => link.getAttribute('href') === '/reviews')).toBe(true);
  });
});
