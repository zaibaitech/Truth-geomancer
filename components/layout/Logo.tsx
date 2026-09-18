export function Emblem({ size = 26, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <path
        d="M24 2 L28.5 15.5 L42 12 L32.5 22.5 L46 24 L32.5 25.5 L42 36 L28.5 32.5 L24 46 L19.5 32.5 L6 36 L15.5 25.5 L2 24 L15.5 22.5 L6 12 L19.5 15.5 Z"
        stroke="#d9b878"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="24" cy="24" r="10.5" fill="#161009" stroke="#d9b878" strokeWidth="0.8" opacity="0.85" />
      <g fill="#d9b878">
        <circle cx="20" cy="19" r="1.7" />
        <circle cx="28" cy="19" r="1.7" />
        <circle cx="19" cy="24" r="1.7" />
        <circle cx="29" cy="24" r="1.7" />
        <circle cx="20" cy="29" r="1.7" />
        <circle cx="28" cy="29" r="1.7" />
      </g>
      <circle cx="24" cy="24" r="1.9" fill="#b6552c" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} style={{ direction: 'ltr' }}>
      <Emblem />
      <span className="font-logo text-lg tracking-wide text-sand-light">Truth Geomancer</span>
    </div>
  );
}
