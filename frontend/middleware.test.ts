/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

const galleryResponse = (artworks: any[]) =>
  ({
    ok: true,
    json: async () => ({ artworks }),
  } as Response);

describe('@S1-AS2 the legacy query-string URL redirects permanently to the slug URL', () => {
  it('redirects with status 301 to the canonical slug', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      galleryResponse([{ id: 7, title: 'Осенний сад' }])
    );

    const request = new NextRequest('http://localhost:3000/gallery?artwork=7');
    const response = await middleware(request);

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toContain('/gallery/osenniy-sad-7');
  });
});

describe('@S1-AS3 legacy URL for a nonexistent artwork does not redirect into a dead page', () => {
  it('returns 404 instead of redirecting when the id matches no artwork', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      galleryResponse([{ id: 7, title: 'Осенний сад' }])
    );

    const request = new NextRequest('http://localhost:3000/gallery?artwork=999999');
    const response = await middleware(request);

    expect(response.status).toBe(404);
  });

  it('returns 404 when the gallery data source is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const request = new NextRequest('http://localhost:3000/gallery?artwork=7');
    const response = await middleware(request);

    expect(response.status).toBe(404);
  });
});

describe('requests without the legacy query param', () => {
  it('pass through untouched', async () => {
    const request = new NextRequest('http://localhost:3000/gallery');
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });
});
