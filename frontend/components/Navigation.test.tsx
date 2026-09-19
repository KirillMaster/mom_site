import { render, screen } from '@testing-library/react';
import Navigation from './Navigation';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => {
        const Component = ({ children, ...rest }: any) => <div {...stripMotionProps(rest)}>{children}</div>;
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

function stripMotionProps(props: Record<string, unknown>) {
  const { initial, animate, exit, transition, variants, whileHover, whileTap, layoutId, layout, ...rest } = props;
  return rest;
}

describe('@S4-AS9 в Header (Navigation) есть ссылка на /reviews', () => {
  it('рендерит ссылку на /reviews', () => {
    render(<Navigation />);
    const links = screen.getAllByRole('link', { name: 'Отзывы' });
    expect(links.some((link) => link.getAttribute('href') === '/reviews')).toBe(true);
  });
});
