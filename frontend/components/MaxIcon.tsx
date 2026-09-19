// react-icons has no MAX glyph yet, so the messenger's wordmark stands in for
// one: it keeps the same square footprint as the other social icons.
export default function MaxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true" focusable="false">
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8.5"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="currentColor"
      >
        MAX
      </text>
    </svg>
  );
}
