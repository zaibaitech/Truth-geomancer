import Link from 'next/link';
import { ChevronRight, GraduationCap } from 'lucide-react';

// SEO Phase 1 (Stage 1b): one small row on the home page pointing to the
// free learning pages at /learn. Server Component; it reuses the Explore
// the App tile classes and the /more row layout, so nothing new visually.
export function LearnRow() {
  return (
    <div className="px-4">
      <Link
        href="/learn"
        className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-sand/12 bg-ink-card px-4 py-3 transition-colors hover:border-sand/25 active:scale-[0.98]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand/15 bg-ink text-clay-light">
          <GraduationCap size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-body font-semibold text-sand-light">Learn Ilm al-Raml</p>
          <p className="type-label text-sand/65">Free basics of the science of the sand</p>
        </div>
        <ChevronRight size={16} className="text-sand/65" />
      </Link>
    </div>
  );
}
