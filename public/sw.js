// Truth Geomancer service worker (Prompt 23 — offline-first audit).
//
// This app has no backend at all: every book's chapters, every star and
// figure, the whole geomancy engine, and every interactive practice flow
// are already compiled into the client JS bundle at build time — nothing
// here is fetched from an API. The ONLY thing a network request is for is
// the Next.js App Router's own page/asset responses. So this worker has one
// job: keep the small app shell always available, and let a reader
// explicitly cache a whole book so its exact pages are readable with no
// network at all — never silently caching things a reader never asked for.
//
// Cache versioning: bump APP_VERSION when this worker's own precache list
// or strategy changes. Bumping it retires the OLD shell/runtime caches on
// the next activate (see below) without touching a reader's per-book
// downloads at all — those live in their own caches, named and owned by
// lib/offline/bookCache.ts, and are never deleted by a version bump here.
// PROMPT 34 — bumped v1 -> v2. A stale `tg-runtime-v1` cache could hold a
// full, ungated Master of Geomancy reader response cached during an
// earlier deployment window (before the entitlement gate — and later, the
// opportunistic-cache exclusion below — existed for /books/*/read). Since
// `caches.match(request)` in the fetch handler below is checked before any
// network/server round-trip, that stale entry would keep being served
// forever to that visitor's browser regardless of any server-side fix,
// because it shared this exact cache name and so was never retired by the
// activate handler's own version-based cleanup. Bumping the version forces
// every visiting browser to install a fresh SHELL_CACHE/RUNTIME_CACHE pair
// and purge the old one on next activate (see the `activate` handler
// below) — this is the only way to retroactively clear a leak that already
// happened, not a hypothetical safeguard for a future one (that part is
// the read-side guard added in the fetch handler below).
//
// PROMPT 61 — bumped v2 -> v3. `/` is one of SHELL_URLS below, so it is
// precached and served cache-first: `caches.match(request)` returns the
// old install's cached response before any network round-trip ever
// happens. The dashboard's content at `/` changed substantially in this
// prompt (new book-discovery and WhatsApp-contact sections replacing the
// old Recommended Books layout) — without a version bump, a returning
// visitor's browser would keep serving that exact old cached HTML
// indefinitely, never seeing the new dashboard until the entry happened to
// be evicted for some unrelated reason. Bumping the version is the same
// mechanism as the v1->v2 fix above, applied for the same structural
// reason: a shell URL's cached content became stale, and only a version
// bump retires it.
//
// PROMPT 63 — bumped v3 -> v4. `/`'s content changed again in this prompt
// (dashboard rebuilt to match the approved visual concept: single Hero
// instead of a rotating carousel, "The Books" 2-column cards, restructured
// "Explore the App" strip) — the exact same structural situation as the
// v2->v3 bump: a browser that already installed `tg-shell-v3` would keep
// serving that now-superseded HTML forever, since nothing else about this
// worker's own bytes would otherwise change and trigger a browser-side SW
// update check. Bumping the version is what actually changes this file's
// bytes (forcing that update check) and gives the new install a fresh,
// distinctly-named cache to populate from the current `/`.
//
// PROMPT 64 — bumped v4 -> v5. `/`'s markup changed again (mobile-first
// responsive rework: compact Hero, horizontal book cards on narrow
// viewports, 2x2 "Explore the App" grid) — same stale-shell-cache
// mechanism as the two bumps above, so the same fix applies: a browser
// that already installed `tg-shell-v4` would otherwise keep serving the
// pre-Prompt-64 HTML (the version that squeezed a desktop-style layout
// into a phone) indefinitely.
const APP_VERSION = 'v5';
const SHELL_CACHE = `tg-shell-${APP_VERSION}`;
const RUNTIME_CACHE = `tg-runtime-${APP_VERSION}`;

// The app shell: the tab-bar destinations and the icons/manifest the shell
// itself needs, so the app opens and its navigation works with no network
// at all. Deliberately excludes book content — a reader opts into that
// separately via "Download for offline".
const SHELL_URLS = [
  '/',
  '/books',
  '/raml',
  '/raml/history',
  '/search',
  '/settings',
  '/more',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Best-effort per URL: one bad entry must never fail the whole install.
      Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          // Only ever retire THIS worker's own shell/runtime caches by
          // version. Never touch a "tg-book-*" cache — those are a
          // reader's explicit downloads, versioned and removed only by
          // lib/offline/bookCache.ts.
          .filter(
            (name) =>
              (name.startsWith('tg-shell-') || name.startsWith('tg-runtime-')) &&
              name !== SHELL_CACHE &&
              name !== RUNTIME_CACHE,
          )
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  self.clients.claim();
});

// Cache-first, falling back to network, falling back to the cached app
// shell for a navigation that has nothing cached at all. Cache-first suits
// this app well: book content changes rarely (a new deploy gets a new
// APP_VERSION and fresh hashed asset URLs automatically), and a reader who
// explicitly downloaded a book should get instant, reliable pages from it
// rather than a race against the network. Every successful network
// response is opportunistically saved to the runtime cache too, so pages a
// reader merely visits (never explicitly downloaded) still tend to work
// offline afterward — a bonus, never a promise: only "Available offline"
// (lib/offline/bookCache.ts) is ever presented to a reader as guaranteed.
// Prompt 30, Phase 12 — a real vulnerability this audit found: the
// opportunistic "cache every successful same-origin GET" behavior below
// used to apply to EVERY response, including protected, entitlement-gated
// ones (/api/books/*, the book reader at /books/*/read, Kanzul method
// practice at /raml/practice/*, Master's practice pages). Cache Storage
// has no concept of WHO a cached response was for — once a response for
// a given URL is in RUNTIME_CACHE, `caches.match()` above serves it to
// ANY future request for that exact URL on this browser, entitled or not,
// with no server round-trip at all. That means an entitled visitor merely
// LOADING their purchased book (no explicit download click needed) would
// silently leave a reusable, protected-content-bearing cache entry behind
// for whoever uses this browser next. The list below excludes every such
// path from automatic/opportunistic caching — the ONLY way protected book
// content may still end up in Cache Storage is the reader's own explicit
// "Download for offline" action (lib/offline/bookCache.ts), which writes
// into its own book-specific cache, never RUNTIME_CACHE, and only after
// the server has independently verified entitlement for THAT request.
//
// This does not, and cannot, prevent a DIFFERENT anonymous identity later
// sharing the SAME physical browser from finding and reading an
// explicitly-downloaded book cache that a previous, legitimately-entitled
// visitor left behind — Cache Storage is device-scoped, and this app's
// identity model has no stronger per-user isolation to offer within a
// single browser profile. See the Prompt 30 final report's "Anonymous
// identity limitations" section for the honest, complete statement of
// what is and is not enforced here.
const NO_OPPORTUNISTIC_CACHE_PREFIXES = ['/api/', '/raml/practice/'];

function isProtectedBookPath(pathname) {
  // /books/<id>/read and /books/<id>/practice/<method> — the book listing
  // (/books) and a book's own detail page (/books/<id>) are public
  // metadata, never excluded.
  return /^\/books\/[^/]+\/(read|practice\/)/.test(pathname);
}

function shouldOpportunisticallyCache(pathname) {
  if (NO_OPPORTUNISTIC_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  if (isProtectedBookPath(pathname)) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never intercept the worker's own script or Next's dev-only endpoints.
  if (url.pathname === '/sw.js' || url.pathname.startsWith('/_next/webpack-hmr')) return;

  // PROMPT 34: the same predicate that already excluded these paths from
  // opportunistic WRITES now also excludes them from cache READS — every
  // request for an entitlement-gated path (a protected book reader/
  // practice route, the protected-content/practice APIs) always goes to
  // the network, so the server's canAccessForUser() check runs on every
  // single request, never short-circuited by a cache entry. This applies
  // even to an entry this worker itself never wrote (e.g. one left over
  // from before this exclusion existed at all, or from any future
  // regression) — closing that off structurally, not just for the one
  // incident the version bump above already cleared. Cache Storage
  // remains reachable for these paths only through the reader's own
  // explicit, server-verified "Download for offline" action
  // (lib/offline/bookCache.ts), which writes into its own book-specific
  // cache, never RUNTIME_CACHE, and is read by that feature's own code,
  // never by this generic fetch handler.
  if (!shouldOpportunisticallyCache(url.pathname)) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((shell) => shell || Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && shouldOpportunisticallyCache(url.pathname)) {
            const copy = response.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches.match('/').then((shell) => shell || Response.error()),
        );
    }),
  );
});
