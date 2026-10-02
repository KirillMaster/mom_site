/**
 * @jest-environment node
 */
import { GET } from './route';

describe('indexnow-key.txt', () => {
  const original = process.env.INDEXNOW_KEY;
  afterEach(() => {
    process.env.INDEXNOW_KEY = original;
  });

  it('отдаёт ключ из env текстом', async () => {
    process.env.INDEXNOW_KEY = 'abc123';
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    expect(await res.text()).toBe('abc123');
  });

  it('без ключа — 404', () => {
    delete process.env.INDEXNOW_KEY;
    expect(GET().status).toBe(404);
  });
});
