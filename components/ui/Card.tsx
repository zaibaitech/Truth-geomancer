import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  padding = 'p-4',
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`rounded-2xl border border-sand/10 bg-ink-card ${padding} ${className}`}>
      {children}
    </div>
  );
}
