import type { SourceReference as SourceReferenceType } from '@/lib/raml/engine/reading';

/** Section 9: always-shown, always-traceable — never buried inside the
 * expandable calculation details, even though that's where the exact quotes
 * live. Just the book/chapter, in the same wording used throughout. */
export function SourceReference({ sources }: { sources: SourceReferenceType[] }) {
  if (sources.length === 0) return null;
  return (
    <p className="px-1 text-[11px] uppercase tracking-widest text-sand/35">
      Source · {sources.map((s) => s.label).join(' · ')}
    </p>
  );
}
