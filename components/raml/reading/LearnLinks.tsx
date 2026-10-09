import Link from 'next/link';
import { LEARN_COPY, LEARN_LINKS } from '@/content/public/freeCastLearning';

/** "Keep learning" links. Only entries whose destination page exists in this
 * build are enabled (enforced by tests); with none enabled this renders nothing. */
export function LearnLinks() {
  const links = LEARN_LINKS.filter((l) => l.enabled);
  if (links.length === 0) return null;
  return (
    <nav aria-label={LEARN_COPY.linksHeading} className="px-1">
      <p className="type-meta uppercase tracking-widest text-sand/65">{LEARN_COPY.linksHeading}</p>
      <ul className="mt-1.5 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex min-h-[44px] items-center rounded-xl border border-sand/15 px-3 type-body text-clay-light">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
