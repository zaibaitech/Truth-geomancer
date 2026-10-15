import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BookCard } from '@/components/books/BookCard';
import { BOOKS } from '@/content/books';
import { getCurrentUserIfPresent } from '@/lib/server/session';
import { getDb } from '@/lib/server/db';
import { canAccessForUser } from '@/lib/server/accessService';
import { JsonLd } from '@/components/seo/JsonLd';
import { booksCollectionJsonLd, publicPageMetadata } from '@/lib/seo';

export const metadata = publicPageMetadata({
  title: 'Geomancy Books & Manuscripts',
  description: `The Truth Geomancer library: ${BOOKS.map((b) => b.title).join(' and ')} by ${
    BOOKS[0]?.author ?? 'the author'
  }, classical Ilm al-Raml manuscripts to own and read in the app.`,
  path: '/books',
});

// Prompt 78: entitlement checked per book with the same canAccessForUser()
// the book detail page and casting authorization already use, so the
// listing's badge stops claiming every visitor already owns both books
// (see BookCard.tsx's own comment for the contradiction this fixes).
export default async function BooksPage() {
  const user = await getCurrentUserIfPresent();
  const db = user ? getDb() : null;
  const entitlements = await Promise.all(
    BOOKS.map((book) => (user && db ? canAccessForUser(db, user.id, { kind: 'book', bookId: book.id }) : Promise.resolve(false))),
  );

  return (
    <div>
      <JsonLd data={booksCollectionJsonLd(BOOKS)} />
      <Header title="Library" subtitle="Manuscripts to own and read" />
      <div className="grid grid-cols-2 gap-4 px-4 py-4">
        {BOOKS.map((book, i) => (
          <BookCard key={book.id} book={book} entitled={entitlements[i]} />
        ))}
      </div>
      <section className="space-y-3 px-4 pb-6">
        <h2 className="font-logo text-lg text-sand-light">Which book should I start with?</h2>
        <p className="type-body leading-relaxed text-sand/70">
          Both books are by {BOOKS[0]?.author ?? 'the author'} and are read inside the Truth Geomancer app.
        </p>
        <p className="type-body leading-relaxed text-sand/70">
          <Link href="/books/master-of-geomancy-vol-1" className="text-clay-light underline underline-offset-2">
            The Master of Geomancy, Volume 1
          </Link>{' '}
          is the place to begin. It is the foundation text: the history of Ilm al-Raml, how to cast a chart by hand,
          and the sixteen figures with their elements.
        </p>
        <p className="type-body leading-relaxed text-sand/70">
          <Link href="/books/kanzul-mikban" className="text-clay-light underline underline-offset-2">
            Kanzul Mikban
          </Link>{' '}
          is the advanced companion. It assumes you already know how to cast a chart, and collects question-specific
          reading methods from the manuscript notebook.
        </p>
        <p className="type-body leading-relaxed text-sand/70">
          New to the subject? Read the free{' '}
          <Link href="/learn" className="text-clay-light underline underline-offset-2">
            Ilm al-Raml basics
          </Link>{' '}
          first. For the current price and how to get access, ask the author on WhatsApp from either book page.
        </p>
      </section>
    </div>
  );
}
