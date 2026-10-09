// Every app route, classified (Stage 1a). The import-graph guard fails if a
// page.tsx / route.ts exists that is NOT listed here, so each new route
// (e.g. Stage 1b's /learn) must be consciously classified, and a route
// classified 'public' is automatically held to the strictest leak rules.
export type RouteClass =
  | 'public' //           open to anyone without purchase (indexable or robots-disallowed)
  | 'gated' //            renders paid content only after a server-side entitlement check
  | 'private' //          account / purchase / device-local pages
  | 'auth' //             sign-in flow
  | 'admin' //            staff only
  | 'api-paid-content' // returns protected content only when entitled
  | 'api-auth'
  | 'api-payment'
  | 'api-admin';

export const ROUTE_CLASSIFICATION: Record<string, RouteClass> = {
  // Root-level public entry files (shared by every page)
  'app/layout.tsx': 'public',
  'app/robots.ts': 'public',
  'app/sitemap.ts': 'public',
  'app/manifest.ts': 'public',
  // Public pages
  'app/page.tsx': 'public',
  'app/books/page.tsx': 'public',
  'app/books/[id]/page.tsx': 'public',
  'app/raml/page.tsx': 'public',
  'app/star/page.tsx': 'public',
  'app/search/page.tsx': 'public',
  'app/more/page.tsx': 'public',
  'app/notifications/page.tsx': 'public',
  'app/preview/kanzul-mikban/page.tsx': 'public',
  'app/preview/master-of-geomancy-vol-1/page.tsx': 'public',
  // Public SEO learning pages (Phase 1). Held to the reserved-directory and
  // zero-tolerance rules, and checked by tests/guards/seoPages.test.tsx.
  'app/learn/page.tsx': 'public',
  'app/learn/ilm-al-raml/page.tsx': 'public',
  'app/learn/glossary/page.tsx': 'public',
  'app/figures/page.tsx': 'public',
  'app/figures/[slug]/page.tsx': 'public',
  'app/houses/page.tsx': 'public',
  // Gated (entitlement-checked server-side)
  'app/books/[id]/read/page.tsx': 'gated',
  'app/books/master-of-geomancy-vol-1/practice/cancelling-method/page.tsx': 'gated',
  'app/books/master-of-geomancy-vol-1/practice/counting-method/page.tsx': 'gated',
  'app/raml/practice/[chapterId]/[methodId]/page.tsx': 'gated',
  // Private / device-local
  'app/purchase/page.tsx': 'private',
  'app/purchase/[productId]/page.tsx': 'private',
  'app/settings/page.tsx': 'private',
  'app/raml/history/page.tsx': 'private',
  'app/raml/history/[id]/page.tsx': 'private',
  // Auth
  'app/signin/page.tsx': 'auth',
  'app/auth/confirm/page.tsx': 'auth',
  // Admin
  'app/admin/page.tsx': 'admin',
  'app/admin/books/page.tsx': 'admin',
  'app/admin/readers/page.tsx': 'admin',
  'app/admin/requests/page.tsx': 'admin',
  'app/admin/settings/page.tsx': 'admin',
  'app/admin/staff/page.tsx': 'admin',
  // API
  'app/api/books/[bookId]/chapters/[chapterId]/route.ts': 'api-paid-content',
  'app/api/books/[bookId]/offline/route.ts': 'api-paid-content',
  'app/api/raml/reading/route.ts': 'api-paid-content',
  'app/api/raml/reading-verdicts/route.ts': 'api-paid-content',
  'app/api/raml/practice/route.ts': 'api-paid-content',
  'app/api/preview/[bookId]/route.ts': 'api-paid-content',
  'app/api/auth/challenge/route.ts': 'api-auth',
  'app/api/auth/logout/route.ts': 'api-auth',
  'app/api/auth/request-link/route.ts': 'api-auth',
  'app/api/auth/start/route.ts': 'api-auth',
  'app/api/auth/status/route.ts': 'api-auth',
  'app/api/auth/verify-code/route.ts': 'api-auth',
  'app/api/auth/verify/route.ts': 'api-auth',
  'app/api/payment-requests/route.ts': 'api-payment',
  'app/api/paystack/callback/route.ts': 'api-payment',
  'app/api/paystack/checkout/route.ts': 'api-payment',
  'app/api/paystack/webhook/route.ts': 'api-payment',
  'app/api/admin/login/route.ts': 'api-admin',
  'app/api/admin/logout/route.ts': 'api-admin',
  'app/api/admin/payment-requests/route.ts': 'api-admin',
  'app/api/admin/payment-requests/[id]/approve/route.ts': 'api-admin',
  'app/api/admin/payment-requests/[id]/reject/route.ts': 'api-admin',
  'app/api/admin/staff/route.ts': 'api-admin',
};

export const PUBLIC_ROUTE_FILES = Object.entries(ROUTE_CLASSIFICATION)
  .filter(([, c]) => c === 'public')
  .map(([f]) => f);
