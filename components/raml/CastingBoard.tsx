'use client';

import { useEffect, useRef, useState } from 'react';
import { Flame, Wind, Droplet, Mountain, RotateCcw, Check } from 'lucide-react';
import {
  activeDrawIndex,
  emptyTapGrid,
  isCastComplete,
  isDrawComplete,
  linesMarked,
  mothersFromTaps,
  registerTap,
  type TapGrid,
} from '@/lib/raml/castingBoardState';
import type { Pattern } from '@/content/stars';

const DRAW_NAMES = ['1st Draw', '2nd Draw', '3rd Draw', '4th Draw'];
const ELEMENTS = [
  { label: 'Fire', icon: Flame },
  { label: 'Air', icon: Wind },
  { label: 'Water', icon: Droplet },
  { label: 'Earth', icon: Mountain },
] as const;

/** One short tick per accepted tap, where the device offers one. Progressive
 * enhancement only: the casting works identically without it, and nothing
 * about the figure depends on whether it fired. */
function tick() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(12);
    }
  } catch {
    // Some browsers expose vibrate but refuse it (no user gesture, a policy,
    // a desktop build). A refused tick is not an error the reader should ever
    // hear about.
  }
}

/**
 * The casting board.
 *
 * The engine needs the number of marks on each line — parity decides whether
 * the line is single or double — and that count is still kept here, exactly as
 * before, in `taps`. What changed in Prompt 17 is that the count is no longer
 * SHOWN. The old board printed "8 tap" beside each line, which turned an act
 * of intuition into an arithmetic exercise, and it revealed each draw's figure
 * as soon as its four lines were marked, letting a user work the result out
 * mid-cast.
 *
 * Now a tap answers with a pulse, a haptic tick and a quiet "marked" state —
 * enough to know it registered, nothing from which to count. The figures stay
 * hidden until the whole casting is complete.
 */
export function CastingBoard({ onComplete }: { onComplete: (mothers: [Pattern, Pattern, Pattern, Pattern]) => void }) {
  const [taps, setTaps] = useState<TapGrid>(emptyTapGrid);
  // Which row pulsed last, and a sequence number so that tapping the SAME row
  // again restarts the animation rather than being ignored as an unchanged key.
  const [pulse, setPulse] = useState<{ draw: number; element: number; seq: number } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const seq = useRef(0);

  const allDone = isCastComplete(taps);
  const activeDraw = activeDrawIndex(taps);

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(null), 450);
    return () => clearTimeout(t);
  }, [pulse]);

  // Only `onClick` registers a mark. A pointer/touch handler alongside it
  // would double-count a single touch on some browsers, and the count is the
  // one thing here that must stay exact.
  function tap(drawIndex: number, elementIndex: number) {
    seq.current += 1;
    // Functional update: a burst of rapid taps queues up and every one of
    // them lands, even if React batches the renders.
    setTaps((prev) => registerTap(prev, drawIndex, elementIndex));
    setPulse({ draw: drawIndex, element: elementIndex, seq: seq.current });
    // Deliberately never "Fire, 8 taps" — the screen reader hears exactly what
    // the eye sees: that the mark registered.
    setAnnouncement(`${ELEMENTS[elementIndex].label} tap registered.`);
    tick();
  }

  function resetAll() {
    setTaps(emptyTapGrid());
    setPulse(null);
    setAnnouncement('The board has been cleared. Start again with the first draw.');
  }

  function castReading() {
    if (!allDone) return;
    onComplete(mothersFromTaps(taps));
  }

  return (
    <div>
      <p className="mb-1.5 text-center type-section font-semibold text-sand-light">
        Tap each line until you naturally stop.
      </p>
      <p className="mx-auto mb-5 max-w-[19rem] text-center type-body text-clay-light">
        Don’t count your taps — follow your intuition.
      </p>

      {/* One live region for the whole board: it says that a mark registered,
          never how many there are. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="space-y-3">
        {DRAW_NAMES.map((name, drawIndex) => {
          const drawTaps = taps[drawIndex];
          const marked = linesMarked(taps, drawIndex);
          const drawDone = isDrawComplete(taps, drawIndex);
          const isActive = drawIndex === activeDraw && !allDone;

          return (
            <div
              key={name}
              className={`overflow-hidden rounded-2xl border bg-ink-card ${
                isActive ? 'border-clay/40' : 'border-sand/12'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-sand/10 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="type-meta font-medium text-sand-light">{name}</p>
                  {/* A stage indicator, not a tap counter: which of the four
                      draws this is, and how many of its lines carry a mark. */}
                  <p className="type-meta text-sand/45">
                    Draw {drawIndex + 1} of 4 · {drawDone ? 'all four lines marked' : `${marked} of 4 lines marked`}
                  </p>
                </div>
                {drawDone ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-sand/20 px-2 py-0.5 type-meta text-sand/70">
                    <Check size={13} aria-hidden /> Done
                  </span>
                ) : null}
              </div>

              {ELEMENTS.map((el, elementIndex) => {
                const lineMarked = drawTaps[elementIndex] > 0;
                const pulsing = pulse?.draw === drawIndex && pulse.element === elementIndex;
                return (
                  <button
                    key={el.label}
                    type="button"
                    onClick={() => tap(drawIndex, elementIndex)}
                    aria-label={`${el.label} draw. Tap to register a mark.`}
                    style={{ touchAction: 'manipulation' }}
                    className={`relative flex min-h-[56px] w-full select-none items-center justify-between gap-3 overflow-hidden border-b border-sand/8 px-3 py-3 text-left last:border-b-0 active:bg-clay/10 ${
                      lineMarked ? 'bg-sand/[0.04]' : ''
                    }`}
                  >
                    {/* The pulse lives on its own element, keyed by the tap's
                        sequence number: tapping the same line twice in a row
                        restarts the animation, and because the element is not
                        the button itself, keyboard focus is never lost. */}
                    {pulsing ? (
                      <span key={pulse!.seq} aria-hidden className="tap-pulse pointer-events-none absolute inset-0" />
                    ) : null}
                    <span className="relative flex items-center gap-2.5">
                      <el.icon size={18} className={lineMarked ? 'text-clay-light' : 'text-clay-light/70'} aria-hidden />
                      <span className="type-evidence font-medium uppercase tracking-wide text-sand-light">
                        {el.label}
                      </span>
                    </span>
                    <span className={`relative type-meta ${lineMarked ? 'text-sand/55' : 'text-sand/35'}`}>
                      {lineMarked ? 'Marked · tap again if you wish' : 'Tap to draw'}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <p role="status" className="mt-5 text-center type-body text-sand-light">
          Four draws complete.
        </p>
      ) : null}

      <button
        type="button"
        onClick={castReading}
        disabled={!allDone}
        className="mt-3 min-h-[52px] w-full rounded-xl bg-clay py-3 type-section font-semibold text-ink disabled:opacity-30"
      >
        Cast Reading
      </button>
      <button
        type="button"
        onClick={resetAll}
        className="mx-auto mt-2.5 flex min-h-[44px] items-center justify-center gap-1.5 px-4 py-1 type-meta text-sand/45"
      >
        <RotateCcw size={14} aria-hidden /> Start the draws again
      </button>
    </div>
  );
}
