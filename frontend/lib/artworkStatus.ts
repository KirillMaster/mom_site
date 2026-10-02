export type ArtworkStatus =
  | 'Available'
  | 'Sold'
  | 'PrivateCollection'
  | 'Unavailable'
  | 'NotForSale'
  | 'NotMine';

export const ARTWORK_STATUS_LABELS: Record<ArtworkStatus, string> = {
  Available: 'В наличии',
  Sold: 'Продана',
  PrivateCollection: 'В частной коллекции',
  Unavailable: 'Недоступна',
  NotForSale: 'Не продаётся',
  NotMine: 'Не моя работа',
};

export const ARTWORK_STATUSES = Object.keys(ARTWORK_STATUS_LABELS) as ArtworkStatus[];

interface StatusSource {
  status?: ArtworkStatus | string | null;
  isForSale?: boolean;
}

// Old API payloads (and cached pages) carry only isForSale; fall back to it.
export function resolveStatus(artwork: StatusSource): ArtworkStatus {
  const status = artwork.status as ArtworkStatus | undefined | null;
  if (status && status in ARTWORK_STATUS_LABELS) return status;
  return artwork.isForSale === false ? 'NotForSale' : 'Available';
}

export const statusLabel = (status: ArtworkStatus): string => ARTWORK_STATUS_LABELS[status];
