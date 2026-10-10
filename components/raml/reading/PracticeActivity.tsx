'use client';

import { useId, useState } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { FigureGlyph } from '@/components/raml/FigureGlyph';
import { LEARN_COPY, WORKED_EXAMPLE, type DotCount } from '@/content/public/freeCastLearning';
import { checkAttempt, type Attempt, type PracticePlan } from '@/lib/raml/readingPractice';

const ROWS = [0, 1, 2, 3] as const;
const EMPTY: Attempt = [null, null, null, null];

function ExampleTable() {
  const { a, b, result } = WORKED_EXAMPLE;
  const lines: Array<[string, readonly DotCount[]]> = [
    ['Figure A', a],
    ['Figure B', b],
    ['Result', result],
  ];
  return (
    <table className="w-full type-evidence text-sand/70">
      <caption className="pb-1.5 text-left type-label text-sand/65">{LEARN_COPY.exampleCaption}</caption>
      <thead>
        <tr>
          <td />
          {ROWS.map((r) => (
            <th key={r} scope="col" className="px-1 py-1 text-left type-label font-medium text-sand/65">
              {LEARN_COPY.rowLegend(r + 1)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map(([name, cells]) => (
          <tr key={name} className="border-t border-sand/10">
            <th scope="row" className="whitespace-nowrap px-1 py-1.5 text-left font-medium text-sand-light">
              {name}
            </th>
            {cells.map((c, i) => (
              <td key={i} className="px-1 py-1.5 tabular-nums text-sand-light">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Optional addition practice for an eligible free sample reading (see
 * lib/raml/readingPractice.ts). All state is local to this component: nothing
 * is stored, sent or preselected, and the engine's result is not rendered until
 * the reader chooses "Show the answer". */
export function PracticeActivity({ plan }: { plan: PracticePlan }) {
  const uid = useId();
  const [attempt, setAttempt] = useState<Attempt>(EMPTY);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const outcome = checked ? checkAttempt(plan.answerKey, attempt) : null;

  const choose = (row: number, value: 1 | 2) => {
    setAttempt((prev) => prev.map((v, i) => (i === row ? value : v)) as Attempt);
    setChecked(false);
  };
  const reset = () => {
    setAttempt(EMPTY);
    setChecked(false);
    setRevealed(false);
  };

  const message =
    outcome === 'correct'
      ? LEARN_COPY.correct
      : outcome === 'incorrect'
        ? LEARN_COPY.incorrect
        : outcome === 'incomplete'
          ? LEARN_COPY.incomplete
          : revealed
            ? LEARN_COPY.revealed
            : '';

  return (
    <Card padding="p-0">
      <details className="group">
        <summary className="flex min-h-[48px] cursor-pointer items-center px-4 py-3 type-section font-semibold text-sand-light">
          {LEARN_COPY.practiceHeading}
        </summary>
        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-1.5">
            <p className="type-body text-sand/70">{LEARN_COPY.figureLine}</p>
            <p className="type-body font-medium text-sand-light">{LEARN_COPY.ruleHeading}</p>
            <p className="type-body text-sand/70">{LEARN_COPY.rule}</p>
          </div>

          <ExampleTable />

          <div className="border-t border-sand/10 pt-4">
            <p className="type-body text-sand/70">{LEARN_COPY.practiceIntro}</p>
            <ol className="mt-2 space-y-1.5">
              {plan.houses.map((h) => (
                <li key={h.number} className="flex items-center gap-3 rounded-xl border border-sand/10 bg-ink px-3 py-2">
                  <FigureGlyph pattern={h.pattern} size="sm" />
                  <p className="type-body text-sand-light">
                    House {h.number} · {h.title}
                    <span className="block type-label text-sand/65">{h.figureName}</span>
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {ROWS.map((r) => (
                <fieldset key={r} className="min-w-0 rounded-xl border border-sand/10 px-2 pb-2 pt-1">
                  <legend className="px-1 type-label font-medium text-sand-light">{LEARN_COPY.rowLegend(r + 1)}</legend>
                  {([1, 2] as const).map((v) => {
                    const id = `${uid}-r${r}-${v}`;
                    return (
                      <label
                        key={v}
                        htmlFor={id}
                        className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg px-2 type-body ${
                          attempt[r] === v ? 'border border-clay-light text-sand-light' : 'border border-transparent text-sand/70'
                        }`}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={`${uid}-row-${r}`}
                          value={v}
                          checked={attempt[r] === v}
                          onChange={() => choose(r, v)}
                          className="h-5 w-5 shrink-0 accent-clay"
                        />
                        {v === 1 ? LEARN_COPY.oneDot : LEARN_COPY.twoDots}
                      </label>
                    );
                  })}
                </fieldset>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setChecked(true)}
                className="min-h-[44px] rounded-xl bg-sand-light px-4 py-2.5 type-body font-semibold text-ink"
              >
                {LEARN_COPY.check}
              </button>
              <button
                type="button"
                onClick={reset}
                className="min-h-[44px] rounded-xl border border-sand/15 px-4 py-2.5 type-body text-sand-light"
              >
                {LEARN_COPY.tryAgain}
              </button>
              {revealed ? null : (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="min-h-[44px] rounded-xl border border-sand/15 px-4 py-2.5 type-body text-sand-light"
                >
                  {LEARN_COPY.showAnswer}
                </button>
              )}
            </div>

            <p role="status" aria-live="polite" className="mt-3 flex items-start gap-2 type-body text-sand-light">
              {outcome === 'correct' ? <Check size={16} className="mt-1 shrink-0" aria-hidden /> : null}
              {outcome === 'incorrect' ? <CircleAlert size={16} className="mt-1 shrink-0" aria-hidden /> : null}
              <span>{message}</span>
            </p>

            {revealed ? (
              <div className="mt-2 space-y-2 rounded-xl border border-sand/10 bg-ink px-3 py-3">
                <div className="flex items-center gap-3">
                  <FigureGlyph pattern={plan.answerKey} size="md" />
                  <p className="type-body font-semibold text-sand-light">{plan.resultName}</p>
                </div>
                <p className="type-evidence break-words text-sand/70">{plan.workingLine}</p>
              </div>
            ) : null}
          </div>
        </div>
      </details>
    </Card>
  );
}
