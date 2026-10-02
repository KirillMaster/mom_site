export const isBuildPhase = (): boolean => process.env.NEXT_PHASE === 'phase-production-build';

export async function loadOrBuildFallback<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (!isBuildPhase()) {
      throw error;
    }
    console.warn('API unavailable during build, prerendering fallback data:', error);
    return fallback;
  }
}
