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
});
