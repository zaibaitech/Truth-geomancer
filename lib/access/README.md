# Access & entitlement foundation

This directory is the product/entitlement domain layer for Truth Geomancer,
built per the Prompt 24 audit's findings and Prompt 25's implementation
scope. It is **backend-agnostic**: nothing here reads or writes
`localStorage`, calls a network, or touches a database. It exists so that
future authentication, manual payment approval, an admin dashboard,
protected content delivery, and offline downloads can all plug into the
**same** access decision, instead of each inventing their own.

**This foundation does NOT provide production authentication, payment
verification, or protected-book security yet.** See "What this is not"
below.

## 1. Product (`products.ts`)

A `Product` is a purchasable unit: `{ id, name, description, active,
entitlementGrants }`. No price or currency field exists — none is in the
repository today and none is invented here. Three products are defined,
built entirely from facts already established elsewhere in the codebase:

- `MASTER_PRODUCT` — grants the Master of Geomancy book plus its two
  practice features.
- `KANZUL_PRODUCT` — grants the Kanzul Mikban book plus its 182 verified
  method ids, computed by calling `practicableMethodsForChapter` (the same
  function the book's own "Try this method" CTA already uses) — never a
  second, separately maintained list.
- `BUNDLE_PRODUCT` — grants the **union** of the two standalone products'
  own grant objects. Adding a book to the bundle never means duplicating
  its content or method list; it means concatenating the same grant array
  another product already exposes.

## 2. Entitlement (`types.ts`)

A user's ownership of one product: `{ id, userId, productId, status:
'active'|'revoked', grantedAt, revokedAt?, source }`. This is a **type
only** — no code anywhere creates, persists, or fakes an `Entitlement`
record. There are no users in this repository (no auth, no database), so
`userId` is an opaque string this module never validates.

## 3. EntitlementGrant (`types.ts`)

A discriminated union of exactly what a product can unlock:

```ts
type EntitlementGrant = BookGrant | MethodSetGrant | FeatureGrant;
```

- `BookGrant { kind: 'book', bookId }` — a whole book's reading access.
- `MethodSetGrant { kind: 'method-set', bookId, methodIds }` — an
  **explicit** list of method ids. A book grant never implies method
  access, and a method-set grant never means "all methods in the book" —
  both must be spelled out, per the Prompt 24/25 rule against inventing
  "purchaser gets everything" relationships.
- `FeatureGrant { kind: 'feature', featureKey }` — a named feature that
  isn't shaped like a Kanzul Mikban method. Used for The Master of
  Geomancy's Counting Method and Cancelling Method, which the audit found
  have no `MethodDefinition`/method-id of their own (see "Why Master of
  Geomancy uses feature grants, not method grants" below).

## 4. PaymentRequest (future) (`types.ts`)

A type only, matching the manual-payment workflow the Prompt 24 audit
designed: `{ id, userId, productId, amount, currency, paymentMethod,
paymentReference, proofUrl?, status, submittedAt, reviewedAt?,
reviewedBy?, adminNote? }`. Status includes `pending | approved | rejected
| revoked | cancelled`. No code creates, reads, or persists a
`PaymentRequest` — this is scaffolding for a future admin-approval task,
not a working payment flow.

## 5. FreePreview (`types.ts`, candidates in `previewCandidates.ts`)

`{ id, target: FreePreviewTarget, maxUses, active }`, where
`FreePreviewTarget` is a discriminated union of `{kind:'method', bookId,
methodId}` or `{kind:'feature', bookId, featureKey}` — never an ambiguous
"methodId OR featureKey" pair. `previewCandidates.ts` documents the
audit's candidate teaser methods (two Kanzul Mikban methods, both of
Master of Geomancy's practice features) with the technical rationale for
each — **none is activated as the production choice**; picking one is an
editorial decision left to the author.

## 6. PreviewUsage (`types.ts`)

`{ userId, previewId, usesConsumed, status: 'available'|'exhausted' }` —
a record of one user's consumption against one `FreePreview`. This is a
type only; nothing persists it. See "Why localStorage is NOT a secure
entitlement source" below for why this can't be enforced commercially yet.

## 7. Access checks (`access.ts`)

`canAccess(ctx, resource)` and its three convenience wrappers
(`canAccessBook`, `canAccessMethod`, `canAccessFeature`) are pure
functions of an explicit `AccessContext { entitlements, products }` and a
resource description. A resource is accessible only if some `active`
entitlement's `active` product carries a grant that **exactly** covers it
— a book grant and a method-set grant are never conflated. The module
contains no payment logic, no authentication logic, no database calls, no
`localStorage`, and no network calls (enforced by a source-scanning test,
`access.test.ts`'s "O" group).

**This module is not wired into any route, page, or component yet.** See
"Why this isn't wired in yet" below.

## 8. Why payment and entitlement are kept separate

`PaymentRequest.status = 'approved'` is one *mechanism* that would cause
an `Entitlement` to be created — an admin's approval click today, a
payment-provider webhook later. `Entitlement` itself never records how it
was verified beyond the provenance field `source: 'manual-payment' |
'promo'`, and `canAccess` never inspects `PaymentRequest` at all. This
means an automatic payment provider can be added later by creating the
same `Entitlement` shape from a different trigger — no rebuild of the
access layer.

## 9. Why bundles grant underlying entitlements, not a duplicate copy

`BUNDLE_PRODUCT.entitlementGrants` is built as
`[...MASTER_PRODUCT.entitlementGrants, ...KANZUL_PRODUCT.entitlementGrants]`
— literally the same grant objects the standalone products expose, not a
re-authored list. If Kanzul Mikban gains a 183rd verified method, the
bundle reflects it automatically the next time the catalogue is built,
with no separate edit and no risk of the bundle silently falling behind.

## 10. Why localStorage is NOT a secure entitlement source

`localStorage` (and Cache Storage, used by the existing offline system) is
scoped to one browser profile on one device, trivially cleared or spoofed
by the user who owns that device (private window, clear site data, a
different browser). A commercially meaningful "one free use" or "this user
owns this book" decision cannot rely on it. **As of Prompt 26, `Entitlement`
and `PreviewUsage` are no longer type-only** — `lib/server/` persists both
in a real database, authoritatively, server-side (see "Server backend and
identity" below). `localStorage` remains appropriate only for pure UX
preferences (e.g. don't re-show a demo prompt someone already dismissed)
and must never be treated as, or substitute for, that server-side record.

## 11. Why protected book content still requires a content-delivery migration

The Prompt 24 audit confirmed both books' complete text is statically
imported into the client bundle (`content/manuscripts/kanzul-mikban.ts`,
`master-of-geomancy-vol1.ts`) and shipped to every visitor as part of
ordinary page load, independent of any future login state. This module's
`canAccess()` can correctly say "no" — but if the book text is already on
the wire before that check runs, the check is cosmetic. Fixing this needs
book content to be served from somewhere that can check entitlement
*before* responding (a real API/server component backed by a database),
which is a genuine content migration, explicitly out of scope for this
task.

## 12. Why the geomancy engine remains independent

`canAccess()` is designed to be called **before**
`runReading()`/`buildChart()`/the practice components — never inside them.
None of `casting.ts`, `chartModel.ts`, `ruleEngine.ts`, `operations.ts`,
`types.ts` (the engine's own), `reading.ts`, `interpretation.ts`, or any
`questions/*.ts` file was touched by this task, and none should ever
import from `lib/access/`. The architecture stays:

```
USER / ENTITLEMENT
        ↓
   ACCESS CHECK (lib/access/)
        ↓
EXISTING GEOMANCY FLOW (casting → calculation → reading, unchanged)
```

## Why this isn't wired in yet

The book/practice routes are not modified to call `canAccess()` in this
task, on purpose. Adding a route-level check now — while the book content
is still fully bundled client-side (§11 above) — would create a false
impression that the content is now protected, when it is not. Wiring
happens once the content-delivery migration exists; until then this
module (and its server-side backing in `lib/server/`, see below) is
available for integration but is not itself claimed to secure anything.

---

# Server backend and identity (Prompt 26)

Prompt 25 built the pure, backend-agnostic decision layer above
(`lib/access/`). Prompt 26 adds the first real, persistent backend it can
run against: `lib/server/`. This section documents that layer. As before,
**nothing here is wired into any route yet** — see "Why this isn't wired
in yet" above, which still applies unchanged.

## Architecture

```
Browser (future)
   │  session cookie (opaque token)
   ▼
lib/server/session.ts   — reads/sets the HTTP-only cookie (Next.js only)
   │
   ▼
lib/server/identity.ts  — resolves/creates a User from that token (pure, DB-backed)
   │
   ▼
lib/server/accessService.ts
   │  loads this user's ACTIVE entitlements from the database
   │  (lib/server/entitlements.ts) + the static PRODUCT_CATALOGUE
   │  (lib/access/products.ts)
   ▼
lib/access/access.ts → canAccess()   — the SAME pure decision function from Prompt 25
   │
   ▼
EXISTING GEOMANCY FLOW (unchanged) — only runs if access is granted
```

Preview consumption (`lib/server/previews.ts`) is a parallel, structurally
separate path that never touches `entitlements` and never produces an
`Entitlement` — see "Entitlement lifecycle" and "Preview lifecycle" below.

## Database engine chosen, and its limits

**Chosen: Node's built-in `node:sqlite`** (`lib/server/db.ts`). Why: the
Prompt 26 audit (Phase 1) confirmed this repository has no database
provider, no ORM, no `vercel.json`/deployment config, and no environment
variables configured anywhere — there was nothing to "keep using," and
the rules for this task forbid introducing an unnecessary third-party
service. `node:sqlite` is part of the Node 22 runtime this project already
runs on (confirmed via `node -v`), requires zero new npm dependencies, and
provides a real SQL engine — actual `UNIQUE`/`CHECK`/foreign-key
constraints, real indexes, real transactions — rather than a hand-rolled
substitute.

**This is a development/single-instance implementation, not yet a
production-scale one**, and that limitation is deliberate to state
plainly rather than paper over:

- It is still marked *experimental* by Node itself.
- It stores data in a single local file (default `.data/truth-geomancer.db`,
  gitignored; overridable via `TG_DB_PATH`, and every test uses an
  isolated `:memory:` instance instead).
- A typical serverless deployment (e.g. Vercel's default Node functions)
  has an ephemeral, non-shared filesystem across invocations and
  instances — a local file does **not** durably persist data there.

**What real production deployment needs instead**: a hosted database
(e.g. Postgres) reachable over the network via a connection string in a
server-only environment variable (never `NEXT_PUBLIC_`-prefixed, never
committed). None of that exists in this environment. `lib/server/db.ts`
isolates this behind `openDatabase()`/`getDb()` specifically so swapping
the underlying engine later means rewriting one file, not the identity,
entitlement, or preview logic built on top of it — none of which contains
any SQLite-specific assumption beyond the `Db` type.

## Identity model

An **anonymous/device identity**, authoritative server-side:

- `User { id, email: string | null, createdAt, lastSeenAt }` — no
  sensitive personal data; `email` exists only for a future real-account
  upgrade and is never populated by anything in this task.
- Identified by an **opaque, 256-bit random session token**
  (`generateSessionToken()`), never the database's own `id`. The database
  stores only `sha256(token)` — never the raw token — so a database read
  never yields a usable credential.
- Carried in an `httpOnly`, `sameSite: 'lax'`, `secure`-in-production
  cookie (`lib/server/session.ts`), set and read only from a Next.js
  Server Action or Route Handler (a Next.js rule, not one invented here).

**Why the browser cannot simply set `userId=paid-user` and gain access**:
identity resolution only ever accepts a token that hash-matches a stored
row (`getUserByToken`). An attacker-chosen or guessed value will not
match anything real, and is treated exactly like "no session" — a fresh
anonymous user, with zero entitlements. Proven directly in
`lib/server/identity.test.ts`'s tamper-resistance suite and restated at
the access-decision level in `lib/server/security.test.ts`.

**Limitations of the anonymous identity, stated plainly**: it identifies
a *browser*, not a *person* — clearing cookies or switching browsers
creates a new, unrelated identity with no history and no entitlements,
even for someone who legitimately purchased something under the old one.
Upgrading to a real account (the optional `email` field) would let a
future flow link a new anonymous identity's entitlements to a persistent
account — not built here, since no repository infrastructure for
password/email verification exists yet, and inventing one was explicitly
out of scope for this task.

## Database schema

```sql
users            (id PK, session_token_hash UNIQUE, email, created_at, last_seen_at)
entitlements     (id PK, user_id → users.id, product_id, status CHECK(active|revoked),
                  granted_at, revoked_at, source CHECK(manual-payment|promo))
                  INDEX (user_id, status)
                  INDEX (user_id, product_id, status)
preview_usage    (user_id → users.id, preview_id, uses_consumed, status CHECK(available|exhausted)
                  PRIMARY KEY (user_id, preview_id))
```

No `Product`/payment table exists in the database — see "Which layer is
authoritative" below.

## Authoritative access-decision flow

1. A (future) route resolves the current user server-side
   (`session.ts` → `identity.ts`) — never trusts a client-sent id.
2. It loads that user's **active** entitlements from the database
   (`entitlements.ts`'s `getActiveEntitlementsForUser`).
3. It builds an `AccessContext` from those entitlements plus the static
   `PRODUCT_CATALOGUE` (`accessService.ts`'s `getAccessContextForUser`).
4. It calls the **same, unmodified** `canAccess()` from Prompt 25.
5. It acts on the boolean result.

No step duplicates the access rule itself — `lib/server/` only supplies
real data to the same pure function.

## Which layer is authoritative

- **What a product grants** (`EntitlementGrant[]`): `lib/access/products.ts`,
  always. The database never stores grant definitions — only which
  product id a user owns (`entitlements.product_id`, a plain string) and
  whether that ownership is active. `grantEntitlement()` validates the
  product id against the live catalogue and refuses to record an
  entitlement for an unknown or inactive product, so the two can never
  drift apart.
- **What a preview is** (`FreePreview`): `lib/access/previewCandidates.ts`
  (or a future author-configured choice), always. `preview_usage` stores
  only a `(userId, previewId)` consumption count — never a preview's own
  definition.

## Entitlement lifecycle

`grantEntitlement(db, userId, productId, source)` → validates the product,
then is **idempotent**: a second grant call for an already-active
`(user, product)` pair returns the existing row rather than creating a
duplicate. `revokeEntitlement(db, entitlementId)` → sets `status:
'revoked'` + `revokedAt`; revoking an already-revoked entitlement is a
harmless no-op. Both are server-only (no client-reachable file imports
them — enforced by `security.test.ts`) and there is no public route that
calls either yet.

## Preview lifecycle

`consumePreviewUse(db, userId, preview)` is wrapped in a `BEGIN IMMEDIATE`
SQLite transaction: the write lock is taken before the read, so a second
call arriving while the first is mid-transaction cannot both read the
same `usesConsumed` and both succeed — `maxUses` can never be exceeded no
matter how many calls arrive back to back, tested up to 10 rapid and 10
`Promise.all`-"simultaneous" calls in `previews.test.ts`. This
serialization is per-database-file; a real multi-instance production
deployment needs the equivalent transactional guarantee from whatever
hosted database eventually replaces `node:sqlite` here (see "Database
engine chosen, and its limits"). Consuming a preview never creates or
touches an `Entitlement` — `previews.ts` does not import `entitlements.ts`
at all, checked structurally by a dedicated test.

## Server/client security boundary

Nothing client-reachable exists yet: there is no API route, no Server
Action, no `'use client'` component importing anything under
`lib/server/` (all three confirmed by `security.test.ts`, which scans the
whole `app/` and `components/` trees). `getDb()` is lazy — importing
`lib/server/db.ts` has no filesystem side effect on its own. No secret,
credential, or `NEXT_PUBLIC_`-prefixed value appears anywhere in
`lib/server/`. Every authoritative value (identity, entitlement status,
product ownership, preview usage count) is read from the database inside
`lib/server/`, never accepted as a parameter representing a client's
claim about itself.

## Current limitations

- Anonymous identity only — see "Identity model" above.
- `node:sqlite` is a development/single-instance database — see "Database
  engine chosen, and its limits."
- No route, page, or component calls any of this yet.
- Protected book content is still fully bundled client-side — §11 above
  is unchanged by this task; persisting entitlements does not, by itself,
  protect content that is already shipped to every browser.
- No payment processing, payment provider, or admin UI exists.

## How Prompt 27 will use this foundation

The next content-delivery task can now: identify a request's user via
`lib/server/session.ts`; call `lib/server/accessService.ts`'s
`canAccessForUser()` before serving a chapter/method that should be
protected; and — separately — call `lib/server/previews.ts`'s
`consumePreviewUse()` when the author activates a real free preview. It
should NOT need to touch `lib/access/`'s decision logic, the geomancy
engine, or the offline caching layer to do so.

**This implementation provides entitlement persistence and server-side
identity infrastructure. It does not yet protect the book content because
the current book content is still bundled into the client application.**

## What this is not

- Not full authentication — there are real, server-verified identities,
  but only anonymous/device ones; no password, email verification, or
  login flow exists.
- Not a production-scale database — `node:sqlite` is a real SQL engine
  but a single-file, single-instance one; see its limits above.
- Not payment processing — no provider is chosen or called.
- Not an admin dashboard — no UI exists here.
- Not protected-content security — book text is still fully bundled
  client-side; see §11.
- Not commercial preview enforcement in production — the persistence is
  real, but no route calls it, and no preview has been activated as the
  author's final choice.
