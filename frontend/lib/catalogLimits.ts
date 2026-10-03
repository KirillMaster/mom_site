export const CATALOG_LIMITS = {
  sizeMin: 1,
  sizeMax: 1000,
  yearMin: 1950,
  textMax: 100,
  shortDescriptionMax: 300,
} as const;

export interface CatalogFields {
  widthCm?: string;
  heightCm?: string;
  year?: string;
  support?: string;
  technique?: string;
  shortDescription?: string;
}

const sizeError = (label: string, v?: string): string | null => {
  if (!v) return null;
  const n = Number(v);
  return n >= CATALOG_LIMITS.sizeMin && n <= CATALOG_LIMITS.sizeMax
    ? null
    : `${label}: от ${CATALOG_LIMITS.sizeMin} до ${CATALOG_LIMITS.sizeMax} см`;
};

export function validateCatalogFields(f: CatalogFields, now: Date = new Date()): string | null {
  const sizes = sizeError('Ширина', f.widthCm) ?? sizeError('Высота', f.heightCm);
  if (sizes) return sizes;
  if (f.year) {
    const y = Number(f.year);
    if (!Number.isInteger(y) || y < CATALOG_LIMITS.yearMin || y > now.getFullYear())
      return `Год: от ${CATALOG_LIMITS.yearMin} до ${now.getFullYear()}`;
  }
  if ((f.support?.length ?? 0) > CATALOG_LIMITS.textMax) return `Основа: не более ${CATALOG_LIMITS.textMax} символов`;
  if ((f.technique?.length ?? 0) > CATALOG_LIMITS.textMax) return `Техника: не более ${CATALOG_LIMITS.textMax} символов`;
  if ((f.shortDescription?.length ?? 0) > CATALOG_LIMITS.shortDescriptionMax)
    return `Короткое описание: не более ${CATALOG_LIMITS.shortDescriptionMax} символов`;
  return null;
}
