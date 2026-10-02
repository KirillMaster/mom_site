/** @jest-environment node */
const revalidatePath = jest.fn();
const startWarmup = jest.fn();
jest.mock('next/cache', () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
jest.mock('@/lib/cacheWarmup', () => ({ startWarmup: () => startWarmup() }));

import { NextRequest } from 'next/server';
import { POST, runtime, dynamic } from '../../app/internal/revalidate/route';

const post = (headers: Record<string, string> = {}) =>
  POST(new NextRequest('http://localhost/internal/revalidate', { method: 'POST', headers }));

describe('@US2-AS5 revalidate rejects bad secret', () => {
  const OLD = process.env.REVALIDATE_SECRET;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REVALIDATE_SECRET = 'right-secret';
  });
  afterAll(() => {
    if (OLD === undefined) delete process.env.REVALIDATE_SECRET;
    else process.env.REVALIDATE_SECRET = OLD;
  });

  it.each([
    ['no header', {}],
    ['wrong secret', { 'x-revalidate-secret': 'wrong-secret!' }],
    ['different length', { 'x-revalidate-secret': 'x' }],
  ])('US2-AS5: %s -> 401', async (_n, headers) => {
    const res = await post(headers as Record<string, string>);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ revalidated: false });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(startWarmup).not.toHaveBeenCalled();
  });

  it('US2-AS5: unset REVALIDATE_SECRET -> 401', async () => {
    delete process.env.REVALIDATE_SECRET;
    const res = await post({ 'x-revalidate-secret': '' });
    expect(res.status).toBe(401);
    const res2 = await post({ 'x-revalidate-secret': 'anything' });
    expect(res2.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('@US2-AS4 revalidate with valid secret', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REVALIDATE_SECRET = 'right-secret';
  });

  it('US2-AS4: revalidates layout and starts warmup', async () => {
    startWarmup.mockReturnValue({ status: 'started' });
    const res = await post({ 'x-revalidate-secret': 'right-secret' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true, warmup: 'started' });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(runtime).toBe('nodejs');
    expect(dynamic).toBe('force-dynamic');
  });

  it('US2-EC3: running warmup -> still revalidates, reports already-running', async () => {
    startWarmup.mockReturnValue({ status: 'already-running' });
    const res = await post({ 'x-revalidate-secret': 'right-secret' });
    expect(await res.json()).toEqual({ revalidated: true, warmup: 'already-running' });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('boundary: secret edge cases', () => {
  const OLD = process.env.REVALIDATE_SECRET;
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REVALIDATE_SECRET = 'my-secret-key-123';
  });
  afterAll(() => {
    if (OLD === undefined) delete process.env.REVALIDATE_SECRET;
    else process.env.REVALIDATE_SECRET = OLD;
  });

  it('should reject secret with extra character appended', async () => {
    const res = await post({ 'x-revalidate-secret': 'my-secret-key-123x' });
    expect(res.status).toBe(401);
    expect(startWarmup).not.toHaveBeenCalled();
  });

  it('should reject secret with character removed (shorter)', async () => {
    const res = await post({ 'x-revalidate-secret': 'my-secret-key-12' });
    expect(res.status).toBe(401);
    expect(startWarmup).not.toHaveBeenCalled();
  });

  it('should reject secret with single char changed', async () => {
    const res = await post({ 'x-revalidate-secret': 'my-secret-key-124' });
    expect(res.status).toBe(401);
  });

  it('should reject empty string secret when key is set', async () => {
    const res = await post({ 'x-revalidate-secret': '' });
    expect(res.status).toBe(401);
    expect(startWarmup).not.toHaveBeenCalled();
  });

  it('should include both revalidated and warmup fields in response', async () => {
    startWarmup.mockReturnValue({ status: 'started' });
    const res = await post({ 'x-revalidate-secret': 'my-secret-key-123' });
    const body = await res.json();
    expect(body).toHaveProperty('revalidated');
    expect(body).toHaveProperty('warmup');
    expect(Object.keys(body).length).toBe(2);
    expect(body.revalidated).toBe(true);
  });

  it('should return 401 with only revalidated:false on bad secret', async () => {
    const res = await post({ 'x-revalidate-secret': 'wrong' });
    const body = await res.json();
    expect(body).toEqual({ revalidated: false });
    expect(Object.keys(body).length).toBe(1);
  });
});
