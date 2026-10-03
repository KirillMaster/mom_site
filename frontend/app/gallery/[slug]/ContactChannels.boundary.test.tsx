import { render, screen, fireEvent } from '@testing-library/react';
import ContactChannels from './ContactChannels';
import { reachGoal } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ContactClick: 'contact_click' },
}));

const mockReachGoal = reachGoal as jest.Mock;

describe('@US5-FE2 ContactChannels: empty and null cases', () => {
  it('returns null when channels array is empty', () => {
    const { container } = render(<ContactChannels channels={[]} artwork="test" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when channels array has one item', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    render(<ContactChannels channels={channels} artwork="test" />);
    expect(screen.getByTestId('contact-channels')).toBeInTheDocument();
  });

  it('renders all channels when array has multiple items', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'telegram' as const, href: 'https://t.me/x' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);
    const links = container.querySelectorAll('[data-testid="contact-channels"] a');
    expect(links).toHaveLength(3);
  });
});

describe('@US5-FE2 ContactChannels: link protocol detection', () => {
  it('external https links have target="_blank" and rel', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('http links have target="_blank" and rel', () => {
    const channels = [
      { channel: 'max' as const, href: 'http://max.com/profile' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('tel: protocol links are handled correctly', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link).toHaveAttribute('href', 'tel:+70000000000');
  });
});

describe('@US5-FE2 ContactChannels: accessibility', () => {
  it('all links have aria-label', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'telegram' as const, href: 'https://t.me/x' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      expect(link).toHaveAttribute('aria-label');
    });
  });

  it('all links have title attribute matching aria-label', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link.getAttribute('title')).toBe(link.getAttribute('aria-label'));
  });

  it('has focus-visible:ring-sea styling on links', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link.className).toContain('focus-visible:ring-sea');
  });

  it('links have outline-none and ring styling', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link.className).toContain('focus:outline-none');
    expect(link.className).toContain('focus-visible:ring-2');
  });
});

describe('@US5-FE2 ContactChannels: analytics tracking', () => {
  beforeEach(() => {
    mockReachGoal.mockReset();
  });

  it('tracks click with correct goal and metadata', () => {
    const channels = [
      { channel: 'telegram' as const, href: 'https://t.me/x' },
    ];
    render(<ContactChannels channels={channels} artwork="my-artwork" />);

    fireEvent.click(screen.getByRole('link'));
    expect(mockReachGoal).toHaveBeenCalledWith('contact_click', {
      channel: 'telegram',
      artwork: 'my-artwork',
    });
  });

  it('tracks each channel click separately', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const links = container.querySelectorAll('a');
    fireEvent.click(links[0]);
    expect(mockReachGoal).toHaveBeenCalledWith('contact_click', expect.objectContaining({ channel: 'whatsapp' }));

    fireEvent.click(links[1]);
    expect(mockReachGoal).toHaveBeenCalledWith('contact_click', expect.objectContaining({ channel: 'phone' }));
  });
});

describe('@US5-FE2 ContactChannels: styling and layout', () => {
  it('has correct button size and border styling', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link.className).toContain('h-11');
    expect(link.className).toContain('w-11');
    expect(link.className).toContain('border');
    expect(link.className).toContain('rounded-md');
  });

  it('has hover state styling', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link.className).toContain('hover:border-sea');
    expect(link.className).toContain('hover:text-sea');
  });

  it('has correct flex layout for multiple channels', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'telegram' as const, href: 'https://t.me/x' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const wrapper = container.querySelector('[data-testid="contact-channels"]')!;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('flex-wrap');
    expect(wrapper.className).toContain('gap-2');
  });

  it('has correct color styling', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link.className).toContain('border-line');
    expect(link.className).toContain('text-ink-600');
  });
});

describe('@US5-FE2 ContactChannels: edge cases', () => {
  it('handles all supported channel types', () => {
    const channels = [
      { channel: 'telegram' as const, href: 'https://t.me/x' },
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'max' as const, href: 'https://max.com/profile' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(4);
  });

  it('has data-ym-tracked attribute on links', () => {
    const channels = [
      { channel: 'telegram' as const, href: 'https://t.me/x' },
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const links = container.querySelectorAll('a');
    expect(Array.from(links).map((l) => l.getAttribute('data-ym-tracked'))).toEqual([
      'channel-telegram',
      'channel-whatsapp',
      'channel-phone',
    ]);
  });

  it('handles unusual artwork names in tracking', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    render(<ContactChannels channels={channels} artwork="my-art-with-&-and-<>" />);

    fireEvent.click(screen.getByRole('link'));
    expect(mockReachGoal).toHaveBeenCalledWith('contact_click', {
      channel: 'phone',
      artwork: 'my-art-with-&-and-<>',
    });
  });

  it('renders correctly with very long href', () => {
    const longUrl = 'https://example.com/very/long/path?param1=value1&param2=value2&param3=value3';
    const channels = [
      { channel: 'whatsapp' as const, href: longUrl },
    ];
    const { container } = render(<ContactChannels channels={channels} artwork="test" />);

    const link = container.querySelector('a')!;
    expect(link).toHaveAttribute('href', longUrl);
  });
});
