import { render, screen, fireEvent } from '@testing-library/react';
import MobileContactBar from './MobileContactBar';
import { reachGoal } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ContactClick: 'contact_click' },
}));

const mockReachGoal = reachGoal as jest.Mock;

describe('@US5-FE2 MobileContactBar: empty and null cases', () => {
  it('returns null when channels array is empty', () => {
    const { container } = render(<MobileContactBar channels={[]} artwork="test" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders with only write channel (no call)', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
    ];
    render(<MobileContactBar channels={channels} artwork="test" />);
    expect(screen.getByText('Написать')).toBeInTheDocument();
    expect(screen.queryByText('Позвонить')).not.toBeInTheDocument();
  });

  it('renders with only call channel (no write)', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    render(<MobileContactBar channels={channels} artwork="test" />);
    expect(screen.getByText('Позвонить')).toBeInTheDocument();
    expect(screen.queryByText('Написать')).not.toBeInTheDocument();
  });

  it('renders with both write and call channels', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    render(<MobileContactBar channels={channels} artwork="test" />);
    expect(screen.getByText('Написать')).toBeInTheDocument();
    expect(screen.getByText('Позвонить')).toBeInTheDocument();
  });
});

describe('@US5-FE2 MobileContactBar: channel selection priority', () => {
  it('prefers whatsapp over telegram for write channel', () => {
    const channels = [
      { channel: 'telegram' as const, href: 'https://t.me/x' },
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const writeButton = container.querySelector('a[href="https://wa.me/1"]');
    expect(writeButton).toBeInTheDocument();
  });

  it('uses telegram if whatsapp missing', () => {
    const channels = [
      { channel: 'telegram' as const, href: 'https://t.me/x' },
    ];
    render(<MobileContactBar channels={channels} artwork="test" />);
    expect(screen.getByText('Написать')).toBeInTheDocument();
  });

  it('phone is always call channel', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
      { channel: 'telegram' as const, href: 'https://t.me/x' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const callButton = container.querySelector('a[href="tel:+70000000000"]');
    expect(callButton).toBeInTheDocument();
  });
});

describe('@US5-FE2 MobileContactBar: link attributes', () => {
  it('external links have target="_blank" and rel', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const waLink = container.querySelector('a[href="https://wa.me/1"]');
    expect(waLink).toHaveAttribute('target', '_blank');
    expect(waLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has data-ym-tracked attribute on write button', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const button = container.querySelector('[data-ym-tracked="mobile-bar-write"]');
    expect(button).toBeInTheDocument();
  });

  it('has data-ym-tracked attribute on call button', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const button = container.querySelector('[data-ym-tracked="mobile-bar-call"]');
    expect(button).toBeInTheDocument();
  });
});

describe('@US5-FE2 MobileContactBar: analytics tracking', () => {
  beforeEach(() => {
    mockReachGoal.mockReset();
  });

  it('tracks write channel click with correct goal and metadata', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
    ];
    render(<MobileContactBar channels={channels} artwork="my-painting" />);

    fireEvent.click(screen.getByText('Написать'));
    expect(mockReachGoal).toHaveBeenCalledWith('contact_click', {
      channel: 'whatsapp',
      artwork: 'my-painting',
    });
  });

  it('tracks call click with correct goal and metadata', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    render(<MobileContactBar channels={channels} artwork="test-art" />);

    fireEvent.click(screen.getByText('Позвонить'));
    expect(mockReachGoal).toHaveBeenCalledWith('contact_click', {
      channel: 'phone',
      artwork: 'test-art',
    });
  });
});

describe('@US5-FE2 MobileContactBar: CSS and styling', () => {
  it('has fixed positioning and correct z-index', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const bar = container.querySelector('[data-testid="mobile-contact-bar"]')!;
    expect(bar.className).toContain('fixed');
    expect(bar.className).toContain('z-30');
    expect(bar.className).toContain('inset-x-0');
    expect(bar.className).toContain('bottom-0');
  });

  it('has safe-area-inset-bottom for notch compatibility', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const bar = container.querySelector('[data-testid="mobile-contact-bar"]')!;
    const style = (bar as HTMLElement).style;
    expect(style.paddingBottom).toContain('safe-area-inset-bottom');
  });

  it('is hidden on md breakpoint and larger', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const bar = container.querySelector('[data-testid="mobile-contact-bar"]')!;
    expect(bar.className).toContain('md:hidden');
  });

  it('has gap-2 spacing between buttons', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const bar = container.querySelector('[data-testid="mobile-contact-bar"]')!;
    expect(bar.className).toContain('gap-2');
  });
});

describe('@US5-FE2 MobileContactBar: edge cases', () => {
  it('handles artwork with special characters', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    render(<MobileContactBar channels={channels} artwork="my-art &special<>chars" />);

    fireEvent.click(screen.getByText('Позвонить'));
    expect(mockReachGoal).toHaveBeenCalledWith('contact_click', {
      channel: 'phone',
      artwork: 'my-art &special<>chars',
    });
  });

  it('handles empty artwork string', () => {
    const channels = [
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    render(<MobileContactBar channels={channels} artwork="" />);

    fireEvent.click(screen.getByText('Позвонить'));
    expect(mockReachGoal).toHaveBeenCalledWith('contact_click', {
      channel: 'phone',
      artwork: '',
    });
  });

  it('buttons have flex-1 width class for equal distribution', () => {
    const channels = [
      { channel: 'whatsapp' as const, href: 'https://wa.me/1' },
      { channel: 'phone' as const, href: 'tel:+70000000000' },
    ];
    const { container } = render(<MobileContactBar channels={channels} artwork="test" />);

    const buttons = container.querySelectorAll('button, a');
    expect(buttons.length).toBeGreaterThan(0);
    // Both should be buttons with similar styling
    Array.from(buttons).forEach((btn) => {
      expect(btn.className).toContain('flex-1');
    });
  });
});
