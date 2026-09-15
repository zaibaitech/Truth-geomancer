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
owns this book" decision cannot rely on it — this is why `PreviewUsage`
and `Entitlement` are **type-only** in this task: enforcing either for
real requires a backend that can verify identity and persist state the
client cannot rewrite. Until that exists, a `localStorage`-based preview
counter may ship later as a UX nicety (don't re-show the same demo prompt
every visit) but must never be described or relied on as the actual
commercial gate.

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
module is available for integration but is not itself claimed to secure
anything.

## What this is not

- Not authentication — there are no users, sessions, or logins.
- Not a database — nothing here is persisted.
- Not payment processing — no provider is chosen or called.
- Not an admin dashboard — no UI exists here.
- Not protected-content security — book text is still fully bundled
  client-side; see §11.
- Not commercial preview enforcement — `FreePreview`/`PreviewUsage` are
  types only.
