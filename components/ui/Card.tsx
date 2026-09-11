import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  padding = 'p-4',
  id,
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`rounded-2xl border border-sand/10 bg-ink-card ${padding} ${className}`}>
      {children}
    </div>
  );
}
