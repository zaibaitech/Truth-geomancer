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
- **Cast a Chart (`/raml`)** — the core feature. All 16 lines are tapped on one screen: The
  Four Draws, each broken into its Fire/Air/Water/Earth lines (the classical top-to-bottom
  element order, which also matches how Kanzul Mikban's own methods isolate "the water
  element of h7" etc.) — tap each line freely and independently, in any order, until it
  feels right; a live figure preview appears on each Draw once its 4 lines are done, and
  "Cast Reading" unlocks once all 16 are. From the 4 Draws (Mothers) the app derives the 4
  Daughters, 4 Nieces, 2 Witnesses, the Judge and the Reconciler — the full classical
  16-house shield chart — and presents results across tabs: Overview (Judge/Self/Wealth/
  Illness), Full Chart (all 16 houses), My Star (Buruji via 3 traditional methods,
  spiritual-strength check, root-cause check), Sadaqah (the offering indicated by the
  chart), and Your Reading when a specific question was picked (see Casting types below).
  Every completed casting is saved automatically (see Persistence below).
- **Past Castings (`/raml/history`)** — every chart ever cast on the device, newest first,
  each showing its question, date, and Judge figure. Tap one to reopen the full result
  view exactly as it was; delete individual castings from there or from the detail page.
  A "Recent castings" preview also surfaces the last 3 right on the casting screen, and
  the My Star tab links out to the full list.
- **Library (`/books`)** — marketplace-style catalog, both books fully readable in-app.
  *The Master of Geomancy, Vol. 1* covers the fundamentals chapter by chapter. *Kanzul
  Mikban* is the advanced companion — a manuscript notebook of **153 question-specific
  reading methods** (travel, money, marriage, pregnancy, sickness, lost things, court
  cases, dreams, and much more), transcribed in full with a filterable table of contents.
  No payment processor is wired up yet (Phase 1, matching the sibling app's
  manual-confirmation approach) — the "Start Reading" flow is fully live, purchase is not.
- **Casting types (`/raml`, "What is this reading for?")** — before casting, the user
  browses ten broad categories (Love & Couple, Money & Possessions, Work & Success, Health
  & Hardships, Family & Loved Ones, Travel & Change, Legal & Conflict, Lost & Stolen
  Things, Fate & Timing, Dreams) down to a specific question, or searches all 153 questions
  directly via the "All (A-Z)" toggle; a "Recent" section resurfaces the last few picked
  (`lib/raml/recentIntentions.ts`). Every one of Kanzul Mikban's 153 chapters is reachable
  this way — `content/intentions.ts` maps each chapter to exactly one selectable question
  under one category, generated from the book's own chapter titles rather than a hand-
  picked subset. After casting, a "Your Reading" tab shows that chapter's exact method
  text, with every house it mentions (`h1`, `h7`, ...) resolved against the real figure the
  user's own chart landed on there — see "On not inventing verdicts" below for why the app
  stops short of resolving the method's own good/bad conclusion for them.

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

## On not inventing verdicts

Kanzul Mikban's methods constantly resolve to a verdict via qualities — "good," "bad,"
"middle-good," "upward," "downward," "opened/closed," "male/female" — that the book treats
as a fixed property of each of the 16 named figures, the same way it treats each figure's
element as fixed. Nothing in either manuscript actually tabulates which figure carries
which of these qualities, and it isn't safe to reconstruct from memory of the (different)
classical Western/Arabic attribution tables — a wrong guess would present a fabricated
verdict as this book's own authority, in something people may use for real decisions. So
`content/manuscripts/kanzul-mikban.ts` transcribes the qualities language verbatim, and
the "Your Reading" tab resolves only what's mechanically certain — which real figure the
user's own chart put at each house the method names — leaving the good/bad call to the
reader (or the compiler of this edition, or whoever else can verify it against source). If
that attribution table turns up, `lib/raml/interpret.ts` is the natural place to wire it in
and let the app resolve verdicts outright.

## Persistence

Castings are saved to the browser's `localStorage` (`lib/raml/storage.ts`) — there's no
backend or account system yet, so "on this device" is the honest scope: nothing syncs
across devices or browsers, and clearing site data clears the history. What's stored per
casting is just the 4 Mother figures, the question text, and a timestamp; the full chart
(Daughters through Reconciler) is recomputed from those on every view, so it always
reflects the latest star data rather than a frozen snapshot. Verified end-to-end in a real
browser: cast → saved confirmation → appears in Recent Castings and full History → reopens
with identical results → survives a full page reload → deletes correctly.

## Not yet done

- Single locale (English). The sibling app's `next-intl` FR/EN/AR setup wasn't ported —
  there's no French or Arabic content to translate yet, so it seemed premature.
- No real payment integration, no accounts/auth — persistence is local-device only (see
  above), not synced to a server or across devices.
- No PWA icons (manifest exists but points at an empty icon list).
- The ten categories in `content/intentions.ts` were assigned by keyword classification
  over the book's own chapter titles, not hand-curated one by one — a handful may sit in a
  slightly better-fitting category than the one they landed in.
- A handful of methods reference dot-figures that were embedded as hand-drawn images in
  the source and couldn't be transcribed as text; those spots are marked inline rather
  than guessed at (see "On not inventing verdicts").

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build       # production build
npm run typecheck
```
