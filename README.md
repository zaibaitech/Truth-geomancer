# Truth Geomancer

An MVP web app for **Ilm al-Raml** (Arabic geomancy / "the science of the sand") —
a manuscript marketplace and reader paired with an interactive chart-casting tool.
Built as a sibling app to [Deftere](../cherno-moussa-yero-sy), reusing its mobile-shell
layout pattern (centered column, sticky bottom nav, card-based dashboard) with an
entirely new visual identity ("sand and ink": deep ink brown, sand gold, clay orange)
and a domain the source app doesn't touch.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind. No external state/UI libraries —
everything is hand-rolled React + Tailwind, matching the sibling app's approach.

## What's here (MVP scope)

- **Dashboard (`/`)** — hero card, three quick actions (Cast / Library / My Star), and a
  horizontally-scrolling manuscript strip.
- **Cast a Chart (`/raml`)** — the core feature. A tap-to-cast ritual: the user taps a
  "sand" button freely for each of the 4 lines of each of the 4 Mother figures (16 lines
  total), exactly mirroring the book's own counting method, rather than a single
  `Math.random()` button. From the 4 Mothers the app derives the 4 Daughters, 4 Nieces,
  2 Witnesses, the Judge and the Reconciler — the full classical 16-house shield chart —
  and presents results across four tabs: Overview (Judge/Self/Wealth/Illness), Full Chart
  (all 16 houses), My Star (Buruji via 3 traditional methods, spiritual-strength check,
  root-cause check), and Sadaqah (the offering indicated by the chart).
- **Library (`/books`)** — marketplace-style catalog. *The Master of Geomancy, Vol. 1* is
  fully readable in-app, chapter by chapter, transcribed from the source manuscript.
  *Kanzul Mikban* (the advanced companion volume) is listed as "coming soon" — its content
  wasn't supplied. No payment processor is wired up yet (Phase 1, matching the sibling
  app's manual-confirmation approach) — the "Start Reading" flow is fully live, purchase
  is not.

## The geomancy system

This isn't the Latin-named 16-figure system (Via, Populus, Fortuna...). The source
manuscript teaches a West African Islamic tradition (Bazdaaho arrangement, attributed to
Sheikh Abu Abdullah az-Zanati) where the same 16 classical binary figures carry different
names — Yussif, Adam, Mahadi, Iddris, Ibrahim, Issah, Umar, Ayuba, Kalla Allahu, Sulemana,
Ali, Nuhu, Hassan & Hussein, Yunus, Usman, Musah — each tied to one of 4 elements (Fire,
Air, Water, Sand), with its own House 6 (illness) and House 2 (wealth) meaning and its own
sadaqah (charitable remedy). All 16 dot-patterns were decoded from the source PDF via
image analysis and cross-validated against the book's own element groupings (all 16
patterns accounted for exactly once, zero conflicts) — see `content/stars.ts`.

The casting algorithm (`lib/raml/casting.ts`) implements the classical shield-chart
derivation: Daughters read across the Mothers' lines; Nieces, Witnesses, the Judge and the
Reconciler are built by the book's own combination rule (same dot-count -> double,
different -> single). This was independently verified against on-screen results during
testing (see conversation) — every derived house matched hand recomputation.

## Not yet done

- Single locale (English). The sibling app's `next-intl` FR/EN/AR setup wasn't ported —
  there's no French or Arabic content to translate yet, so it seemed premature.
- No real payment integration, no accounts/auth, no persistence (each casting is
  ephemeral — nothing is saved between sessions yet).
- *Kanzul Mikban* has no content — only its catalog placeholder exists.
- No PWA icons (manifest exists but points at an empty icon list).

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build       # production build
npm run typecheck
```
