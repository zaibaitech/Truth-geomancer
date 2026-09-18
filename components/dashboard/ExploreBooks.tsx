import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { BookCover } from '@/components/books/BookCover';
import { WhatsAppButton } from '@/components/whatsapp/WhatsAppButton';
import { buildExploreBookCards, type ExploreBookCard } from '@/lib/dashboard/exploreBooks';
import { EXPLORE_BOOKS_COPY } from '@/lib/dashboard/copy';
import { buildBookContactMessage, buildPurchaseInquiryMessage } from '@/lib/whatsapp';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getProductAccessStatus, type ProductAccessStatus } from '@/lib/server/purchaseStatus';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';

// Prompt 61/63: the dashboard's primary discovery/storefront section — a
// new visitor should see the books and the path to the author from here,
// without opening a book detail page first. Reuses the exact same
// getProductAccessStatus() every purchase page already calls (Prompt 28,
// Phase 13) — never a second, separately maintained ownership check — and
// PRODUCT_CATALOGUE/BOOKS as the only sources of book identity, so no book
// name is ever hardcoded here.
//
// Prompt 64: Prompt 63 stacked a full-width primary button ABOVE a
// full-width "Ask the Author" pill (two 40px+ rows), which alone added
// ~90px to every card — the single biggest contributor to the "books need
// too much scrolling" problem. The primary CTA stays a full pill (its own
// label is the one thing on the card a visitor must be able to read); the
// secondary "Ask the Author" action becomes the existing WhatsAppButton's
// new `iconOnly` mode, placed beside it in the same row instead of below
// it. Its accessible name (`aria-label`) is unchanged — still the full
// "Ask the Author (opens WhatsApp in a new tab)" — only its visual shape
// changes. Both stay a real 44px tall (the previous 40px missed this app's
// own touch-target floor; fixed here, not loosened).
function CardActions({ card }: { card: ExploreBookCard }) {
  const { book, product, status } = card;

  if (status === 'active') {
    return (
      <div className="mt-2 flex items-center gap-1.5">
        <Link
          href={`/books/${book.id}`}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-clay px-2.5 type-label font-semibold text-ink"
        >
          Open Book
        </Link>
        <WhatsAppButton
          message={buildBookContactMessage(book)}
          label="Ask the Author"
          variant="subtle"
          iconOnly
          className="border border-sand/15"
        />
      </div>
    );
  }

  const purchaseLabel = status === 'pending' ? 'View Request' : status === 'rejected' ? 'Try Again' : 'Get This Book';

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <Link
        href={`/purchase/${product.id}`}
        className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-clay px-2.5 type-label font-semibold text-ink"
      >
        {purchaseLabel}
      </Link>
      <WhatsAppButton
        message={buildPurchaseInquiryMessage(product)}
        label="Ask the Author"
        variant="subtle"
        iconOnly
        className="border border-sand/15"
      />
    </div>
  );
}

export async function ExploreBooks() {
  const user = await getCurrentUserIfPresent();
  const db = user ? getDb() : null;

  const statusEntries = await Promise.all(
    PRODUCT_CATALOGUE.filter((p) => p.active).map(async (product) => {
      const status: ProductAccessStatus = user && db ? await getProductAccessStatus(db, user.id, product.id) : 'none';
      return [product.id, status] as const;
    }),
  );
  const cards = buildExploreBookCards(Object.fromEntries(statusEntries));

  return (
    <div className="px-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="type-section font-logo text-sand-light">{EXPLORE_BOOKS_COPY.heading}</h2>
        <Link href="/books" className="flex shrink-0 items-center gap-1 type-meta font-medium text-clay-light">
          See all <ArrowRight size={12} />
        </Link>
      </div>
      <p className="mb-2.5 text-sm leading-snug text-sand/65 sm:mb-3 sm:text-base">{EXPLORE_BOOKS_COPY.body}</p>
      {/*
        Prompt 64: on mobile this is a vertical stack of HORIZONTAL cards
        (small cover on the left, title/subtitle/CTAs beside it) rather than
        the Prompt 63 grid of full-poster vertical cards — a vertical card
        sums cover height + text height + CTA height, so with only 2 books
        the visitor had to scroll well past the first screen to reach even
        one CTA. A horizontal card's height is the max of its cover and its
        text/CTA column instead of their sum, which is what actually gets
        both books (and their CTAs) visible together near the top. At lg:
        (the same breakpoint app/layout.tsx's own shell widens the content
        column at) there's enough width and height budget for the original
        2-column vertical-poster grid, which suits the wider desktop layout
        better, so it switches back there.
      */}
      <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
        {cards.map((card) => (
          <div
            key={card.book.id}
            className="flex gap-3 rounded-2xl border border-sand/12 bg-ink-card p-2.5 lg:flex-col lg:gap-0"
          >
            <Link href={`/books/${card.book.id}`} className="block shrink-0">
              <BookCover book={card.book} className="w-[84px] sm:w-24 lg:w-full" />
            </Link>
            <div className="min-w-0 flex-1 lg:mt-2">
              <div className="flex items-start justify-between gap-1.5">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-sand-light lg:text-base">
                  {card.book.title}
                </p>
                {card.status === 'active' ? (
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-clay-light" aria-label="Owned" />
                ) : null}
              </div>
              <p className="line-clamp-1 text-xs leading-snug text-sand/65 lg:text-sm">{card.book.subtitle}</p>
              <CardActions card={card} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
