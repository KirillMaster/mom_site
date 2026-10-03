const SOFA_CM = 200;
const VIEW_W = 300;
const VIEW_H = 300;
const SOFA_TOP = 225;

const isValid = (value?: number | null): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

interface Props {
  widthCm?: number | null;
  heightCm?: number | null;
}

const ScaleDiagram = ({ widthCm, heightCm }: Props) => {
  if (!isValid(widthCm) || !isValid(heightCm)) return null;

  const w = Math.min(widthCm, VIEW_W);
  const h = Math.min(heightCm, SOFA_TOP - 10);
  const sofaX = (VIEW_W - SOFA_CM) / 2;

  return (
    <figure data-testid="scale-diagram" className="rounded-md border border-line bg-paper-50 p-6">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Схема масштаба: работа рядом с диваном шириной 200 см"
        className="mx-auto w-full max-w-sm"
      >
        <rect
          data-testid="scale-artwork"
          x={(VIEW_W - w) / 2}
          y={SOFA_TOP - 10 - h}
          width={w}
          height={h}
          className="fill-ochre/30 stroke-ochre-700"
          strokeWidth={2}
        />
        <g className="fill-line stroke-ink-500" strokeWidth={1.5}>
          <rect data-testid="scale-sofa" x={sofaX} y={SOFA_TOP} width={SOFA_CM} height={65} rx={10} />
          <rect x={sofaX - 12} y={SOFA_TOP + 15} width={24} height={50} rx={8} />
          <rect x={sofaX + SOFA_CM - 12} y={SOFA_TOP + 15} width={24} height={50} rx={8} />
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-sm text-ink-600">
        <span data-testid="scale-caption">{`${widthCm} × ${heightCm} см`}</span>
        <span className="block text-ink-500">Для сравнения — диван шириной 200 см</span>
      </figcaption>
    </figure>
  );
};

export default ScaleDiagram;
