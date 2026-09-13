/** The manuscript body itself (Prompt 18, section 8). This was pinned at
 * 17px, which meant the one screen a student or researcher actually reads at
 * length was the only one the text-size control could not touch. It is on the
 * shared scale now; the justified measure and the 1.7 leading stay, because
 * they are what make a long passage readable rather than what make it big. */
function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="manuscript-paragraph mb-5 break-words text-justify type-body leading-[1.7] text-sand/80 hyphens-auto last:mb-0">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="text-sand-light">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return <div>{paragraphs.map((p, i) => renderInline(p, i))}</div>;
}
