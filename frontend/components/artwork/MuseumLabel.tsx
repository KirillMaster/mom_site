import { normalizeTitle } from '@/lib/normalizeTitle';
import { priceLabel, sizeLabel } from '@/lib/price';
import type { ArtworkDto } from '@/lib/api';

interface MuseumLabelProps {
  artwork: ArtworkDto;
  exhibition?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: { title: 'text-lg', line: 'text-sm', price: 'text-sm' },
  md: { title: 'text-3xl md:text-4xl', line: 'text-base', price: 'text-xl' },
};

const MuseumLabel = ({ artwork, exhibition = false, as: Title = 'p', size = 'sm' }: MuseumLabelProps) => {
  const s = SIZES[size];
  const title = normalizeTitle(artwork.title);
  const medium = [artwork.technique, artwork.support].map((v) => (v ?? '').trim()).filter(Boolean).join(', ');
  const priceOrStatus = priceLabel(artwork, exhibition);
  const dimensions = exhibition ? null : sizeLabel(artwork);
  const line = `${s.line} text-ink-600`;

  return (
    <div>
      {title && (
        <Title data-label-line className={`font-serif italic break-words text-ink ${s.title}`}>
          «{title}»
        </Title>
      )}
      {!exhibition && medium && <p data-label-line className={line}>{medium}</p>}
      {dimensions && <p data-label-line className={line}>{dimensions}</p>}
      {artwork.year ? <p data-label-line className={line}>{artwork.year}</p> : null}
      {priceOrStatus && (
        <p data-label-line className={`mt-2 border-t border-line pt-2 font-medium text-ochre-700 ${s.price}`}>
          {priceOrStatus}
        </p>
      )}
    </div>
  );
};

export default MuseumLabel;
