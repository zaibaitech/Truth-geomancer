// Structural checks for the Prompt 65 Author Dashboard — the same pattern
// established in paymentRequestRoutes.test.ts (Prompt 28): a real
// database/service-layer test proves the underlying LOGIC is correct (see
// adminStats.test.ts and products.test.ts), these tests prove the PAGE
// WIRING and rendered UI never undermine it — every admin page still gates
// on the server-authoritative admin check, and no technical/private field
// (session tokens, the admin secret, raw UUIDs, the reviewer literal) ends
// up in what an author actually sees.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DASHBOARD_PAGE = readFileSync('app/admin/page.tsx', 'utf-8');
const REQUESTS_PAGE = readFileSync('app/admin/requests/page.tsx', 'utf-8');
const BOOKS_PAGE = readFileSync('app/admin/books/page.tsx', 'utf-8');
const READERS_PAGE = readFileSync('app/admin/readers/page.tsx', 'utf-8');
const SETTINGS_PAGE = readFileSync('app/admin/settings/page.tsx', 'utf-8');
const REQUEST_CARD = readFileSync('components/admin/RequestCard.tsx', 'utf-8');
const ACTIVITY_ITEM = readFileSync('components/admin/ActivityItem.tsx', 'utf-8');
const BOOK_ADMIN_CARD = readFileSync('components/admin/BookAdminCard.tsx', 'utf-8');
const ADMIN_SIGN_IN_REQUIRED = readFileSync('components/admin/AdminSignInRequired.tsx', 'utf-8');
const ADMIN_SIGN_OUT_BUTTON = readFileSync('components/admin/AdminSignOutButton.tsx', 'utf-8');
const LOGOUT_ROUTE = readFileSync('app/api/admin/logout/route.ts', 'utf-8');

const ADMIN_PAGES = {
  'app/admin/page.tsx': DASHBOARD_PAGE,
  'app/admin/requests/page.tsx': REQUESTS_PAGE,
  'app/admin/books/page.tsx': BOOKS_PAGE,
  'app/admin/readers/page.tsx': READERS_PAGE,
  'app/admin/settings/page.tsx': SETTINGS_PAGE,
};

describe('every /admin/* page gates on the server-authoritative admin check', () => {
  for (const [name, source] of Object.entries(ADMIN_PAGES)) {
    it(`${name} calls isCurrentUserAdmin() and returns before touching any data if it is false`, () => {
      expect(source).toMatch(/isCurrentUserAdmin\(\)/);
      expect(source).toMatch(/if \(!isAdmin\) return <AdminSignInRequired \/>/);
      // The auth check's CALL, and its early-return, must come before any
      // data-fetching CALL in the function body — comparing against the
      // import lines (which always come first, regardless of ordering
      // elsewhere) would trivially pass, so this strips the import block
      // first and only looks at the body.
      const body = source.slice(source.lastIndexOf('\nimport '));
      const authIdx = body.indexOf('isCurrentUserAdmin()');
      const dataIdx = body.search(/const db = getDb\(\)/);
      if (dataIdx !== -1) expect(authIdx).toBeLessThan(dataIdx);
    });
  }
});

describe('Dashboard home (Phase 4)', () => {
  it('shows Books/Pending/Readers/Access Granted stats built from real data, never invented numbers', () => {
    expect(DASHBOARD_PAGE).toMatch(/BOOKS\.length/);
    expect(DASHBOARD_PAGE).toMatch(/pending\.length/);
    expect(DASHBOARD_PAGE).toMatch(/getTotalUniqueReaders/);
    expect(DASHBOARD_PAGE).toMatch(/getTotalActiveAccessGrants/);
  });

  it('renders Needs Your Attention and Recent Activity sections with an empty state each', () => {
    expect(DASHBOARD_PAGE).toMatch(/Needs Your Attention/);
    expect(DASHBOARD_PAGE).toMatch(/Recent Activity/);
    expect(DASHBOARD_PAGE).toMatch(/You're all caught up\./);
    expect(DASHBOARD_PAGE).toMatch(/No recent activity yet\./);
  });
});

describe('My Books (Phase 7)', () => {
  it('renders from the existing BOOKS catalogue, never a hardcoded book list', () => {
    expect(BOOKS_PAGE).toMatch(/import \{ BOOKS \} from '@\/content\/books'/);
    expect(BOOKS_PAGE).toMatch(/BOOKS\.map/);
    // No literal book title string anywhere outside the import/comment —
    // titles must flow through {book.title}, never be typed out here.
    expect(BOOKS_PAGE).not.toMatch(/The Master of Geomancy|Kanzul Mikban/);
  });

  it('BookAdminCard reads title/subtitle/status from the Book object, never a second hardcoded copy', () => {
    expect(BOOK_ADMIN_CARD).toMatch(/\{book\.title\}/);
    expect(BOOK_ADMIN_CARD).toMatch(/\{book\.subtitle\}/);
    expect(BOOK_ADMIN_CARD).toMatch(/book\.status/);
    expect(BOOK_ADMIN_CARD).not.toMatch(/The Master of Geomancy|Kanzul Mikban/);
  });

  it('View Book links to the existing public book route, never a new/invented one', () => {
    expect(BOOK_ADMIN_CARD).toMatch(/href=\{`\/books\/\$\{book\.id\}`\}/);
  });
});

describe('Readers (Phase 8) — counts only, never a per-person list', () => {
  it('reads counts from getReaderCountsByBook, never queries entitlements directly', () => {
    expect(READERS_PAGE).toMatch(/getReaderCountsByBook/);
    expect(READERS_PAGE).not.toMatch(/FROM entitlements/);
  });

  it('renders only aggregate counts, per book — the returned Record<bookId, number> shape makes a per-person field structurally unavailable to render', () => {
    expect(READERS_PAGE).toMatch(/readerCounts\[book\.id\]/);
  });
});

describe('Requests (Phase 3/5/6 terminology + privacy)', () => {
  it('RequestCard never renders the raw Payment Request id or the customer userId as visible text — only uses request.id functionally to wire the approve/reject actions', () => {
    expect(REQUEST_CARD).not.toMatch(/userId/);
    // request.id must appear exactly once: `requestId={request.id}`, the
    // functional prop PaymentRequestActions needs to call the right API
    // route — never rendered as text content anywhere else in the card.
    const idOccurrences = REQUEST_CARD.match(/request\.id/g) ?? [];
    expect(idOccurrences.length).toBe(1);
    expect(REQUEST_CARD).toMatch(/requestId=\{request\.id\}/);
  });

  it('ActivityItem never renders reviewedBy (today always the meaningless literal "admin"), the userId, or the request id', () => {
    for (const forbidden of [/reviewedBy/, /userId/, /request\.id\b/]) {
      expect(ACTIVITY_ITEM).not.toMatch(forbidden);
    }
  });

  it('uses the Phase 3 terminology — "Access Requests"-style plain language, never "Payment Request ID" or "Product ID" in the UI copy', () => {
    for (const source of [DASHBOARD_PAGE, REQUESTS_PAGE, REQUEST_CARD, ACTIVITY_ITEM]) {
      expect(source).not.toMatch(/Payment Request ID|Product ID/i);
    }
  });
});

describe('Settings (Phase 9) — sign-out wiring, no secrets', () => {
  it('the logout route only calls the existing logoutAdmin(), never reads or compares TG_ADMIN_SECRET', () => {
    expect(LOGOUT_ROUTE).toMatch(/logoutAdmin\(\)/);
    expect(LOGOUT_ROUTE).not.toMatch(/TG_ADMIN_SECRET/);
  });

  it('the settings page and sign-out button never reference the admin secret or a raw session token', () => {
    for (const source of [SETTINGS_PAGE, ADMIN_SIGN_OUT_BUTTON]) {
      expect(source).not.toMatch(/TG_ADMIN_SECRET/);
      expect(source).not.toMatch(/tg_admin['"]/); // the cookie name itself
    }
  });
});

describe('sign-in gate (Phase 2/18) never renders admin data before authorization', () => {
  it('AdminSignInRequired renders only the login form — no stats, requests, or book data', () => {
    expect(ADMIN_SIGN_IN_REQUIRED).toMatch(/AdminLoginForm/);
    for (const forbidden of [/paymentReference/, /BOOKS\.map/, /getReaderCountsByBook/, /listPaymentRequestsForAdmin/]) {
      expect(ADMIN_SIGN_IN_REQUIRED).not.toMatch(forbidden);
    }
  });
});

describe('no admin file added in this prompt weakens the entitlement-mutation boundary', () => {
  it('none of the new pages/components import grantEntitlement/revokeEntitlement, or call them directly', () => {
    for (const source of [DASHBOARD_PAGE, REQUESTS_PAGE, BOOKS_PAGE, READERS_PAGE, SETTINGS_PAGE, REQUEST_CARD, ACTIVITY_ITEM, BOOK_ADMIN_CARD]) {
      expect(source).not.toMatch(/grantEntitlement|revokeEntitlement/);
    }
  });
});
