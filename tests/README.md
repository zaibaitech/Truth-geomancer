# Leak guards (SEO Stage 1a)

Test-only guards that stop paid / restricted content of The Truth Geomancer
from reaching visitors who have not bought it. They change no runtime
behaviour. They exist so Phase 1 public SEO pages can be added safely.

| File | Guards |
| --- | --- |
| `guards/importGraph.test.ts` | Every route is classified. No protected module (book text, engine, restricted star data, Hatim values, …) is reachable from `'use client'` code beyond the known-leak baseline. Public routes never import raw book text (documented server-only exceptions aside). Reserved SEO dirs (`app/learn`, `app/figures`, `components/seo`, `content/public`, …) contain no client components. |
| `guards/leakMatcher.test.ts` | The fingerprint matcher works on minified JS, RSC/JSON and HTML. Every protected group yields fingerprints. No free string is ever fingerprinted. Ratchet logic. |
| `guards/paidApiUnauthenticated.test.ts` | Paid APIs (reading, reading-verdicts, practice, chapter text, offline bundle) answer 403 with no content to a visitor without an entitlement. Preview status leaks nothing. The one free sample still works. |
| `guards/publicPageRender.test.tsx` | Signed-out server HTML of every public page contains zero protected fingerprints. |
| `guards/publicContentAllowlist.test.ts` | The free-materials allowlist cites real code and agrees with the access policy (free sample, previews; General Reading is paid). |
| `guards/buildOutputScan.test.ts` | Opt-in vitest wrapper around the build scan (`LEAK_SCAN_NEXT_DIR=.next`). |
| `../scripts/scan-build-leaks.ts` | Scans a real `next build` (public JS chunks plus prerendered HTML/RSC) for fingerprints and applies the ratchet. |

Fixtures:

- `fixtures/publicContentAllowlist.ts` lists INTENTIONALLY FREE material, with source references. It is subtracted from fingerprints, and it is the list public SEO pages may link to or reuse.
- `fixtures/protectedContent.ts` defines the protected corpus. It is read at run time from the real modules, and no protected text is copied.
- `fixtures/routeClassification.ts` classifies every route.
- `fixtures/knownLeaks.ts` is the **ratchet baseline** of leaks that exist today (L1 restricted star fields, L2 Hatim values, L3 low items). It may only shrink. A new leak fails. A fixed leak also fails until its entry is deleted.

Fingerprint ids are `sha256(group | normalised string)` truncated to 16 hex characters, so they are stable and non-reversible.

## Run

```bash
npm test                         # everything, including the guards (build scan skipped)
npx vitest run tests/guards      # guards only

npm run build && npm run test:leaks   # build-output scan (CI: run after the build step)
npm run test:leaks:build              # same, builds first
npm run test:leaks -- --next-dir path/to/.next --verbose
LEAK_SCAN_NEXT_DIR=.next npx vitest run tests/guards/buildOutputScan.test.ts
```

`test:leaks` exits 1 when it finds a new leak, when a fixed leak is still in the baseline, or when it hits a zero-tolerance SEO route (`/learn`, `/figures`, …). It exits 2 when there is no build.

## When a guard fails

- **New leak**: don't add it to the baseline. Move the data server-side, or pass a public projection to the client component.
- **Fixed leak**: delete the listed ids or modules from `fixtures/knownLeaks.ts`.
- **Free content flagged**: only add it to `publicContentAllowlist.ts` once the author confirms it is free, and cite the source.
- **New route**: classify it in `fixtures/routeClassification.ts`.
