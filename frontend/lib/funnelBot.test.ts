import { botLink, artworkBotLink, FUNNEL_BOT_USERNAME } from '@/lib/funnelBot';

describe('botLink', () => {
  it('defaults to the public bot', () => {
    expect(FUNNEL_BOT_USERNAME).toBe('angela_moiseenko_bot');
  });
  it('without payload returns the plain bot url', () => {
    expect(botLink()).toBe('https://t.me/angela_moiseenko_bot');
  });
  it('with payload adds start parameter', () => {
    expect(botLink('site')).toBe('https://t.me/angela_moiseenko_bot?start=site');
  });
  it('artworkBotLink uses art_<id>', () => {
    expect(artworkBotLink(42)).toBe('https://t.me/angela_moiseenko_bot?start=art_42');
  });
  it('username can be overridden by env', () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_FUNNEL_BOT_USERNAME = 'test_bot';
    const mod = require('@/lib/funnelBot');
    expect(mod.botLink('x')).toBe('https://t.me/test_bot?start=x');
    delete process.env.NEXT_PUBLIC_FUNNEL_BOT_USERNAME;
  });
});
