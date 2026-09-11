function renderInline(text: string, key: number) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="mb-5 text-justify text-[17px] leading-[1.7] text-sand/80 hyphens-auto last:mb-0">
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
