// Fixed, deterministic "stone" positions — evokes the octagonal geomancy
// casting board without needing a photographic asset.
const STONES: { x: number; y: number; light: boolean }[] = [
  { x: 30, y: 22, light: true },
  { x: 44, y: 18, light: false },
  { x: 58, y: 24, light: true },
  { x: 70, y: 34, light: true },
  { x: 74, y: 50, light: false },
  { x: 68, y: 66, light: true },
  { x: 54, y: 76, light: false },
  { x: 40, y: 78, light: true },
  { x: 26, y: 70, light: false },
  { x: 20, y: 54, light: true },
  { x: 24, y: 38, light: false },
  { x: 46, y: 46, light: true },
  { x: 54, y: 56, light: false },
  { x: 38, y: 58, light: true },
];

export function SandBoardIllustration({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative aspect-square ${className}`}
      style={{ clipPath: 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-ink-card via-ink to-ink-light" />
      <div className="absolute inset-0 border border-sand/25" style={{ clipPath: 'inherit' }} />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-40">
        <line x1="24" y1="24" x2="76" y2="76" stroke="#d9b878" strokeWidth="0.4" />
        <line x1="76" y1="24" x2="24" y2="76" stroke="#d9b878" strokeWidth="0.4" />
        <path
          d="M50 20 L56 42 L78 42 L60 55 L67 78 L50 64 L33 78 L40 55 L22 42 L44 42 Z"
          fill="none"
          stroke="#d9b878"
          strokeWidth="0.5"
          opacity="0.6"
        />
      </svg>
      {STONES.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: '9%',
            height: '9%',
            background: s.light ? '#ecd6a4' : '#241a10',
            border: s.light ? '1px solid #a9814c' : '1px solid #d9b878',
          }}
        />
      ))}
    </div>
  );
}
