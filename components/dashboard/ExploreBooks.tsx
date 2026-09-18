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
// name is ever hardcoded here. Prompt 63's approved concept gives each
// book card its own full-width cover and stacked (not side-by-side) CTAs,
// so covers stay legible rather than a small thumbnail.
function CardActions({ card }: { card: ExploreBookCard }) {
  const { book, product, status } = card;

  if (status === 'active') {
    return (
      <div className="mt-2.5 space-y-1.5">
        <Link
          href={`/books/${book.id}`}
          className="flex min-h-[40px] w-full items-center justify-center rounded-lg bg-clay px-3 py-2 type-label font-semibold text-ink"
        >
          Open Book
        </Link>
        <WhatsAppButton
          message={buildBookContactMessage(book)}
          label="Ask the Author"
          variant="subtle"
          className="w-full border border-sand/15 px-3 py-2 type-label"
        />
      </div>
    );
  }

  const purchaseLabel = status === 'pending' ? 'View Request' : status === 'rejected' ? 'Try Again' : 'Get This Book';

  return (
    <div className="mt-2.5 space-y-1.5">
      <Link
        href={`/purchase/${product.id}`}
        className="flex min-h-[40px] w-full items-center justify-center rounded-lg bg-clay px-3 py-2 type-label font-semibold text-ink"
      >
        {purchaseLabel}
      </Link>
      <WhatsAppButton
        message={buildPurchaseInquiryMessage(product)}
        label="Ask the Author"
        variant="subtle"
        className="w-full border border-sand/15 px-3 py-2 type-label"
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
      <p className="mb-3 type-meta text-sand/65">{EXPLORE_BOOKS_COPY.body}</p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.book.id} className="rounded-2xl border border-sand/12 bg-ink-card p-2.5">
            <Link href={`/books/${card.book.id}`} className="block">
              <BookCover book={card.book} />
            </Link>
            <div className="mt-2 flex items-start justify-between gap-1.5">
              <p className="line-clamp-2 type-body font-medium leading-snug text-sand-light">{card.book.title}</p>
              {card.status === 'active' ? (
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-clay-light" aria-label="Owned" />
              ) : null}
            </div>
            <p className="line-clamp-1 type-label text-sand/65">{card.book.subtitle}</p>
            <CardActions card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}
