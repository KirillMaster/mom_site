import { Goals, reachGoal } from '@/lib/analytics';

describe('Metrica goals', () => {
  afterEach(() => {
    delete (window as { ym?: unknown }).ym;
  });

  it('does nothing when the counter script is absent', () => {
    expect(() => reachGoal(Goals.ContactFormSubmit)).not.toThrow();
  });

  it('never lets a failing counter break the caller', () => {
    window.ym = (() => {
      throw new Error('counter blew up');
    }) as typeof window.ym;

    expect(() => reachGoal(Goals.ContactFormSubmit)).not.toThrow();
  });
});
