import { resolveStatus, statusLabel, ArtworkStatus } from '@/lib/artworkStatus';

export interface ArtworkSpecsData {
  widthCm?: number | null;
  heightCm?: number | null;
  technique?: string | null;
  support?: string | null;
  year?: number | null;
  status?: ArtworkStatus | string | null;
  isForSale?: boolean;
}

const filled = (value: string | null | undefined) => (value ?? '').trim();

export function buildSpecRows(artwork: ArtworkSpecsData): [string, string][] {
  const rows: [string, string][] = [];
  if (artwork.widthCm && artwork.heightCm) {
    rows.push(['Размер', `${artwork.widthCm} × ${artwork.heightCm} см`]);
  }
  if (filled(artwork.technique)) rows.push(['Техника', filled(artwork.technique)]);
  if (filled(artwork.support)) rows.push(['Основа', filled(artwork.support)]);
  if (artwork.year) rows.push(['Год', String(artwork.year)]);
  rows.push(['Статус', statusLabel(resolveStatus(artwork))]);
  return rows;
}

const ArtworkSpecs = ({ artwork }: { artwork: ArtworkSpecsData }) => (
  <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
    {buildSpecRows(artwork).map(([term, value]) => (
      <div key={term} className="contents">
        <dt className="text-ink-500">{term}</dt>
        <dd className="font-medium text-ink">{value}</dd>
      </div>
    ))}
  </dl>
);

export default ArtworkSpecs;
