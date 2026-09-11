const tones = {
  fire: 'bg-clay/20 text-clay-light border-clay/30',
  air: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
  water: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  sand: 'bg-sand/15 text-sand-light border-sand/25',
  neutral: 'bg-sand/10 text-sand/70 border-sand/15',
} as const;

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
