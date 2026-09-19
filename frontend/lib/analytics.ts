declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

export const YM_COUNTER_ID = process.env.NEXT_PUBLIC_YM_ID
  ? Number(process.env.NEXT_PUBLIC_YM_ID)
  : undefined;

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
