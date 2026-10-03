import { render } from '@testing-library/react';
import Footer from './Footer';
import MobileContactBar from '@/app/gallery/[slug]/MobileContactBar';
import ContactChannels from '@/app/gallery/[slug]/ContactChannels';

jest.mock('@/hooks/useApi', () => ({
  useFooterData: () => ({
    data: {
      email: 'a@b.ru',
      phone: '+70000000000',
      socialLinks: { instagram: 'https://i', vk: 'https://v', telegram: 'https://t', whatsapp: 'https://w', youtube: 'https://y', max: 'https://m' },
    },
    isLoading: false,
  }),
}));

const FORBIDDEN = /(primary|secondary|purple|indigo|blue|orange|pink|violet|cyan|green|red|gray)-\d|gradient|\bprimary\b/;
const channels = [
  { channel: 'whatsapp', href: 'https://wa.me/1' },
  { channel: 'phone', href: 'tel:+70000000000' },
  { channel: 'telegram', href: 'https://t.me/x' },
] as never;

describe('@US5-FE2 футер и панель контактов', () => {
  it('Footer: bg-ink и text-paper, без устаревших цветов', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer')!;
    expect(footer.className).toContain('bg-ink');
    expect(footer.className).toContain('text-paper');
    expect(container.innerHTML).not.toMatch(FORBIDDEN);
  });

  it('MobileContactBar: bg-paper, кнопки primary и secondary', () => {
    const { container, getByText } = render(<MobileContactBar channels={channels} artwork="s" />);
    expect(container.querySelector('[data-testid="mobile-contact-bar"]')!.className).toContain('bg-paper');
    expect(getByText('Написать').className).toContain('bg-sea');
    expect(getByText('Позвонить').className).toContain('border-sea');
    expect(container.innerHTML).not.toMatch(FORBIDDEN);
  });

  it('ContactChannels без устаревших цветов', () => {
    const { container } = render(<ContactChannels channels={channels} artwork="s" />);
    expect(container.innerHTML).not.toMatch(FORBIDDEN);
  });
});
