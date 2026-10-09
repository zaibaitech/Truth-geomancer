import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ChevronRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { KANZUL_BOOK_PATH, MASTER_BOOK_PATH, isLivePath } from '@/content/public/seoPages';
import type { Crumb } from '@/lib/seo';

// Building blocks for the public learning pages (SEO Phase 1). Server
// Components only, and every class here is one the app already uses
// (Header/Card, the reader's prose, /more's list rows, the book page's
// buttons), so these pages add no new visual language.

const INLINE_LINK = 'font-semibold text-clay-light underline underline-offset-2';

/** An inline link that falls back to plain text while its target is not published yet. */
export function SeoLink({ href, children }: { href: string; children: ReactNode }) {
  if (!isLivePath(href)) return <>{children}</>;
  return (
    <Link href={href} className={INLINE_LINK}>
      {children}
    </Link>
  );
}

/** Renders its children only once `href` is a published page. */
export function IfLive({ href, children }: { href: string; children: ReactNode }) {
  return isLivePath(href) ? <>{children}</> : null;
}

/** A standalone "Go to … →" link (the dashboard's "See all" style), hidden until its target is published. */
export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <IfLive href={href}>
      <p>
        <Link href={href} className="inline-flex min-h-[44px] items-center gap-1 type-meta font-medium text-clay-light">
          {children} <ArrowRight size={13} />
        </Link>
      </p>
    </IfLive>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="px-4 pt-3">
      <ol className="flex flex-wrap items-center gap-1 type-label text-sand/65">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page">{c.name}</span>
              ) : (
                <>
                  <Link href={c.path} className="underline underline-offset-2">
                    {c.name}
                  </Link>
                  <ChevronRight size={12} aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="pt-2 font-logo type-section text-sand-light">{children}</h2>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="type-body leading-[1.7] text-sand/80">{children}</p>;
}

/** A list of linked rows in one Card, the same pattern as the /more menu. Rows whose page is not published are left out. */
export function LinkList({
  items,
}: {
  items: { href: string; title: string; description: string; icon: LucideIcon }[];
}) {
  const live = items.filter((item) => isLivePath(item.href));
  return (
    <Card padding="p-0">
      {live.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-4 py-3.5 ${i !== live.length - 1 ? 'border-b border-sand/10' : ''}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand/15 text-clay-light">
            <item.icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="type-body text-sand-light">{item.title}</p>
            <p className="type-label text-sand/65">{item.description}</p>
          </div>
          <ChevronRight size={16} className="text-sand/65" />
        </Link>
      ))}
    </Card>
  );
}

/** "The full meanings and methods are in …" with links to both books. */
export function BooksLine({ lead = 'The full meanings and methods are in' }: { lead?: string }) {
  return (
    <P>
      {lead} <SeoLink href={MASTER_BOOK_PATH}>The Master of Geomancy</SeoLink> and{' '}
      <SeoLink href={KANZUL_BOOK_PATH}>Kanzul Mikban</SeoLink>.
    </P>
  );
}

/** The closing call to action on every learning page: cast free (the book page's primary button) and see the books. */
export function LearnCta() {
  return (
    <div className="space-y-3 pt-2">
      <Link href="/raml" className="block rounded-xl bg-clay px-4 py-3 text-center type-body font-semibold text-ink">
        Cast a free chart →
      </Link>
      <Link
        href="/books"
        className="flex items-center justify-center gap-2 rounded-2xl border border-sand/10 bg-ink-card py-3 type-body text-sand/65"
      >
        See the books →
      </Link>
    </div>
  );
}
