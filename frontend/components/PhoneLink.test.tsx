import { render, screen, fireEvent } from '@testing-library/react';
import PhoneLink, { SITE_PHONE } from './PhoneLink';
import { reachGoal, Goals } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({
  reachGoal: jest.fn(),
  Goals: { ContactClick: 'contact_click' },
}));

describe('PhoneLink', () => {
  it('dials the number with formatting stripped', () => {
    render(<PhoneLink place="header" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'tel:+79785458650');
    expect(screen.getByText(SITE_PHONE)).toBeInTheDocument();
  });

  it('reports the click with the place it happened in', () => {
    render(<PhoneLink place="header-mobile" />);
    fireEvent.click(screen.getByRole('link'));
    expect(reachGoal).toHaveBeenCalledWith(Goals.ContactClick, {
      channel: 'phone',
      place: 'header-mobile',
    });
  });
});
