import { render } from '@testing-library/react';
import ClickTracker from './ClickTracker';
import { reachGoal, Goals } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ContactClick: 'contact_click', SocialClick: 'social_click' },
}));

function clickAnchor(href: string) {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  document.body.appendChild(a);
  a.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  a.remove();
}

describe('ClickTracker', () => {
  beforeEach(() => {
    (reachGoal as jest.Mock).mockClear();
    render(<ClickTracker />);
  });

  it('reports a contact goal for mail and phone links', () => {
    clickAnchor('mailto:artist@example.com');
    clickAnchor('tel:+79990000000');
    expect(reachGoal).toHaveBeenNthCalledWith(1, Goals.ContactClick, { channel: 'email' });
    expect(reachGoal).toHaveBeenNthCalledWith(2, Goals.ContactClick, { channel: 'phone' });
  });

  it('reports a social goal for a known network, including subdomains', () => {
    clickAnchor('https://www.instagram.com/artist');
    expect(reachGoal).toHaveBeenCalledWith(Goals.SocialClick, { network: 'instagram.com' });
  });

  it('ignores internal navigation', () => {
    clickAnchor('/gallery');
    expect(reachGoal).not.toHaveBeenCalled();
  });
});

describe('ClickTracker opt-out', () => {
  it('leaves links that report themselves alone', () => {
    (reachGoal as jest.Mock).mockClear();
    render(<ClickTracker />);
    const a = document.createElement('a');
    a.setAttribute('href', 'tel:+79785458650');
    a.setAttribute('data-ym-tracked', 'phone');
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    a.remove();
    expect(reachGoal).not.toHaveBeenCalled();
  });
});
