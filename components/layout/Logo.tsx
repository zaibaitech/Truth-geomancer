export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ direction: 'ltr' }}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="4" r="2" fill="#d9b878" />
        <circle cx="13" cy="11" r="2" fill="#d9b878" />
        <circle cx="10" cy="18" r="2" fill="#d9b878" />
        <circle cx="16" cy="18" r="2" fill="#d9b878" />
        <circle cx="13" cy="24" r="1.6" fill="#b6552c" />
      </svg>
      <span className="font-logo text-lg tracking-wide text-sand-light">Truth Geomancer</span>
    </div>
  );
}
