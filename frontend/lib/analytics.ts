declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

// The counter id is public (it ships in the page anyway), so the live one is the
// default; NEXT_PUBLIC_YM_ID stays as an override for staging or a local build
// that must not pollute the real statistics (set it to 0 to disable).
const DEFAULT_COUNTER_ID = 112804064;

export const YM_COUNTER_ID = process.env.NEXT_PUBLIC_YM_ID
  ? Number(process.env.NEXT_PUBLIC_YM_ID) || undefined
  : DEFAULT_COUNTER_ID;

/**
 * Fire a Metrica goal. Safe to call before (or entirely without) the counter:
 * when NEXT_PUBLIC_YM_ID is unset the site simply runs без аналитики.
 */
export function reachGoal(goal: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !YM_COUNTER_ID || typeof window.ym !== 'function') {
    return;
  }

  try {
    window.ym(YM_COUNTER_ID, 'reachGoal', goal, params);
  } catch {
    // Analytics must never break a user action.
  }
}

export const Goals = {
  ContactFormSubmit: 'contact_form_submit',
  ArtworkView: 'artwork_view',
  ContactClick: 'contact_click',
  SocialClick: 'social_click',
} as const;
