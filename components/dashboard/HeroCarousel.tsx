'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { HERO_VALUE_PROP } from '@/lib/dashboard/copy';
import { SandBoardIllustration } from './SandBoardIllustration';

// Prompt 61: slide 1 carries the app's fuller value proposition (source
// books + interactive casting/practice, not just a reader) since it's what
// a first-time visitor sees before the carousel ever rotates — its own
// copy lives in lib/dashboard/copy.ts so it stays reusable/testable rather
// than duplicated here.
const SLIDES = [
  { ...HERO_VALUE_PROP },
  {
    eyebrow: 'The Library',
    heading: ['Study the', 'Manuscripts.'],
    body: 'Read The Master of Geomancy chapter by chapter — the classical method, transcribed in full.',
    cta: 'Open the Library',
    href: '/books',
  },
  {
    eyebrow: 'My Star',
    heading: ['Revisit Your', 'Readings.'],
    body: 'Every chart you cast is saved on this device — reopen any of them, any time.',
    cta: 'View My Star',
    href: '/star',
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="px-4">
      <div className="relative overflow-hidden rounded-3xl border border-sand/15 bg-gradient-to-br from-ink-card via-ink to-ink-light shadow-[0_0_50px_-20px_rgba(217,184,120,0.4)]">
        <PatternOverlay opacity={0.05} />
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(182,85,44,0.35), transparent 70%)' }}
        />
        <div className="relative flex items-center gap-4 px-5 pb-5 pt-6">
          <div className="min-w-0 flex-1">
            <p className="type-label font-semibold uppercase tracking-[0.2em] text-clay-light">
              {slide.eyebrow}
            </p>
            <h2 className="mt-1.5 font-logo type-title leading-[1.15] text-sand-light">
              {slide.heading.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-2.5 type-meta leading-relaxed text-sand/65">{slide.body}</p>
            <Link
              href={slide.href}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-sand-light to-sand px-4 py-2.5 type-meta font-semibold text-ink shadow-[0_4px_14px_-4px_rgba(217,184,120,0.6)] transition-transform active:scale-95"
            >
              {slide.cta} <ArrowRight size={14} />
            </Link>
          </div>
          <SandBoardIllustration className="w-[38%] shrink-0" />
        </div>

        <div className="relative flex justify-center gap-1.5 pb-4">
          {SLIDES.map((s, i) => (
            <button
              key={s.href}
              aria-label={`Show ${s.eyebrow} slide`}
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                background: i === index ? '#d9b878' : 'rgba(217,184,120,0.25)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
