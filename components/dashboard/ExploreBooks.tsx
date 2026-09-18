import Link from 'next/link';
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import { BookCover } from '@/components/books/BookCover';
import { WhatsAppButton } from '@/components/whatsapp/WhatsAppButton';
import { buildExploreBookCards, type ExploreBookCard } from '@/lib/dashboard/exploreBooks';
import { EXPLORE_BOOKS_COPY } from '@/lib/dashboard/copy';
import { buildBookContactMessage, buildPurchaseInquiryMessage } from '@/lib/whatsapp';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { getProductAccessStatus, type ProductAccessStatus } from '@/lib/server/purchaseStatus';
import { PRODUCT_CATALOGUE } from '@/lib/access/products';

// Prompt 61: the dashboard's primary discovery/storefront section — a new
// visitor should see the books and the path to the author from here,
// without opening a book detail page first. Reuses the exact same
// getProductAccessStatus() every purchase page already calls (Prompt 28,
// Phase 13) — never a second, separately maintained ownership check — and
// PRODUCT_CATALOGUE/BOOKS as the only sources of book identity, so no book
// name is ever hardcoded here.
function CardActions({ card }: { card: ExploreBookCard }) {
  const { book, product, status } = card;

  if (status === 'active') {
    return (
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Link
          href={`/books/${book.id}`}
          className="inline-flex min-h-[38px] items-center rounded-lg bg-clay px-3 py-2 type-label font-semibold text-ink"
        >
          Open Book
        </Link>
        <WhatsAppButton
          message={buildBookContactMessage(book)}
          label="Ask the Author"
          variant="subtle"
          className="min-h-[38px] px-3 py-2 type-label"
        />
      </div>
    );
  }

  const purchaseLabel = status === 'pending' ? 'View Request' : status === 'rejected' ? 'Try Again' : 'Get This Book';

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <Link
        href={`/purchase/${product.id}`}
        className="inline-flex min-h-[38px] items-center rounded-lg bg-clay px-3 py-2 type-label font-semibold text-ink"
      >
        {purchaseLabel}
      </Link>
      <WhatsAppButton
        message={buildPurchaseInquiryMessage(product)}
        label="Ask the Author"
        variant="subtle"
        className="min-h-[38px] px-3 py-2 type-label"
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
      <div className="mb-1 flex items-center gap-1.5">
        <BookOpen size={15} className="text-clay-light" />
        <h2 className="type-body font-semibold text-sand-light">{EXPLORE_BOOKS_COPY.heading}</h2>
      </div>
      <p className="mb-3 type-meta text-sand/65">{EXPLORE_BOOKS_COPY.body}</p>
      <div className="space-y-3">
        {cards.map((card) => (
          <div key={card.book.id} className="flex gap-3 rounded-2xl border border-sand/12 bg-ink-card p-3">
            <Link href={`/books/${card.book.id}`} className="w-16 shrink-0">
              <BookCover book={card.book} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="line-clamp-1 type-body font-medium text-sand-light">{card.book.title}</p>
                  <p className="line-clamp-1 type-meta text-sand/65">{card.book.subtitle}</p>
                </div>
                {card.status === 'active' ? (
                  <span className="flex shrink-0 items-center gap-1 type-label text-clay-light">
                    <CheckCircle2 size={12} aria-hidden /> Owned
                  </span>
                ) : null}
              </div>
              <CardActions card={card} />
            </div>
          </div>
        ))}
      </div>
      <Link href="/books" className="mt-3 flex items-center gap-1 type-meta font-medium text-clay-light">
        See all books <ArrowRight size={12} />
      </Link>
    </div>
  );
}
