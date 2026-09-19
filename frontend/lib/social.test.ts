import { maxProfileUrl } from './social';

describe('maxProfileUrl', () => {
  it('builds the account link from the contact phone', () => {
    expect(maxProfileUrl(undefined, '+7 (978) 545-86-50')).toBe('https://max.ru/+79785458650');
  });

  it('falls back to the site phone when contacts carry none', () => {
    expect(maxProfileUrl(undefined, undefined)).toBe('https://max.ru/+79785458650');
  });

  it('prefers an explicit link set in the admin panel', () => {
    expect(maxProfileUrl('https://max.ru/u/angela', '+79785458650')).toBe('https://max.ru/u/angela');
  });

  it('returns null rather than a broken link for a junk phone', () => {
    expect(maxProfileUrl(undefined, '123')).toBeNull();
  });
});
