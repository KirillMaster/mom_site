import { render, screen } from '@testing-library/react';
import ContactsSocialSection from './ContactsSocialSection';

describe('@US2 /contacts links to the Telegram bot', () => {
  it('shows bot link next to personal Telegram', () => {
    render(
      <ContactsSocialSection
        contactsData={{ socialLinks: { telegram: 'https://t.me/Angelamois' }, phone: '+7 (978) 545-86-50' } as any}
      />
    );
    expect(screen.getByRole('link', { name: /Telegram-бот/ })).toHaveAttribute(
      'href',
      'https://t.me/angela_moiseenko_bot?start=site'
    );
    expect(screen.getByRole('link', { name: 'Telegram' })).toHaveAttribute('href', 'https://t.me/Angelamois');
  });
});
