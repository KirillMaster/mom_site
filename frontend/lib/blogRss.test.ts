import { buildRss } from './blogRss';

const mockedList = jest.fn();
const mockedPost = jest.fn();

const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

beforeAll(() => {
  global.fetch = jest.fn(async (input: string) => {
    const url = new URL(input, 'http://api');
    const path = url.pathname.replace(/^.*\/public\/blog/, '');
    if (path === '' || path === '/') return json(await mockedList(Number(url.searchParams.get('page'))));
    return json(await mockedPost(decodeURIComponent(path.slice(1))));
  }) as unknown as typeof fetch;
});

const item = (slug: string, extra: Record<string, unknown> = {}) => ({
  slug,
  title: `Статья ${slug} & <друзья>`,
  excerpt: 'Анонс',
  coverImagePath: 'https://s3/cover.png',
  category: { slug: 'novosti', name: 'Новости' },
  publishedAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-02T10:00:00Z',
  readingMinutes: 2,
  ...extra,
});

beforeEach(() => jest.clearAllMocks());

describe('buildRss', () => {
  it('lists only what the public API returns (drafts never reach it) with full body and cover', async () => {
    mockedList.mockResolvedValue({ items: [item('vystavka')], total: 1, page: 1, pageSize: 12 });
    mockedPost.mockResolvedValue({ post: { bodyHtml: '<p>Текст ]]> конец</p>' }, artworks: [] });

    const xml = await buildRss();

    expect(xml.match(/<item>/g)).toHaveLength(1);
    expect(xml).toContain('<link>https://angelamoiseenko.ru/blog/vystavka</link>');
    expect(xml).toContain('Статья vystavka &amp; &lt;друзья&gt;');
    expect(xml).toContain('<enclosure url="https://s3/cover.png" type="image/png" length="0"/>');
    expect(xml).toContain('<content:encoded><![CDATA[<p>Текст ]]]]><![CDATA[> конец</p>]]></content:encoded>');
    expect(xml).toContain('<pubDate>Tue, 01 Sep 2026 10:00:00 GMT</pubDate>');
  });

  it('stops at 50 items across pages', async () => {
    mockedList.mockImplementation(async (page: number) => ({
      items: Array.from({ length: 12 }, (_, i) => item(`p${page}-${i}`)),
      total: 100,
      page,
      pageSize: 12,
    }));
    mockedPost.mockResolvedValue({ post: { bodyHtml: '' }, artworks: [] });

    const xml = await buildRss();

    expect(xml.match(/<item>/g)).toHaveLength(50);
    expect(mockedList).toHaveBeenCalledTimes(5);
  });

  it('renders an empty channel when there are no posts', async () => {
    mockedList.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 12 });
    const xml = await buildRss();
    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
  });
});
