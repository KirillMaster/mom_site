import { render, screen } from '@testing-library/react';
import Footer from './Footer';

jest.mock('@/hooks/useApi', () => ({
  useFooterData: () => ({
    data: {
      email: 'a@b.ru',
      phone: '+70000000000',
      socialLinks: { instagram: 'https://i', vk: 'https://v', telegram: 'https://t', whatsapp: 'https://w', youtube: 'https://y', max: 'https://m' },
      description: 'Test artist',
    },
    isLoading: false,
  }),
}));

const FORBIDDEN = /(primary|secondary|purple|indigo|blue|orange|pink|violet|cyan|green|red|gray)-\d|gradient|\bprimary\b/;

describe('@US5-FE2 Footer: current year calculation', () => {
  it('includes current year in copyright text', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });
});

describe('@US5-FE2 Footer: link attributes and protocols', () => {
  it('has proper footer structure with inner container', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
    const inner = footer?.querySelector('[class*="max-w-7xl"]');
    expect(inner).toBeInTheDocument();
  });

  it('has border separator between main and bottom sections', () => {
    const { container } = render(<Footer />);
    const border = container.querySelector('[class*="border-t"]');
    expect(border).toBeInTheDocument();
  });

  it('has text-paper/60 for copyright text', () => {
    const { container } = render(<Footer />);
    const copyrightP = Array.from(container.querySelectorAll('p')).find((p) => p.textContent?.includes('©'));
    expect(copyrightP?.className).toContain('text-paper/60');
  });

  it('copyright text includes current year', () => {
    const { container } = render(<Footer />);
    const currentYear = new Date().getFullYear();
    const footer = container.querySelector('footer');
    expect(footer?.textContent).toContain(currentYear.toString());
  });
});

describe('@US5-FE2 Footer: social links display', () => {
  it('social icons render without forbidden color classes', () => {
    const { container } = render(<Footer />);
    expect(container.innerHTML).not.toMatch(FORBIDDEN);
  });

  it('footer has bg-ink and text-paper', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer?.className).toContain('bg-ink');
    expect(footer?.className).toContain('text-paper');
  });

  it('social links have proper icon container styling', () => {
    const { container } = render(<Footer />);
    const iconContainers = container.querySelectorAll('[class*="bg-ink-700"]');
    expect(iconContainers.length).toBeGreaterThan(0);
  });
});

describe('@US5-FE2 Footer: navigation section', () => {
  it('renders "Навигация" heading', () => {
    render(<Footer />);
    expect(screen.getByText('Навигация')).toBeInTheDocument();
  });

  it('renders navigation links in footer', () => {
    render(<Footer />);
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Галерея')).toBeInTheDocument();
    expect(screen.getByText('Обо мне')).toBeInTheDocument();
  });

  it('navigation links have correct styling', () => {
    const { container } = render(<Footer />);
    const navLinks = container.querySelectorAll('[class*="hover:text-paper"]');
    expect(navLinks.length).toBeGreaterThan(0);
  });
});

describe('@US5-FE2 Footer: contacts section', () => {
  it('displays email if present in footerData', () => {
    render(<Footer />);
    expect(screen.getByText('a@b.ru')).toBeInTheDocument();
  });

  it('email link has mailto protocol', () => {
    const { container } = render(<Footer />);
    const emailLinks = container.querySelectorAll('a[href^="mailto:"]');
    expect(emailLinks.length).toBeGreaterThan(0);
  });

  it('phone link has tel protocol', () => {
    const { container } = render(<Footer />);
    const phoneLinks = container.querySelectorAll('a[href^="tel:"]');
    expect(phoneLinks.length).toBeGreaterThan(0);
  });

  it('email link does not have external attributes', () => {
    const { container } = render(<Footer />);
    const emailLink = container.querySelector('a[href^="mailto:"]');
    expect(emailLink?.getAttribute('target')).not.toBe('_blank');
  });
});

describe('@US5-FE2 Footer: brand section', () => {
  it('displays artist name with font-serif', () => {
    const { container } = render(<Footer />);
    const name = screen.getAllByText('Анжела Моисеенко');
    const footerName = name.find((el) => el.className?.includes('font-serif'));
    expect(footerName).toBeInTheDocument();
  });

  it('has logo icon with sea background', () => {
    const { container } = render(<Footer />);
    const logo = container.querySelector('[class*="bg-sea"]');
    expect(logo).toBeInTheDocument();
  });

  it('description section exists with text', () => {
    const { container } = render(<Footer />);
    const desc = Array.from(container.querySelectorAll('p')).find((p) => p.textContent && p.textContent.length > 10);
    expect(desc).toBeInTheDocument();
  });
});
