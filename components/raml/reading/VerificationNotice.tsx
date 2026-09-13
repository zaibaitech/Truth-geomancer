/** Section 10's partial-verification notice — an always-visible one-line
 * sentence (exact required copy, composed in reading.ts) plus a link into
 * the calculation details, where the actual needs_review/uncertain methods
 * and their reviewNotes are already listed. Never shown for the fully
 * insufficient state, which uses its own copy in OutcomeCard instead. */
export function VerificationNotice({ text, onExpand }: { text: string; onExpand: () => void }) {
  return (
    <p className="px-1 type-evidence text-sand/50">
      {text}{' '}
      <button onClick={onExpand} className="underline underline-offset-2">
        Source verification notes
      </button>
    </p>
  );
}
