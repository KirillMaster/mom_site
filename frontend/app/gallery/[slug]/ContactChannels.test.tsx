import { render, screen, fireEvent } from '@testing-library/react';
import ContactChannels from './ContactChannels';
import MobileContactBar from './MobileContactBar';
import { buildContactChannels } from '@/lib/contactChannels';
import { reachGoal } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ContactClick: 'contact_click' },
}));

const PHONE = '+7 (978) 545-86-50';
const all = buildContactChannels({
  title: 'Закат',
  url: 'https://angelamoiseenko.ru/gallery/zakat-1',
  socialLinks: { telegram: 'https://t.me/a', whatsapp: 'https://wa.me/79785458650' },
  phone: '123',
}).concat(
  buildContactChannels({ title: 'Закат', url: 'https://x/y', socialLinks: {}, phone: PHONE }).filter(
    (c) => c.channel === 'phone'
  )
);

beforeEach(() => (reachGoal as jest.Mock).mockClear());

describe('@US2-AS3 channel click sends analytics goal', () => {
  it('each channel button sends channel and artwork', () => {
    render(<ContactChannels channels={all} artwork="Закат" />);
    fireEvent.click(screen.getByLabelText('Написать в WhatsApp'));
    expect(reachGoal).toHaveBeenLastCalledWith('contact_click', { channel: 'whatsapp', artwork: 'Закат' });
    fireEvent.click(screen.getByLabelText('Написать в Telegram'));
    expect(reachGoal).toHaveBeenLastCalledWith('contact_click', { channel: 'telegram', artwork: 'Закат' });
    fireEvent.click(screen.getByLabelText('Позвонить'));
    expect(reachGoal).toHaveBeenLastCalledWith('contact_click', { channel: 'phone', artwork: 'Закат' });
  });
  it('mobile bar buttons send the goal', () => {
    render(<MobileContactBar channels={all} artwork="Закат" />);
    fireEvent.click(screen.getByText('Написать'));
    expect(reachGoal).toHaveBeenLastCalledWith('contact_click', { channel: 'whatsapp', artwork: 'Закат' });
    fireEvent.click(screen.getByText('Позвонить'));
    expect(reachGoal).toHaveBeenLastCalledWith('contact_click', { channel: 'phone', artwork: 'Закат' });
  });
  it('@US2-EC11 max channel sends analytics with max channel id', () => {
    const withMax = buildContactChannels({
      title: 'Закат',
      url: 'https://x/y',
      socialLinks: { max: 'https://max.ru/+79785458650' },
      phone: PHONE,
    });
    render(<ContactChannels channels={withMax} artwork="Закат" />);
    fireEvent.click(screen.getByLabelText('Написать в MAX'));
    expect(reachGoal).toHaveBeenLastCalledWith('contact_click', { channel: 'max', artwork: 'Закат' });
  });
});

describe('@US2-AS6 hidden channels are not rendered', () => {
  it('renders no MAX button when not configured', () => {
    render(<ContactChannels channels={all} artwork="Закат" />);
    expect(screen.queryByLabelText('Написать в MAX')).toBeNull();
    expect(screen.getByLabelText('Написать в WhatsApp')).toBeInTheDocument();
  });
  it('mobile bar shows only call when no messengers', () => {
    render(<MobileContactBar channels={all.filter((c) => c.channel === 'phone')} artwork="Закат" />);
    expect(screen.queryByText('Написать')).toBeNull();
    expect(screen.getByText('Позвонить')).toBeInTheDocument();
  });
  it('@US2-EC12 returns null when no channels at all', () => {
    const { container } = render(<ContactChannels channels={[]} artwork="Закат" />);
    expect(container.firstChild).toBeNull();
  });
  it('@US2-EC13 mobile bar returns null when no channels', () => {
    const { container } = render(<MobileContactBar channels={[]} artwork="Закат" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('@US2-AS2 mobile bar is fixed at the bottom', () => {
  it('has fixed bottom positioning with safe-area padding and both buttons', () => {
    render(<MobileContactBar channels={all} artwork="Закат" />);
    const bar = screen.getByTestId('mobile-contact-bar');
    expect(bar.className).toContain('fixed');
    expect(bar.className).toContain('bottom-0');
    expect(bar.style.paddingBottom).toContain('safe-area-inset-bottom');
    expect(screen.getByText('Написать')).toBeInTheDocument();
    expect(screen.getByText('Позвонить')).toBeInTheDocument();
  });
});

describe('@US2-AS5 no bottom bar on desktop', () => {
  it('bar is md:hidden', () => {
    render(<MobileContactBar channels={all} artwork="Закат" />);
    expect(screen.getByTestId('mobile-contact-bar').className).toContain('md:hidden');
  });
});

describe('@US2-EC8 web links open in a new tab', () => {
  it('telegram/whatsapp/max have target=_blank and rel noopener', () => {
    const withMax = buildContactChannels({
      title: 'Закат',
      url: 'https://x/y',
      socialLinks: { telegram: 'https://t.me/a', max: 'https://max.ru/+79785458650' },
      phone: PHONE,
    });
    render(<ContactChannels channels={withMax} artwork="Закат" />);
    for (const label of ['Написать в Telegram', 'Написать в WhatsApp', 'Написать в MAX']) {
      const a = screen.getByLabelText(label);
      expect(a).toHaveAttribute('target', '_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
    expect(screen.getByLabelText('Позвонить')).not.toHaveAttribute('target');
  });
  it('@US2-EC14 phone link does not have target and rel attributes', () => {
    render(<ContactChannels channels={all} artwork="Закат" />);
    const phone = screen.getByLabelText('Позвонить');
    expect(phone).not.toHaveAttribute('target');
    expect(phone).not.toHaveAttribute('rel');
  });
  it('@US2-EC15 mobile bar write link opens in new tab', () => {
    render(<MobileContactBar channels={all} artwork="Закат" />);
    const writeLink = screen.getByText('Написать');
    expect(writeLink).toHaveAttribute('target', '_blank');
    expect(writeLink.getAttribute('rel')).toContain('noopener');
  });
  it('@US2-EC16 mobile bar call link does not open in new tab', () => {
    render(<MobileContactBar channels={all} artwork="Закат" />);
    const callLink = screen.getByText('Позвонить');
    expect(callLink).not.toHaveAttribute('target');
  });
});

describe('@US2-EC17 accessibility and labels', () => {
  it('all buttons have aria-label and title', () => {
    render(<ContactChannels channels={all} artwork="Закат" />);
    for (const label of ['Написать в WhatsApp', 'Написать в Telegram', 'Позвонить']) {
      const btn = screen.getByLabelText(label);
      expect(btn).toHaveAttribute('aria-label', label);
      expect(btn).toHaveAttribute('title', label);
    }
  });
  it('@US2-EC18 mobile bar tracks clicks with data-ym-tracked', () => {
    render(<MobileContactBar channels={all} artwork="Закат" />);
    expect(screen.getByText('Написать')).toHaveAttribute('data-ym-tracked', 'mobile-bar-write');
    expect(screen.getByText('Позвонить')).toHaveAttribute('data-ym-tracked', 'mobile-bar-call');
  });
  it('@US2-EC19 desktop contact buttons have data-ym-tracked', () => {
    render(<ContactChannels channels={all} artwork="Закат" />);
    const wa = screen.getByLabelText('Написать в WhatsApp');
    expect(wa).toHaveAttribute('data-ym-tracked', 'channel-whatsapp');
    const tg = screen.getByLabelText('Написать в Telegram');
    expect(tg).toHaveAttribute('data-ym-tracked', 'channel-telegram');
    const phone = screen.getByLabelText('Позвонить');
    expect(phone).toHaveAttribute('data-ym-tracked', 'channel-phone');
  });
});

describe('@US2-EC20 mobile bar prioritizes whatsapp over telegram', () => {
  it('shows whatsapp write when both whatsapp and telegram exist', () => {
    const channels = buildContactChannels({
      title: 'Test',
      url: 'https://x/y',
      socialLinks: { telegram: 'https://t.me/a', whatsapp: 'https://wa.me/79785458650' },
      phone: PHONE,
    });
    render(<MobileContactBar channels={channels} artwork="Test" />);
    const writeLink = screen.getByText('Написать');
    fireEvent.click(writeLink);
    expect(reachGoal).toHaveBeenLastCalledWith('contact_click', { channel: 'whatsapp', artwork: 'Test' });
  });
  it('@US2-EC21 still prefers whatsapp fallback over explicit telegram when phone available', () => {
    const channels = buildContactChannels({
      title: 'Test',
      url: 'https://x/y',
      socialLinks: { telegram: 'https://t.me/a' },
      phone: PHONE,
    });
    render(<MobileContactBar channels={channels} artwork="Test" />);
    const writeLink = screen.getByText('Написать');
    fireEvent.click(writeLink);
    // whatsapp fallback from phone has higher priority than explicit telegram
    expect(reachGoal).toHaveBeenLastCalledWith('contact_click', { channel: 'whatsapp', artwork: 'Test' });
  });
});
