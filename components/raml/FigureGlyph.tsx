import type { Pattern } from '@/content/stars';

const sizeMap = {
  sm: { dot: 6, gap: 4, row: 10 },
  md: { dot: 9, gap: 6, row: 14 },
  lg: { dot: 13, gap: 8, row: 20 },
};

export function FigureGlyph({
  pattern,
  size = 'md',
  tone = '#d9b878',
  animated = false,
}: {
  pattern: Pattern;
  size?: keyof typeof sizeMap;
  tone?: string;
  animated?: boolean;
}) {
  const { dot, gap, row } = sizeMap[size];
  const width = dot * 2 + gap;

  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: row - dot }}
      aria-label={`Figure pattern ${pattern.join('-')}`}
    >
      {pattern.map((count, i) => (
        <div key={i} className="flex items-center justify-center" style={{ width, height: dot, gap }}>
          {Array.from({ length: count }).map((_, j) => (
            <span
              key={j}
              className={animated ? 'dot-in' : ''}
              style={{
                width: dot,
                height: dot,
                borderRadius: '9999px',
                background: tone,
                display: 'inline-block',
                animationDelay: animated ? `${(i * 2 + j) * 45}ms` : undefined,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
