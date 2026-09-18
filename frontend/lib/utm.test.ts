import { captureUtm, getStoredUtm } from '@/lib/utm';

function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
}

function setSearch(search: string) {
  window.history.replaceState({}, '', `/contacts${search}`);
}

describe('first-touch UTM capture', () => {
  beforeEach(() => {
    clearCookies();
    setSearch('');
  });

  it('stores utm params from the landing URL', () => {
    setSearch('?utm_source=yandex&utm_medium=cpc&utm_campaign=autumn');

    expect(captureUtm()).toEqual({
      utm_source: 'yandex',
      utm_medium: 'cpc',
      utm_campaign: 'autumn',
    });
    expect(getStoredUtm()).toEqual({
      utm_source: 'yandex',
      utm_medium: 'cpc',
      utm_campaign: 'autumn',
    });
  });

  it('keeps the first source when a later visit carries another one', () => {
    setSearch('?utm_source=yandex&utm_medium=cpc');
    captureUtm();

    setSearch('?utm_source=vk&utm_medium=social');
    expect(captureUtm()).toEqual({ utm_source: 'yandex', utm_medium: 'cpc' });
  });

  it('stores nothing when the URL carries no utm params', () => {
    setSearch('?page=2');

    expect(captureUtm()).toEqual({});
    expect(document.cookie).not.toContain('utm_ft');
  });

  it('returns an empty object when the stored cookie is not valid JSON', () => {
    document.cookie = 'utm_ft=not-json; path=/';

    expect(getStoredUtm()).toEqual({});
  });
});
