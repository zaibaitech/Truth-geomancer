/** Faint tiled Islamic geometric star-lattice, used as a texture layer behind
 * hero/header surfaces. Absolutely positioned — parent needs `relative`. */
export function PatternOverlay({ opacity = 0.05, className = '' }: { opacity?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
    >
      <defs>
        <pattern id="tg-star-lattice" width="44" height="44" patternUnits="userSpaceOnUse">
          <g stroke="#ecd6a4" strokeWidth="1" fill="none">
            <path d="M22 2 L26 12 L36 8 L30 17 L40 22 L30 27 L36 36 L26 32 L22 42 L18 32 L8 36 L14 27 L4 22 L14 17 L8 8 L18 12 Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tg-star-lattice)" />
    </svg>
  );
}
