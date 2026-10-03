import { render, screen, fireEvent } from '@testing-library/react';
import ArtworkPage from './page';
import BotCtaButton from './BotCtaButton';
import MobileContactBar from './MobileContactBar';
import { getGalleryData } from '@/hooks/useApi';
import { buildArtworkSlug } from '@/lib/artworkSlug';
import { reachGoal } from '@/lib/analytics';

jest.mock('@/hooks/useApi', () => ({
  getGalleryData: jest.fn(),
  getContactsData: jest.fn(),
  getImageUrl: (path: string) => path,
}));
jest.mock('next/navigation', () => ({ notFound: jest.fn() }));
jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ContactClick: 'contact_click', ArtworkView: 'artwork_view' },
}));
jest.mock('yet-another-react-lightbox', () => ({ __esModule: true, default: () => null }));
jest.mock('yet-another-react-lightbox/plugins/zoom', () => ({ __esModule: true, default: {} }));
jest.mock('yet-another-react-lightbox/styles.css', () => ({}), { virtual: true });

const BOT = 'https://t.me/angela_moiseenko_bot?start=art_7';

describe('@US1 bot CTA on artwork page', () => {
  const { getContactsData } = jest.requireMock('@/hooks/useApi');
  const setup = async () => {
    getContactsData.mockResolvedValue({ socialLinks: { telegram: 'https://t.me/Angelamois' }, phone: '+7 (978) 545-86-50' });
    (getGalleryData as jest.Mock).mockResolvedValue({ artworks: [{ id: 7, title: 'Закат', isForSale: true }], categories: [] });
    render(await ArtworkPage({ params: { slug: buildArtworkSlug('Закат', 7) } }));
  };

  it('@US1-AS1 shows bot button and personal Telegram side by side', async () => {
    await setup();
    const bot = screen.getByTestId('bot-cta');
    expect(bot).toHaveAttribute('href', BOT);
    expect(bot).toHaveAttribute('target', '_blank');
    expect(bot.getAttribute('rel')).toContain('noopener');
    expect(bot).toHaveAccessibleName('Спросить в Telegram');
    expect(screen.getByLabelText('Написать в Telegram')).toHaveAttribute('href', 'https://t.me/Angelamois');
  });

  it('@US1-AS2 mobile bar has a bot link and keeps write/call', async () => {
    await setup();
    const bar = screen.getByTestId('mobile-contact-bar');
    const links = Array.from(bar.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toContain(BOT);
    expect(screen.getByText('Написать')).toBeInTheDocument();
    expect(screen.getByText('Позвонить')).toBeInTheDocument();
  });
});

describe('@US1-AS3 click sends analytics goal', () => {
  beforeEach(() => (reachGoal as jest.Mock).mockClear());
  it('desktop button', () => {
    render(<BotCtaButton artworkId={7} artwork="Закат" />);
    fireEvent.click(screen.getByTestId('bot-cta'));
    expect(reachGoal).toHaveBeenCalledWith('contact_click', { channel: 'telegram_bot', artwork: 'Закат' });
  });
  it('mobile bar button, even with no other channels', () => {
    render(<MobileContactBar channels={[]} artwork="Закат" artworkId={7} />);
    fireEvent.click(screen.getByLabelText('Спросить в Telegram'));
    expect(reachGoal).toHaveBeenCalledWith('contact_click', { channel: 'telegram_bot', artwork: 'Закат' });
  });
});
