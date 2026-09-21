'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
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
/** Prompt 76: for a pairing-only reading (Chapter 151 today; any future
 * question whose resolved casting display is `mothers_and_pairing`) the four
 * rows ARE the four Mothers themselves — nothing else is derived from them
 * except their own pairing — so they are named as such instead of with the
 * generic draw-stage wording, which reads like the first four stages of a
 * sixteen-house chart. Same board, same tap mechanics, same four-line
 * structure; only these row names and the surrounding copy change. */
const MOTHER_NAMES = ['Mother 1', 'Mother 2', 'Mother 3', 'Mother 4'];
/** The source ("The Master of Geomancy") describes making "4 straight lines
 * with dots" and only afterward names the resulting four figures the
 * "Umuhat mother stars." It never assigns Fire/Air/Water/Earth to these four
 * casting rows — that came from another app and is not established here, so
 * the rows are labelled plainly as what they are while being drawn. */
const LINES = [{ label: 'Line 1' }, { label: 'Line 2' }, { label: 'Line 3' }, { label: 'Line 4' }] as const;

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
export function CastingBoard({
  onComplete,
  mothersOnly = false,
}: {
  onComplete: (mothers: [Pattern, Pattern, Pattern, Pattern]) => void;
  /** Prompt 76: true for a question whose resolved casting display is
   * `mothers_and_pairing` (Chapter 151 today) — the reading uses only the
   * four Mothers themselves, never a derived shield, so the board says so
   * instead of the generic "draw" wording. Caller-supplied, generic: this
   * component has no question/chapter awareness of its own. */
  mothersOnly?: boolean;
}) {
  const [taps, setTaps] = useState<TapGrid>(emptyTapGrid);
  // Which row pulsed last, and a sequence number so that tapping the SAME row
  // again restarts the animation rather than being ignored as an unchanged key.
  const [pulse, setPulse] = useState<{ draw: number; line: number; seq: number } | null>(null);
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
  function tap(drawIndex: number, lineIndex: number) {
    seq.current += 1;
    // Functional update: a burst of rapid taps queues up and every one of
    // them lands, even if React batches the renders.
    setTaps((prev) => registerTap(prev, drawIndex, lineIndex));
    setPulse({ draw: drawIndex, line: lineIndex, seq: seq.current });
    // Deliberately never "Line 1, 8 taps" — the screen reader hears exactly
    // what the eye sees: that the mark registered.
    setAnnouncement(`${LINES[lineIndex].label} tap registered.`);
    tick();
  }

  function resetAll() {
    setTaps(emptyTapGrid());
    setPulse(null);
    setAnnouncement(
      mothersOnly
        ? 'The board has been cleared. Start again with the first Mother.'
        : 'The board has been cleared. Start again with the first draw.',
    );
  }

  function castReading() {
    if (!allDone) return;
    onComplete(mothersFromTaps(taps));
  }

  const rowNames = mothersOnly ? MOTHER_NAMES : DRAW_NAMES;

  return (
    <div>
      <p className="mb-1.5 text-center type-section font-semibold text-sand-light">
        {mothersOnly ? 'Cast the four Mothers.' : 'Tap each line until you naturally stop.'}
      </p>
      <p className="mx-auto mb-5 max-w-[19rem] text-center type-body text-clay-light">
        {mothersOnly
          ? 'Draw the four Mothers (Umuhat). Each Mother has four lines — don’t count your taps, follow your intuition.'
          : 'Don’t count your taps — follow your intuition.'}
      </p>

      {/* One live region for the whole board: it says that a mark registered,
          never how many there are. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="space-y-3">
        {rowNames.map((name, drawIndex) => {
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
                      draws/Mothers this is, and how many of its lines carry
                      a mark. Two full JSX branches (not one string built in
                      JS) so the plain "Draw N of 4" wording stays exactly
                      what it was before Prompt 76 for every non-mothersOnly
                      board. */}
                  <p className="type-meta text-sand/65">
                    {mothersOnly ? (
                      <>
                        Mother {drawIndex + 1} of 4 · {drawDone ? 'all four lines marked' : `${marked} of 4 lines marked`}
                      </>
                    ) : (
                      <>
                        Draw {drawIndex + 1} of 4 · {drawDone ? 'all four lines marked' : `${marked} of 4 lines marked`}
                      </>
                    )}
                  </p>
                </div>
                {drawDone ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-sand/20 px-2 py-0.5 type-meta text-sand/70">
                    <Check size={13} aria-hidden /> Done
                  </span>
                ) : null}
              </div>

              {LINES.map((line, lineIndex) => {
                const lineMarked = drawTaps[lineIndex] > 0;
                const pulsing = pulse?.draw === drawIndex && pulse.line === lineIndex;
                return (
                  <button
                    key={line.label}
                    type="button"
                    onClick={() => tap(drawIndex, lineIndex)}
                    aria-label={`${line.label}. Tap to register a mark.`}
                    style={{ touchAction: 'manipulation' }}
                    className={`relative flex min-h-[56px] w-full select-none items-center justify-between gap-3 overflow-hidden border-b border-sand/8 px-3 py-3 text-left last:border-b-0 active:bg-clay/10 ${
                      lineMarked ? 'bg-sand/[0.04]' : ''
                    }`}
                  >
                    {/* The pulse lives on its own element, keyed by the tap's
                        sequence number: tapping the same line twice in a row
                        restarts the animation, and because the pulse is not
                        the button itself, keyboard focus is never lost. */}
                    {pulsing ? (
                      <span key={pulse!.seq} aria-hidden className="tap-pulse pointer-events-none absolute inset-0" />
                    ) : null}
                    <span className="relative type-evidence font-medium uppercase tracking-wide text-sand-light">
                      {line.label}
                    </span>
                    <span className={`relative type-meta ${lineMarked ? 'text-sand/70' : 'text-sand/65'}`}>
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
          {mothersOnly ? 'Four Mothers complete.' : 'Four draws complete.'}
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
        className="mx-auto mt-2.5 flex min-h-[44px] items-center justify-center gap-1.5 px-4 py-1 type-meta text-sand/65"
      >
        <RotateCcw size={14} aria-hidden /> {mothersOnly ? 'Start the Mothers again' : 'Start the draws again'}
      </button>
    </div>
  );
}
