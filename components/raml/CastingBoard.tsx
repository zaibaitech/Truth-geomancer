'use client';

import { useState } from 'react';
import { Flame, Wind, Droplet, Mountain, RotateCcw } from 'lucide-react';
import { FigureGlyph } from './FigureGlyph';
import { reduceCount } from '@/lib/raml/casting';
import type { Pattern } from '@/content/stars';

const DRAW_NAMES = ['1st Draw', '2nd Draw', '3rd Draw', '4th Draw'];
const ELEMENTS = [
  { label: 'Fire', icon: Flame },
  { label: 'Air', icon: Wind },
  { label: 'Water', icon: Droplet },
  { label: 'Earth', icon: Mountain },
] as const;

function emptyGrid(): number[][] {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

export function CastingBoard({ onComplete }: { onComplete: (mothers: [Pattern, Pattern, Pattern, Pattern]) => void }) {
  const [taps, setTaps] = useState<number[][]>(emptyGrid);

  const allDone = taps.every((draw) => draw.every((n) => n > 0));

  function tap(drawIndex: number, elementIndex: number) {
    setTaps((prev) => {
      const next = prev.map((row) => [...row]);
      next[drawIndex][elementIndex] += 1;
      return next;
    });
  }

  function resetAll() {
    setTaps(emptyGrid());
  }

  function castReading() {
    if (!allDone) return;
    const mothers = taps.map((draw) => draw.map((n) => reduceCount(n)) as Pattern) as [Pattern, Pattern, Pattern, Pattern];
    onComplete(mothers);
  }

  return (
    <div>
      <p className="mb-1 text-center text-sm font-semibold uppercase tracking-widest text-sand-light">
        The Four Draws
      </p>
      <p className="mb-5 text-center text-xs text-sand/50">
        Tap on each line until you naturally stop — don’t count, follow your intuition.
      </p>

      <div className="space-y-3">
        {DRAW_NAMES.map((name, drawIndex) => {
          const drawTaps = taps[drawIndex];
          const drawDone = drawTaps.every((n) => n > 0);
          const pattern = drawDone ? (drawTaps.map((n) => reduceCount(n)) as Pattern) : null;

          return (
            <div key={name} className="overflow-hidden rounded-2xl border border-sand/12 bg-ink-card">
              <div className="flex items-center justify-between border-b border-sand/10 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] text-sand/60">
                    {drawIndex + 1}
                  </span>
                  <span className="text-sm font-medium text-sand-light">{name}</span>
                </div>
                {pattern ? (
                  <FigureGlyph pattern={pattern} size="sm" />
                ) : (
                  <span className="text-[11px] text-sand/35">
                    {drawTaps.filter((n) => n > 0).length}/4
                  </span>
                )}
              </div>
              {ELEMENTS.map((el, elementIndex) => (
                <button
                  key={el.label}
                  type="button"
                  onClick={() => tap(drawIndex, elementIndex)}
                  className="flex w-full items-center justify-between border-b border-sand/8 px-3 py-3 last:border-b-0 active:bg-clay/5"
                >
                  <div className="flex items-center gap-2.5">
                    <el.icon size={15} className="text-clay-light" />
                    <span className="text-[11px] font-medium uppercase tracking-wide text-sand/60">{el.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-logo text-lg ${drawTaps[elementIndex] > 0 ? 'text-sand-light' : 'text-sand/25'}`}>
                      {drawTaps[elementIndex]}
                    </span>
                    <span className="text-[9px] uppercase tracking-wide text-sand/25">tap</span>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={castReading}
        disabled={!allDone}
        className="mt-5 w-full rounded-xl bg-clay py-3 text-sm font-semibold text-ink disabled:opacity-30"
      >
        Cast Reading
      </button>
      <button
        type="button"
        onClick={resetAll}
        className="mx-auto mt-2.5 flex items-center justify-center gap-1.5 py-1 text-xs text-sand/45"
      >
        <RotateCcw size={13} /> Reset All
      </button>
    </div>
  );
}
