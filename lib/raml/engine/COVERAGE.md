# Structured engine — rule coverage report

This tracks the hand-authored, structured engine in `lib/raml/engine/questions/`
— the layer that gives a question a full audit trail and cross-method
consensus (`agree`/`mostly_agree`/`mixed`/`conflict`/`insufficient_data`).
It is separate from `lib/raml/methodVerdicts.ts` + `lib/raml/methodParser.ts`,
a general text-pattern parser that automates a *different, larger* slice of
the book (~54 of 134 method paragraphs across 33 chapters) without a full
audit trail or consensus layer. The two don't overlap in the app: a question
in this registry always takes priority; every other question still uses the
general parser, unaffected by anything below.

Regenerate this table by hand whenever a chapter is added or a method's
status changes — it is not generated from code, so treat it as documentation
that can drift, not a live report.

## Prompt 4.5 — descriptive result kind (architecture audit, no new chapters)

Before Prompt 4.5, chapters 23/31/36's fully-computable methods were marked
`needs_review` purely because the engine had no `MethodOutcome` for a
categorical answer ("the terrain is water") — an architectural workaround,
not a real source-verification gap. The audit added a genuine third result
shape rather than continuing to misuse `needs_review` for it:

- `MethodOutcome` gained `'descriptive'`, and `MethodVerdict` gained an
  optional `descriptiveAnswer` field (a normalized value used ONLY to
  compare methods for agreement — never displayed raw, never a favourable/
  unfavourable judgment).
- `QuestionDefinition` gained an optional `resultKind: 'outcome' |
  'descriptive'` field (default `'outcome'` — every pre-existing question
  needed zero changes).
- `COMPARE_RESULTS` (`operations.ts`) now takes that `resultKind` and, for
  descriptive questions, compares counted methods by ANSWER EQUALITY
  ("Methods agree" / "Methods disagree" — new `ConsensusLevel: 'disagree'`)
  instead of voting them into a favourable/unfavourable/mixed tally that was
  never the right shape for a categorical fact.
- Chapters 23, 31, and 36 were migrated from `status: 'needs_review'` to
  `status: 'verified'` with a real `outcome: 'descriptive'` verdict — the
  calculation didn't change at all, only how honestly its result type is
  represented. **No source rule was invented or altered by this change.**
- `EngineReadingView`'s existing generic components (`OutcomeCard`,
  `MethodConsistencyCard`, `FigureCard`) gained small, data-driven
  adaptations (a "Reading" eyebrow + the actual answer text in place of a
  favourable/unfavourable badge; per-method rows without a check/cross icon)
  rather than a second, hard-coded UI — see "Files changed" in the session
  report for the full list.

This is a presentation/result-model change only; every existing outcome
question's calculation, consensus, and display are byte-identical to
before. See `lib/raml/engine/__tests__/reading.test.ts` ("Prompt 4.5 —
descriptive result kind") and `operations.test.ts`
("COMPARE_RESULTS — descriptive questions") for the new coverage.

## Prompt 5 — Kanzul Mikban chapters 41-60 (Stage 4)

Source-first expansion, same discipline as Prompt 4: read every chapter's
actual text (not the table of contents), preserve every method
independently, never merge distinct traditional methods into one
algorithm, never guess an omitted figure, never force a descriptive answer
into favourable/unfavourable. 17 new questions registered, reusing the
`resultKind: 'descriptive'` model Prompt 4.5 built rather than inventing
another result shape — nothing new was needed there.

Two consolidation decisions, both source-driven rather than convenience
merges:

- **Chapter 47 + the unnumbered "Additional Methods — If You Want to Know
  If She's Pregnant" fragment** (which follows chapter 56 in the source and
  is explicitly titled as extending chapter 47's own question): that
  fragment's first two methods are registered as `lady-pregnant-method-3`
  and `-4` on chapter 47's question, since they answer the exact same
  question, more completely (full upward/downward and good/bad branch
  coverage) than chapter 47's own two positive-trigger-only methods. Its
  third method (predicting the baby's *sex*, not whether she's pregnant) is
  a different question — see below.
- **Chapter 48 + Chapter 56**: both ask "will the child be male or female"
  — content/intentions.ts already carries a separate intention id for each,
  but per instruction #10 ("check for duplicate/overlapping questions, reuse
  an existing id") they are registered as ONE question, under chapter 48's
  id. Chapter 48's own two methods both hinge on classifying a figure
  directly as a "male star"/"female star" — a classification neither this
  chapter nor any other in the source (so far) defines, and which this
  project's general `FigureQualities.gender` axis is intentionally left
  `needs_review` for, project-wide (see types.ts — this is not new to
  Prompt 5). Chapter 56's method needs no such classification at all — it's
  pure whole-chart dot arithmetic (`COUNT_TOTAL_DOTS` + `CAST_OUT_BY`, both
  new, generic, reusable primitives) — and is the only verified method
  here. Chapter 56's own intention id therefore has no `QUESTION_REGISTRY`
  entry (it falls back to the general parser, same as any other
  not-yet-structured chapter — this is normal, not a gap).

Two chapters and one unnumbered fragment were read in full and found to
have **no computable shape at all**, so nothing was registered for them —
see "Architectural gaps" below for the full reasoning: chapter 46 (a
talismanic/ritual practice, not a chart-verdict method, with its own
diagram omitted from the transcription), chapter 59 (every method is
either open-ended/non-deterministic — "use whatever star you get to talk
to the person" — or not chart-derived at all), and the unnumbered
"Consequence of Friendship Between Two People" fragment after chapter 52
(fully computable, but carries no chapter number and so falls outside this
stage's numbered scope).

One new architecture-level finding, not a source-rule change: this
stage's descriptive questions are joined by several genuinely **yes/no
factual** ones (is she pregnant, is it a male/female child, have they had
sex) that don't carry any favourable/unfavourable value judgment in the
source — `resultKind: 'descriptive'` was used for these too, consistent
with Prompt 4.5's own principle ("do not force every question into the
outcome-voting model"). This is a considered extension of that principle,
not a new mechanism — no types.ts change was needed. Chapter 21's
pre-existing, structurally identical question (wife/sister had sex) still
uses the older favourable=yes/unfavourable=no treatment from before the
descriptive kind existed; that inconsistency is flagged in the
source-verification queue below rather than silently left unremarked, but
fixing it is out of this stage's scope (Prompt 5 scopes chapters 41-60
only).

Real, hand-computed data on the shared fixture chart produced two genuine
cross-method disagreements this stage — both preserved honestly, neither
averaged nor silently resolved: chapter 58 ("if couples have had sex")
disagrees ("yes" vs. "no" — `ConsensusLevel: 'disagree'`), and chapter 60
("if she/he loves you") conflicts (`favourable` vs. `unfavourable` —
`ConsensusLevel: 'conflict'`, `overallResult: 'mixed'`).

See `lib/raml/engine/__tests__/questions-stage4.test.ts` for the full
per-method, hand-verified test coverage, and `__tests__/audit-1-60.test.ts`
(renamed from `audit-1-40.test.ts`, generalized to run its structural/
consensus/descriptive-integrity checks against every registered question,
chapters 1-60 together) for the full regression audit.

## Prompt 6 — Source Reconciliation & Architecture Audit (chapters 1-60)

A full audit stage, not a knowledge-base expansion: no new chapters, no new
source rules, no invented classifications. Governing principle: *source
fidelity over completeness — never infer, extrapolate, or invent a
geomantic rule simply because the application needs a result.* Everything
below is either a confirmation ("reviewed, no change needed") or a fix with
regression tests; nothing was changed on editorial preference alone.

**1. Chapters 1-60 audit status.** Every registered question, every
`operations.ts` primitive, `ruleEngine.ts`, `types.ts`, `reading.ts`,
`interpretation.ts`, and `chartModel.ts` were reviewed. `casting.ts` was
read but not touched (see "Confirmation" below). Two genuine issues were
found and fixed (chs. 18 and 21, detailed below); everything else reviewed
was confirmed already correct.

**2. Male/female-star resolution — CONFIRMED UNRESOLVABLE, not guessed.**
Exhaustively re-searched both source manuscripts
(`content/manuscripts/kanzul-mikban.ts`, all 153 chapters, and
`master-of-geomancy-vol1.ts`) for any table, glossary, appendix, or later
chapter defining which of the 16 figures are male vs. female. None exists.
Two independent pieces of evidence: (a) a plain-text grep for "male
star"/"female star" across the whole manuscript finds 7 occurrences (chs.
31, 41, 48 x2, the pregnant fragment's Method 3, and two more not yet
implemented, ch. ~71 and ch. ~90 by line position) and every one of them
*uses* the classification without ever *defining* it, except ch.31, which
explicitly redefines gender via element for its own rule only; (b) the
manuscript's own front matter (`KM_EDITION_NOTE`, already present in this
codebase) states outright: "male or female" is named as one of the
qualities the book regularly uses, but "this transcription has no verified
source defining exactly which of the sixteen named figures carries which
quality." Per Prompt 6 section 2's explicit instruction, no classification
was invented. Instead: chapter 41 Method 1 and chapter 48 Methods 1-2
remain `needs_review`, and now additionally carry a new, optional,
machine-readable `reviewReasonCode: 'gender_classification_unsourced'`
field on `MethodDefinition` (types.ts, purely additive) — see "Operation
and result-model audit" below. The UI already explained this in full
sentences via each method's own `reviewNote` (confirmed unchanged via a
live re-screenshot of ch.41's insufficient-data screen); no UI change was
needed. Regression tests (`audit-1-60.test.ts`, new describe block) prove
every gender-blocked method never produces a verdict and never enters
consensus, and will automatically cover any future method carrying the
same reason code.

**3. Descriptive-result audit.** Chapters 47, 48/56, 49, 53, 54, 55, 57,
and 58 were re-reviewed individually against the question "does the source
attach a favourable/unfavourable value judgment to this answer, or is it a
neutral fact?" All eight were confirmed correctly modeled as
`resultKind: 'descriptive'` — including a specific re-examination of
chapter 57's "daytime is good... night time is good for you to travel"
wording (which uses the word "good" but never states an "unfavourable"
alternative — every chart produces a recommended time, the same
no-negative-branch shape as chapter 54's "which direction," not a
favourable/unfavourable axis). Chapters 1-40 were scanned for the specific
failure mode named in Prompt 6 section 3 (a real descriptive answer forced
into `insufficient_data`): chapters 4, 5, 6, and 17 (huntingSearching,
fightWarLocation, enemyThiefLocation, timingOfEvent) are genuinely blocked
by omitted source figures, independent of result kind, so nothing to fix;
chapter 10 (lostThingAround) was checked closely since its title ("Is Your
Lost Thing Still Around or Gone") sounds locational, but its own text
consistently frames "still around" as good news and "gone" as bad news
across all 5 of its methods (unlike chapter 49's purely neutral "closer or
far away," which correctly stays descriptive) — confirmed correctly
`outcome`, not changed. One borderline case was found and deliberately
**not** changed: chapter 32 ("will it rain") is structurally a binary
yes/no fact like chapters 47/58, but the source never marks it as neutral
information either, and it fits the same "will X happen" mold as many
already-`outcome` chapters (money, children, safe return) with no clear
evidence favoring a change — flagged in the source-verification queue
rather than auto-changed, per section 3's explicit instruction to document
discrepancies rather than resolve every one.

**4. Conditional-result audit.** Chapters 41 M2, 42 M1, 51, and 60 M1 were
re-verified line by line: every named good/middle-good/bad x
upward/downward combination the source distinguishes still produces a
distinct outcome (favourable/mixed/unfavourable), none collapsed. A
positive control was found in `safeInCanoe.ts` (ch.24), which already
implements the full 4-way fortune x direction split correctly, confirming
the pattern works elsewhere in the codebase when the source supports it.
Two "same outcome despite a stated caveat" cases were specifically
re-examined — chapter 1 Method 1 ("return with money" vs. "return
peacefully, but without money," both `favourable`) and chapter 19
(`courtCase.ts`, "win with money" vs. "win, without money," both
`favourable`) — and confirmed NOT a collapsing bug: in both, the caveat is
the *absence of a bonus* (money), not an active downside undermining the
question's own core ask (safe return; winning the case), structurally
different from chapter 42's "get it but then lose it over time" (`mixed`)
or chapter 60's "loves you but might divorce" (`mixed`), where the caveat
directly undermines the thing being asked about. One genuine bug WAS found
and fixed: chapter 18 (`stolenThings.ts`) Method 3's own source text names
TWO independent rules for the same h2+h6+h9+h16 calculation — the book's
own primary "found in the chart" rule, and a second, explicitly-attributed
rule ("Some scholars also say...", verbatim in the source) giving a more
detailed good/bad x upward/downward breakdown. The previous version
folded the scholars' rule into cosmetic elaboration text on the primary
rule's own verdict, so a "good but upward" result (which the scholars'
rule itself calls "you might not get them," i.e. `mixed`) could never
actually surface as anything but the primary rule's flat
favourable/unfavourable. Split into Method 3 (primary rule only) and a new
Method 4 (the scholars' rule, independently computed and counted) — this
is the exact "preserve every method independently" principle, applied
retroactively. A grep for this "Some scholars"/"also say" pattern across
the whole manuscript confirms chapter 18 is the only occurrence — not a
symptom of a wider problem.

**5. Chapter 58 vs. Chapter 21 — RESOLVED as an implementation
inconsistency, fixed.** Both ask the same real-world question (did sexual
activity occur — a yes/no fact) via the identical mechanic (a water line's
opened/closed state). Chapter 58 (`couplesHadSex.ts`, built in Prompt 5)
correctly uses `resultKind: 'descriptive'`; chapter 21
(`wifeSisterHadSex.ts`, built in Prompt 2, one stage before the
descriptive model existed in Prompt 4.5) never got migrated. This is
category 2 of the four Prompt 6 offered ("an implementation
inconsistency") — not a genuine source difference (the source attaches no
value judgment to either chapter's answer), not an architectural
limitation (the descriptive model already existed and worked), and not
insufficient evidence (both source passages are clear). Fixed: chapter
21's Method 2 now reports `outcome: 'descriptive'` /
`descriptiveAnswer: 'yes'|'no'`, matching chapter 58 exactly; its
underlying calculation (H7+H13, water line state) is byte-for-byte
unchanged — confirmed by a regression test asserting the same figure
(Nuhu) and the same water-line state as before the fix, only the outcome
label changed. Live-rendered and screenshotted: the reading now shows
"READING / Had sex" instead of a fabricated "Favourable" badge.

**6. Non-implemented items — permanently classified.**
- **Chapter 46** (talismanic ritual): confirmed to be a **ritual
  procedure, not a chart-verdict method** — its instruction (write/fold/
  place a diagram, weighted with a stone) has no branching structure and
  produces no determinate answer to compute, independent of its also-
  omitted diagram. Not a "missing method" in the sense the other gaps are;
  it was never going to produce a `ReadingResult` verdict even with the
  diagram restored. Stays unregistered.
- **Chapter 59** (secret of the querent): confirmed all 3 methods are
  **open-ended by design**, not incomplete deterministic rules — Method 1
  says "use whatever star you get to talk to the person" (no defined
  verdict shape at all, just "here's a figure, interpret it freely");
  Method 2 has the querent pick a figure with no chart computation
  involved; Method 3 says "add Yusuf to any star found in a house" without
  specifying which house, another free choice. Confirmed the general
  fallback parser (`methodParser.ts`) cannot and does not silently
  mis-parse any of these into a fabricated verdict — its regex patterns
  require an explicit "if X, then Y" branch structure none of these three
  methods have, so it safely falls through to the plain house-chip display
  with no invented answer. Stays unregistered; documented here as its
  permanent classification rather than left ambiguous.
- **Unnumbered "Consequence of Friendship" fragment** (after ch.52):
  reconfirmed **architecturally ready** (fully computable — H1+H3,
  good/bad) but kept outside the registry solely because it carries no
  chapter number, per this stage's explicit instruction not to assign one
  on the project's own initiative.
- **Pregnant fragment's Method 3** (baby-sex via male/female star):
  treated exactly like chapter 48's own Methods 1-2 — the identical
  unsourced-gender blocker. Not registered as its own `MethodDefinition`
  (it would be a third, fully redundant confirmation of a gap chapter 48
  already documents); its existence and the shared reasoning are recorded
  here rather than silently dropped.

**7. Operation and result-model audit.** `COUNT_TOTAL_DOTS` and
`CAST_OUT_BY` (Prompt 5) were re-verified: both are pure functions with no
dependency on chapter 48/56's specific question logic — `CAST_OUT_BY`
doesn't even import `ChartModel`. Confirmed generic and reusable as
designed. One genuine extraction opportunity was found: the "found in the
first/second/third/last 4 houses" mechanic was independently hand-rolled
with the identical `[1-4]/[5-8]/[9-12]/[13-16]` grouping in THREE separate
files (chapters 31, 35, 55) — and a manuscript-wide grep confirms this
exact phrasing recurs many more times in chapters not yet implemented (at
least 8 more instances). This is genuine, evidenced reuse, not a
speculative abstraction, so it was extracted as a new primitive,
`FIND_FIGURE_QUARTER` (`operations.ts`) — it only finds WHICH quarter a
figure occupies; each question keeps its own mapping from quarter to
outcome/label/interpretation, since that meaning genuinely differs per
chapter. All three call sites were refactored to use it with unit tests
confirming byte-identical behavior (same `descriptiveAnswer`/outcome
values as before the refactor, on the shared fixture chart). Result-model
inventory (Prompt 6 section 8): every shape required by chapters 1-60 —
favourable/unfavourable/mixed, insufficient data, descriptive (which
already subsumes factual yes/no, directional, and locational answers via
its `descriptiveAnswer` field, needing no separate `MethodOutcome` values),
and source-review-required — is already representable by the existing
`MethodOutcome`/`RuleStatus`/`resultKind` model. Open-ended (ch.59) and
ritual (ch.46) content don't need a live representation since both stay
unregistered — a valid, already-supported representation choice. The
**only** architecture change made is the new optional
`ReviewReasonCode`/`reviewReasonCode` field described in point 2 — the
smallest possible backward-compatible addition, requested explicitly by
this stage, touching no existing value's meaning.

**8. UI audit.** `InsufficientNotice.tsx` and `CalculationDetails.tsx`
were re-read: both already render every method's status badge and full
`reviewNote` regardless of status, and `OutcomeCard`/`MethodConsistencyCard`
already render the distinct `descriptive`/`disagree`/`conflict` states
correctly (confirmed via live screenshots of the two chapters fixed this
stage, plus chapters 58 and 60 from Prompt 5). No UI component was
modified this stage — the existing generic components already satisfy
"the user should understand what the method found, whether the result is
certain/conditional/descriptive/unresolved, and when the source doesn't
provide enough information" for every result shape audited.

**9. Tests.** 819 before this stage (Prompt 5 baseline) → **829 after**,
all passing: +6 `FIND_FIGURE_QUARTER` unit tests, +3 gender-classification
regression tests (registry-wide, self-updating), +1 net from the chapter
18/21 fixes (assertions updated in place, not weakened — the chapter 18
tests now check a NEW Method 4 that didn't exist before, and the chapter
21 tests now check `descriptiveAnswer` in addition to `outcome`). `tsc
--noEmit` clean, `npm run build` clean, and both fixes were live-rendered
and screenshotted in the browser.

**10. Files changed:** `types.ts` (new `ReviewReasonCode` type +
`reviewReasonCode` field, additive only), `operations.ts` (new
`FIND_FIGURE_QUARTER`/`ChartQuarter`/`QUARTER_HOUSES`), `operations.test.ts`,
`questions/thePersonThatTookAnItem.ts` and `questions/childGender.ts`
(reason code + updated review notes), `questions/wifeSisterHadSex.ts`
(descriptive migration), `questions/stolenThings.ts` (Method 3/4 split),
`questions/lostThingThiefLocation.ts`, `questions/familyDoingWell.ts`,
`questions/thiefWhereabouts.ts` (refactored onto `FIND_FIGURE_QUARTER`),
`__tests__/questions-stage3.test.ts`, `__tests__/questions.test.ts`,
`__tests__/audit-1-60.test.ts`, this file. **Not touched:** `casting.ts`,
`chartModel.ts`, `ruleEngine.ts`, `reading.ts`, `interpretation.ts`, and
every chapter 22-40/41-60 question file.

**11. Remaining source-verification queue additions:** see the updated
table below — chapter 32's "will it rain" yes/no-vs-outcome classification
(borderline, flagged not changed), and the male/female-star gap now has 3
confirmed occurrences (ch.41, ch.48 x2) plus 2 more named occurrences not
yet implemented (~ch.71, ~ch.90 by manuscript line position) that a future
stage should expect to hit the identical wall.

## Prompt 7 — Kanzul Mikban chapters 61-80 (Stage 5)

Source-first expansion, same discipline as Prompts 4/5: read every
chapter's actual text plus 2 unnumbered fragments, preserve every method
independently, never merge distinct traditional methods into one
algorithm, never guess an omitted figure or invent what an incomplete
passage means. 21 new questions registered (20 numbered chapters plus one
unnumbered fragment — "If She/He Is Still in the Marriage," after ch.66).
No chapter this stage turned out to be architecturally out of scope at the
whole-chapter level (unlike ch.46/ch.59 in Prompt 5) — every chapter had at
least one computable method — but several individual METHODS within
otherwise-computable chapters hit genuine, source-documented gaps; those
are detailed below rather than smoothed over.

**Consolidation/registration decisions, both source-driven:**

- **The "Someone's Behavior" fragment** (after ch.64, cross-referencing
  "also see Chapter Forty-Three" in its own title): its calculation
  (H3+H7+H11+H14, +H12) is byte-for-byte identical to
  `futureSpouseCharacter.ts`'s (ch.43) own Method 1, already implemented in
  Prompt 5. Confirmed a genuine source-stated duplicate, not a new rule —
  **not registered** as a separate question.
- **The "If She/He Is Still in the Marriage" fragment** (after ch.66, no
  cross-reference to any other chapter, no chapter number): fully
  computable (H5+H9+H10+H11, figure-presence check) and answers a distinct
  real-world question from ch.66 itself (ever-married-before vs.
  currently-still-married). Unlike Prompt 5's decision to leave the
  "Consequence of Friendship" fragment unregistered solely for lacking a
  chapter number, this stage's own instructions explicitly call for
  registering genuinely new questions found in unnumbered material — so it
  **is** registered, as its own question (`stillInMarriage.ts`). This is a
  considered, documented policy application, not a reversal of Prompt 5's
  own (still-correct, for its own reasons) decision.

**Two new operations, both genuinely reused across multiple chapters, not
speculative:** `ADD_FIGURES` (sums an array of already-computed figures —
needed by chs. 62, 67, and 74's "fire-fire/air-air/water-water/sand-sand
element" mechanic, and would also have simplified ch.1 Method 3's existing
inline workaround, left untouched per this stage's no-ch.1-60-changes
rule) and `COUNT_OPENED_LINES` (counts opened/single-dot lines across the
chart or a house subset — needed by ch.78's "count all the single dots
from h1 to h6" before reducing via the existing `CAST_OUT_BY`). Chapters
76, 77, and 80's "check N houses individually, not combined" pattern was
deliberately composed inline from existing `CHECK_HOUSE`/`CHECK_LINE_STATE`
primitives via `.every()`, not extracted into a new operation — composing
2-4 lines from existing exported functions once or twice per chapter isn't
the kind of duplication Prompt 7 section 7 asked to extract.

**A new `ReviewReasonCode` value, `interpretation_not_stated`:** chapter
64 Method 2 states its full calculation (H4+H11+H7+H14, check
good/middle-good/bad) but the source passage itself ends without ever
saying what any branch means — genuinely different from an omitted figure
(the calculation IS complete here) and from an ambiguous split (there is
nothing stated to be ambiguous about). Classified `status: 'uncertain'`
(not `needs_review`), matching the project's own definition of
`'uncertain'` as "the specific source passage needed to compute this could
not be read with confidence" — here, the passage's own verdict-mapping
sentence is missing, not its arithmetic.

**Male/female-star classification — reconfirmed unresolved, not
invented, per instruction #6.** Chapter 68 ("if your partner is cheating
on you") Method 1 uses the same unsourced male/female-star terminology
Prompt 6 already found has no defining table anywhere in either
manuscript. No later chapter in 61-80 provides one either — the
gender-classification gap remains exactly as Prompt 6 left it, now with a
4th confirmed occurrence (`partner-cheating-method-1`, alongside ch.41 M1
and ch.48 M1/M2). Chapter 68 is additionally blocked by a **second,
independent gap**: its first branch depends on the *querent's own* gender
("if it's a man that comes to check... if it's a lady...") — this app's
casting flow has no input mechanism for who is asking at all (it only
takes 4 Mother patterns). Both blockers are documented on the same method
via its `reviewNote`; `reviewReasonCode: 'gender_classification_unsourced'`
is the primary/first-listed code, consistent with how the field is used
elsewhere in the registry (one reason code per method, the note's prose
covers any secondary blocker).

**resultKind decisions, applying Prompt 6's own descriptive-vs-outcome
test ("does the source attach an inherent value judgment, or is it a
neutral/context-dependent fact?") case by case:** chs. 63, 66, 73,
78-80, and the "still in marriage" fragment are `'descriptive'` (a
family relation, a marital-history fact, a polyandry category, a
pregnancy's age/count/paternity — none framed by the source as inherently
good or bad news). Ch. 74 ("born out of wedlock") stays `'outcome'`
despite being a factual question, because — unlike ch.66's neutral
"married before" framing — the source's own question wording ("adulterous
son/daughter") is already a loaded, negative term, not a neutral category
label; found-in-chart is scored `unfavourable`. Ch. 69's
good/middle-good/bad "will re-marry" spread is a genuine
favourable/mixed/unfavourable gradient, not a neutral fact, so it stays
`'outcome'`.

**Two genuine cross-method conflicts, preserved honestly, neither
averaged nor silently resolved:** chapter 61 ("if a marriage is good or
not") — Method 1 `favourable` vs. Method 2 `unfavourable`,
`ConsensusLevel: 'conflict'`, `overallResult: 'mixed'`, same pattern as
Prompt 5's ch.60.

One deliberate non-inference, consistent with source-fidelity discipline
throughout this project: chapter 79 Method 2 (baby count via how many
times H5's own figure repeats) defines counts of exactly 2, 3, and >3; a
count of exactly 1 (no repeat at all) is never addressed by the source and
was **not** assumed to mean "a single baby" — left `uncertain` on this
chart's own data (H5 = Kalla Allahu, occurring exactly once).

See `lib/raml/engine/__tests__/questions-stage5.test.ts` for the full
per-method, hand-verified test coverage (every expected figure/outcome
read off a printed audit run of the shared fixture chart before being
relied on, never guessed), and `__tests__/audit-1-80.test.ts` (renamed
from `audit-1-60.test.ts`, generalized to run its structural/consensus/
descriptive-integrity/gender-classification checks against every
registered question, chapters 1-80 together, now 4 confirmed
gender-blocked methods instead of 3) for the full regression audit.

## Prompt 8 — Dependency Resolution & Chapters 1-80 Integrity Audit

Not a new-chapter stage: no chapter 81+ work, no new questions registered,
no new source rules. This stage re-investigated every unresolved
dependency accumulated across Prompts 1-7, resolved what genuinely could
be resolved, and formally tabulated what cannot. One real, source-neutral
UI accuracy bug was found and fixed along the way (detailed in section 8
below); no geomantic rule, figure classification, or user input was
invented anywhere.

**1. Male/female-star dependency — re-searched, still confirmed
unresolvable, no new invention.** Both manuscripts were re-grepped in
full (`content/manuscripts/kanzul-mikban.ts`, all 153 chapters, and
`master-of-geomancy-vol1.ts`, all 10 chapters) for every spelling of "male
star," "female star," "masculine," "feminine," and equivalent phrasing.
Confirmed exactly **7 occurrences across 6 chapters/fragments**, all of
which *use* the classification without ever *defining* it, and confirmed
**no table, glossary, or definition exists anywhere in either supplied
manuscript** (a direct grep for phrasing like "the following are male,"
"male stars are," etc. returns nothing). The occurrences: ch.41 M1, ch.48
M1, ch.48 M2, the pregnancy fragment's own M3 (all already documented),
ch.68 M1 (Prompt 7), and — resolving Prompt 6/7's own open prediction of
"a later occurrence around ch.71/ch.90" — the two actual further
occurrences are **chapter 127 ("The Description of the Thief")** and
**chapter 141 ("If the Prisoner Is Male or Female")**, both read in full
this stage. Neither defines the classification either; both just use it
exactly like ch.41/48/68 do, and both are far outside 1-80 (not
implemented, not touched). The earlier "~ch.71, ~ch.90" line-position
guess is **retired and corrected** in the source-verification queue below
— it was an approximation from before the exact grep was run; the real
positions are now known precisely. No classification was invented. Ch.41
M1, ch.48 M1/M2, and ch.68 M1 remain `needs_review` with
`reviewReasonCode: 'gender_classification_unsourced'`, unchanged.

**2. Querent-gender dependency — investigated, confirmed scoped to ch.68
alone, no product-wide input added.** A full-manuscript grep for the
querent-differentiated phrasing pattern ch.68 uses ("if it's a man that
comes to check... if it's a lady...") and near-synonyms ("the querent is a
man/woman," "whoever is asking," etc.) across all 153 Kanzul Mikban
chapters found **exactly one occurrence: chapter 68 itself.** No other
chapter, anywhere in the manuscript, distinguishes its rule by who is
asking. This is a source requirement of exactly one method, not a
recurring pattern. Separately, the app's entire architecture was
inspected for any existing suitable input: `lib/raml/storage.ts`'s
`SavedCasting` (question, mothers, intentionId only), `app/settings/`, and
every component under `components/raml/` were read — **the app has no
user/profile/account concept of any kind**, let alone a gender field; a
casting is four Mother patterns and nothing else. Per this stage's
explicit instruction not to add a gender input merely because one method
needs it, **no input was added.** `partner-cheating-method-1` stays
`needs_review`, `reviewReasonCode: 'gender_classification_unsourced'`
(the primary, listed-first blocker — the figure-gender gap alone is
already sufficient to block it), with its `reviewNote` prose fully
explaining the second, independent querent-gender-input gap. A second,
distinct `reviewReasonCode` value for the input gap was considered and
declined: `reviewReasonCode` is a single value per method (not an array),
changing that shape for one method would be exactly the kind of
speculative architecture change this stage's own instructions warn
against, and the existing prose note already documents the second
blocker in full (confirmed rendering correctly in the browser — see
section 12). The required product decision — whether and how to collect
querent identity at all — remains **open and undecided**; section 10
below designs, without implementing, the smallest mechanism for it should
a future stage's source findings justify building it.

**3. Chapter 64 Method 2 — re-investigated, confirmed unresolvable, no
verdict fabricated.** Re-read chapter 64 in full context: Method 2's
complete text is "After the chart is drawn, pick h4, h11, h7 and 14 and
add them. Check if it's a good, middle-good, or a bad star." — one
sentence, immediately followed in the manuscript by an unrelated,
differently-titled entry (the unnumbered "Someone's Behavior" fragment,
itself a confirmed duplicate of ch.43 M1 — see Prompt 7). There is no
continuation, footnote, or cross-reference anywhere nearby that supplies
what good/middle-good/bad means for this specific rule. The calculation
remains fully computed and shown (H4+H11+H7+H14, the resulting figure and
its fortune); the verdict mapping is not. `marriage-last-forever-method-2`
stays `status: 'uncertain'`, `reviewReasonCode: 'interpretation_not_stated'`,
unchanged.

**4. Chapter 79 Method 2, exactly-one case — re-investigated, confirmed no
implicit rule, non-invention proven by test.** Re-read chapter 79's exact
text: "Check h5; if it repeats in the chart twice, it means twins. If it
repeats thrice, it means more than two. If it repeats more than 3 times,
it means more than 3 babies." This is a plain enumeration starting at 2,
not an arithmetic formula with an implicit base case — there is no stated
rule of the form "if it does not repeat, it means..." A count of exactly
1 (H5's own figure appearing nowhere else in the chart) is never
addressed. **"1 = one baby" was deliberately not assumed**, even though it
is the intuitively obvious reading — per this stage's explicit
instruction, an intuitive inference is still an invented rule unless the
source states it. A new regression test
(`questions-stage5.test.ts`, ch.79 describe block) asserts directly that
this exact case — which the shared fixture chart actually produces (H5 =
Kalla Allahu, occurring exactly once) — never turns `descriptive`, never
carries a `descriptiveAnswer`, and never displays a label resembling "one
baby." Verified live in the browser (section 12) showing the accurate,
non-fabricated explanation.

**5. Complete unresolved-method audit, chapters 1-80.** Every method
whose `status` is not `'verified'`, plus every chapter/fragment never
registered at all, tabulated below across all 7 dimensions this stage's
instructions require. Nothing here is collapsed into a generic
"insufficient_data" label — each row states its own, specific cause.

*Registered methods with `status !== 'verified'` (24 total, machine-counted
directly from `QUESTION_REGISTRY` — matches the running Needs
review + Uncertain totals below exactly):*

| Group | Methods | Calc. complete? | Interp. complete? | Missing input | Cause | Resolvable from supplied manuscripts? | Recommended permanent status |
|---|---|---|---|---|---|---|---|
| A — figure-trigger list omitted by transcription | ch.2 M4, ch.4 M1, ch.5 M1/M2, ch.6 M1, ch.7 M4, ch.9 M3, ch.13 M3, ch.17 M1/M2, ch.19 M3, ch.21 M3, ch.26 M1, ch.27 M1/M2 (15 methods) | Yes — houses computed | No — named-figure verdict list never transcribed | A figure-trigger list (which named figures map to which branch) | Source (transcription gap) | No — needs the original manuscript scan | **UNCERTAIN** (permanent, pending scan access) |
| B — ambiguous split / incomplete interpretation | ch.3 M3 (2 of 4 fortune combos addressed) | Yes | Partial | None — the stated rule itself is incomplete | Source | No | **NEEDS_REVIEW** (permanent) |
| B2 — interpretation never stated at all | ch.64 M2 | Yes | No — zero branches interpreted | None — nothing to input, the mapping sentence is simply absent | Source | No — reconfirmed this stage, no continuation exists | **UNCERTAIN** (permanent), `reviewReasonCode: interpretation_not_stated` |
| C — whole-figure opened/closed axis undefined | ch.1 M3, ch.21 M1 | Yes | No | A verified whole-figure (not per-line) open/closed classification | Architectural (project-wide axis gap, not chapter-specific) + Source (no table anywhere) | No | **NEEDS_REVIEW** (permanent, project-wide) |
| D — spatial (left/right diagram) layout undefined | ch.37 M2 | Yes (rule itself understood) | No — needs a drawn-diagram convention `ChartModel` doesn't carry | A left/right house-layout convention | Architectural / Product | No — no worked example survives to reverse-engineer it | **NEEDS_REVIEW** (permanent, pending a product/source decision) |
| E — figure-gender classification unsourced | ch.41 M1, ch.48 M1, ch.48 M2 | Yes | No | A figure male/female table | Source (reconfirmed this stage — 7 occurrences, 0 definitions, in both manuscripts) | No | **NEEDS_REVIEW** (permanent, pending a source table) |
| E2 — figure-gender + querent-gender (dual, independent) | ch.68 M1 | Yes | No | Figure-gender table (source) **and** a querent-identity input (product) | Source (figure-gender) **and** Product (querent-gender — confirmed this stage to be genuinely required by the source, but not yet a made product decision) | No for either | **NEEDS_REVIEW** (permanent, pending both a source table and a product decision) |

*Never registered at all (not counted in the 24 above; whole chapters or
fragments, permanently classified):*

| Item | Calc. complete? | Interp. complete? | Missing input | Cause | Resolvable? | Recommended permanent status |
|---|---|---|---|---|---|---|
| Ch.28, 2 continuation fragments | No — every branch's figure identifier dropped entirely | No | The figure list itself, with no partial reconstruction possible | Source | No | **NOT_IMPLEMENTED** (permanent, pending original scan) |
| Ch.30, 2 named-figure branches (within an otherwise-implemented chapter) | No (these 2 branches only) | No | Named figure list for these 2 branches | Source | No | **NOT_IMPLEMENTED** (partial — sub-method only; the chapter's direction-based primary rule is implemented and verified) |
| Ch.33 ("cast out by 4s" dot-line mechanic) | Yes — the rule is fully stated with a worked example | Yes | A second, non-16-house casting input mechanism | Architectural / Product | Yes, technically — the rule text is complete; blocked purely on a product decision to build a second casting flow | **NOT_IMPLEMENTED** (pending a product decision, not a source gap) |
| Ch.46 (talismanic diagram + ritual) | N/A — no branch structure to compute at all | N/A | A physical-practice instruction, not a chart-verdict rule | Source (also architectural — this was never going to be a `QuestionDefinition`, diagram or not) | N/A | **RITUAL_NON_READING** (permanent) |
| Ch.59, Methods 1-3 (secret of the querent) | Yes (M1's calculation runs); no defined verdict shape for any of the 3 | No — each method is explicitly open-ended by its own design ("use whatever star you get," querent freely picks, unspecified house) | A fixed interpretation shape, which the method itself declines to have | Source (the ambiguity is the method's own open-ended design, not an omission) | N/A — nothing is missing to look up | **OPEN_ENDED** (permanent) |
| "Consequence of Friendship" fragment (after ch.52) | Yes — fully computable | Yes | None | Product/process — held out solely because Prompt 5 scoped that stage to numbered chapters 41-60 | Yes — already fully resolvable, not blocked on anything | **NOT_IMPLEMENTED** (scope-deferred only; a legitimate candidate for a future stage's registration, not attempted here per this stage's own "not a new-chapter stage" restriction) |
| "Someone's Behavior" fragment (after ch.64) | Yes | Yes | None | N/A | Yes | **RESOLVED — not a gap.** Confirmed (Prompt 7) byte-for-byte identical to ch.43 M1; the question it asks is already answered |
| Pregnant fragment's own Method 3 (baby-sex via figure-gender) | Yes | No | Figure-gender table | Source — identical gap to ch.48 | No | **NEEDS_REVIEW-equivalent**, deliberately not instantiated as its own `MethodDefinition` (would be a fully redundant third confirmation of ch.48's own gap) |

**6. Descriptive/outcome result-kind audit, chapters 1-80.** Re-applied
the governing test — *does the source attach an inherent value judgment,
or is it neutrally reporting a fact?* — across every `resultKind:
'descriptive'` question in the registry (19 total: chs. 21/23/31/36 from
1-40's later reconciliation, chs. 47/48+56/49/53/54/55/57/58 from 41-60,
and chs. 63/66/73/78/79/80 plus the "still in marriage" fragment from
61-80) and cross-checked against the outcome-kind factual questions this
stage's instructions specifically named (pregnancy, child sex, previous
marriage, sexual activity, birth circumstances, counts, location,
direction, weather, relationship states). All 19 confirmed correctly
`descriptive`; no misclassification found or changed. **Chapter 32
("will it rain") was specifically re-checked, as instructed, and
deliberately left unchanged.** Its own text is 4 pure positive-trigger
statements ("if X, then it will rain") with no stated negative branch and
no explicit neutral framing either — structurally similar to the
already-descriptive weather-adjacent chapters, but the source gives no
clearer signal one way or the other than it did at the Prompt 6 review,
and this stage found **no new source evidence** to justify a change.
Per this stage's own explicit instruction ("do not change it without
source evidence"), `willItRain.ts` is untouched: `rain-method-1..4`
still map their positive trigger to `favourable` and the unaddressed case
to `uncertain`. This is documented here as a **known, reconfirmed,
open tension** (rain-as-fact vs. rain-as-favourable-outcome) rather than
silently left unremarked, exactly as it was at Prompt 6 — not resolved,
because resolving it now would mean guessing, which this stage's
instructions explicitly forbid.

**7. Conflict/disagreement/consensus semantics — re-verified, no drift.**
Re-read `ruleEngine.ts`'s `runQuestion`/`deriveOverallResult` and
`operations.ts`'s `COMPARE_RESULTS` in full. Confirmed unchanged since
Prompt 6 and still structurally sound: a method with `status !==
'verified'` always gets `verdict: null` and is never passed to
`evaluate()`; `COMPARE_RESULTS`'s `verifiableCount` only ever counts
methods with a non-null verdict whose `outcome !== 'uncertain'`; a
genuine favourable-vs-unfavourable split renders as `conflict`/`mixed`,
never averaged into a false single answer (re-confirmed live for ch.61 —
see section 12); a descriptive question's methods are compared by answer
value, not outcome-type equality, and a genuine value split (e.g. ch.58,
Prompt 5) renders as `disagree`, never silently resolved. The Prompt 7
audit test suite (`audit-1-80.test.ts`) already runs every one of these
invariants against all 78 registered questions on every test run; this
stage re-read the assertions rather than re-deriving them, and found no
gap.

**8. Method-exclusion semantics — re-verified, and one real bug found and
fixed.** Re-read `ruleEngine.ts` (verified methods with conclusions
participate; methods with no verdict are excluded; calculation stays
visible even when withheld — all confirmed correct, unchanged) and every
UI component that explains an unresolved method to the user. **One
genuine, source-neutral accuracy bug was found in
`InsufficientNotice.tsx`**: its per-method "WHY" line fell back to the
generic string `"Not yet verified against the source manuscript."`
whenever a method's own `reviewNote` was empty — but a fully `verified`
method whose outcome on *this particular chart* happens to be
`'uncertain'` (the chart's own figures simply don't match any branch the
source defines) never has a `reviewNote` at all; only genuinely
`needs_review`/`uncertain`-status methods do. The fallback text was
therefore **factually wrong** for every verified-but-chart-uncertain
method — for example chapter 79 previously showed "Method 1 — Not yet
verified against the source manuscript" even though Method 1 is, and
always was, a fully verified rule; this chart's own figures (Usman at H10,
not Musah) simply don't trigger any of its defined branches. Fixed with
the smallest possible change: the WHY line now prefers `m.reviewNote` (the
method-level "why this whole method is withheld" explanation, when one
exists), falling back to `m.interpretation` (the verdict's own, already-
computed, chart-specific explanation — e.g. *"The source only defines the
'Musah at H10' trigger — this is not addressed"*) before ever reaching the
generic string. This required no data model change — `m.interpretation`
already existed on `ReadingMethodRow` and was already being computed
correctly; it just wasn't being displayed in this one spot. Verified live
for chapters 79 and 67 (both now show their real, accurate reasons) and
reconfirmed unaffected for chapter 68 (a genuinely `needs_review` method,
which still shows its full `reviewNote` exactly as before) — see section
12. This is a presentation-layer fix only; no calculation, verdict, or
consensus value changed anywhere, confirmed by the full suite staying at
1078/1078 (no test asserted on the old, inaccurate wording — none existed
to break).

**9. Reusable-operations audit — no new operation extracted, and no
duplicated equivalent calculation left un-extracted where it mattered.**
Re-read `COUNT_TOTAL_DOTS`, `CAST_OUT_BY`, `FIND_FIGURE_QUARTER`,
`ADD_FIGURES`, and `COUNT_OPENED_LINES`: all five remain pure, chart-
generic, unit-tested, and used exactly as designed — no chapter 1-80
method hand-rolls an equivalent reduction/quartet/summation loop instead
of using them (confirmed by grep: no `while` loops and no hand-written
`[1,2,3,4]`/`[5,6,7,8]`-style quartet arithmetic exist anywhere in
`questions/*.ts` outside the methods that already use these primitives or
that deliberately diverge from `FIND_FIGURE_QUARTER` for a documented
reason, e.g. ch.63's self-exclusion — see Prompt 7). One near-duplication
was found and deliberately **not** extracted: `pregnancyHealthy.ts` M1 and
`pregnancyPaternity.ts` M2 both inline the identical one-line pattern
`housesToCheck.every((n) => CHECK_HOUSE(chart, n).figure.qualities.fortune.value === 'good')`,
and `exWillReturn.ts` inlines a related-but-distinct one checking
`CHECK_LINE_STATE(...) === 'opened'`/`'closed'` across an array of
already-computed figures. This is 2 exact duplicates (not the 3+ that
justified extracting `FIND_FIGURE_QUARTER` in Prompt 6), each a single
line of trivial composition over an existing primitive (`CHECK_HOUSE`),
not hand-rolled arithmetic — extracting a named operation for a one-line,
twice-repeated boolean check would be exactly the kind of premature,
stylistic-only refactor this stage's own instructions warn against. Left
inline, documented here rather than silently noticed and dropped.

**10. Architecture decision for contextual inputs — designed, not
implemented.** Section 2 confirmed a genuine, if narrow, source
requirement (ch.68 needs the querent's own gender) with no existing
product-level input to supply it, and confirmed this need does not
recur anywhere else in the manuscript. Per this stage's instruction to
design the smallest future-proof mechanism *without* implementing it
unless the audit demands it (it doesn't, yet — one method out of 143 is a
weak case for a new product surface), the proposed shape, for whenever a
future stage's source findings justify building it, is:

```
QuestionDefinition
  contextInputs?: ContextInputSpec[]   // declared per-question, optional, empty by default

ContextInputSpec
  { id: 'querent-gender', label: string, kind: 'select', options: [...], required: false }

MethodDefinition.evaluate(calc, chart, context?: Record<string, string>)
  // context is undefined/empty for every existing method — a strictly
  // additive third parameter, not a chart field
```

This keeps the 16-figure `ChartModel` and `casting.ts` completely
untouched — a contextual input is metadata attached to a *question*, read
by a *method's* `evaluate()`, never a property of the chart itself, and
every question without `contextInputs` behaves exactly as it does today
(the parameter is optional and unused). The casting flow would only ever
prompt for a context input immediately before showing results for a
question that declares one, never during the four-Mother-pattern casting
itself, and a querent who declines to answer leaves that one method
blocked exactly as today (a missing optional context input is not
materially different from a missing figure — the method's calculation
still runs and shows, its verdict stays withheld). **Not implemented this
stage** — this is a design on paper only, matching the letter of this
stage's "do not implement additional contextual inputs unless supported
by actual source requirements" instruction: the requirement exists (one
method), but building product surface for a single method is a judgment
call for the product owner, not something this audit stage decides on its
own initiative.

**11. Tests.** 1077 (Prompt 7 baseline) → **1078 after**: one new
regression test proving chapter 79 Method 2 never invents an answer for
its unsupported "exactly one" case (section 4). No other test was added,
removed, or had its assertion weakened — every chapter 1-80 assertion
from Prompts 1-7 passes unchanged. `tsc --noEmit` clean, `npm run build`
clean.

**12. Browser verification.** Seven cases rendered live against the
shared fixture chart, screenshotted, and read back in full: chapter 61
(a genuine conflict — Method 1 favourable vs. Method 2 unfavourable,
shown as `Methods conflict`/`MIXED`, never averaged); chapter 64 (Method 1
favourable, Method 2 shown as "Not counted" with its withheld-
interpretation reason visible under "Source verification notes");
chapter 68 (`Insufficient Verified Data`, both independent gaps — figure-
gender and querent-gender — spelled out in full prose, unaffected by the
section 8 fix since it's a genuinely `needs_review` method with its own
`reviewNote`); chapter 79 (`Insufficient Verified Data`, now — post-fix —
showing each method's own accurate, chart-specific reason instead of the
old misleading "not yet verified" text, and no "one baby" answer
anywhere); chapter 80 (an ordinary descriptive result, two methods
agreeing on "Not yours"); chapter 69 (an ordinary conditional/mixed
result, "Conditional / Mixed," one method); and chapter 72 (an ordinary
unfavourable outcome, one method, methods agree). Every screen matched
the hand-computed values from Prompts 1-7 exactly, explained every
withheld verdict honestly, and fabricated nothing. No UI change was made
beyond the section 8 accuracy fix — every result shape this stage
exercised was already representable by the existing renderers.

## Totals (as of this stage — Prompt 8 dependency-resolution audit, chapters 1-80)

| | Count |
|---|---|
| Total source chapters (Kanzul Mikban, numbered 1-153) | 153 |
| Numbered chapters reviewed and entered into this engine | 80 (chapters 1-19, 20-32, 34-45, 47-55, 57-58, 60-80 — chapters 33, 46, 59 reviewed but out of scope/not computable, see below) |
| Numbered chapters not yet reviewed | 73 (chapters 81-153) |
| Unnumbered sub-chapters/continuations reviewed | 4 (the "Additional Methods — pregnant" fragment — 2 of its 3 methods registered under ch.47; the "Consequence of Friendship" fragment — not registered, out of numbered scope; the "Someone's Behavior" fragment after ch.64 — not registered, confirmed exact duplicate of ch.43 M1; the "If She/He Is Still in the Marriage" fragment after ch.66 — registered as its own question) |
| Questions registered in `QUESTION_REGISTRY` | **78** |
| Total methods across all registered questions | 143 |
| **Verified** (computed automatically, count toward the result — includes descriptive verdicts) | **119** |
| **Needs review** (calculable, but the rule itself is genuinely ambiguous) | **7** |
| **Uncertain** (not computable — omitted source figures, or, new this stage, a stated calculation whose verdict-mapping sentence is itself missing) | **17** |
| Automated tests covering this engine | 1078 (all passing — Prompt 8 added 1 regression test proving ch.79 M2 never invents "1 = one baby") |

### Stage 1+2 (chapters 1-19) subtotal — Prompt 6 touched 2 of these (ch.18, ch.21; see "Prompt 6" section below)

| | Count |
|---|---|
| Chapters | 19 |
| Methods | 49 |
| Verified | 36 |
| Needs review | 2 |
| Uncertain | 11 |

### Stage 3 (chapters 20-40) subtotal — Prompt 4 + 4.5

| | Count |
|---|---|
| Numbered/sub- chapters reviewed | 23 (20, 21, the unnumbered "good to stay in a house", 22-32, 33, 34-40, plus 2 unnumbered Ch.28 continuation fragments) |
| Questions registered | 21 |
| Methods | 37 |
| Verified (includes 3 descriptive verdicts: chs. 23, 31, 36 — see Prompt 4.5 above) | 31 |
| Needs review | 1 |
| Uncertain | 5 |
| Not registered at all (no computable shape, or architecturally out of scope) | 3 (chapter 33; both Ch.28 continuation fragments) |

### Stage 4 (chapters 41-60) subtotal — Prompt 5

| | Count |
|---|---|
| Numbered/unnumbered items reviewed | 22 (41-60, plus the two unnumbered fragments after ch.52 and ch.56) |
| Questions registered | 17 |
| Methods (registered only) | 26 |
| Verified (includes 8 descriptive verdicts: chs. 47(x2 counted methods)/49/53/54/55/57/58(x2)/48 — see per-chapter table) | 23 |
| Needs review (all 3: the unsourced figure-gender classification — ch.41 M1, ch.48 M1/M2) | 3 |
| Uncertain (method status) | 0 |
| Not registered at all (no computable shape, or out of this stage's numbered scope) | ch.46 (1 method — talismanic ritual, diagram omitted), ch.59 (3 methods — open-ended/non-deterministic or not chart-derived), unnumbered "Consequence of Friendship" fragment (1 method — fully computable, no chapter number), unnumbered fragment's Method 3 (1 method — baby-sex-by-star-gender, same unsourced-gender gap as ch.48) |

### Stage 5 (chapters 61-80) subtotal — Prompt 7

| | Count |
|---|---|
| Numbered/unnumbered items reviewed | 22 (61-80, plus the "Someone's Behavior" fragment after ch.64 and the "Still in the Marriage" fragment after ch.66) |
| Questions registered | 21 |
| Methods (registered only) | 31 |
| Verified (includes 8 descriptive verdicts: chs. 63/66/73/78/79(x2)/80(x2), plus the "still in marriage" fragment — 9 total counting the fragment) | 29 |
| Needs review (the unsourced figure-gender classification, plus a second, independent querent-gender-input gap — ch.68 M1) | 1 |
| Uncertain (method status — a stated calculation whose verdict-mapping sentence is missing, `interpretation_not_stated` — ch.64 M2) | 1 |
| Not registered at all (confirmed exact duplicate of an already-implemented method, not a new rule) | "Someone's Behavior" fragment after ch.64 (1 method — byte-for-byte identical to ch.43 M1) |

## Implemented, by chapter

_A "Verified" count below includes descriptive verdicts (chs. 23, 31, 36 — see "Prompt 4.5" above)._

| Ch. | Question (intention id) | Methods | Verified | Needs review | Uncertain |
|---|---|---|---|---|---|
| 1 | `traveling-business-and-if-you-will-return-from` | 3 | 2 | 1 | 0 |
| 2 | `if-you-want-to-know-if-you-will` (money today) | 4 | 3 | 0 | 1 |
| 3 | `business-profit-and-loss` | 3 | 2 | 1 | 0 |
| 4 | `hunting-in-water-and-on-land-and-searching` | 1 | 0 | 0 | 1 |
| 5 | `if-you-will-win-a-fight-war-or` (H6/H1+H8 variant) | 2 | 0 | 0 | 2 |
| 6 | `if-you-want-to-know-where-your-enemy` | 1 | 0 | 0 | 1 |
| 7 | `marriage-and-its-blessings` | 4 | 3 | 0 | 1 |
| 8 | `if-one-will-stay-in-a-particular-place` | 1 | 1 | 0 | 0 |
| 9 | `sickness-if-he-she-will-survive` | 3 | 2 | 0 | 1 |
| 10 | `if-your-lost-thing-is-still-around-or` | 5 | 5 | 0 | 0 |
| 11 | `if-you-want-to-know-if-you-will-2` (home vs. travel) | 2 | 2 | 0 | 0 |
| 12 | `if-you-want-to-know-if-you-will-3` (rich or not) | 1 | 1 | 0 | 0 |
| 13 | `if-you-will-get-children-from-a-lady` | 5 | 4 | 0 | 1 |
| 14 | `if-a-pregnancy-is-going-to-be-stable` | 1 | 1 | 0 | 0 |
| 15 | `if-things-will-be-better-for-the-questioner` | 1 | 1 | 0 | 0 |
| 16 | `if-you-will-overcome-your-enemy-or-not` | 2 | 2 | 0 | 0 |
| 17 | `if-something-will-happen-in-an-hour-day` (timing) | 2 | 0 | 0 | 2 |
| 18 | `if-you-will-get-your-stolen-things-back` (Part B only) | 4 | 4 | 0 | 0 |
| 19 | `if-you-will-win-a-case-in-court` | 4 | 3 | 0 | 1 |
| **Subtotal (1-19)** | | **49** | **36** | **2** | **11** |
| 20 | `who-will-win-an-election-or-a-chieftaincy` | 2 | 2 | 0 | 0 |
| 21 | `if-your-wife-or-sister-has-had-sex` | 3 | 1 | 1 | 1 |
| — | `if-it-s-good-to-stay-in-a` (unnumbered, between 21-22) | 3 | 3 | 0 | 0 |
| 22 | `if-it-s-good-to-stay-in-a-2` | 2 | 2 | 0 | 0 |
| 23 | `is-there-much-trees-water-sand-or-stones` (descriptive) | 1 | 1 | 0 | 0 |
| 24 | `if-you-will-be-safe-entering-a-canoe` | 2 | 2 | 0 | 0 |
| 25 | `if-there-are-armed-robbers-on-your-way` | 1 | 1 | 0 | 0 |
| 26 | `if-there-will-be-a-fight-argument-etc` | 1 | 0 | 0 | 1 |
| 27 | `about-farming-and-food-in-the-year` | 2 | 0 | 0 | 2 |
| 28 | `if-you-will-get-money-or-good-strangers` | 1 | 1 | 0 | 0 |
| 28→ | Two "gift/visitor figure" continuation fragments | — | not registered | — | — |
| 29 | `if-you-will-be-successful-where-you-are` | 1 | 1 | 0 | 0 |
| 30 | `if-you-will-be-successful-and-get-what` | 1 | 1 | 0 | 0 |
| 31 | `about-a-lost-thing-stolen-things` (descriptive) | 1 | 1 | 0 | 0 |
| 32 | `if-it-will-rain-today-or-not` | 4 | 4 | 0 | 0 |
| 33 | *(cast-out-by-4s dot-line method)* | — | not registered | — | — |
| 34 | `if-your-enemies-are-working-against-you-or` | 2 | 2 | 0 | 0 |
| 35 | `if-your-family-is-doing-well-while-you` | 1 | 1 | 0 | 0 |
| 36 | `if-you-want-to-locate-someone-or-something` (descriptive) | 1 | 1 | 0 | 0 |
| 37 | `how-to-predict-a-game-who-will-win` | 2 | 1 | 0 | 1 |
| 38 | `if-two-lovers-will-be-compatible-for-marriage` | 2 | 2 | 0 | 0 |
| 39 | `if-your-visitor-or-the-person-that-comes` | 2 | 2 | 0 | 0 |
| 40 | `if-spiritual-work-you-want-to-do-for` | 2 | 2 | 0 | 0 |
| **Subtotal (20-40)** | | **37** | **31** | **1** | **5** |
| 41 | `the-person-that-took-an-item-stole-something` | 2 | 1 | 1 | 0 |
| 42 | `if-you-will-get-what-you-want-from` | 2 | 2 | 0 | 0 |
| 43 | `the-real-behavior-character-or-life-of-someone` | 1 | 1 | 0 | 0 |
| 44 | `if-a-lady-or-man-will-accept-your` | 1 | 1 | 0 | 0 |
| 45 | `if-you-will-get-the-lost-thing-back` | 1 | 1 | 0 | 0 |
| 46 | *(talismanic ritual — diagram omitted, not a chart-verdict method)* | — | not registered | — | — |
| 47 | `if-a-lady-is-pregnant-or-not` (descriptive; incl. 2 methods from the unnumbered "pregnant" fragment) | 4 | 4 | 0 | 0 |
| 48 | `if-it-s-a-male-or-female-child` (descriptive; incl. 1 method from ch.56) | 3 | 1 | 2 | 0 |
| 49 | `if-something-is-closer-to-you-or-far` (descriptive) | 1 | 1 | 0 | 0 |
| 50 | `if-you-will-get-gold-in-a-place` | 1 | 1 | 0 | 0 |
| 51 | `if-things-are-going-to-be-well-this` | 1 | 1 | 0 | 0 |
| 52 | `the-friendship-between-two-people-if-it-s` | 1 | 1 | 0 | 0 |
| 52→ | "Consequence of Friendship" (unnumbered fragment) | — | not registered | — | — |
| 53 | `if-a-querent-is-asking-about-someone-or` (descriptive) | 1 | 1 | 0 | 0 |
| 54 | `where-your-success-is-or-where-you-will` (descriptive) | 1 | 1 | 0 | 0 |
| 55 | `the-whereabouts-of-a-thief-or-robbers` (descriptive) | 1 | 1 | 0 | 0 |
| 56 | *(own intention not registered — its 1 verified method is `child-gender-method-3`, folded into ch.48 above)* | — | see ch.48 | — | — |
| 57 | `when-to-travel-daytime-or-night-time` (descriptive) | 1 | 1 | 0 | 0 |
| 58 | `if-couples-have-had-sex-or-not` (descriptive) | 2 | 2 | 0 | 0 |
| 59 | *(open-ended/non-deterministic or not chart-derived — see "Architectural gaps")* | — | not registered | — | — |
| 60 | `if-she-he-loves-you-or-not` | 2 | 2 | 0 | 0 |
| **Subtotal (41-60)** | | **26** | **23** | **3** | **0** |
| **Subtotal (1-60)** | | **112** | **90** | **6** | **16** |
| 61 | `if-a-marriage-is-good-or-not` | 2 | 2 | 0 | 0 |
| 62 | `if-the-prayers-done-for-someone-have-been` | 1 | 1 | 0 | 0 |
| 63 | `if-the-lady-or-man-you-are-going` (descriptive) | 1 | 1 | 0 | 0 |
| 64 | `if-a-marriage-will-last-forever` | 2 | 1 | 0 | 1 |
| 64→ | "Someone's Behavior" (unnumbered fragment) | — | not registered (confirmed exact duplicate of ch.43 M1) | — | — |
| 65 | `if-a-partner-has-a-particular-disease-or` | 3 | 3 | 0 | 0 |
| 66 | `if-someone-has-married-before-or-if-he` (descriptive) | 1 | 1 | 0 | 0 |
| 66→ | `if-she-he-is-still-in-the-marriage` (unnumbered fragment, descriptive) | 1 | 1 | 0 | 0 |
| 67 | `if-he-she-is-enjoying-the-marriage` | 1 | 1 | 0 | 0 |
| 68 | `if-your-partner-is-cheating-on-you` | 1 | 0 | 1 | 0 |
| 69 | `if-your-ex-husband-wife-will-re-marry` | 1 | 1 | 0 | 0 |
| 70 | `if-a-pregnant-woman-will-have-childbirth-problems` | 2 | 2 | 0 | 0 |
| 71 | `if-a-man-will-have-manhood-problems-in` | 2 | 2 | 0 | 0 |
| 72 | `if-a-lady-or-man-has-feelings-for` | 1 | 1 | 0 | 0 |
| 73 | `if-a-woman-has-married-more-than-one` (descriptive) | 1 | 1 | 0 | 0 |
| 74 | `if-someone-is-an-adulterous-son-daughter-born` | 1 | 1 | 0 | 0 |
| 75 | `if-he-she-is-a-womanizer-or-a` | 1 | 1 | 0 | 0 |
| 76 | `if-your-ex-husband-wife-girlfriend-or-boyfriend` | 2 | 2 | 0 | 0 |
| 77 | `if-the-pregnancy-is-healthy-or-not` | 2 | 2 | 0 | 0 |
| 78 | `the-number-of-months-of-a-pregnancy-how` (descriptive) | 1 | 1 | 0 | 0 |
| 79 | `the-number-of-babies-in-a-pregnancy` (descriptive) | 2 | 2 | 0 | 0 |
| 80 | `if-a-pregnancy-is-yours-or-not-d` (descriptive) | 2 | 2 | 0 | 0 |
| **Subtotal (61-80)** | | **31** | **29** | **1** | **1** |
| **Grand total (1-80)** | | **143** | **119** | **7** | **17** |

## Architectural gaps (Stage 3)

**Resolved by Prompt 4.5.** Chapters 23 (terrain type), 31 (lost/stolen
thing), and 36 (locate someone/something) each produce a real, fully
mechanical, unambiguous calculation whose *answer* is descriptive (an
element, a compass direction, a thief's gender + rough distance) rather than
favourable/unfavourable. These were previously logged as `needs_review`
because the engine's `MethodOutcome` vocabulary had no honest way to
represent "the answer is water" — that was a result-*type* gap, not a
source ambiguity. Prompt 4.5 closed it by adding a genuine third
`MethodOutcome`, `'descriptive'` (with its own `descriptiveAnswer` field and
its own agree/disagree comparison model, `compareDescriptiveResults`, rather
than overloading the favourable/unfavourable tally). All three chapters are
now `status: 'verified'`, `outcome: 'descriptive'`, `resultKind:
'descriptive'` — no source rule changed, only how an already-correct answer
is represented and displayed. See the "Prompt 4.5" section above.

The remaining gaps below were reviewed under Prompt 4.5's explicit
architectural taxonomy and are still gaps — nothing here was implemented,
guessed, or forced into the existing model:

- **A.** Can the current architecture (ChartModel + operations.ts +
  QuestionDefinition/consensus model) support this once the source is
  known?
- **B.** Does it need better result semantics (a new `MethodOutcome` /
  `resultKind`, beyond what Prompt 4.5 just added)?
- **C.** Does it need a new generic operations.ts primitive?
- **D.** Does it need source verification (a figure/token the transcription
  omitted)?
- **E.** Does it need a genuinely different casting/input mechanism (data
  the current 16-house chart doesn't carry)?

| Chapter | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 26 (fight/argument) | Every branch depends on named figures the transcription omitted or dropped entirely | — | — | — | **Yes** — this is the entire blocker | No |
| 27, Methods 1-2 (farming/harvest) | Every directional/elemental branch's figure tokens omitted | — | — | — | **Yes** — this is the entire blocker | No |
| 28 (2 continuation fragments) | Every branch's figure identifier dropped entirely; not even which figure means what is recoverable | — | — | — | **Yes**, and worse than the others above: no partial reconstruction is possible from context | No |
| 33 ("cast out by 4s" line mechanic) | Not a chart-derived rule at all — a separate divination technique | No — nothing to compute from a `ChartModel`, because the input isn't a 16-house chart | No — this isn't a result-representation problem | Possibly, once understood (see below) | Yes — need the full mechanic described, ideally with worked examples | **Yes** — needs its own input/casting path, entirely separate from `casting.ts` |
| 37, Method 2 | Decided by which physical side (right/left) of the *drawn* chart a figure lands on | No — `ChartModel` carries house number → figure only, no left/right layout | No — a `'descriptive'` or new outcome value doesn't help; the blocker is upstream, at input, not at output | Not on its own — a primitive can't invent geometry that isn't in the model | No — the rule text itself is understood; nothing is omitted | **Yes** — needs a spatial/layout data model (see below) |

### Chapter 33 — documented, not implemented

Per the source ("make a long line, cast out 4s, repeat for four lines until
each is reduced to 1-4 dots"), this is a distinct, self-contained
arithmetic procedure: it consumes a hand-count (a total tapped or drawn by
the querent) and reduces it mod 4 (mapping a 0 remainder to 4), four times,
to produce its own 4-line figure — it never reads from, and has no
dependency on, the 16-house chart `casting.ts` builds. If the mechanic is
ever fully verified against the source, it could become a **new, separate,
deterministic module** (e.g. `lib/raml/engine/castOutFours.ts`) with its own
pure function `(counts: number[]) => Figure`-shaped calculation, its own
`QuestionDefinition`-like wrapper, and its own minimal input UI (four
numeric taps) — entirely additive, requiring no change to `casting.ts`,
`chartModel.ts`, or any existing question. This is a plan for *if* the
mechanic is confirmed, not an implementation; nothing has been built for
it, per the explicit instruction not to implement it this stage.

### Chapter 37, Method 2 — missing data model, not guessed

The rule as transcribed decides its verdict by which side of the physically
*drawn* chart (traditionally arranged as a diagram, not a flat list of 16
houses) a given figure falls on — a right/left split that depends on the
diagram's spatial layout convention. `ChartModel` (via `casting.ts`) only
ever exposes "house N → figure"; it has no left/right, no adjacency-by-page-
position, no notion of a drawn diagram at all. Missing, specifically:

- Which of the 16 houses fall on the "right" vs. "left" half of the
  traditional diagram (this is a fixed convention in the source tradition,
  not something derivable from the figures themselves).
- Confirmation that "side" means the same thing in every classical layout
  convention (some traditions mirror the diagram; guessing which one this
  source uses would be inventing a rule).

No spatial model was invented to fill this gap. If the existing chart
already contained enough information, house-number parity or grouping could
prove it with a test against the source's worked example — no such example
survives in the transcribed material, so nothing was assumed and no such
test could be written.

Chapter 34, Method 1 needed one new primitive, `RECAST_FROM_HOUSES`
(`operations.ts`): a known classical technique of treating 4 named houses'
own figures as fresh Mothers and deriving an entirely new 16-house chart
from them (via the existing, untouched `buildChart`/`buildChartModel`).
Chapters 20/22 needed `COUNT_FORTUNE`/`COUNT_DIRECTION` (whole-chart quality
tallies, same optional-houseNumbers shape as `COUNT_ELEMENTS`); chapter 32
needed `CHECK_FIGURE_ADJACENT_REPETITION`/`CHECK_ELEMENT_ADJACENT_REPETITION`
("X follows X" positional checks); chapter 35 needed `CHECK_FIGURE_PRESENT_IN_CHART`
extended with an optional house-subset parameter (backward compatible,
mirrors `COUNT_ELEMENTS`'s existing shape). No other new primitives were
required — everything else composes from what Prompts 1-2 already built.

## Architectural gaps (Stage 4 — Prompt 5, chapters 41-60)

Reviewed under the same A-E taxonomy as Stage 3 above. Nothing here was
implemented, guessed, or forced into the existing model.

| Chapter | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 41 Method 1, 48 Methods 1-2 | Hinges on classifying a figure directly as a "male star"/"female star" | No — `ChartModel`/`FigureQualities` carries no verified gender axis (`gender` is always `needs_review`, project-wide, since types.ts was first written — not new to this stage) | No — a new result kind doesn't create the missing classification | No — a primitive can't invent a table that doesn't exist | **Yes** — need the source (this chapter or elsewhere in the manuscript) to actually define which of the 16 figures are male vs. female | No |
| 46 (talismanic ritual) | Not a chart-*reading* method at all — "mix h12 inside h11 on paper, fold it, put a stone on it," referencing a named talismanic diagram the transcription dropped | No — nothing here produces a verdict to compute; it's a physical-practice instruction, not a rule with branches | No — there is no answer shape to represent, descriptive or otherwise | No | **Yes** — the diagram itself is omitted (`[talismanic diagram in the original — not reproduced here]`) | **Yes** — even with the diagram, this is a "make and place a talisman" practice, not a `ChartModel` → verdict computation; it would need its own non-reading UI, not a `QuestionDefinition` |
| 59 (secret of the querent) | Methods 1 and 3 say "use whatever star you get to talk to the person" / "add Yusuf to any star found in a house" with no defined branch structure; Method 2 has the querent freely pick a star with no chart computation at all | No — none of the three methods define a determinate verdict a rule engine can evaluate | **Partially** — even a descriptive result needs a *defined* answer shape; "whatever you get, interpret freely" isn't one | No — a primitive computes a fixed operation, not open-ended human interpretation | No — nothing is omitted; the ambiguity is in the method's own open-ended design, not a transcription gap | No — Method 1's calculation (H1+H5+H9+H13) is a normal `ChartModel` operation; it's the *verdict* step that has no fixed shape, not the input mechanism |
| Unnumbered "Consequence of Friendship" fragment (after ch.52) | Not a blocker at all — fully computable (H1+H3, good/bad) | **Yes** | — | — | — | — |

The friendship fragment is the one item in this table that is *architecturally* ready to register — it was left out only because it carries no chapter number and Prompt 5 scoped this stage to numbered chapters 41-60. It is a natural candidate for a future stage once its numbering (or lack of it) is resolved against the source.

The male/female-star gender gap (chapter 41 Method 1, chapter 48 Methods
1-2, and the pregnancy fragment's own Method 3 — predicting the baby's sex
the same way) is the single largest recurring blocker this stage, appearing
independently in 3 different chapters/fragments. It is not a per-chapter
oversight: this project's `FigureQualities.gender` axis has been
architecturally `needs_review` since Prompt 1 (see types.ts), because no
chapter reviewed so far (1-60) ever tabulates which of the 16 figures are
traditionally male vs. female — every occurrence where a chapter's own text
needed "male/female" was only computable when that SAME chapter redefined
it via an already-verified axis (chapter 31's fire/air=male, water/sand=
female, stated explicitly in its own source text). Chapters 41/48/56's
fragment never redefine it that way — they just say "male star"/"female
star" as if the classification is already known. Resolving this for good
would need either (a) a later chapter in the source that tabulates it
directly, or (b) an explicit product decision to adopt classical geomancy's
general male/female figure convention as a labeled, sourced-from-tradition
axis (the same pattern this project already uses for Fortune/Direction via
`content/classicalAttributes.ts`) — which Prompt 5 explicitly did not
authorize ("do NOT use general geomancy knowledge to fill gaps"), so it
was not done here.

## Architectural gaps (Stage 5 — Prompt 7, chapters 61-80)

Reviewed under the same A-E taxonomy as Stages 3-4 above. No chapter this
stage was blocked at the whole-chapter level (unlike ch.46/ch.59 above) —
every gap found was scoped to a single method within an otherwise-computable
chapter. Nothing here was implemented, guessed, or forced into the
existing model.

| Method | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 64 Method 2 | The source states the full calculation (H4+H11+H7+H14, check good/middle-good/bad) but the passage itself ends without ever saying what any branch means | No — `ChartModel` computes the figure correctly; there's simply no rule text left to evaluate against it | **Partially** — this needed a new, more precise `ReviewReasonCode` (`interpretation_not_stated`) to distinguish it from an omitted-figure gap, which was added | No — a primitive can't invent a verdict mapping that isn't in the source | **Yes** — need the source's own missing sentence (this passage, or a cross-reference elsewhere, stating what good/middle-good/bad means here) | No |
| 68 Method 1 | Two independent, compounding blockers: (a) the same unsourced male/female-star classification as ch.41/48, and (b) the rule's first branch depends on the *querent's own* gender, which this app's casting flow never asks for at all | No — `ChartModel`/`FigureQualities` carries no verified gender axis (blocker a); the casting flow's own input shape carries no querent field at all (blocker b) | No — a new result kind doesn't create either missing input | No — a primitive can't invent a table (a) or an input the user was never asked for (b) | **Yes** for (a) — need a source table defining figure gender | **Yes** for (b) — need a querent-gender input added to the casting flow, a product decision out of this stage's scope, not merely a source-reading gap |

The chapter 68 finding is new evidence for a point Prompt 6 already flagged as unresolved (section 11): the male/female-star gap keeps recurring (now a 4th confirmed occurrence — ch.41 M1, ch.48 M1/M2, ch.68 M1) with no defining table anywhere in either manuscript within chapters 1-80. It also surfaces a genuinely new, second kind of gap this project hasn't hit before: the source needs to know *who is asking*, not just what the chart shows — the casting flow only ever collects the 4 Mother patterns, with no concept of querent identity at all. Resolving (b) would be an architectural/product decision (add a querent-gender field to the casting flow), not a source-reading fix, and was not made here — consistent with Prompt 7's own "do not alter core casting unless a source-supported architectural need is documented and the smallest possible change is made" instruction; since no chapter 1-80 method can be computed even with that field added except this one, adding it was judged not yet warranted.

## Needs review (calculable, rule ambiguous)

- **Chapter 1, Method 3** (travel) — the deciding rule classifies the final
  figure as a whole "single-dot star" or "double-dot star"; this project
  only has a verified opened/closed definition per *line*, not for a whole
  4-line figure. The four-element extraction itself is computed and shown;
  the verdict is withheld.
- **Chapter 3, Method 3** (business) — "check H2 and H6 — if both are bad,
  X; if it's a good star, Y" never says what a split or middle-good pair
  means. Both houses are shown; only the two unambiguous cases (both bad,
  both good) resolve, everything else is honestly `uncertain` for that
  chart.
- **Chapter 21, Method 1** (wife/sister had sex) — decides the verdict by
  classifying the WHOLE resulting figure as "opened" or "closed"; this
  project only has a verified opened/closed definition per individual line,
  not for a whole 4-line figure — same unresolved gap as Chapter 1, Method 3
  above.
- **Chapter 41, Method 1** (who took the item) — classifies H1 directly as
  a "male star" or "female star"; this specific chapter never defines which
  figures are male/female, and this project's general figure-gender axis is
  intentionally unsourced project-wide. See "Architectural gaps (Stage 4)"
  above for the full reasoning shared with the next entry.
- **Chapter 48, Methods 1-2** (male or female child) — same unsourced
  figure-gender gap as Chapter 41, Method 1, applied to H1 alone and to
  H10+H11 needing to match each other. The question still resolves via
  Chapter 56's independently-computable dot-arithmetic method (see
  `childGender.ts`).
- **Chapter 68, Method 1** (is your partner cheating) — same unsourced
  figure-gender gap as chapters 41/48 above (4th confirmed occurrence),
  compounded by a second, independent blocker: the rule's first branch
  depends on the *querent's* own gender, which the app's casting flow has
  no input for at all. See "Architectural gaps (Stage 5)" above for the
  full reasoning.

## Uncertain (not computable — source passages needing manual verification)

Every one of these depends on named or hand-drawn figures the PDF
transcription marked `[figures omitted — symbols not preserved]`, except
where noted:

- Chapter 2, Method 4 (Sirri Sa'ael/Damir) — also has no defined computation
  anywhere in this project for what "Sirri Sa'ael" itself derives from, on
  top of the omitted figure list.
- Chapter 4, Method 1 (H10 figure list)
- Chapter 5, Methods 1-2 (H6 figure list; H1+H8 figure list)
- Chapter 6, Method 1 (H4/H10 figure list)
- Chapter 7, Method 4 (H7 figure list — repeated "If it's," with the figure
  never named for any branch)
- Chapter 9, Method 3 (H6 healing/non-survival figure lists)
- Chapter 13, Method 3 (H5 figure list, five branches)
- Chapter 17, Methods 1-2 (figure lists for both; Method 2's one seemingly
  independent trailing sentence still refers back to the omitted material,
  so it can't be isolated as its own rule)
- Chapter 19, Method 3 (named figures deciding H4/H10 vs. H5/H11)
- Chapter 21, Method 3 (H7 figure lists, both branches)
- Chapter 26 (fight/argument) — every branch (h1/h2, Sirri Sa'ael, h8, h12,
  h9's own "peace" branch, h14) depends on named figures the transcription
  omitted or dropped entirely; nothing in this chapter is computable.
- Chapter 27, Methods 1-2 (farming/harvest) — every branch (stars of the
  East/West/North/South; fire/air/water/sand "stars") depends on named
  figures the transcription omitted; nothing in this chapter is computable.
- Chapter 37, Method 2 — architectural gap (no left/right spatial layout),
  not an omitted figure; see "Architectural gaps" above.
- Chapter 64, Method 2 — not an omitted figure either: the source states
  the full calculation (H4+H11+H7+H14, check good/middle-good/bad) but the
  passage itself ends without ever saying what any branch means. Carries
  the new `reviewReasonCode: 'interpretation_not_stated'` (distinct from
  the `gender_classification_unsourced`/`figures_omitted_by_transcription`
  codes used elsewhere) so this specific kind of gap stays distinguishable
  from an omitted figure or an ambiguous split. See "Architectural gaps
  (Stage 5)" above.

None of these were guessed at. If the original manuscript pages ever surface
with these figures legible, each one becomes a small, mechanical change —
replace the `status: 'uncertain'` method with a real `evaluate()`, following
the pattern already used by every verified method in the same file.

## Source-verification queue

Items a human with access to the original, unredacted manuscript could
resolve, listed plainly rather than buried in code comments (Prompt 4,
section 17):

| Chapter — Method | Issue |
|---|---|
| Ch.2, Method 4 | Sirri Sa'ael figure list omitted; "Sirri Sa'ael" itself also has no defined computation anywhere in this project |
| Ch.4, Method 1 | H10 figure list omitted |
| Ch.5, Methods 1-2 | H6 figure list omitted; H1+H8 figure list omitted |
| Ch.6, Method 1 | H4/H10 figure list omitted |
| Ch.7, Method 4 | H7 figure list omitted (repeated "If it's," with no figure named) |
| Ch.9, Method 3 | H6 healing/non-survival figure lists omitted |
| Ch.13, Method 3 | H5 figure list omitted (five branches) |
| Ch.17, Methods 1-2 | Figure lists omitted for both |
| Ch.19, Method 3 | Named figures deciding H4/H10 vs. H5/H11 omitted |
| Ch.21, Method 1 | Ambiguous wording — "opened/closed star" for a whole figure, not a line (architectural, not an omission) |
| Ch.21, Method 3 | Both branches' figures omitted |
| Ch.26 | Figure tokens omitted or dropped for every branch, including the H9 "peace" branch |
| Ch.27, Methods 1-2 | Figure tokens omitted for every directional/elemental branch |
| Ch.28 (2 continuation fragments) | Every branch's figure identifier was dropped entirely — not even which figure means what is recoverable; not registered at all |
| Ch.30 | Two named-figure branches ("profit but not stable"; "profit but very sick") omitted — not implemented, only the direction-based primary rule is |
| Ch.33 | Uses a separate dot-line "cast out by 4s" mechanic, not the 16-house chart — architectural, needs a product decision (new input UI) rather than a source fix |
| Ch.37, Method 2 | Needs a defined left/right spatial convention for the chart — architectural, needs a product/source decision |
| Ch.41 Method 1, Ch.48 Methods 1-2, "pregnant" fragment Method 3, Ch.68 Method 1 | **Confirmed unresolvable (Prompt 6, reconfirmed Prompt 7)** — exhaustively re-searched both manuscripts through chapter 80; no table exists anywhere, and the book's own front matter (`KM_EDITION_NOTE`) explicitly confirms the gap. Now 4 confirmed occurrences. Ch.68 additionally needs a querent-gender input the app's casting flow doesn't collect at all — see "Architectural gaps (Stage 5)" above. Needs either a later chapter that defines the figure-gender table or an explicit product decision to adopt an outside classical-tradition table (not authorized by this or any prior stage) |
| Ch.64, Method 2 | **New this stage (Prompt 7)** — the source states the full calculation (H4+H11+H7+H14, good/middle-good/bad) but its own text ends without ever saying what any branch means. Carries `reviewReasonCode: 'interpretation_not_stated'` (a new code, distinct from an omitted figure). Needs the source's own missing verdict-mapping sentence, if it survives elsewhere in the manuscript |
| "Someone's Behavior" fragment (after ch.64) | **Resolved, not a gap (Prompt 7)** — confirmed a byte-for-byte duplicate of chapter 43's own Method 1 (same H3+H7+H11+H14, +H12 calculation), consistent with its own title's cross-reference ("also see Chapter Forty-Three"). Not registered as a separate question |
| Ch.46 | Talismanic diagram omitted ("[talismanic diagram in the original — not reproduced here]"); also architectural — even with the diagram, this is a ritual-practice chapter, not a chart-verdict method. **Permanently classified (Prompt 6)**: ritual procedure, not a missing method |
| Ch.58 vs. Ch.21 consistency | **RESOLVED (Prompt 6)** — confirmed an implementation inconsistency (Ch.21 predates the `resultKind: 'descriptive'` model), not a genuine source difference. Ch.21 Method 2 migrated to `resultKind: 'descriptive'` to match Ch.58 exactly; regression tests confirm the underlying calculation is unchanged |
| Ch.18, Method 3 ("some scholars") | **RESOLVED (Prompt 6)** — the source's own secondary "some scholars also say" rule was previously folded into cosmetic text on Method 3's verdict instead of counted independently. Split into Method 3 (primary rule) + a new Method 4 (the scholars' rule), each now independently contributing to consensus |
| Ch.32 ("will it rain") | **Reviewed, not changed (Prompt 6)** — structurally a binary yes/no fact like chs. 47/58 (arguably `descriptive`), but fits the same "will X happen" mold as many already-`outcome` chapters (money, children, safe return) with no clear source evidence favoring a change either way. Flagged for a future stage's judgment, not auto-changed |
| Ch.31, Ch.41, Ch.48 x2, Ch.68 gender occurrences — **corrected (Prompt 8)**: 2 further named occurrences now precisely located by a full-manuscript re-grep, replacing the earlier "~ch.71, ~ch.90" line-position estimate (ch.71, as actually implemented in Prompt 7, turned out to be two ordinary named-figure trigger methods with no gender terminology at all — that guess did not materialize) | The 2 real further occurrences are **chapter 127** ("The Description of the Thief," h1 or h7 male/female star → male/female thief) and **chapter 141** ("If the Prisoner Is Male or Female," h1+h7 male/female star → prisoner's sex). Both read in full this stage; neither defines the classification either — same unsourced gap. Both are far beyond chapters 1-80 and were not implemented, per this stage's explicit scope. A future stage reaching ch.127/ch.141 should expect to hit the identical wall; no new investigation needed there |
| Ch.64, Method 2 | **Reconfirmed unresolvable (Prompt 8)** — re-read in full context; the passage genuinely ends after "check if it's a good, middle-good, or a bad star" with no continuation anywhere nearby. `interpretation_not_stated` stands, permanently, pending a source that was never supplied |
| Ch.68, Method 1 — querent-gender input | **New finding, confirmed genuine and scoped (Prompt 8)** — a full-manuscript grep confirms this querent-differentiated pattern occurs exactly once in the entire 153-chapter book (ch.68 only); the app has no querent-identity input anywhere in its architecture. Not added this stage (a single method is a weak case for new product surface) — the required product decision (whether/how to collect querent identity) is open. See "Architecture decision for contextual inputs" in the Prompt 8 section above for the proposed (undeployed) mechanism |
| Ch.79, Method 2 — exactly-one case | **Reconfirmed non-invention (Prompt 8)** — the source enumerates only 2/3/>3; no implicit rule covers a count of 1. Left `uncertain`, now with a dedicated regression test proving the app doesn't fabricate "one baby" for the one fixture chart that actually produces this exact case |
| Ch.32 ("will it rain") | **Re-checked, still not changed (Prompt 8)** — same conclusion as Prompt 6: no new source evidence surfaced to justify moving it to `descriptive`. Documented again as an open, deliberately-unresolved tension rather than silently dropped |
| `InsufficientNotice.tsx` WHY text | **RESOLVED (Prompt 8)** — a verified method whose per-chart outcome is `'uncertain'` was showing the generic, factually wrong "Not yet verified against the source manuscript" instead of its own accurate, already-computed verdict interpretation. Fixed to prefer the method's `reviewNote` (when the whole method is blocked) then its verdict's own `interpretation` (when the method is verified but this chart falls outside its defined branches), before ever falling back to the generic string. Presentation-layer only; no calculation or verdict changed |

## Not yet implemented

Chapters 81-153 (73 numbered chapters) have not been read for this
structured engine yet. `lib/raml/methodVerdicts.ts`'s general parser
already covers some of that material with lighter-weight automatic
verdicts (no audit trail, no cross-method consensus) — see its own file
header for current numbers. Extending this engine further means repeating
the same process: read the chapter's actual text, write one file in
`lib/raml/engine/questions/`, register it in `questions/index.ts`, add
tests, run the full suite, and update this table — the same shape as every
chapter above, chapter by chapter, in order.

## Confirmation

The original casting engine (`lib/raml/casting.ts` — Mother/Daughter/Niece/
Witness/Judge/Reconciler generation) was not touched in this stage or in
Prompt 4.5, nor was `chartModel.ts`, or any chapter 1-19 question file.
`operations.ts` was extended only additively in Prompt 4: one genuinely new
primitive (`RECAST_FROM_HOUSES`) plus four small quality/adjacency tallies
(`COUNT_FORTUNE`, `COUNT_DIRECTION`, `CHECK_FIGURE_ADJACENT_REPETITION`,
`CHECK_ELEMENT_ADJACENT_REPETITION`), and one existing function
(`CHECK_FIGURE_PRESENT_IN_CHART`) gained a backward-compatible optional
parameter, same shape `COUNT_ELEMENTS` already had. Every pre-existing
pilot question (chapters 1-19) produces byte-identical results on the same
fixture chart as before this stage — their own test files
(`__tests__/questions.test.ts`, `__tests__/questions-stage2.test.ts`) are
unchanged in their original assertions and still pass, alongside a new,
explicit structural audit (`__tests__/audit-1-40.test.ts`) checking for
duplicate question ids, broken chapter references, and any needs_review/
uncertain method leaking into a consensus count, across all 40 registered
questions at once.

**Prompt 4.5, honestly:** unlike Prompt 4, this stage did touch
`ruleEngine.ts` and `operations.ts` again, plus `types.ts` and `reading.ts`
(and three UI components) — but only for result-*type* plumbing, never for
a source rule. `ruleEngine.ts` gained one new branch in
`deriveOverallResult` (`if (consensus.kind === 'descriptive') return
'descriptive'`) and its `runQuestion` now passes `question.resultKind` into
`COMPARE_RESULTS`; `operations.ts`'s `COMPARE_RESULTS` gained an optional
`resultKind` parameter and a new `compareDescriptiveResults` helper,
purely additive and defaulting to the exact prior outcome-model behavior
when omitted. No calculation, no source figure, and no verdict for any of
the chapters 1-40 changed as a result — chapters 23/31/36 compute exactly
the same value as before; only their `status` (`needs_review` →
`verified`) and how that value is labeled and displayed changed, because
the old `needs_review` status was itself the bug being fixed (a
mislabeling of a real, unambiguous, verified computation as "unverified").
No new source rule was invented anywhere in this stage, and no chapter
outside 20-40 was touched.

**Prompt 5, honestly:** `casting.ts`, `chartModel.ts`, `ruleEngine.ts`,
`types.ts`, `reading.ts`, `interpretation.ts`, and every chapter 1-40
question file are all completely untouched this stage — the entire
`resultKind: 'descriptive'` machinery Prompt 4.5 built was reused exactly
as-is, with zero changes needed to support chapters 41-60. `operations.ts`
gained exactly two new, genuinely generic primitives: `COUNT_TOTAL_DOTS`
(whole-chart or house-subset raw dot sum) and `CAST_OUT_BY` (reduce a
positive count into 1..n by repeated subtraction — the manuscript's own
named "cast out by N" technique, kept reusable rather than inlined once
into chapter 56's file). Both are pure, deterministic, unit-tested, and
used by exactly one question this stage (`childGender.ts`) — no other
chapter 41-60 method needed a new primitive; everything else composed from
`ADD_MULTIPLE_HOUSES`, `ADD_FIGURE_TO_HOUSE`, `CHECK_HOUSE`,
`CHECK_ELEMENT`, `CHECK_DIRECTION`, `CHECK_LINE_STATE`,
`CHECK_FIGURE_PRESENT_IN_CHART`, `COUNT_ELEMENTS`, and `MATCH_FIGURE` —
all pre-existing. `__tests__/audit-1-40.test.ts` was renamed to
`audit-1-60.test.ts` and its per-question structural/consensus checks now
run against all 57 registered questions (not just 40), plus two new
describe blocks checking descriptive/outcome result-kind integrity
end-to-end. Every pre-existing question (chapters 1-40) produces
byte-identical results on the same fixture chart as before this stage;
their own test files are unchanged in their original assertions and all
still pass. No new source rule was invented anywhere in this stage, and no
chapter outside 41-60 was implemented (chapters 33/46/59 and the two
unnumbered fragments were reviewed, per Prompt 5's own instruction to
document rather than implement architectural gaps, but nothing was coded
for them).

**Prompt 6, honestly:** `casting.ts`, `chartModel.ts`, and `ruleEngine.ts`
remain completely untouched — confirmed by re-reading all three in full as
part of this audit. `types.ts` gained exactly one additive change (the
optional `ReviewReasonCode` type and `MethodDefinition.reviewReasonCode`
field — no existing type's meaning changed, no existing field became
required). `reading.ts` and `interpretation.ts` were read but not modified
— the audit concluded, and confirmed by re-reading both components and
re-screenshotting two live readings, that they already render every result
shape (favourable/unfavourable/mixed/conflict, descriptive/agree/disagree,
insufficient-data-with-full-explanation) honestly, with no invented
conclusions anywhere. `operations.ts` gained one new, evidence-backed
primitive (`FIND_FIGURE_QUARTER`, extracting a pattern that was already
independently duplicated three times, with a manuscript-wide grep
confirming many more future call sites). No chapter's underlying
CALCULATION changed in this stage — the chapter 18 and chapter 21 fixes
both changed only how an already-correct calculation's result is split
into methods (ch.18) or labeled (ch.21), confirmed by regression tests
asserting the exact same computed figures as before each fix. No
male/female figure classification was invented anywhere, confirmed by an
exhaustive re-search of both source manuscripts. No chapter outside 1-60
was touched, and no chapter 61+ work was started, per this stage's explicit
scope.

**Prompt 7, honestly:** `casting.ts`, `chartModel.ts`, and `ruleEngine.ts`
remain completely untouched — confirmed by re-reading all three in full,
and no chapter 61-80 finding ever came close to needing a change to them
(no chapter this stage revealed a bug in any chapter 1-60 calculation
either — nothing in 1-60 was corrected this stage, unlike Prompt 6).
`types.ts` gained exactly one additive change: one new
`ReviewReasonCode` union member (`interpretation_not_stated`), no existing
value's meaning changed. `operations.ts` gained exactly two new, genuinely
reused primitives (`ADD_FIGURES`, `COUNT_OPENED_LINES`, both unit-tested);
every other chapter 61-80 method composed entirely from the 20+ primitives
Prompts 1-6 already built (`ADD_MULTIPLE_HOUSES`, `CHECK_HOUSE`,
`CHECK_LINE_STATE`, `CHECK_DIRECTION`, `EXTRACT_ELEMENT`,
`CHECK_FIGURE_PRESENT_IN_CHART`, `COUNT_FIGURE_OCCURRENCES`,
`CAST_OUT_BY`, `MATCH_FIGURE`, among others) — no other new primitive was
needed. `reading.ts`, `interpretation.ts`, and every UI component
(`OutcomeCard`, `MethodConsistencyCard`, `InsufficientNotice`,
`CalculationDetails`) were read but not modified:
every result shape produced by chapters 61-80 (favourable/unfavourable/
mixed/conflict, descriptive/agree, insufficient-data-with-full-explanation)
was confirmed, via live rendering, to already be rendered honestly by the
existing components built for chapters 1-60 — no new result shape was
needed this stage. No new source rule was invented anywhere: chapter 64
Method 2 and chapter 68 Method 1 were left without a verdict rather than
guessed one, and chapter 79 Method 2's count-of-1 case was left
`uncertain` rather than assumed to mean "one baby." No chapter outside
61-80 was touched, and no chapter 81+ work was started, per this stage's
explicit scope.

**Prompt 8, honestly:** this was an audit stage, not an implementation
stage, and its footprint reflects that. `casting.ts`, `chartModel.ts`,
`ruleEngine.ts`, `types.ts`, and every chapter 1-80 question file's
calculation logic are completely untouched — re-confirmed by re-reading
the core three files in full and by the full suite staying green at
1078/1078 with only one new test added. No new `ReviewReasonCode` value
was needed (the two-independent-gaps case on ch.68 was judged to fit the
existing single-code shape, with the second gap documented in prose rather
than forcing a second machine-readable code). No new `operations.ts`
primitive was extracted — the one candidate found (a twice-duplicated,
one-line "are these houses all a given fortune" check) was judged below
the extraction threshold this project has consistently used (three or
more genuine occurrences), and left inline, deliberately, with the
reasoning recorded rather than silently skipped. **Exactly one file
changed in a way that affects what a user sees**:
`components/raml/reading/InsufficientNotice.tsx`, and even that change
touches no calculation, verdict, or consensus value — it only fixes which
of two already-computed, already-accurate strings (`reviewNote` vs. the
verdict's own `interpretation`) gets shown, in favor of the one that
was actually true for verified-but-chart-uncertain methods. No male/
female-star classification was invented, confirmed by a second
exhaustive re-search of both manuscripts (this time locating the two
further occurrences — ch.127, ch.141 — precisely, rather than by
estimate). No querent-gender input was added, despite confirming the
need is genuine, because it is scoped to exactly one method out of 143
and building new product surface for that alone was correctly identified
as outside this audit's authority to decide unilaterally — the design
for it exists on paper only. Chapter 64 Method 2's missing verdict
mapping and chapter 79 Method 2's exactly-one case were both
re-investigated and both remain exactly as unresolved as they were at
the end of Prompt 7 — reconfirmed, not newly discovered, and neither was
filled in with a plausible-sounding guess. No chapter 81+ work was
started, and no chapter 1-80 source rule, figure classification, or user
input was invented anywhere in this stage.
