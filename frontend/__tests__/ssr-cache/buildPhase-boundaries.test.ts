/** @jest-environment node */
import { loadOrBuildFallback, isBuildPhase } from '../../lib/buildPhase';

describe('boundary: NEXT_PHASE detection', () => {
  const old = process.env.NEXT_PHASE;
  afterEach(() => {
    if (old === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = old;
    jest.restoreAllMocks();
  });

  it('US1-AS2: isBuildPhase returns true only for exact "phase-production-build"', () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    expect(isBuildPhase()).toBe(true);
  });

  it('US1-AS2: isBuildPhase false for other production phases', () => {
    process.env.NEXT_PHASE = 'phase-production-server';
    expect(isBuildPhase()).toBe(false);
  });

  it('US1-AS2: isBuildPhase false for development phase', () => {
    process.env.NEXT_PHASE = 'phase-development';
    expect(isBuildPhase()).toBe(false);
  });

  it('US1-AS2: isBuildPhase false when unset', () => {
    delete process.env.NEXT_PHASE;
    expect(isBuildPhase()).toBe(false);
  });

  it('US1-AS2: isBuildPhase false for substring match', () => {
    process.env.NEXT_PHASE = 'production-build';
    expect(isBuildPhase()).toBe(false);
  });

  it('US1-AS2: isBuildPhase false for partial match with case variation', () => {
    process.env.NEXT_PHASE = 'Phase-Production-Build';
    expect(isBuildPhase()).toBe(false);
  });
});

describe('boundary: build phase fallback behavior', () => {
  const old = process.env.NEXT_PHASE;
  afterEach(() => {
    if (old === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = old;
    jest.restoreAllMocks();
  });

  it('US1-AS2: loader success in build phase returns loader data', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    const data = { content: 'real' };
    const fallback = { content: 'fallback' };
    await expect(loadOrBuildFallback(async () => data, fallback)).resolves.toEqual(data);
  });

  it('US1-AS2: loader success ignores fallback', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    await expect(loadOrBuildFallback(async () => 'real', 'fallback')).resolves.toBe('real');
  });

  it('US1-AS2: loader failure in build phase returns fallback', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fallback = { empty: true };
    await expect(loadOrBuildFallback(async () => Promise.reject(new Error('API error')), fallback)).resolves.toEqual(fallback);
  });

  it('US1-AS2: console.warn called when loader fails in build phase', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new Error('network error');
    await loadOrBuildFallback(async () => Promise.reject(error), 'fb');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('prerendering fallback'), error);
  });
});

describe('boundary: non-build phase error propagation', () => {
  const old = process.env.NEXT_PHASE;
  afterEach(() => {
    if (old === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = old;
  });

  it('US4-AS9: loader error in production-server throws', async () => {
    process.env.NEXT_PHASE = 'phase-production-server';
    const error = new Error('API down');
    await expect(loadOrBuildFallback(async () => Promise.reject(error), 'fb')).rejects.toBe(error);
  });

  it('US4-AS9: loader error when NEXT_PHASE unset throws', async () => {
    delete process.env.NEXT_PHASE;
    const error = new Error('failed');
    await expect(loadOrBuildFallback(async () => Promise.reject(error), 'fb')).rejects.toBe(error);
  });

  it('US4-AS9: loader error in non-build phase does not use fallback', async () => {
    process.env.NEXT_PHASE = 'phase-development';
    const fallback = { should: 'not be used' };
    const error = new Error('conn refused');
    await expect(loadOrBuildFallback(async () => Promise.reject(error), fallback)).rejects.toBe(error);
  });
});

describe('boundary: fallback data types', () => {
  const old = process.env.NEXT_PHASE;
  afterEach(() => {
    if (old === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = old;
    jest.restoreAllMocks();
  });

  it('US1-AS2: fallback can be null', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(loadOrBuildFallback(async () => Promise.reject(new Error('x')), null)).resolves.toBe(null);
  });

  it('US1-AS2: fallback can be object', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fb = { artworks: [] };
    await expect(loadOrBuildFallback(async () => Promise.reject(new Error('x')), fb)).resolves.toEqual(fb);
  });

  it('US1-AS2: fallback can be array', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const fb = [1, 2, 3];
    await expect(loadOrBuildFallback(async () => Promise.reject(new Error('x')), fb)).resolves.toEqual(fb);
  });

  it('US1-AS2: fallback can be string', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(loadOrBuildFallback(async () => Promise.reject(new Error('x')), 'empty')).resolves.toBe('empty');
  });

  it('US1-AS2: fallback can be undefined', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(loadOrBuildFallback(async () => Promise.reject(new Error('x')), undefined)).resolves.toBeUndefined();
  });
});

describe('boundary: loader execution timing', () => {
  const old = process.env.NEXT_PHASE;
  afterEach(() => {
    if (old === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = old;
    jest.restoreAllMocks();
  });

  it('US1-AS2: build phase catches immediate synchronous-like errors', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const loader = async () => {
      throw new Error('immediate');
    };
    await expect(loadOrBuildFallback(loader, 'fb')).resolves.toBe('fb');
  });

  it('US1-AS2: build phase catches async delayed errors', async () => {
    process.env.NEXT_PHASE = 'phase-production-build';
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const loader = async () => {
      await new Promise((r) => setTimeout(r, 1));
      throw new Error('delayed');
    };
    await expect(loadOrBuildFallback(loader, 'fb')).resolves.toBe('fb');
  });

  it('US4-AS9: non-build phase propagates synchronous-like errors', async () => {
    process.env.NEXT_PHASE = 'phase-production-server';
    const error = new Error('sync fail');
    const loader = async () => {
      throw error;
    };
    await expect(loadOrBuildFallback(loader, 'fb')).rejects.toBe(error);
  });
});
