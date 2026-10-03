import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from './Navigation';

let mockPath = '/gallery';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));

const FORBIDDEN = /(primary|secondary|purple|indigo|blue|orange|gray)-|gradient/;

describe('@US5-AS1 активный пункт навигации', () => {
  it('Галерея имеет aria-current=page и text-sea, остальные без aria-current', () => {
    mockPath = '/gallery';
    render(<Navigation />);
    const desktop = screen.getByTestId('desktop-nav');
    const links = Array.from(desktop.querySelectorAll('a'));
    const gallery = links.find((l) => l.textContent === 'Галерея')!;
    expect(gallery).toHaveAttribute('aria-current', 'page');
    expect(gallery.className).toContain('text-sea');
    links.filter((l) => l !== gallery).forEach((l) => expect(l).not.toHaveAttribute('aria-current'));
  });
});

describe('@US5-AS2 мобильное меню', () => {
  it('открывается с bg-paper и всеми пунктами, после закрытия скрыто', () => {
    mockPath = '/';
    render(<Navigation />);
    expect(screen.queryByTestId('mobile-menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /меню/i }));
    const menu = screen.getByTestId('mobile-menu');
    expect(menu.className).toContain('bg-paper');
    ['Главная', 'Галерея', 'Обо мне', 'Видео', 'Блог', 'Отзывы', 'Контакты'].forEach((l) =>
      expect(menu).toHaveTextContent(l),
    );
    expect(screen.getByRole('button', { name: /меню/i })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: /меню/i }));
    expect(screen.queryByTestId('mobile-menu')).toBeNull();
  });
});

describe('@US5-FE1 шапка', () => {
  it('имя художницы font-serif, nav bg-paper/95 и border-line, без устаревших классов', () => {
    mockPath = '/';
    const { container } = render(<Navigation />);
    expect(screen.getByText('Анжела Моисеенко').className).toContain('font-serif');
    const nav = container.querySelector('nav')!;
    expect(nav.className).toContain('bg-paper/95');
    expect(nav.className).toContain('border-line');
    expect(container.innerHTML).not.toMatch(FORBIDDEN);
  });
});
