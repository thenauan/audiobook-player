// Selo de conteúdo explícito (como o "E" do Apple Music): um quadradinho arredondado com a letra E
export function ExplicitBadge({ label = 'Explícito', size = 14, className = '' }: { label?: string; size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center shrink-0 rounded-[3px] bg-[var(--text-muted)] text-[var(--bg-mica)] font-bold leading-none select-none align-middle ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.68) }}
    >
      E
    </span>
  );
}
