'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
  DEFAULT_READER_SIZE,
  READER_SIZES,
  readReaderSize,
  setReaderSize,
  type ReaderSize,
} from '@/lib/raml/readerSize';

/** Three steps, no typography panel (Prompt 18, section 3). The choice scales
 * the reading type scale only — figures, charts, icons and the logo keep their
 * geometry, and no geomancy value is touched. */
export function ReaderSizeControl() {
  const [size, setSize] = useState<ReaderSize>(DEFAULT_READER_SIZE);
  const [persisted, setPersisted] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setSize(readReaderSize());
  }, []);

  function choose(next: ReaderSize) {
    const ok = setReaderSize(next);
    setSize(next);
    setPersisted(ok);
    const label = READER_SIZES.find((s) => s.id === next)?.label ?? next;
    setAnnouncement(`Text size set to ${label}.`);
  }

  return (
    <Card>
      <p className="mb-1 type-meta uppercase tracking-widest text-sand/65">Reading</p>
      <h2 className="type-section font-semibold text-sand-light">Text size</h2>
      <p className="mt-1 type-meta text-sand/65">
        Applies to readings, source passages and question text. Charts and figures keep their own size.
      </p>

      {/* A radio group rather than three toggle buttons: a screen reader then
          announces it as one choice with three options, and arrow keys move
          between them the way a reader expects. */}
      <div role="radiogroup" aria-label="Text size" className="mt-3 space-y-2">
        {READER_SIZES.map((option) => {
          const selected = size === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(option.id)}
              className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${
                selected ? 'border-clay/60 bg-clay/10' : 'border-sand/15'
              }`}
            >
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? 'border-clay-light' : 'border-sand/40'
                }`}
              >
                {selected ? <span className="h-2.5 w-2.5 rounded-full bg-clay-light" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block type-body font-medium text-sand-light">{option.label}</span>
                <span className="block type-label text-sand/65">{option.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Sample text, so the choice can be judged rather than guessed. */}
      <div className="mt-3 rounded-xl border border-sand/10 bg-ink px-3 py-3">
        <p className="type-meta uppercase tracking-widest text-sand/65">Preview</p>
        <p className="mt-1 type-quote italic text-sand/75">
          “After casting the chart, pick h1, h5, h9 and h14 and add them.”
        </p>
      </div>

      {!persisted ? (
        <p className="mt-3 type-meta text-clay-light">
          This browser won’t let the app remember the setting, so it will go back to Standard next time.
        </p>
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </Card>
  );
}
