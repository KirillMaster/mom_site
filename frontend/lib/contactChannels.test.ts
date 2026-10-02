import { buildContactChannels, buildPrefilledMessage } from './contactChannels';

const URL_ = 'https://angelamoiseenko.ru/gallery/utro-1';
const base = {
  title: 'Утро в Коктебеле',
  url: URL_,
  socialLinks: { telegram: 'https://t.me/angela', whatsapp: 'https://wa.me/79785458650', max: 'https://max.ru/+79785458650' },
  phone: '+7 (978) 545-86-50',
};

describe('@US2-AS1 prefilled message', () => {
  it('contains greeting, quoted title and page url', () => {
    expect(buildPrefilledMessage('Утро в Коктебеле', URL_)).toBe(
      `Здравствуйте! Интересует картина «Утро в Коктебеле» ${URL_}`
    );
  });
  it('telegram channel carries the prefilled text', () => {
    const tg = buildContactChannels(base).find((c) => c.channel === 'telegram');
    expect(tg?.href).toBe('https://t.me/angela');
    expect(tg?.prefilledText).toContain('Утро в Коктебеле');
    expect(tg?.prefilledText).toContain(URL_);
  });
});

describe('@US2-AS4 url encoding in messenger links', () => {
  it('whatsapp link is url-encoded and decodes back to the message', () => {
    const wa = buildContactChannels({ ...base, title: 'Утро "в" Коктебеле' }).find((c) => c.channel === 'whatsapp')!;
    expect(wa.href.startsWith('https://wa.me/79785458650?text=')).toBe(true);
    const text = decodeURIComponent(wa.href.split('?text=')[1]);
    expect(text).toContain('Утро "в" Коктебеле');
    expect(text).toContain(URL_);
    expect(wa.href).not.toMatch(/[ «»]/);
  });
  it('builds whatsapp from phone when socialLinks has none', () => {
    const wa = buildContactChannels({ ...base, socialLinks: {} }).find((c) => c.channel === 'whatsapp');
    expect(wa?.href.startsWith('https://wa.me/79785458650?text=')).toBe(true);
  });
  it('phone channel is a tel: link', () => {
    expect(buildContactChannels(base).find((c) => c.channel === 'phone')?.href).toBe('tel:+79785458650');
  });
});

describe('@US2-AS6 channels without contact are omitted', () => {
  it('no telegram when not configured, order preserved, no empty href', () => {
    const channels = buildContactChannels({ ...base, socialLinks: { whatsapp: base.socialLinks.whatsapp } });
    expect(channels.map((c) => c.channel)).toEqual(['whatsapp', 'max', 'phone']);
    expect(channels.every((c) => c.href)).toBe(true);
  });
  it('returns nothing when phone is unusable and no links', () => {
    expect(buildContactChannels({ title: 'A', url: URL_, socialLinks: {}, phone: '123' })).toEqual([]);
  });
});
