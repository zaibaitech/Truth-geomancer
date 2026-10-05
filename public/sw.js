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

// PROMPT 59 — bumped v5 -> v6. `/raml` is a SHELL_URL, so it was served
// cache-first: the first visit (almost always unpaid) stored an anonymous
// picker snapshot, and every later visit — including after a payment
// request became pending, or after admin approval granted the book —
// kept seeing Locked. The Cast picker is now entitlement-personalized
// (free / unlocked / pending / locked per book). Same structural fix as
// Prompt 34's gated-path exclusion: bump the cache version so the stale
// anonymous `/raml` entry is retired, and never serve `/raml` from cache
// again so the server's access snapshot runs on every request.
//
// PROMPT 81 (production hotfix) — bumped v6 -> v7. Three deploys in a row
// (Prompt 75, 77, 79) changed the server-rendered markup of `/`, `/books`,
// `/raml`, and `/settings` — all SHELL_URLS — without bumping APP_VERSION.
// Every returning visitor with a service worker already installed from
// before those deploys kept getting their old `tg-shell-v6` entry for `/`
// from `caches.match(request)` (see the fetch handler below), cache-first,
// no network round-trip. That cached HTML still references the exact
// `/_next/static/css/*.css` and `/_next/static/chunks/*.js` hashed URLs
// from whichever deployment was live when it was cached — but Vercel's
// production alias only serves the CURRENT deployment's static output at
// those paths, so once later deploys superseded it, those exact hashed
// asset requests started 404ing. A 404 on a stylesheet fails silently
// (the browser just never applies it) while the stale-but-textually
// unchanged HTML body still renders, which is exactly the "correct page
// copy, zero styling, default blue links" report from a live device.
// Same structural fix as every bump above: a SHELL_URL's cached content
// went stale, so the version bumps to force every installed worker to
// reinstall, fetch `/` fresh from the network, and repopulate the shell
// cache with the current deployment's own asset references.
//
// PROMPT 82 — bumped v7 -> v8. This deploy changed `/settings`'s own
// client bundle (a self-service recovery action for the sign-in conflict
// error) — another SHELL_URL. Skipping this bump would reintroduce the
// exact v7 bug immediately: any browser that already reinstalled the v7
// worker moments ago would keep that `tg-shell-v7` entry for `/settings`,
// referencing the pre-this-deploy chunk hash, and 404 on it the moment
// this deploy supersedes it. Bump on every deploy that changes a
// SHELL_URL's output — not just the first time this class of bug is
// found — is the actual rule; see the v6->v7 bump above for why.
// AUTH/SESSION REDESIGN, PHASE 0 — bumped v8 -> v9, and the strategy
// changed. Server responses for every per-user page already send
// `Cache-Control: private, no-store`, but the Cache API ignores HTTP cache
// headers: this worker used to serve `/books`, `/books/<id>`, `/purchase*`
// and `/preview*` CACHE-FIRST, keyed only by URL. The first visit's
// signed-out / "Not yet unlocked" / "pending" HTML (or RSC payload) was then
// replayed after sign-in, purchase or approval — and to the NEXT person
// using the same browser — until site data was cleared. Three rules now:
//
//  1. USER-SPECIFIC routes (USER_SPECIFIC_PREFIXES below, plus every
//     /api/ call) are NETWORK-ONLY: never read from, never written to, any
//     cache by this worker. Offline, a navigation to one falls back to the
//     cached `/` shell, which carries no account state.
//  2. Public pages are NETWORK-FIRST: the cached copy is used only when the
//     network fails, so a deploy never leaves a stale page (or stale hashed
//     asset references) behind, and no version bump is needed per deploy.
//  3. Content-hashed static assets (/_next/static/*) are cache-first — their
//     URL changes whenever their bytes do.
//
// On activate, besides retiring old-version shell/runtime caches, any entry
// for a user-specific path still sitting in the CURRENT shell/runtime cache
// is deleted. A reader's explicit book downloads ("tg-book-*", owned by
// lib/offline/bookCache.ts) are never touched.
const APP_VERSION = 'v9';
const SHELL_CACHE = `tg-shell-${APP_VERSION}`;
const RUNTIME_CACHE = `tg-runtime-${APP_VERSION}`;

// The app shell: public, account-free destinations and the icons/manifest
// the shell itself needs, so the app opens with no network at all. Per-user
// pages (/books, /raml, /settings …) are deliberately NOT precached: their
// HTML is personalised by the session and must never be replayed.
const SHELL_URLS = ['/', '/search', '/more', '/manifest.webmanifest', '/icon.svg', '/apple-icon.png'];

// Every path whose server response depends on WHO is asking (the session
// cookie): entitlement badges, payment/request status, preview availability,
// the account itself, sign-in, and the protected reader/practice routes.
// Also excludes all API calls. Kept as one list so the read-side guard and
// the write-side gate below can never drift apart.
const NO_OPPORTUNISTIC_CACHE_PREFIXES = [
  '/api/',
  '/raml/practice/',
  '/raml',
  '/books',
  '/purchase',
  '/preview',
  '/settings',
  '/account',
  '/signin',
  '/auth',
  '/admin',
];

function isProtectedBookPath(pathname) {
  // /books/<id>/read and /books/<id>/practice/<method> — already covered by
  // the '/books' prefix above; kept as an explicit, named guard.
  return /^\/books\/[^/]+\/(read|practice\/)/.test(pathname);
}

function matchesPrefix(pathname, prefix) {
  if (prefix.endsWith('/')) return pathname.startsWith(prefix);
  return pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?');
}

function isUserSpecificPath(pathname) {
  return NO_OPPORTUNISTIC_CACHE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix)) || isProtectedBookPath(pathname);
}

function shouldOpportunisticallyCache(pathname) {
  return !isUserSpecificPath(pathname);
}

function isImmutableAsset(pathname) {
  return pathname.startsWith('/_next/static/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Best-effort per URL: one bad entry must never fail the whole install.
      Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))),
    ),
  );
  self.skipWaiting();
});

// Removes every cached entry for a user-specific path from one cache.
function purgeUserSpecificEntries(cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.keys().then((requests) =>
      Promise.all(
        requests
          .filter((req) => isUserSpecificPath(new URL(req.url).pathname))
          .map((req) => cache.delete(req)),
      ),
    ),
  );
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
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
      )
      .then(() => Promise.all([SHELL_CACHE, RUNTIME_CACHE].map(purgeUserSpecificEntries)))
      .then(() => self.clients.claim()),
  );
});

function offlineShell() {
  return caches.match('/').then((shell) => shell || Response.error());
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never intercept the worker's own script or Next's dev-only endpoints.
  if (url.pathname === '/sw.js' || url.pathname.startsWith('/_next/webpack-hmr')) return;

  // Rule 1 — user-specific: network only. Never consults the cache for this
  // request and never writes, so no response that depends on the session can ever be
  // stored or replayed by this worker (including an entry an older worker
  // version wrote). Offline navigations get the account-free shell.
  if (!shouldOpportunisticallyCache(url.pathname)) {
    event.respondWith(fetch(request).catch(() => offlineShell()));
    return;
  }

  // Rule 3 — content-hashed assets: cache-first.
  if (isImmutableAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Rule 2 — public pages: network-first, cached copy only when offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && shouldOpportunisticallyCache(url.pathname)) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || offlineShell())),
  );
});
