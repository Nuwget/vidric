interface Props {
  className?: string;
  compacto?: boolean;
}

/** Marca do Vidric: gota de película + wordmark com gradiente sutil. */
export function VidricLogo({ className, compacto = false }: Props) {
  return (
    <svg
      viewBox={compacto ? '0 0 32 32' : '0 0 128 32'}
      role="img"
      aria-label="Vidric"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vidric-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-brand)" />
          <stop offset="100%" stopColor="var(--fg)" />
        </linearGradient>
      </defs>
      <path
        d="M16 4c5.2 5.6 8 9.2 8 12.8A8 8 0 0 1 8 16.8C8 13.2 10.8 9.6 16 4Z"
        fill="url(#vidric-grad)"
      />
      <path d="M12.6 17.4a3.6 3.6 0 0 0 3.4 3.6" stroke="var(--on-accent)" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      {!compacto && (
        <text
          x="32"
          y="22"
          fill="url(#vidric-grad)"
          fontSize="19"
          fontWeight="700"
          letterSpacing="-0.6"
          fontFamily="var(--font-geist-sans, sans-serif)"
        >
          Vidric
        </text>
      )}
    </svg>
  );
}
