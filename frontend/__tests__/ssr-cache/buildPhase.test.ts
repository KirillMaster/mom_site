/** @jest-environment node */
import { loadOrBuildFallback } from '../../lib/buildPhase';

describe('@US1-AS2 build phase without API', () => {
  const old = process.env.NEXT_PHASE;
  afterEach(() => {
    if (old === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = old;
    jest.restoreAllMocks();
  });

  it('US1-AS2: build phase без API → fallback', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const loader = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(loadOrBuildFallback(loader, { empty: true })).resolves.toEqual({ empty: true });
  });

  it('US1-AS2: build phase с API → реальные данные', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    await expect(loadOrBuildFallback(async () => 'real', 'fb')).resolves.toBe('real');
  });
});

describe('@US4-AS9 outside build errors propagate', () => {
  it('US4-AS9: вне build ошибка пробрасывается', async () => {
    process.env.NEXT_PHASE = 'phase-production-server';
    const boom = new Error('API down');
    await expect(loadOrBuildFallback(() => Promise.reject(boom), 'fb')).rejects.toBe(boom);
    delete process.env.NEXT_PHASE;
    await expect(loadOrBuildFallback(() => Promise.reject(boom), 'fb')).rejects.toBe(boom);
  });
});
