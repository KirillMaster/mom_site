import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from './Navigation';

let mockPath = '/gallery';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));

describe('@US5-FE1 Navigation boundary: isActive() edge cases', () => {
  it('gallery path activates gallery link', () => {
    mockPath = '/gallery';
    render(<Navigation />);
    const links = Array.from(screen.getByTestId('desktop-nav').querySelectorAll('a'));
    const gallery = links.find((l) => l.textContent === 'Галерея')!;
    expect(gallery).toHaveAttribute('aria-current', 'page');
  });

  it('handles nested paths: /gallery/[slug] activates /gallery', () => {
    mockPath = '/gallery/my-artwork';
    render(<Navigation />);
    const links = Array.from(screen.getByTestId('desktop-nav').querySelectorAll('a'));
    const gallery = links.find((l) => l.textContent === 'Галерея')!;
    expect(gallery).toHaveAttribute('aria-current', 'page');
  });

  it('only root matches exactly /', () => {
    mockPath = '/';
    render(<Navigation />);
    const links = Array.from(screen.getByTestId('desktop-nav').querySelectorAll('a'));
    const home = links.find((l) => l.textContent === 'Главная')!;
    expect(home).toHaveAttribute('aria-current', 'page');
  });

  it('root / does not activate /gallery or other child paths', () => {
    mockPath = '/gallery';
    render(<Navigation />);
    const links = Array.from(screen.getByTestId('desktop-nav').querySelectorAll('a'));
    const home = links.find((l) => l.textContent === 'Главная')!;
    expect(home).not.toHaveAttribute('aria-current', 'page');
  });

  it('detects /videos path correctly', () => {
    mockPath = '/videos';
    render(<Navigation />);
    const links = Array.from(screen.getByTestId('desktop-nav').querySelectorAll('a'));
    const videos = links.find((l) => l.textContent === 'Видео')!;
    expect(videos).toHaveAttribute('aria-current', 'page');
  });

  it('activates single nav item at a time', () => {
    mockPath = '/gallery';
    render(<Navigation />);
    const links = Array.from(screen.getByTestId('desktop-nav').querySelectorAll('a'));
    const activeLinks = links.filter((l) => l.hasAttribute('aria-current'));
    expect(activeLinks).toHaveLength(1);
  });
});

describe('@US5-FE1 Navigation scroll: shadow state handling', () => {
  it('initially renders nav without shadow-md', () => {
    mockPath = '/';
    const { container } = render(<Navigation />);
    const nav = container.querySelector('nav')!;
    expect(nav.className).not.toContain('shadow-md');
  });

  it('nav has transition-all class for smooth state changes', () => {
    mockPath = '/';
    const { container } = render(<Navigation />);
    const nav = container.querySelector('nav')!;
    expect(nav.className).toContain('transition-all');
    expect(nav.className).toContain('duration-300');
  });

  it('scroll listener cleanup returns function from useEffect', () => {
    mockPath = '/';
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Navigation />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('adds scroll event listener on mount', () => {
    mockPath = '/';
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    render(<Navigation />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });
});

describe('@US5-AS2 Navigation menu: state preservation and rapid toggles', () => {
  it('opens and closes correctly without state corruption', () => {
    mockPath = '/';
    render(<Navigation />);
    const button = screen.getByRole('button', { name: /меню/i });

    fireEvent.click(button); // Open
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button); // Close
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('handles rapid click toggle: open → close → open', () => {
    mockPath = '/';
    render(<Navigation />);
    const button = screen.getByRole('button', { name: /меню/i });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes menu when a nav link is clicked', () => {
    mockPath = '/';
    render(<Navigation />);
    const button = screen.getByRole('button', { name: /меню/i });

    fireEvent.click(button);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    // Click the first link in the mobile menu
    const menu = screen.getByTestId('mobile-menu');
    const firstLink = menu.querySelector('a')!;
    fireEvent.click(firstLink);

    // Menu should close
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
});

describe('@US5-FE1 Navigation: accessibility and keyboard focus', () => {
  it('all nav links have proper focus-visible:ring-sea styling', () => {
    mockPath = '/';
    render(<Navigation />);
    const links = Array.from(screen.getByTestId('desktop-nav').querySelectorAll('a'));
    links.forEach((link) => {
      expect(link.className).toContain('focus-visible:ring-sea');
    });
  });

  it('mobile menu button has proper aria-expanded attribute', () => {
    mockPath = '/';
    render(<Navigation />);
    const button = screen.getByRole('button', { name: /меню/i });
    expect(button).toHaveAttribute('aria-expanded');
    expect(['true', 'false']).toContain(button.getAttribute('aria-expanded'));
  });

  it('mobile menu button has aria-label', () => {
    mockPath = '/';
    render(<Navigation />);
    const button = screen.getByRole('button', { name: /меню/i });
    expect(button).toHaveAttribute('aria-label');
    expect(button.getAttribute('aria-label')).toBe('Меню');
  });

  it('all desktop nav links have aria-current when active', () => {
    mockPath = '/gallery';
    render(<Navigation />);
    const links = Array.from(screen.getByTestId('desktop-nav').querySelectorAll('a'));
    const activeLinks = links.filter((l) => l.hasAttribute('aria-current'));
    expect(activeLinks.length).toBeGreaterThan(0);
  });
});

describe('@US5-FE1 Navigation: mobile menu structure', () => {
  it('mobile menu is hidden by default', () => {
    mockPath = '/';
    const { container } = render(<Navigation />);
    expect(container.querySelector('[data-testid="mobile-menu"]')).not.toBeInTheDocument();
  });

  it('mobile menu has md:hidden class', () => {
    mockPath = '/';
    render(<Navigation />);
    const button = screen.getByRole('button', { name: /меню/i });
    fireEvent.click(button);

    const menu = screen.getByTestId('mobile-menu');
    expect(menu.className).toContain('md:hidden');
  });

  it('mobile menu has all nav items', () => {
    mockPath = '/';
    render(<Navigation />);
    const button = screen.getByRole('button', { name: /меню/i });
    fireEvent.click(button);

    const menu = screen.getByTestId('mobile-menu');
    expect(menu).toHaveTextContent('Главная');
    expect(menu).toHaveTextContent('Галерея');
    expect(menu).toHaveTextContent('Обо мне');
    expect(menu).toHaveTextContent('Видео');
    expect(menu).toHaveTextContent('Блог');
    expect(menu).toHaveTextContent('Отзывы');
    expect(menu).toHaveTextContent('Контакты');
  });
});

describe('@US5-FE1 Navigation: logo and branding', () => {
  it('logo section has sea background', () => {
    mockPath = '/';
    const { container } = render(<Navigation />);
    const logo = container.querySelector('[class*="bg-sea"]');
    expect(logo).toBeInTheDocument();
  });

  it('artist name has font-serif styling', () => {
    mockPath = '/';
    render(<Navigation />);
    const name = screen.getByText('Анжела Моисеенко');
    expect(name.className).toContain('font-serif');
  });

  it('nav has bg-paper/95 and backdrop-blur-sm', () => {
    mockPath = '/';
    const { container } = render(<Navigation />);
    const nav = container.querySelector('nav')!;
    expect(nav.className).toContain('bg-paper/95');
    expect(nav.className).toContain('backdrop-blur-sm');
  });

  it('nav has border-line styling', () => {
    mockPath = '/';
    const { container } = render(<Navigation />);
    const nav = container.querySelector('nav')!;
    expect(nav.className).toContain('border-line');
  });
});
