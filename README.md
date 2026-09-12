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
  Each book reads as one continuous vertical document (`/books/[id]/read`) — chapters are
  stacked `<section>`s in one scrollable page, not a page-per-chapter carousel, so reading
  on is exactly "keep scrolling down"; the contents list, search results, and the casting
  flow's "Open full chapter" links all jump straight to a chapter via a plain `#id` anchor
  rather than a page navigation. No payment processor is wired up yet (Phase 1, matching
  the sibling app's manual-confirmation approach) — the "Start Reading" flow is fully live,
  purchase is not.
- **Casting types (`/raml`, "What is this reading for?")** — before casting, the user
  browses ten broad categories (Love & Couple, Money & Possessions, Work & Success, Health
  & Hardships, Family & Loved Ones, Travel & Change, Legal & Conflict, Lost & Stolen
  Things, Fate & Timing, Dreams) down to a specific question, or searches all 153 questions
  directly via the "All (A-Z)" toggle; a "Recent" section resurfaces the last few picked
  (`lib/raml/recentIntentions.ts`). Every one of Kanzul Mikban's 153 chapters is reachable
  this way — `content/intentions.ts` maps each chapter to exactly one selectable question
  under one category, generated from the book's own chapter titles rather than a hand-
  picked subset. After casting, a "Your Reading" tab shows that chapter's result: for a
  growing set of chapters the method now runs automatically end-to-end (houses picked off
  the chart, combined per the book's rule, and the resulting figure's verdict shown
  directly); for the rest, the chapter's exact method text is shown with every house it
  mentions (`h1`, `h7`, ...) resolved against the real figure the user's own chart landed
  on there — see "On not inventing verdicts" and "The automatic interpretation engine"
  below for how much of that is now fully automatic and why the rest isn't yet.

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
which of these qualities (confirmed by exhaustive search of both texts), so it can't be
resolved as this book's own authority. What it *can* be resolved against, clearly labeled
as such, is the standard classical Western/Arabic geomancy attribution table for the same
16 binary patterns — see `content/classicalAttributes.ts` for the full mapping and its
sourcing (Fortune per the classical Latin-named figures; Upward/Downward derived
structurally from each figure's first vs. last line, with genuinely ambiguous patterns
marked "level" rather than forced to a guess).

The flagship "If She's Going to Stay in the Marriage or Not" chapter is hand-authored
(`lib/raml/methodVerdicts.ts`) to the book's exact wording. Beyond it, a general parser
(`lib/raml/methodParser.ts`) reads every other chapter's own "Method N: ..." text and
auto-computes a result wherever it can do so with real confidence: the instruction is a
plain "pick/check these houses" (not an element-isolation or dot-counting technique, which
use a different mechanic this parser doesn't attempt), and the outcome text resolves
cleanly to one of a handful of recognized shapes — good/bad, upward/downward, both
together, the resulting figure's own element, whether it turns up elsewhere in the chart,
a specific line's single/double dot state, or a specific named figure at a specific house.
Every branch a method's own wording describes has to be captured by the parser for it to
run at all; if a computed result lands on a combination the text simply doesn't address
(e.g. a "level" figure on an upward/downward-only method), the card still shows every
mechanical fact plainly with an honest note that the book's own wording doesn't cover it,
rather than forcing a guess. As of this writing that reaches roughly 54 of the book's 134
method paragraphs across 33 of its 153 chapters; a chapter can mix computed cards with the
plain house-chip fallback paragraph by paragraph, wherever only some of its methods parse
safely. Everything else — embedded hand-drawn figures the source couldn't transcribe,
whole-chart tallies ("count all the good stars..."), multi-house comparisons without one
combined figure, incomplete source text — still falls back to the plain house-chip
display: `content/manuscripts/kanzul-mikban.ts` transcribes the qualities language
verbatim, and the "Your Reading" tab resolves what's mechanically certain — which real
figure the user's own chart put at each house the method names — leaving the good/bad call
to the reader. Widening the parser's recognized shapes (element-isolation and whole-chart
tallies are the next-biggest categories left) is the natural next step.

## The automatic interpretation engine

`lib/raml/engine/` is a second, more structured automation layer sitting alongside the
general parser above — built question by question from the manuscript text directly rather
than parsed in bulk, so each one can carry a full audit trail and multi-method comparison
without waiting on a fully general rule language. It never touches chart generation
(`lib/raml/casting.ts`) or the figure data (`content/stars.ts`,
`content/classicalAttributes.ts`) — it only reads them. See `lib/raml/engine/COVERAGE.md`
for the full per-chapter table; the summary:

- **Chart model** (`engine/chartModel.ts`) adapts the existing `Chart` into a richer
  `ChartModel` where every house carries its full traditional quality set — fortune,
  direction, per-line opened/closed, and also stability, gender, and day/night — with each
  one honestly labeled `verified`, `needs_review`, or `uncertain` per where its value
  actually comes from. Stability, gender, and day/night are always `needs_review`: the
  source manuscripts name these as real qualities but never tabulate which figure carries
  which, so the engine represents the *slot* for that data without inventing what goes in
  it.
- **Operations** (`engine/operations.ts`) are the reusable primitives every method is built
  from — add houses, check a single house, check whether a figure recurs (or how many times
  it recurs) elsewhere in the chart, extract lines into a new synthetic figure (either one
  element across several houses, or a different named line from each house — the same
  mechanic the casting algorithm already uses to derive Daughters from Mothers,
  generalized), compare several methods' verdicts into one consensus. Methods never call
  `addPatterns` or `getStarByPattern` directly — only through these, so there's exactly one
  place the actual geomantic math lives.
- **Question registry** (`engine/questions/`) currently covers Kanzul Mikban chapters 1-19
  in full, each transcribed and cross-checked against the manuscript text directly, not
  paraphrased — travel, money, business, hunting/searching, fight-war-court (two separate
  chapters), enemy/thief location, marriage, staying in a place, sickness survival, two
  distinct lost/stolen-item questions, home-vs-travel success, wealth, having children,
  pregnancy stability, life improving, overcoming an enemy, and timing. Of their 48 combined
  methods, 35 are `verified` and computed automatically; 2 are `needs_review` (the
  calculation is computable but the rule itself is ambiguous — e.g. a "single-dot star"
  label the source never defines at the whole-figure level); 11 are `uncertain`, almost all
  because their deciding figures were transcribed as "[figures omitted]" in the source
  PDFs. A `needs_review`/`uncertain` method whose facts ARE still computable (e.g. "check H2
  and H6") shows those facts in the audit trail regardless — only the verdict is withheld,
  never the calculation. A question with zero verified methods still gets a registry entry
  rather than silently falling back, so picking it produces an honest
  "not enough to go on" reading with the source quotes, not no acknowledgment at all.
- **Rule engine** (`engine/ruleEngine.ts`) runs every method for a question automatically —
  no house is ever asked of the user — and computes a consensus across whichever methods
  came back verified: `agree`, `mostly_agree`, `mixed`, `conflict`, or `insufficient_data`
  if nothing was computable at all.
- **Interpretation** (`engine/interpretation.ts`) turns that already-decided calculation
  into sentences. It never decides anything itself — no model call, no free-text reading of
  the chart — it only phrases a result Layer 1 already computed deterministically.

Covered by an automated test suite (`npm test`, Vitest) — 103 tests as of that stage, against
a hand-verified fixture chart whose every house was checked by hand against the addition rule
before being relied on in an assertion: correct house selection, figure addition (including
that it's order/grouping-independent, since the addition rule is associative and
commutative), element extraction (both forms), quality identification, multi-method consensus
in all five levels (including several questions that genuinely conflict or split on this
fixture chart — encoded faithfully rather than "corrected," since two of chapter 10's own
methods disagree with each other in the source itself), and a regression pass over the
untouched casting engine itself.

### The reading & results layer

`engine/reading.ts` is a third, purely presentational layer on top of the above — it
recalculates nothing. `composeReading(engineResult, question)` takes the rule engine's own
output and re-arranges the SAME values into a `ReadingResult`: a friendly question category,
a primary/supporting figure split (deduped, each with only the attributes that are actually
`verified` — never a displayed "unknown"), a per-method row against the overall outcome
(excluding, correctly, any method whose own outcome is itself `uncertain` — that's a real
case: a verified rule can still land outside every branch it defines, and that method must
never silently count toward agreement), a full-sentence consensus summary and disagreement
note built only from the existing consensus counts, and traceable source references resolved
to their real chapter numbers. `runReading(chart, intentionId)` is the one call
`ResultTabs.tsx` uses — `runEngine` is still exported for anything that only wants the
undecorated calculation.

**A figure's traditional qualities are never the same thing as a method's outcome.** Every
`ReadingIndicator` carries both, kept visibly separate: `fortune`/`direction`/`element` are
the figure's own qualities (from the chart), while `methodOutcome`/`methodOutcomeLabel` are
that SPECIFIC method's verdict. A "Bad" figure producing a "Favourable" outcome (the book's
own chapter 2 money question, on the project's standard fixture chart) is real and stays
visible as exactly that — the calculation rule decides the outcome, never the quality label.
Each indicator also carries a `relevance` note — "Supports/Provides a conditional
indication/Gives a differing indication: <the method's own interpretation text>", or "Not yet
counted toward this result" for an uncounted method — built only by comparing already-known
outcome values, never a new geomantic claim.

Outcome language is traditional-consistency phrasing only, never an invented probability or
confidence score: `"Favourable — the verified methods agree."`, `"Mostly favourable — most
verified methods indicate a favourable outcome, with one conditional or differing
indication."`, `"Mixed — the verified methods give materially different indications."` A
`mixed` method outcome is a distinct, third state — shown as "Conditional / Mixed" with its
own `~` mark in Method Consistency, never folded into "unfavourable" — and the consensus
sentence spells out each type in full ("Two methods indicate a favourable outcome. One method
gives a conditional indication."), never a bare "2 favourable, 1 unfavourable" fragment.

Two states get exact, spec-required copy rather than any generated phrasing: a question with
zero verified methods shows "Insufficient Verified Data" / "We could not produce a reliable
automatic reading from the currently verified source rules." plus a WHY list (each
method's own review note) and a SOURCE STATUS tally — never a fabricated outcome or primary
figure; a question with a MIX of verified and unverified methods shows its real result plus
one line — "Some additional traditional methods could not be evaluated because their source
material requires verification." A genuine conflict (e.g. chapter 19's court-case methods on
the fixture chart) is shown as a genuine conflict, never averaged into a fabricated middle
ground.

`components/raml/reading/` holds the reusable component set this composes into: `ReadingHeader`
→ `OutcomeCard` (or `InsufficientNotice`, with its WHY/SOURCE STATUS sections) → `FigureCard`
(primary — quality block, then a divider, then that method's own outcome badge and quote) →
`SupportingIndicators` (each with its relevance note) → `MethodConsistencyCard` →
`CalculationDetails` (the one expandable — houses, steps, result figure AND its qualities,
verdict, source quote, plus the full multi-method interpretation for advanced users) →
`SourceReference`. The old always-visible "Interpretation" block was retired: its content is
now the primary indication's own short quote up front, with the full per-method text moved
into Calculation Details as secondary/advanced material — the first screen answers the
question in a few seconds, per the recommended order, rather than surfacing every method's
text (or a house-number formula) as prominently as the answer itself.

Auditing all 19 questions against this new layer surfaced two real bugs, both fixed:
`ruleEngine.ts`'s own outcome derivation could pick a side on an exact tie between favourable
and mixed counts even though `COMPARE_RESULTS` had already classified that as a `mixed`
consensus level (self-contradictory: a "Favourable" badge next to a "Mixed" summary sentence)
— a one-line, minimal compatibility fix, the only touch this stage made to the calculation
engine; and the reading layer's own primary-indicator selection could feature a verified
method whose own outcome was `uncertain` ahead of a later, actually-counted method, purely
because it was first in the list — fixed by preferring the first counted method for what gets
featured as primary. Neither changes any method's calculation, verdict, or the consensus math
itself.

Covered by 32 additional tests (`engine/__tests__/reading.test.ts`) — one hand-built
`EngineResult` per scenario (favourable, unfavourable, mostly favourable, conflicting,
insufficient data, needs_review, uncertain, a verified-but-uncertain-outcome method, missing
figure information, missing optional qualities, source traceability, calculation details,
question-specific interpretation pass-through, the two Prompt-3.5 bugfixes above, and the
lettered A-H regression set: bad figure + favourable outcome, good figure + unfavourable
outcome, favourable + conditional + favourable, a genuine conflict, needs_review/uncertain
exclusion from consensus, insufficient data, and supporting-indicator interpretation
consistency), plus end-to-end checks against the real registry on the fixture chart. 135 tests
pass in total; none of the original 103 needed to change.

## Content protection in the book reader

`components/books/ContentGuard.tsx` wraps both books' reading content with copy/leak
*deterrents* — deliberately not called "prevention," because none of this can be: no
website can block the OS screenshot function (power+volume, or any screen-recording API),
on any device, in any browser. Anything claiming otherwise is not being honest about how
browsers work. What it does instead, in line with what real reading platforms in this
position (Kindle's web reader, O'Reilly, etc.) actually do:

- **Selection and clipboard friction** — `user-select: none` on the reading column, plus
  blocked `copy`/`cut`/`contextmenu`/`dragstart` events, with a small toast explaining why
  when someone tries. This stops casual copy-paste; it does not and cannot stop someone
  using browser dev tools, view-source, or a camera pointed at the screen.
- **A tiled watermark** across the entire scrollable chapter column (an inline SVG
  background, low-opacity, `pointer-events-none`) — invisible enough not to interfere with
  reading, present enough that a screenshot carries a visible mark back to this app rather
  than passing as a clean, source-free copy. There's no account system yet (see
  Persistence below), so it currently stamps the app and book name rather than a specific
  reader's identity — the natural upgrade once accounts exist is to stamp *who* read it,
  which is the actually-effective version of this technique.
- **Obscure-on-background** — the moment the tab/app leaves the foreground
  (`visibilitychange`), the reading content blurs out, so it can't show up readable in an
  OS app-switcher/recents thumbnail. This is a real, verifiable privacy win; it's also the
  full extent of what a website can do about screenshots — it does nothing for one taken
  while the page is in the foreground and focused.

Verified in a real mobile browser: text selection disabled, `copy`/`cut`/`contextmenu`
events prevented, content blurs within one frame of the tab going to background and
un-blurs on return, watermark renders across the full chapter length without introducing
horizontal overflow or breaking chapter-anchor navigation.

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
npm test            # engine + casting-regression test suite (Vitest)
```
