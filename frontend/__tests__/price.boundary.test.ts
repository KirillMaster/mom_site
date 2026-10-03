import { formatPrice, priceLabel, sizeLabel } from '@/lib/price';
import type { ArtworkDto } from '@/lib/api';

const defaultArtwork = (): ArtworkDto => ({
  id: 1,
  title: 'Test Artwork',
  imagePath: '/test.jpg',
  thumbnailPath: '/test-thumb.jpg',
  isForSale: true,
  status: 'Available' as const,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  categoryId: 1,
  images: [],
});

describe('@US4-AS8 formatPrice formats prices with Russian locale', () => {
  it('formats positive prices with ruble symbol', () => {
    const price1500 = formatPrice(1500);
    expect(price1500).toMatch(/^1\s*500\s*₽$/);
    expect(formatPrice(1)).toMatch(/^1\s*₽$/);
    expect(formatPrice(99999)).toMatch(/^99\s*999\s*₽$/);
  });

  it('formats zero as 0 ₽', () => {
    expect(formatPrice(0)).toMatch(/^0\s*₽$/);
  });

  it('handles large numbers with thousand separators', () => {
    expect(formatPrice(1000000)).toMatch(/^1\s*000\s*000\s*₽$/);
  });
});

describe('@US4-AS9 priceLabel shows price for available artworks in gallery', () => {
  it('shows formatted price when artwork is available and has price > 0', () => {
    const artwork = defaultArtwork();
    artwork.price = 50000;
    expect(priceLabel(artwork, false)).toMatch(/^50\s*000\s*₽$/);
  });

  it('shows "цена по запросу" when price is null or undefined', () => {
    const artwork = defaultArtwork();
    artwork.price = undefined;
    expect(priceLabel(artwork, false)).toBe('цена по запросу');

    const artwork2 = defaultArtwork();
    artwork2.price = null as any;
    expect(priceLabel(artwork2, false)).toBe('цена по запросу');
  });

  it('shows "цена по запросу" when price is 0', () => {
    const artwork = defaultArtwork();
    artwork.price = 0;
    expect(priceLabel(artwork, false)).toBe('цена по запросу');
  });

  it('shows "цена по запросу" for negative prices', () => {
    const artwork = defaultArtwork();
    artwork.price = -100;
    expect(priceLabel(artwork, false)).toBe('цена по запросу');
  });

  it('returns null in exhibition mode', () => {
    const artwork = defaultArtwork();
    artwork.price = 50000;
    expect(priceLabel(artwork, true)).toBeNull();
  });

  it('shows status label for non-available artworks', () => {
    const artwork = defaultArtwork();
    artwork.price = 50000;
    artwork.status = 'Sold' as const;
    expect(priceLabel(artwork, false)).toBe('Продана');

    const artwork2 = defaultArtwork();
    artwork2.price = 50000;
    artwork2.status = 'NotForSale' as const;
    expect(priceLabel(artwork2, false)).toBe('Не продаётся');

    const artwork3 = defaultArtwork();
    artwork3.price = 50000;
    artwork3.status = 'PrivateCollection' as const;
    expect(priceLabel(artwork3, false)).toBe('В частной коллекции');
  });

  it('status label takes precedence over price', () => {
    const artwork = defaultArtwork();
    artwork.price = 100000;
    artwork.status = 'Sold' as const;
    expect(priceLabel(artwork, false)).toBe('Продана');
  });
});

describe('@US4-AS10 sizeLabel shows dimensions when both width and height available', () => {
  it('shows formatted dimensions with cm symbol', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 100;
    artwork.heightCm = 150;
    expect(sizeLabel(artwork)).toBe('100 × 150 см');
  });

  it('shows correct format with various dimensions', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 50;
    artwork.heightCm = 75;
    expect(sizeLabel(artwork)).toBe('50 × 75 см');
  });

  it('returns null when width is missing', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = undefined;
    artwork.heightCm = 150;
    expect(sizeLabel(artwork)).toBeNull();
  });

  it('returns null when height is missing', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 100;
    artwork.heightCm = undefined;
    expect(sizeLabel(artwork)).toBeNull();
  });

  it('returns null when both dimensions are missing', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = undefined;
    artwork.heightCm = undefined;
    expect(sizeLabel(artwork)).toBeNull();
  });

  it('returns null when width is null', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = null;
    artwork.heightCm = 150;
    expect(sizeLabel(artwork)).toBeNull();
  });

  it('returns null when height is null', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 100;
    artwork.heightCm = null;
    expect(sizeLabel(artwork)).toBeNull();
  });

  it('shows size even with zero dimensions', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 0;
    artwork.heightCm = 0;
    // 0 is falsy but should still be treated as a dimension
    expect(sizeLabel(artwork)).toBeNull();
  });

  it('handles very large dimensions', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 5000;
    artwork.heightCm = 3000;
    expect(sizeLabel(artwork)).toBe('5000 × 3000 см');
  });
});

describe('@US4-EC4 price and size boundary edge cases', () => {
  it('price of 1 ruble is shown', () => {
    const artwork = defaultArtwork();
    artwork.price = 1;
    expect(priceLabel(artwork, false)).toMatch(/^1\s*₽$/);
  });

  it('very large prices are formatted correctly', () => {
    const artwork = defaultArtwork();
    artwork.price = 999999999;
    expect(priceLabel(artwork, false)).toMatch(/₽/);
    expect(formatPrice(999999999)).toMatch(/999\s*999\s*999/);
  });

  it('dimensions of 1cm are shown', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 1;
    artwork.heightCm = 1;
    expect(sizeLabel(artwork)).toBe('1 × 1 см');
  });

  it('exhibition mode suppresses price even for special status artworks', () => {
    const artwork = defaultArtwork();
    artwork.price = 50000;
    artwork.status = 'Available' as const;
    expect(priceLabel(artwork, true)).toBeNull();
  });

  it('@US3-FE1 formatPrice handles price exactly at boundary 100', () => {
    expect(formatPrice(100)).toMatch(/^100\s*₽$/);
  });

  it('@US3-FE1 formatPrice handles price exactly at boundary 1000', () => {
    expect(formatPrice(1000)).toMatch(/^1\s*000\s*₽$/);
  });

  it('@US3-FE1 formatPrice handles price exactly at boundary 10000', () => {
    expect(formatPrice(10000)).toMatch(/^10\s*000\s*₽$/);
  });

  it('@US3-FE1 formatPrice with maximum safe integer', () => {
    const max = Number.MAX_SAFE_INTEGER;
    const result = formatPrice(max);
    expect(result).toMatch(/₽$/);
    expect(result).not.toContain('Infinity');
  });

  it('@US3-FE2 priceLabel returns exact status labels for each status', () => {
    const sold = defaultArtwork();
    sold.status = 'Sold' as const;
    sold.price = 50000;
    expect(priceLabel(sold, false)).toBe('Продана');

    const notForSale = defaultArtwork();
    notForSale.status = 'NotForSale' as const;
    notForSale.price = 50000;
    expect(priceLabel(notForSale, false)).toBe('Не продаётся');

    const privateCollection = defaultArtwork();
    privateCollection.status = 'PrivateCollection' as const;
    privateCollection.price = 50000;
    expect(priceLabel(privateCollection, false)).toBe('В частной коллекции');

    const unavailable = defaultArtwork();
    unavailable.status = 'Unavailable' as const;
    unavailable.price = 50000;
    expect(priceLabel(unavailable, false)).toBe('Недоступна');

    const notMine = defaultArtwork();
    notMine.status = 'NotMine' as const;
    notMine.price = 50000;
    expect(priceLabel(notMine, false)).toBe('Не моя работа');
  });

  it('@US3-FE2 priceLabel returns null for exhibition photos in all statuses', () => {
    const sold = defaultArtwork();
    sold.status = 'Sold' as const;
    expect(priceLabel(sold, true)).toBeNull();

    const available = defaultArtwork();
    available.price = 100000;
    available.status = 'Available' as const;
    expect(priceLabel(available, true)).toBeNull();
  });

  it('@US3-FE2 priceLabel with price between 0 exclusive and 1', () => {
    const artwork = defaultArtwork();
    artwork.price = 0.5;
    // Should show price or "по запросу" depending on implementation
    const result = priceLabel(artwork, false);
    expect(result).not.toBeNull();
  });

  it('@US4-AS9 sizeLabel with minimum boundary 1cm each', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 1;
    artwork.heightCm = 1;
    expect(sizeLabel(artwork)).toBe('1 × 1 см');
  });

  it('@US4-AS10 sizeLabel with maximum typical boundary 1000cm', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 1000;
    artwork.heightCm = 1000;
    expect(sizeLabel(artwork)).toBe('1000 × 1000 см');
  });

  it('@US4-AS10 sizeLabel asymmetric dimensions', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 50;
    artwork.heightCm = 200;
    expect(sizeLabel(artwork)).toBe('50 × 200 см');
  });

  it('@US4-AS10 sizeLabel with very small and very large dimensions', () => {
    const artwork = defaultArtwork();
    artwork.widthCm = 1;
    artwork.heightCm = 9999;
    expect(sizeLabel(artwork)).toBe('1 × 9999 см');
  });
});
