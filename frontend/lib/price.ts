import { resolveStatus, statusLabel } from '@/lib/artworkStatus';
import type { ArtworkDto } from '@/lib/api';

const rubles = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export const formatPrice = (price: number): string => `${rubles.format(price)} ₽`;

// Available works show the price or "цена по запросу"; other statuses show
// their own label so a sold work never invites a price request.
export function priceLabel(artwork: ArtworkDto, exhibition: boolean): string | null {
  if (exhibition) return null;
  const status = resolveStatus(artwork);
  if (status !== 'Available') return statusLabel(status);
  return artwork.price && artwork.price > 0 ? formatPrice(artwork.price) : 'цена по запросу';
}

export function sizeLabel(artwork: ArtworkDto): string | null {
  return artwork.widthCm && artwork.heightCm ? `${artwork.widthCm} × ${artwork.heightCm} см` : null;
}
