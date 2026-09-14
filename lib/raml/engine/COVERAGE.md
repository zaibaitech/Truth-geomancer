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

## Prompt 9 — Kanzul Mikban chapters 81-100 (Stage 6)

Source-first expansion, same discipline as Prompts 4/5/7: read every
chapter's actual text plus 2 unnumbered fragments, preserve every method
independently, never guess an omitted figure or invent what an incomplete
passage means. 20 new questions registered (19 numbered chapters plus the
"Secrets Between Two Friends" fragment after ch.85; chapter 95 is a
reference table, entirely omitted from the transcription and never phrased
as a chart-verdict question, so it is not registered; the "repeated"
fragment after ch.96 is a confirmed duplicate of ch.96's own question, per
its own title, and is registered as ch.96's Method 2 rather than under its
own separate intentions.ts id).

**Three brand-new unsourced-classification axes, hit for the first time.**
Chapters 1-80 never happened to need the `dayNight` or `stability`
FigureQualities axes — both have been `needs_review`, project-wide, since
Prompt 1 (the source's own edition note names them as real qualities the
book uses, alongside gender, but this project has never had a table for
any of the three). Chapter 83 needs day/night; chapters 85 Method 2, the
"secrets" fragment's unreachable else-branch, and 86 Method 2 need
stability. Chapter 91 needs a classification this project has *never*
declared a field for at all — "present, past, or future star" — confirmed
via a full re-grep of both manuscripts to be used exactly once, nowhere
defined. None of the three was invented. Three new `ReviewReasonCode`
values were added, one per axis (`day_night_classification_unsourced`,
`stability_classification_unsourced`, `temporal_classification_unsourced`),
matching `gender_classification_unsourced`'s own precedent exactly — one
code per distinct axis, reused across every method that axis blocks.

**Male/female-star search continued into 81-100, per instruction — still
nothing found.** No occurrence of "male star"/"female star" or equivalent
appears anywhere in chapters 81-100. The male/female-star gap therefore
stands exactly as Prompt 8 left it (4 confirmed occurrences through ch.80,
plus ch.127 and ch.141 beyond it, none defining the classification).

**Two "OR across two different axes, pointing to opposite conclusions"
cases, split into separate methods rather than merged.** Chapters 85 and
86 each state their verdict as an OR between a verified axis (direction)
and an unsourced one (stability) — and, unlike the "secrets" fragment two
paragraphs later (where both halves of its own OR agree on the same
verdict, so a true direction/fortune check is still decisive), chapters 85
and 86's two axes point to *opposite* conclusions, meaning a
direction-only reading could not honestly rule out the unverifiable
stability half silently disagreeing on a given chart. Both are split into
a direction-based Method 1 (verified) and a stability-based Method 2
(blocked), matching the chapter 18 "some scholars also say" precedent
(Prompt 6): preserve two genuinely different readings as two methods,
never collapse one into the other's cosmetic elaboration.

**A deliberately preserved textual difference: chapters 88 and 89.** Both
use the identical 7-house opened-line count (h1, h2, h4, h5, h10, h11,
h15), but chapter 88 says "subtract 12 from it" (a single subtraction)
while chapter 89, two paragraphs later, says "start subtracting 12, 12"
(the repeated `CAST_OUT_BY` reduction). These were implemented literally
as two different techniques rather than smoothed into the same mechanic —
on the shared fixture chart they happen to produce the same result (both
reduce 15 to 3), which is a coincidence of this particular chart, not
evidence the two techniques are secretly the same.

**Chapter 90 Method 1 reuses the `interpretation_not_stated` code from
Prompt 7** rather than needing a new one: its calculation is fully defined
(sum the dot-values of every bad-fortune house, cast out by 12s, check
that house's own fortune) but its own worked examples ("if your result is
9, it means; if it's 12, it means...") never say what any result number
means for whether misery ends — the same shape of gap as chapter 64
Method 2, not a new category.

**Chapter 79's own discipline (exactly-one case never assumed) reapplied
twice more.** Chapter 84's three positive-trigger methods leave a
good/middle-good result at h3/h4/h5 `uncertain` rather than assuming "not
bad" means anything; chapter 98's house-repeat lookup leaves both a
zero-match and a multiple-match case `uncertain` rather than picking one
cause arbitrarily.

**One new operation-audit finding: none extracted.** Every chapter 81-100
method composed entirely from existing primitives —
`ADD_MULTIPLE_HOUSES`, `ADD_FIGURES`, `EXTRACT_ELEMENT`, `CHECK_HOUSE`,
`CHECK_ELEMENT`, `CHECK_LINE_STATE`, `COUNT_OPENED_LINES`, `CAST_OUT_BY`,
`COUNT_FORTUNE`, `FIND_FIGURE_QUARTER`, `RECAST_FROM_HOUSES` — with two
calculations composed inline rather than extracted: chapter 90 Method 1's
"sum the dot-values of every bad-fortune house" (used by exactly one,
already-blocked method — not evidenced as reusable) and chapter 98's
house-repeat lookup (a 12-branch table specific to this one chapter's own
cause list, not a generic operation). Neither meets this project's
established extraction bar (three or more genuine, independent
occurrences).

**One genuine, naturally-occurring method conflict.** Chapter 96 ("if a
sick person has long life") — Method 1 (air line, unfavourable) vs.
Method 2 (the "repeated" fragment's quartet water-elements, favourable),
`ConsensusLevel: 'conflict'`, `overallResult: 'mixed'`, verified live in
the browser, same "preserved, not averaged" pattern as every earlier
conflict this project has found (chs. 60, 61).

See `lib/raml/engine/__tests__/questions-stage6.test.ts` for the full
per-method, hand-verified test coverage, and `__tests__/audit-1-100.test.ts`
(renamed from `audit-1-80.test.ts`, generalized to run its structural/
consensus/descriptive-integrity/gender-classification checks against
every registered question, chapters 1-100 together — still exactly 4
confirmed gender-blocked methods, since none of this stage's 3 new
unsourced axes use the gender code) for the full regression audit.

## Prompt 10 — Kanzul Mikban chapters 101-120 (Stage 7)

Source-first expansion, same discipline as Prompts 4/5/7/9: read every
chapter's actual text plus 2 unnumbered fragments, preserve every method
independently, never guess an omitted figure, never invent a
classification or a constant figure's value. 10 new questions registered.
Chapters 109-117 **do not exist** in the source's own hand-numbering — the
manuscript's own front matter says so explicitly ("hence gaps like
109-117... these are preserved exactly as in the source, not transcription
errors"), so this is not a gap to fill, just a fact about the author's own
numbering to record. Chapter 106 (a full, un-omitted body-part reference
table) is not registered as its own question — it has no calculation of
its own, just a house-number lookup — and is instead embedded directly in
`bodyPartInPain.ts`, the one chapter (105) that actually cross-references
it. The "repeated again in the notebook" fragment after chapter 104 is a
confirmed, word-for-word THIRD occurrence of chapter 96 Method 1's own
rule (after the "repeated" fragment already consolidated there in Prompt
9) — its own title says so, and it is not registered separately.

**Cross-chapter dependency scan, per instruction: nothing resolved.**
Chapters 101-120 were checked against every previously-known unresolved
axis (male/female star, day/night, stability, present/past/future,
missing interpretations, querent-gender) before writing a single method.
None of them appears anywhere in this range. What chapters 101-120 *do*
introduce is a **new category of the same underlying problem**: four
methods (chs. 107, 108, 118, 119) each open by adding a named "constant
figure" — Nazir, Nutik, Itisal, and Ifusal respectively — to whatever
figure is sitting in house 1, exactly the way chapter 2 Method 4 already
adds "Sirri Sa'ael (Damir)" to a house's figure. The book's own front
matter (`KM_EDITION_NOTE`) names all of these together as real, recurring
techniques the book uses — but, exactly like male/female/day-night/
stability, never once states what any of their own dot-patterns actually
are, in either manuscript. This is the FIRST time this specific shape of
gap (an undefined *constant*, not an undefined *classification* of an
already-known figure) has recurred enough — 4 times in this stage alone —
to warrant its own code: a new `ReviewReasonCode`,
`constant_figure_undefined`, added to `types.ts`, matching the established
one-code-per-distinct-gap precedent. Chapter 2 Method 4's own,
already-shipped Sirri Sa'ael gap was left as-is (plain `uncertain`, no
code) rather than retroactively edited — Prompt 10 scopes changes to
chapters 101-120, and adding a label to a method's documentation isn't a
calculation change, but touching a chapters-1-40 file outside this stage's
own scope wasn't judged necessary either; the connection is recorded here
instead.

**Male/female-star search continued into 101-120, per instruction — still
nothing found.** No occurrence of "male star"/"female star" or equivalent
appears anywhere in chapters 101-120. The gap stands exactly as Prompt 9
left it (4 confirmed occurrences through ch.100, plus ch.127/ch.141 beyond
this stage's own scope).

**One genuine new pattern: house-number as a raw index, not a figure
lookup.** Chapters 101 and 105 both resolve their verdict by searching
*which house* a computed figure matches (extending chapter 98's own
"causes of death" house-repeat mechanic), and chapter 105 specifically
cross-references a body-part table by house number 1-16 — including
houses 15/16 mapping to "Manhood"/"Womanhood." This does NOT require
knowing the querent's own gender (unlike chapter 68): it's simply one of
16 possible, source-given answers in a lookup table, reported as-is
regardless of who is asking, so no contextual-input gap was created here.

**A genuine internal ambiguity, left unresolved rather than arbitrarily
resolved.** Chapter 103 Method 2 states two independent conditions on the
SAME house's two different lines ("fire closed -> not sick; but if air
closed -> not well") without saying which wins if both lines are closed
at once. Rather than picking one condition as a silent priority order,
that specific combination is left `uncertain`; the fixture chart doesn't
exercise it (only air is closed), so a hand-verified test could not
directly exercise the ambiguous branch either — documented here instead.

**One data-quality fix in a brand-new method, not a pre-existing
regression.** Chapter 105's own calculation legitimately reads the SAME 4
houses (h3, h7, h10, h15) four times over — once per element — before
summing, unlike every earlier "quartet" chapter (62/67/74/91/96), which
each reads a DIFFERENT 4-house group per element. `ADD_FIGURES`'s own
`sourceHouses` union (a flatMap, no deduping — correct and harmless when
the four inputs' house sets are already disjoint) therefore produced a
16-entry list repeating the same 4 houses four times, which the Primary
Indication card would have displayed as "H3 + H7 + H10 + H15" four times
over. Caught during this stage's own browser verification and fixed
locally, inside `bodyPartInPain.ts` only (overriding the result figure's
`sourceHouses` to the true, deduplicated set) — no change to
`ADD_FIGURES` itself, which remains correct for every existing caller.

**One pre-existing, unrelated test-flakiness bug fixed.** While running
the full suite before this stage's own changes, `operations.test.ts`'s
RECAST_FROM_HOUSES "is deterministic" test failed — not due to any
chapter 101-120 change, but because it compared two `RECAST_FROM_HOUSES`
calls' entire chart objects (via `JSON.stringify`) including each chart's
own `createdAt` wall-clock timestamp, which can legitimately differ by a
millisecond between two back-to-back calls. Fixed to compare `.houses`
only — what "structurally identical" actually means — leaving the
underlying `RECAST_FROM_HOUSES`/`buildChart` behavior completely
untouched. Confirmed this was pre-existing flakiness, not a chapter
101-120 regression: nothing in this stage touches `casting.ts`,
`RECAST_FROM_HOUSES`, or chart construction at all.

See `lib/raml/engine/__tests__/questions-stage7.test.ts` for the full
per-method, hand-verified test coverage, and `__tests__/audit-1-120.test.ts`
(renamed from `audit-1-100.test.ts`, generalized to run its structural/
consensus/descriptive-integrity/gender-classification checks against
every registered question, chapters 1-120 together — still exactly 4
confirmed gender-blocked methods) for the full regression audit.

## Prompt 11 — Kanzul Mikban chapters 121-140 (Stage 8)

Source-first expansion, same discipline as Prompts 4/5/7/9/10: read every
chapter's actual text in full, preserve every method independently, never
guess an omitted figure or invent a classification or a constant figure's
value. 20 new questions registered — every one of chapters 121-140 has a
computable shape (no reference tables, no ritual-only material, no
unnumbered fragments needing consolidation this time).

**Chapter 127 gender-classification investigation (instruction section
2) — does NOT resolve the classification.** Chapter 127 ("The Description
of the Thief") is the specific chapter the Prompt 8/9 audit flagged as a
later occurrence of "male star"/"female star" terminology, alongside
chapter 141 (out of this stage's own scope). Read in full, together with
its surrounding text: the chapter states "a male star or a female star
found [at H1] indicates a male or female thief" — using the terminology
exactly as chapters 41/48/68 already do, but never supplying a mapping,
table, or rule from which one could be derived. Per the critical
distinction the instructions themselves draw ("a mere use of the terms is
NOT a definition"), this is not a resolution. `gender_classification_unsourced`
is retained; chapters 41, 48, and 68 were re-checked and are unchanged —
nothing to revisit, since nothing new was found. This is the 5th and 6th
confirmed occurrence of this gap (chapter 127 Methods 1 and 2), bringing
the running total to 6 blocked methods across 4 chapters.

**Cross-chapter dependency scan: nothing else resolved either.** Chapters
121-140 were checked against every previously-known unresolved axis
(male/female star, day/night, stability, present/past/future, undefined
constant figures, missing interpretations, querent-gender) before writing
a single method. None of day/night, present/past/future, or the four
undefined constant figures (Nazir/Nutik/Itisal/Ifusal) appear anywhere in
this range. **Stability**, however, recurs heavily — six separate methods
across five chapters (122 M1/M2, 129 M1, 130 M1, 132 M3) use the familiar
"downward or stable star" idiom, each split into a direction sub-method
(verified) and a stability sub-method (blocked), matching the chapter
85/86 precedent exactly. No new axis was invented to handle this — it is
the same `stability_classification_unsourced` gap first hit at chapter 85,
recurring at a higher rate than in any previous stage.

**A genuinely useful discovery while implementing the "downward or stable
star" idiom: it is usually fully resolvable via direction alone.** Where
the source states BOTH branches explicitly ("downward or stable -> X; but
upward or unstable -> Y" — chapters 129, 130 M1, 132 M3), each branch's
own OR is independently satisfied by its direction leg alone, regardless
of stability: a downward figure always satisfies the positive branch, and
an upward figure always satisfies the negative branch, since "upward"
alone already satisfies "upward OR unstable." Only a level (neither
upward nor downward) figure genuinely needs the unsourced stability axis
to decide. This let the direction sub-methods for these three chapters
resolve BOTH outcomes, not just the positive trigger — confirmed against
the chapter 86 precedent (`businessOrHandwork.ts`), which already does
exactly this. Where the source states only ONE branch (chapter 122 M1/M2,
"if downward or stable -> X," with no stated opposite), the direction
sub-method stays positive-trigger-only, else uncertain — the source
simply gives less to work with there.

**A new descriptive-vs-outcome policy made explicit this stage: "confirm
or deny a specific claimed fact" is descriptive, not outcome, even when
the fact is bad news.** Chapters 124 (is it really stolen), 129 (is the
accused guilty), 131 (was something buried), 132 (is there treasure), and
137 (is this person truthful) all ask the querent to confirm or deny a
specific external claim — the source's own language is truth-value framed
("it is true" / "it's a lie," "it is him/her" / "not the one") rather than
good/bad framed. These are classified `descriptive` with a `'yes'`/`'no'`-
style `descriptiveAnswer`, distinct from chapters like 121 (getting
knowledge), 125 (getting a stolen thing back), 138-140 (prison outcomes),
where the source explicitly frames the two branches in terms of personal
benefit or harm and stays `outcome`. This mirrors the established test
("is the source neutrally describing a fact, or asking for an evaluative
outcome") already used for chapters 98/104 (causes/sources, descriptive)
versus chapters 103/125 (outcome) in earlier stages — made explicit here
because this stage hit five such cases in a row.

**Two calculations independently duplicated across different questions,
kept separate.** Chapter 124 Method 2 (is something really stolen) and
chapter 137 Method 2 (is someone truthful) both use the IDENTICAL
calculation (H1+H5, found anywhere in the chart -> yes/no) — but answer
genuinely distinct questions, so both are registered separately rather
than merged, per instruction section 5 ("answers a distinct question ->
register it separately"). Both independently compute the same result on
the fixture chart, confirmed as a cross-check in
`questions-stage8.test.ts`. Chapters 139 and 140 similarly share one
calculation (H1+H3) but partition it by direction — chapter 139 covers
only the upward branches, chapter 140 only the downward branches — kept
as two questions since the source itself gives them two separate chapter
titles and neither chapter's own text ever addresses the other's
direction.

**One genuinely unresolved internal ambiguity, left unresolved rather
than arbitrarily resolved.** Chapter 136 (has the traveller reached their
destination) states four conditions in sequence — H1 downward (reached
home safely), H1 not downward (not reached), H1 repeating at H3/H9 (on
the way), H1 repeating at H7 (reached town, not home) — with no stated
priority when more than one triggers at once (a chart's direction and its
repeat-position are logically independent, so overlap is possible).
Rather than picking an arbitrary winner, any chart tripping more than one
of the three specific conditions is left `uncertain`, matching the
chapter 103 Method 2 precedent for stated-but-overlapping branches. The
fixture chart happens to trigger none of them (a clean default-negative
case), so this specific overlap branch isn't exercised by the hand-
verified test either — documented here instead.

**Two "figures omitted" gaps, same shape as prior stages, same
convention.** Chapter 124 Method 1 and chapter 132 Methods 1-2 each name
a trigger-figure list that was never transcribed — left `uncertain` with
a plain `reviewNote`, matching the chapter 102/124(sic, this stage's own
precedent)/132 convention already established (status `'uncertain'`, no
`reviewReasonCode`, since that field has consistently been reserved for
categories that recur 3+ times as their own distinct machine-readable
tag, and "omitted figure list" already has enough distinct prior
occurrences without needing this one tagged too).

**External-assignment methods (chapter 130) computed at the chart level,
not treated as a new contextual-input gap.** Chapter 130 ("The Thief from
Among the Accused People") asks the querent to physically assign named
people to a position (right/left, or East/West) before casting — the
same shape as every other Kanzul Mikban method that asks the geomancer to
correlate a classical answer with a real person or object placed there
outside the casting itself. The app computes the classical side (H4's
direction, or the Umuhat/Banat dot-count comparison) exactly as it
already does for compass directions (chapter 134) — per instruction
section 10 ("determine ... whether it exists elsewhere in the
application"), this does not need a new contextual/product input, since
the app was never going to know which specific named person the querent
assigned to which side regardless of what fields it collected. The
chapter 68 querent-gender boundary is unchanged.

See `lib/raml/engine/__tests__/questions-stage8.test.ts` for the full
per-method, hand-verified test coverage (including the ch.124/ch.137 and
ch.139/ch.140 cross-consistency checks), and
`__tests__/audit-1-140.test.ts` (renamed from `audit-1-120.test.ts`,
generalized to chapters 1-140 together — now 6 confirmed gender-blocked
methods) for the full regression audit.

## Prompt 12 — Kanzul Mikban chapters 141-151 (Stage 9)

Source-first expansion, same discipline as Prompts 4/5/7/9/10/11: read
every chapter's actual text in full, preserve every method independently,
never guess an omitted figure or invent a classification. 10 new
questions registered.

**The manuscript ends at chapter 151 — chapters 152-160 do not exist in
this transcription.** Before writing any method, the full `KM_CHAPTERS`
array was inspected structurally: it contains exactly 153 entries total
(matching `content/books.ts`'s `chapterCount: 153`), but that count is 142
NUMBERED entries (1-151, with the already-known 109-117 gap) PLUS 11
UNNUMBERED fragment/sub-chapter entries scattered throughout — not a
numbering ceiling of 153. The array's own last entry is chapter 151
("Dreams and Their Interpretations"); nothing follows it. This matches the
file's own header comment ("a compiled notebook of ~150 question-specific
geomantic reading methods"). This stage therefore covers chapters 141-151
— the entire remainder of the book — rather than the full 141-160 the
prompt's own title anticipated, and confirms (not assumes) that nothing
is left to extract from Kanzul Mikban after this stage.

**Chapter 141 gender-classification investigation (instruction section 2)
— does NOT resolve the classification, and the source itself now
confirms why.** Chapter 141 ("If the Prisoner Is Male or Female") is the
specific chapter the Prompt 8 manuscript-wide audit flagged. Read in full:
it uses "male star" exactly as chapters 41/48/68/127 already do, with no
mapping supplied. This stage goes one step further than a re-search,
though: the book's own front matter (`KM_EDITION_NOTE`) explicitly lists
"male or female" among the paired qualities a figure is "described" by,
then states outright — "this transcription has no verified source
defining exactly which of the sixteen named figures carries which
quality." That sentence has been part of this project's data since Prompt
1, but this is the first stage to cite it directly as dispositive evidence
for the gender gap specifically: the SOURCE's own editorial note admits
the mapping never survived, independent of how many chapters use the
term. `gender_classification_unsourced` is retained; chapters 41, 48, 68,
and 127 were re-checked and are unchanged — nothing to revisit, since
nothing new was found. This is the 7th confirmed occurrence.

**Cross-chapter dependency scan: nothing else resolved either.** Chapters
141-151 were checked against every previously-known unresolved axis
(male/female star, day/night, stability, present/past/future, undefined
constant figures, missing interpretations, querent-gender) before writing
a single method. None of day/night, present/past/future, stability, or
the four undefined constant figures (Nazir/Nutik/Itisal/Ifusal) appear
anywhere in this range — this is the first stage since chapter 85 with
zero stability occurrences.

**A genuinely new omitted-branch shape: the source's own hedge about its
own legibility.** Chapter 149 ("Which Day a Pregnant Woman Will Put to
Bed") states a dot-count-cast-out-by-7 result maps to days of the week —
"1 is Sunday; 2 is Monday; 3 is Tuesday; and so on through the week to
Saturday" — but carries its own bracketed transcription note: "[The full
day-by-day list runs off the edge of the scanned page — only the first
three days are legible; please check the original for days 4-7.]" The
"and so on" phrase reads as an obvious, inferable sequence (the ordinary
calendar week), but the bracketed note is the TRANSCRIBER's own admission
that they could not confirm the original text for results 4-7 — meaning
"and so on" may be the transcriber's own smoothing-over of that exact
gap, not verified source wording. Per this project's discipline (never
infer a missing branch, not even one that looks obvious, and the
instructions' explicit "do not infer... from traditional practice or an
apparently similar chapter"), only results 1-3 are implemented; 4-7 are
left `uncertain`. This is a new twist on "omitted branch" — not a missing
figure or a cut-off sentence, but a source-flagged doubt about its OWN
completeness — documented here rather than silently trusting the "and so
on" gloss.

**A dual-blocker chapter, not just a figures-omitted one.** Chapter 142
("Where Kidnappers Are Keeping a Person Hostage") names a calculation —
"check which star is found in its own house" — that presumes a
figure-to-house "own house" identity table never given anywhere in either
manuscript, ON TOP OF every one of its ~11 branches having an omitted
trigger figure (the same "If it's:, ..." pattern as chapters 94/97).
Unlike those chapters, where the calculation itself (a single house
check) was fully clear and only the branch meanings were missing, chapter
142's own first step has no verifiable basis — left `uncertain` with both
reasons documented in one `reviewNote`.

**One chapter judged not computable at all, not registered.** Chapter 151
("Dreams and Their Interpretations") compounds two blockers beyond even
chapter 142's: its own calculation — "make only the first 4 stars (Umuhat)
and pair them" — names an operation ("pair them") with no established,
unambiguous meaning anywhere in this project (unlike "add," which is
crystal clear), AND every one of its 16 branches has an omitted trigger
figure. Structurally this chapter also reads as a dream-omen/ritual-remedy
guide (each of the 16 outcomes prescribes a specific sadaka/charitable
offering) rather than a chart-verdict question in the usual sense — closer
in flavor to chapter 46's talismanic material (already classified
ritual-adjacent, not registered) than to any verified chapter. Given
neither the calculation nor any branch meaning is recoverable, this
chapter is NOT_IMPLEMENTED and not registered, matching the chapter
46/95/28-fragments precedent for "no computable shape recoverable" — not
left as a blocked `QuestionDefinition` with zero working methods, since
there is no verifiable calculation to attach even a blocked method to.

**Six ordinary sum-and-fortune methods, mostly full coverage.** Chapters
143-148 and 150 each reduce to a straightforward multi-house sum
(reusing `ADD_MULTIPLE_HOUSES` with 3 or 4 houses at once — see that
operation's own doc comment on why "pick A and B, then C, then add them
all" is the same as summing every named house together) followed by a
good/middle-good/bad check. Five of these six state all three fortune
branches explicitly (chapters 145-148, 150) — full coverage, no gap.
Chapter 143 only states good/bad for both its methods, leaving
middle-good genuinely unaddressed in each — left `uncertain` for that
specific case rather than assumed. Chapter 144 additionally requires its
"good" branch to ALSO repeat somewhere in the chart (an explicit AND, not
just fortune alone) — a good-but-non-repeating result is left `uncertain`
since the source never addresses it, while bad and middle-good resolve
cleanly on fortune alone.

See `lib/raml/engine/__tests__/questions-stage9.test.ts` for the full
per-method, hand-verified test coverage, and `__tests__/audit-1-151.test.ts`
(renamed from `audit-1-140.test.ts`, generalized to chapters 1-151
together — now 7 confirmed gender-blocked methods) for the full
regression audit.

## Prompt 13 — Final source reconciliation & production audit (chapters 1-151)

Not an extraction stage: no chapter was read for the first time here, and no
geomantic rule was added, changed, or reinterpreted. This stage cross-checked
the finished implementation against the source one last time and closed the
gaps that cross-checking found. Its conclusions are now executable —
`__tests__/source-reconciliation.test.ts` asserts each of them, so a future
change cannot quietly undo one.

### The book's boundaries, stated once and for all

- **153** transcription entries in `KM_CHAPTERS`.
- **142** of them are numbered chapters; **11** are unnumbered fragments.
- Numbered chapters run **1-151**. **151 is the final chapter.**
- **Chapters 109-117 do not exist** — an intentional gap in the author's own
  hand-numbering, stated as such by the manuscript's front matter.
- **There is no chapter 152, and no chapter 161-180.** 153 was never a
  chapter number; it is the entry count.

### What the audit found, and what it changed

**1. 27 unresolved methods carried no machine-readable reason — while three
codes that describe their blockers exactly had never been attached to
anything.** `types.ts` has declared `figures_omitted_by_transcription`,
`whole_figure_state_undefined` and `spatial_layout_unsupported` since Prompt
6, but every stage since then reached for a free-text `reviewNote` instead,
so the codes sat unused while 20+ methods that match them precisely went
uncoded. 24 methods were given their canonical code this stage — purely
additive, no status, calculation or verdict changed:

| Code | Methods | What it means |
|---|---|---|
| `figures_omitted_by_transcription` | 20 (chs. 4, 5 x2, 6, 7, 9, 13, 17 x2, 19, 21, 26, 27 x2, 94, 97, 102, 124, 132 x2) | A named trigger-figure list the transcription marked "[figures omitted]" |
| `whole_figure_state_undefined` | 2 (ch.1 M3, ch.21 M1) | Classifies a WHOLE figure as opened/closed; this project only defines that per line |
| `spatial_layout_unsupported` | 1 (ch.37 M2) | Decided by which physical side of the drawn chart a figure lands on |
| `constant_figure_undefined` | 1 added (ch.2 M4, Sirri Sa'ael) | Extends the Prompt 10 code to the constant it was written for — its own doc comment names Sirri Sa'ael, but ch.2's occurrence predated it |

**Three methods are deliberately left uncoded**, because their blocker is
genuinely not one canonical category and labelling it as one would
misdescribe it. Each is now named in an explicit allowlist the test enforces,
so "uncoded" can never again mean "overlooked":

- **ch.3 M3** — a *partial* interpretation gap (the source defines both
  extremes but never the middle case), so `interpretation_not_stated` would
  overstate it.
- **ch.82 M2** — the source is truncated mid-sentence; a truncation is not an
  omitted figure list, and it is the book's only occurrence — below this
  project's own 3-occurrence bar for minting a code.
- **ch.142 M1** — a dual blocker (undefined "own house" identity table *and*
  omitted branch figures); restoring either alone would not make it
  computable, so no single code is accurate.

**2. Two computable fragments were never registered — not on their merits,
but because every stage scoped itself to a numbered range.** The "If She's
Going to Stay in the Marriage" sub-topic after chapter 7 and "The Consequence
of Friendship Between Two People" after chapter 52 are both fully computable
and both already had their own selectable entries in `content/intentions.ts`
— meaning a user could pick them and get only the lighter-weight fallback
parser. Prompt 5's own notes even record the friendship one as "fully
computable, no chapter number, out of this stage's numbered scope." That
scope no longer exists, so both are now registered (3 methods, all verified,
implementing their fragment's text exactly). This is the only place the
audit added questions, and it added no new source material.

**3. One user-facing note was factually wrong.** Chapter 3 Method 3's
`reviewNote` told the reader "the two unambiguous cases are shown when they
occur" — but the method is `needs_review`, and a non-verified method never
produces a verdict at all, so those cases are never shown. Reworded to say
what actually happens. No status or behaviour changed; the method stays
withheld, as the source requires.

**4. Consolidated material now cites where it actually came from.** Chapter
96's Method 2 implements the unnumbered "repeated later in the notebook"
fragment verbatim — its own quote says so — but its `source.chapterId`
pointed at chapter 96. It now cites the fragment, so consolidated material
stays traceable to its real origin. The question still belongs to chapter 96;
only that one method's reference moved. (It renders as an unnumbered Kanzul
Mikban reference, exactly as chapter 47's fragment methods already do.)

### What the audit deliberately did NOT change

- **The male/female-star classification is still unsourced** — 7 occurrences
  (chs. 41, 48 x2, 68, 127 x2, 141), all `gender_classification_unsourced`,
  none executable. Chapters 127 and 141 were each investigated in their own
  stage and neither defines it. The decisive evidence is the manuscript's own
  front matter, which lists "male or female" among a figure's paired
  qualities and then says outright that the transcription has "no verified
  source defining exactly which of the sixteen named figures carries which
  quality." A test now asserts that sentence is still in the source, because
  if it ever changed, this whole family of decisions would need re-auditing.
- **Day/night (1), stability (7), present/past/future (1)** — unchanged, for
  the same reason: the same front-matter sentence covers all of them.
- **The five constant figures** (Sirri Sa'ael/Damir, Nazir, Nutik, Itisal,
  Ifusal) — still undefined, no pattern invented.
- **No contextual/product input was added.** The chapter 68 querent-gender
  dependency remains exactly the open product decision Prompt 8 scoped it as.
- **Result kinds were audited and left alone.** The two strongest
  miscategorisation candidates both survive the stated test: chapter 43
  ("what is their character") is `outcome` because the source's own answers
  are "a good behavior" / "a bad behavior", and chapter 37 ("who will win")
  is `outcome` because the source frames it as "your team will win". Where a
  question *sounds* factual but its answer branches were omitted (chs. 6, 17),
  its framing is genuinely undeterminable from the surviving source — so it
  was documented, not reclassified on a guess.
- **Chapter 151 stays unregistered.** One final cross-source search for its
  "pair them" mechanism found the word only twice more in either manuscript:
  as "paired qualities" in front matter (an unrelated sense) and as the
  standard casting algorithm's pairing in the *other* book. Neither defines
  this chapter's operation, and all 16 of its branch trigger figures are
  omitted regardless — so even a resolved mechanism would leave it
  non-computable. No placeholder, no fabricated dream interpretations.
- **Core architecture untouched.** `casting.ts`, `chartModel.ts`,
  `ruleEngine.ts`, `types.ts` and `operations.ts` were all read and none
  needed changing — no new operation, no new review code, no new type.

### UI honesty, verified rather than assumed

The concern is that an unresolved reading might show generic wording when a
specific reason exists. Structurally it cannot, and now provably so:

- `InsufficientNotice` prefers `reviewNote`, then the verdict's own
  `interpretation`, before any generic fallback — and a test now asserts
  **every** non-verified method carries a non-empty `reviewNote`, which makes
  that generic fallback unreachable rather than merely unlikely.
- "The calculation ran but the source never says what it means" and "the
  calculation could not run" are genuinely different states on screen, not
  just in the data: chapter 64 M2 displays its real houses (H4 + H11 + H7 +
  H14) and steps while being excluded from the tally, whereas chapter 142
  deliberately exposes no houses at all because nothing about it is
  computable. A test locks both halves of that contrast in place.
- Live browser checks covered an early, middle and late verified chapter,
  descriptive, favourable, unfavourable, genuine conflict, gender-blocked,
  constant-figure-blocked, omitted-branch, missing-interpretation, both newly
  registered fragments, and chapter 151. No crash, no misleading verdict, no
  invented classification, and no unresolved result without its reason. The
  only console message anywhere was a missing favicon — cosmetic, pre-existing
  and unrelated to readings.

Chapter 48 is the clearest single demonstration that the app never fabricates
what the source withholds: it returns a real answer ("Female") from the one
method that needs no gender table, while both gender-dependent methods sit
beside it, computed as far as they can be and explicitly not counted.

## Totals (as of this stage — Prompt 13 final audit, chapters 1-151)

| | Count |
|---|---|
| Total source chapters (Kanzul Mikban) | 153 transcription entries — 142 NUMBERED (1-151, with the 109-117 gap) + 11 UNNUMBERED fragments/sub-chapters. **Corrected this stage**: earlier prompts described this as "numbered 1-153," which was never accurate — the manuscript's own highest chapter number is 151, confirmed by inspecting the full `KM_CHAPTERS` array structurally (see the "Prompt 12" section above) |
| Numbered chapters reviewed and entered into this engine | 136 (chapters 1-19, 20-32, 34-45, 47-55, 57-58, 60-94, 96-105, 107-108, 118-150) |
| Numbered chapters reviewed but deliberately NOT implemented | 6, each for a recorded reason enforced by test: **33** (separate casting mechanism), **46** (ritual, not a reading), **59** (open-ended by design), **95** (reference table, omitted), **106** (reference table — embedded in ch.105's file), **151** (not computable — undefined "pair them" mechanism + all 16 branch figures omitted) |
| Numbered chapters not yet reviewed | **0** — chapters 1-151 (the manuscript's full numbered range) are all reviewed. Chapters 109-117 do not exist in the source's own hand-numbering, and there is no chapter 152+ in this transcription |
| Unnumbered fragments | **11 total, all classified** — 6 registered (the 2 "pregnant" methods under ch.47; "Still in the Marriage" after ch.66; "Secrets Between Two Friends" after ch.85; the "repeated" sick-person fragment as ch.96's Method 2; "If She's Going to Stay in the Marriage" after ch.7 and "The Consequence of Friendship" after ch.52 — the last two newly registered by the Prompt 13 audit; "If It's Good to Stay in a House" between chs. 21-22 as its own question). Not registered: the 2 chapter-28 continuations (every figure identifier dropped), "Someone's Behavior" after ch.64 (confirmed duplicate of ch.43 M1), and the "repeated again" sick-person fragment after ch.104 (confirmed third occurrence of ch.96 M1) |
| Questions registered in `QUESTION_REGISTRY` | **140** |
| Total methods across all registered questions | **231** |
| **Verified** (computed automatically, count toward the result — includes descriptive verdicts) | **182** |
| **Needs review** (calculable, but the rule itself is genuinely ambiguous) | **19** |
| **Uncertain** (not computable — omitted source figures, an undefined constant figure, or a stated calculation whose verdict-mapping sentence is itself missing) | **30** |
| Non-verified methods carrying a machine-readable `reviewReasonCode` | **46 of 49** — the 3 exceptions are named and enforced by test (see "Prompt 13" above) |
| Automated tests covering this engine | **1939** (all passing — Prompt 13 added 166 source-reconciliation invariants and the 2 newly registered fragments' own coverage) |

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

### Stage 6 (chapters 81-100) subtotal — Prompt 9

| | Count |
|---|---|
| Numbered/unnumbered items reviewed | 22 (81-100, plus the "Secrets Between Two Friends" fragment after ch.85 and the "repeated" fragment after ch.96) |
| Questions registered | 20 |
| Methods (registered only) | 27 |
| Verified (includes 5 descriptive verdicts: chs. 82/84(x3)/98 — see per-chapter table) | 19 |
| Needs review (3 brand-new unsourced axes — day/night ch.83, stability ch.85 M2/86 M2, temporal ch.91 — plus the male/female-star search continued into 81-100 with no new occurrence found) | 4 |
| Uncertain (method status — 2 figures-omitted chapters (94, 97), 1 interpretation_not_stated (ch.90 M1), 1 truncated mid-sentence (ch.82 M2)) | 4 |
| Not registered at all (a reference table, entirely omitted, never phrased as a chart-verdict question) | ch.95 (0 computable methods) |

### Stage 7 (chapters 101-120) subtotal — Prompt 10

| | Count |
|---|---|
| Numbered/unnumbered items reviewed | 22 (101-108, 118-120, plus the "repeated again" fragment after ch.104 — chapters 109-117 do not exist in the source's own numbering) |
| Questions registered | 10 |
| Methods (registered only) | 12 |
| Verified (includes 5 descriptive verdicts: chs. 101/103(partially — see method table)/104/105/120(x2) — see per-chapter table) | 7 |
| Needs review | 0 |
| Uncertain (method status — 1 figures-omitted chapter (102), 4 constant-figure-undefined chapters (107/108/118/119, a brand-new gap category — Nazir/Nutik/Itisal/Ifusal)) | 5 |
| Not registered at all (a full reference table, not a chart-verdict question; a confirmed 3rd-occurrence duplicate) | ch.106 (0 methods — embedded in bodyPartInPain.ts instead); the "repeated again" fragment after ch.104 (1 method — confirmed duplicate of ch.96 M1) |

### Stage 8 (chapters 121-140) subtotal — Prompt 11

| | Count |
|---|---|
| Numbered items reviewed | 20 (121-140 — no unnumbered fragments this stage) |
| Questions registered | 20 |
| Methods (registered only) | 35 |
| Verified (16 of the 25 are descriptive-kind: chs. 124/126/128/129/130(x2)/131(x3)/132/133/134/135/136/137(x2); the other 9 are outcome-kind: chs. 121/122(x2)/123/125/138(x2)/139/140 — see per-chapter table) | 25 |
| Needs review (5 stability-split sub-methods: chs. 122(x2)/129/130/132, plus 2 gender-blocked methods: ch.127 M1/M2) | 7 |
| Uncertain (method status — 3 figures-omitted methods: ch.124 M1, ch.132 M1/M2) | 3 |
| Not registered at all | none this stage |

### Stage 9 (chapters 141-151) subtotal — Prompt 12

| | Count |
|---|---|
| Numbered items reviewed | 11 (141-151 — the manuscript's own final chapter; no unnumbered fragments this stage) |
| Questions registered | 10 |
| Methods (registered only) | 11 |
| Verified (2 of the 9 are descriptive-kind: ch.149; the other 7 are outcome-kind: chs. 143(x2)/144/145/146/147/148/150 — see per-chapter table) | 9 |
| Needs review (1 gender-blocked method: ch.141 M1) | 1 |
| Uncertain (method status — 1 dual-blocker chapter: ch.142) | 1 |
| Not registered at all (no verifiable calculation or branch meaning recoverable) | ch.151 (0 methods — ambiguous "pair them" calculation plus all 16 branch triggers omitted) |

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
| **Subtotal (1-80)** | | **143** | **119** | **7** | **17** |
| 81 | `if-she-will-put-to-bed-peacefully-or` | 1 | 1 | 0 | 0 |
| 82 | `the-time-she-will-put-to-bed` (descriptive) | 2 | 1 | 0 | 1 |
| 83 | `if-it-s-day-or-night-that-she` (descriptive) | 1 | 0 | 1 | 0 |
| 84 | `if-your-enemy-is-from-your-father-s` (descriptive) | 3 | 3 | 0 | 0 |
| 85 | `how-the-future-of-two-people-s-friendship` | 2 | 1 | 1 | 0 |
| 85→ | `secrets-between-two-friends-who-follow-each-other` (unnumbered fragment, descriptive) | 1 | 1 | 0 | 0 |
| 86 | `if-it-s-business-or-handwork-that-will` (descriptive) | 2 | 1 | 1 | 0 |
| 87 | `when-your-suffering-and-pain-or-sadness-will` | 1 | 1 | 0 | 0 |
| 88 | `if-you-will-get-a-position-rank-or` | 1 | 1 | 0 | 0 |
| 89 | `if-your-success-or-wealth-will-remain-forever` | 1 | 1 | 0 | 0 |
| 90 | `if-someone-s-misery-will-be-taken-away` | 2 | 1 | 0 | 1 |
| 91 | `if-something-is-present-past-or-future` (descriptive) | 1 | 0 | 1 | 0 |
| 92 | `the-ending-part-of-anything-you-want-to` | 1 | 1 | 0 | 0 |
| 93 | `if-someone-has-long-life-or-not` | 1 | 1 | 0 | 0 |
| 94 | `the-lifespan-and-when-someone-will-die` (descriptive) | 1 | 0 | 0 | 1 |
| 95 | *(reference table, entirely omitted — not a chart-verdict question)* | — | not registered | — | — |
| 96 | `if-a-sick-person-has-long-life-or` (incl. 1 method from the "repeated" fragment) | 2 | 2 | 0 | 0 |
| 97 | `where-one-will-die-place-of-death` (descriptive) | 1 | 0 | 0 | 1 |
| 98 | `the-causes-of-someone-s-death` (descriptive) | 1 | 1 | 0 | 0 |
| 99 | `if-someone-or-something-good-will-come-to` | 1 | 1 | 0 | 0 |
| 100 | `if-today-is-a-good-day-or-not` | 1 | 1 | 0 | 0 |
| **Subtotal (81-100)** | | **27** | **19** | **4** | **4** |
| **Subtotal (1-100)** | | **170** | **138** | **11** | **21** |
| 101 | `as-a-stranger-if-the-food-you-want` (descriptive) | 1 | 1 | 0 | 0 |
| 102 | `if-this-money-the-work-or-the-lady` (descriptive) | 1 | 0 | 0 | 1 |
| 103 | `if-the-querent-is-sick-or-not` | 2 | 2 | 0 | 0 |
| 104 | `if-the-sickness-is-from-human-jinn-or` (descriptive) | 1 | 1 | 0 | 0 |
| 104→ | "repeated again" sick-person-long-life (unnumbered fragment) | — | not registered (confirmed 3rd-occurrence duplicate of ch.96 M1) | — | — |
| 105 | `which-part-of-the-body-is-paining-the` (descriptive) | 1 | 1 | 0 | 0 |
| 106 | *(reference table, embedded in `bodyPartInPain.ts` — not a chart-verdict question)* | — | not registered | — | — |
| 107 | `if-you-will-see-what-you-are-searching` (Nazir, descriptive) | 1 | 0 | 0 | 1 |
| 108 | `if-you-will-get-to-talk-to-someone` (Nutik, descriptive) | 1 | 0 | 0 | 1 |
| 109-117 | *(do not exist in the source's own hand-numbering — confirmed intentional by the manuscript's own front matter)* | — | — | — | — |
| 118 | `if-you-will-get-what-you-are-searching` (Itisal, descriptive) | 1 | 0 | 0 | 1 |
| 119 | `if-you-won-t-get-what-you-are` (Ifusal, descriptive) | 1 | 0 | 0 | 1 |
| 120 | `if-you-have-enemies-and-how-many` (descriptive) | 2 | 2 | 0 | 0 |
| **Subtotal (101-120)** | | **12** | **7** | **0** | **5** |
| **Subtotal (1-120)** | | **182** | **145** | **11** | **26** |
| 121 | `if-you-will-get-knowledge-or-not-in` | 1 | 1 | 0 | 0 |
| 122 | `if-you-will-get-what-you-want-or` | 4 | 2 | 2 | 0 |
| 123 | `if-something-will-burn` | 1 | 1 | 0 | 0 |
| 124 | `if-something-has-really-been-stolen-or-not` (descriptive) | 2 | 1 | 0 | 1 |
| 125 | `if-they-will-return-a-stolen-thing-back` | 1 | 1 | 0 | 0 |
| 126 | `the-number-of-thieves` (descriptive) | 1 | 1 | 0 | 0 |
| 127 | `the-description-of-the-thief` (descriptive; gender-classification re-investigated, not resolved) | 2 | 0 | 2 | 0 |
| 128 | `if-the-thief-or-the-stolen-thing-is` (descriptive) | 1 | 1 | 0 | 0 |
| 129 | `if-it-is-the-accused-person-that-stole` (descriptive) | 2 | 1 | 1 | 0 |
| 130 | `the-thief-from-among-the-accused-people` (descriptive) | 3 | 2 | 1 | 0 |
| 131 | `if-something-was-buried-or-has-been-buried` (descriptive) | 3 | 3 | 0 | 0 |
| 132 | `if-there-s-a-hidden-treasure-gold-money` (descriptive) | 4 | 1 | 1 | 2 |
| 133 | `how-deep-something-is-buried` (descriptive) | 1 | 1 | 0 | 0 |
| 134 | `where-a-traveller-has-travelled-to` (descriptive) | 1 | 1 | 0 | 0 |
| 135 | `if-the-traveller-has-travelled-by-air-water` (descriptive) | 1 | 1 | 0 | 0 |
| 136 | `if-the-traveller-has-reached-where-he-she` (descriptive) | 1 | 1 | 0 | 0 |
| 137 | `if-someone-is-truthful-or-not` (descriptive) | 2 | 2 | 0 | 0 |
| 138 | `if-a-prisoner-will-come-out-of-prison` | 2 | 2 | 0 | 0 |
| 139 | `if-the-prisoner-will-be-removed-peacefully` | 1 | 1 | 0 | 0 |
| 140 | `how-long-the-prisoner-will-stay-in-prison` | 1 | 1 | 0 | 0 |
| **Subtotal (121-140)** | | **35** | **25** | **7** | **3** |
| **Subtotal (1-140)** | | **217** | **170** | **18** | **29** |
| 141 | `if-the-prisoner-is-male-or-female` (descriptive; gender-classification re-investigated, not resolved) | 1 | 0 | 1 | 0 |
| 142 | `where-kidnappers-are-keeping-a-person-hostage` (descriptive; dual blocker — undefined mechanism + omitted figures) | 1 | 0 | 0 | 1 |
| 143 | `the-consequence-of-a-prisoner` | 2 | 2 | 0 | 0 |
| 144 | `if-you-will-get-your-debts-deposit-or` | 1 | 1 | 0 | 0 |
| 145 | `if-someone-will-get-a-particular-position-or` | 1 | 1 | 0 | 0 |
| 146 | `if-you-will-own-a-house-in-your` | 1 | 1 | 0 | 0 |
| 147 | `if-this-apartment-you-are-going-to-is` | 1 | 1 | 0 | 0 |
| 148 | `if-you-will-receive-the-expected-message` | 1 | 1 | 0 | 0 |
| 149 | `which-day-a-pregnant-woman-will-put-to` (descriptive; only days 1-3 legible) | 1 | 1 | 0 | 0 |
| 150 | `if-you-will-get-back-to-work-after` | 1 | 1 | 0 | 0 |
| 151 | *(not computable — ambiguous "pair them" calculation, all 16 branch triggers omitted; dream-omen/ritual-remedy material)* | — | not registered | — | — |
| **Subtotal (141-151)** | | **11** | **9** | **1** | **1** |
| — | `if-she-s-going-to-stay-in-the` (unnumbered, after ch.7 — registered by the Prompt 13 audit) | 2 | 2 | 0 | 0 |
| — | `the-consequence-of-friendship-between-two-people` (unnumbered, after ch.52 — registered by the Prompt 13 audit) | 1 | 1 | 0 | 0 |
| **Grand total (all 151 chapters + every registered fragment)** | | **231** | **182** | **19** | **30** |

### Unresolved dependencies — the complete, final list

Every one of these needs the original, unredacted manuscript (or an explicit
product decision); none can be resolved by further reading of this
transcription. Counts are asserted by `__tests__/source-reconciliation.test.ts`.

| Dependency | Methods | Code | Status |
|---|---|---|---|
| Male/female star classification | 7 | `gender_classification_unsourced` | Unresolved — chs. 127 and 141 each investigated and neither defines it; the source's own front matter confirms no table survives |
| Stable/unstable classification | 7 | `stability_classification_unsourced` | Unresolved — same front-matter admission |
| Omitted trigger-figure lists | 20 | `figures_omitted_by_transcription` | Unresolved — needs the original scan's hand-drawn symbols |
| Constant figures (Sirri Sa'ael, Nazir, Nutik, Itisal, Ifusal) | 5 | `constant_figure_undefined` | Unresolved — named in front matter, never defined anywhere |
| Interpretation never stated | 2 | `interpretation_not_stated` | Unresolved — calculation complete, meaning absent (chs. 64, 90) |
| Whole-figure opened/closed state | 2 | `whole_figure_state_undefined` | Unresolved — this project defines opened/closed per line only (chs. 1, 21) |
| Day/night classification | 1 | `day_night_classification_unsourced` | Unresolved (ch.83) |
| Present/past/future classification | 1 | `temporal_classification_unsourced` | Unresolved (ch.91) |
| Chart spatial layout (right/left) | 1 | `spatial_layout_unsupported` | Unresolved — architectural; ChartModel carries no layout (ch.37) |
| Partial-interpretation ambiguity | 1 | *(uncoded by design)* | Unresolved (ch.3 M3) |
| Source truncated mid-sentence | 1 | *(uncoded by design)* | Unresolved (ch.82 M2) |
| Dual blocker: undefined mapping + omitted figures | 1 | *(uncoded by design)* | Unresolved (ch.142) |
| Querent-gender contextual input | 1 | `gender_classification_unsourced` (ch.68, compounded) | Open **product** decision, not a source gap — see "Prompt 8" |

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

## Architectural gaps (Stage 6 — Prompt 9, chapters 81-100)

Reviewed under the same A-E taxonomy as Stages 3-5 above. Like Stage 5, no
chapter this stage was blocked at the whole-chapter level except ch.95
(never a computable shape at all) — every other gap found was scoped to a
single method within an otherwise-computable chapter.

| Method | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 83 Method 1 | Hinges on classifying the resulting figure as a "day star" or "night star" | No — `FigureQualities.dayNight` has been `needs_review`, project-wide, since Prompt 1 | No — a new result kind doesn't create the missing classification | No — a primitive can't invent a table that doesn't exist | **Yes** — need a later chapter (or either manuscript) to actually define which figures are day/night | No |
| 85 Method 2, "secrets" fragment's else-branch, 86 Method 2 | Hinges on classifying a figure as "stable" or "unstable" | No — `FigureQualities.stability` has been `needs_review`, project-wide, since Prompt 1 | No | No | **Yes** — same shape as day/night: need a source table | No |
| 91 Method 1 | Hinges on classifying a figure as "present," "past," or "future" | No — this project has never declared a FigureQualities field for this axis at all, let alone sourced one | No — a new result kind doesn't create the missing classification | No — a primitive can't invent a table, and there's no field to attach one to yet even if it existed | **Yes** — need any source (either manuscript) to define this classification; a full re-grep found the phrase used exactly once, nowhere defined | No |
| 82 Method 2 | The source's own text is cut off mid-sentence, continuing onto a page never transcribed | No — nothing to compute past the recast step; the very next check is unknown | No | No — a primitive can't invent what the missing sentence says | **Yes** — need the original manuscript's next page | No |
| 90 Method 1 | The calculation is fully defined, but the source's own worked examples never state what any result number means for this question | No — `ChartModel` computes the figure correctly | No — this is the exact shape `interpretation_not_stated` already exists for (Prompt 7) | No — a primitive can't invent a verdict mapping that isn't in the source | **Yes** — need the source's own missing sentence(s) | No |
| 94, 97 | Every branch's trigger figure(s) omitted from the transcription (the branch *meanings* survive in full) | No — `CHECK_HOUSE(chart, 8)` computes correctly | No | No | **Yes** — need the original manuscript scan | No |
| 95 (not registered) | A reference table (which figures belong to which life stage), not phrased as a question at all, and entirely omitted besides | No — no houses, no calculation, nothing a `ChartModel` operation could compute even in principle | No — there is no answer shape to represent | No | **Yes** — need the original manuscript scan, though even then this would be a lookup table like `content/classicalAttributes.ts`, not a `QuestionDefinition` | No |

Three of these (day/night, stability, temporal) are the SAME shape of gap
as the male/female-star classification (Prompt 6) — an axis the source
tradition clearly uses but this project has no table for — just three
different axes, each hit here for the first time. None was invented;
each got its own `ReviewReasonCode`, matching `gender_classification_
unsourced`'s own precedent (one code per distinct axis, reused across
every method that axis blocks).

## Architectural gaps (Stage 7 — Prompt 10, chapters 101-120)

Reviewed under the same A-E taxonomy as Stages 3-6 above. Like Stage 6, no
chapter this stage was blocked at the whole-chapter level except ch.106
(never a computable shape at all, being a reference table) — every other
gap found was scoped to a single method within an otherwise-computable
chapter.

| Method | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 107 Method 1 (Nazir), 108 Method 1 (Nutik), 118 Method 1 (Itisal), 119 Method 1 (Ifusal) | Each opens by adding a named "constant figure" — never itself defined — to H1's own figure | No — `ChartModel` has no notion of these constants at all, and there's no verified pattern to add | No — a new result kind doesn't create the missing value | No — a primitive can't invent a dot-pattern that isn't in the source | **Yes** — need a later chapter, or either manuscript's own appendix, to actually state each constant's pattern (same shape as chapter 2's Sirri Sa'ael gap) | No |
| 102 Method 1 | The trigger-figure list for the recast chart's first 4 houses was never transcribed | No — the recast itself computes correctly | No | No — a primitive can't invent a list that isn't in the source | **Yes** — need the original manuscript's figure list | No |

The four "constant figure" gaps are new evidence for exactly the kind of
pattern chapter 2's Sirri Sa'ael gap already showed: the book names
several such recurring techniques together in its own front matter
(Sirri Sa'ael/Damir, Itisal, Ifusal, Nazir — `KM_EDITION_NOTE`), and this
stage confirms none of the other three fares any better than Sirri
Sa'ael's own, already-documented gap. A future stage reaching any further
"constant figure" reference should expect the identical wall.

## Architectural gaps (Stage 8 — Prompt 11, chapters 121-140)

Reviewed under the same A-E taxonomy as Stages 3-7 above. No chapter this
stage was blocked at the whole-chapter level — every gap found was scoped
to a single method or sub-method within an otherwise-computable chapter.

| Method | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 122 M1/M2 (stability), 129 M1 (stability), 130 M1 (stability), 132 M3 (stability) | Each is the stability-reading half of a "downward or stable star" idiom | No — `ChartModel` has a `stability` field, it's simply `needs_review` project-wide | No | No | No — this project has never sourced a stability table anywhere | **Yes** — same `stability_classification_unsourced` gap first hit at chapter 85, recurring here at its highest rate yet |
| 127 M1 (H1), 127 M2 (H7) | Classifies a figure as a "male star"/"female star" without ever defining which figures are which | No | No | No | No | **Yes** — same `gender_classification_unsourced` gap as chapters 41/48/68; chapter 127 was the chapter specifically flagged for re-investigation and confirmed not to resolve it |
| 124 M1, 132 M1/M2 | Each names a trigger-figure list never transcribed | No — the rest of each calculation computes correctly | No | No — a primitive can't invent a list that isn't in the source | **Yes** — need the original manuscript's figure list | No |

No new architectural category (A-E) was needed this stage — every gap
found fits a category this project has already named and resolved to
"needs a source, not a product change" in a prior stage.

## Architectural gaps (Stage 9 — Prompt 12, chapters 141-151)

Reviewed under the same A-E taxonomy as Stages 3-8 above.

| Chapter/Method | Blocker | A | B | C | D | E |
|---|---|---|---|---|---|---|
| 141 M1 | Classifies the H1+H7 sum as a "male star"/"female star" without ever defining which figures are which | No | No | No | **Yes** — same `gender_classification_unsourced` gap as chapters 41/48/68/127; the source's own front matter now cited directly as confirming evidence | No |
| 142 | Names a calculation ("found in its own house") presuming an undefined figure-to-house identity table, AND every branch's trigger figure is omitted | No | No | No | **Yes** — needs BOTH the identity table and the branch figure list, neither of which survives | No |
| 151 | Names an unverified operation ("pair" the 4 Mothers) with no established meaning in this project, AND every one of 16 branches has its trigger figure omitted | No | No | Possibly, once "pair them" is understood from the original manuscript (same shape as chapter 33's own unresolved mechanic) | **Yes** — needs the original manuscript's own description of "pairing" plus all 16 branch figures | No |

Chapter 151's own blocker is structurally closest to chapter 33's
"separate dot-line mechanic" gap (Prompt 4) — a named operation this
project has never had cause to define — rather than to a simple omitted-
figure gap; documented here rather than forcing it into either the
"figures omitted" or "constant figure undefined" categories, neither of
which quite fits.

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
- **Chapter 83, Method 1** (day or night birth) — classifies the result as
  a "day star" or "night star"; the `dayNight` axis has been `needs_review`
  project-wide since Prompt 1, and this is the first method to actually
  need it. `reviewReasonCode: 'day_night_classification_unsourced'`.
- **Chapter 85, Method 2 / Chapter 86, Method 2** (friendship future /
  business-or-handwork, stability-based readings) — classify the result as
  "stable" or "unstable"; same shape of gap, `reviewReasonCode:
  'stability_classification_unsourced'`.
- **Chapter 91, Method 1** (present, past, or future) — classifies the
  result as a "present," "past," or "future" star; a classification this
  project has never even declared a `FigureQualities` field for, confirmed
  by a full re-grep to occur exactly once in either manuscript.
  `reviewReasonCode: 'temporal_classification_unsourced'`.
- **Chapter 122, Methods 1-2 (stability sub-methods) / Chapter 129, Method 1
  (stability) / Chapter 130, Method 1 (stability) / Chapter 132, Method 3
  (stability)** — five more occurrences of the "downward or stable star"
  idiom's stability leg, same `stability_classification_unsourced` gap as
  chapters 85/86, hit at a higher rate this stage than in any previous one.
- **Chapter 127, Methods 1-2** (description of the thief) — classifies H1
  (or, alternately, H7) directly as a "male star" or "female star"; this is
  the chapter the Prompt 8/9 audit specifically flagged for re-investigation,
  and it confirms the same unsourced gap as chapters 41/48/68 — using the
  terminology is not the same as defining it.
- **Chapter 141, Method 1** (is the prisoner male or female) — classifies
  the H1+H7 sum as a "male star" or "female star"; this is the chapter the
  Prompt 8 audit specifically flagged for re-investigation. Confirms the
  same unsourced gap, now further corroborated by the manuscript's own
  front matter explicitly admitting no gender table survives anywhere in
  the transcription.

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
- Chapter 82, Method 2 — the source is cut off mid-sentence ("...and...
  [text continues onto the next page, not yet transcribed]") immediately
  after naming which 4 houses to recast — the same shape of gap as the
  "continued from Chapter Twenty-Eight" fragment (Prompt 4), just within a
  registered chapter this time.
- Chapter 90, Method 1 — reuses `interpretation_not_stated` (see chapter
  64 Method 2 above): the calculation is fully defined, but the source's
  own worked examples never say what any result number means.
- Chapter 94 — "check h8" is well-defined, but every one of its ~15
  branches has its trigger figure omitted while the meaning survives in
  full; same Group A shape as chapters 2/4/5/6/7/9/13/17/19/21/26/27.
- Chapter 97 — identical shape to chapter 94, ~13 branches, figures
  omitted throughout.
- Chapter 102, Method 1 — the trigger-figure list for the recast chart's
  first 4 houses was never transcribed; the recast operation itself is
  shown, the list is not.
- Chapters 107 (Nazir), 108 (Nutik), 118 (Itisal), 119 (Ifusal) — each
  opens by adding a named "constant figure" to H1's own figure, but none
  of the four is ever defined with an actual dot-pattern anywhere in
  either manuscript — the same shape of gap as chapter 2's Sirri Sa'ael
  reference, now with its own `reviewReasonCode: 'constant_figure_
  undefined'` (a new code, first added this stage) so it's distinguishable
  from an omitted branch-trigger list.
- Chapter 124, Method 1 (is something really stolen) — names a trigger-
  figure list never transcribed. Method 2 (a different, independently
  computable calculation on the same question) is verified.
- Chapter 132, Methods 1-2 (hidden treasure) — each names a trigger-figure
  list never transcribed; Method 2's own calculation basis is even less
  specified than Method 1's. Method 3's direction sub-method is verified.
- Chapter 142 (kidnapper location) — a dual blocker: the calculation itself
  ("found in its own house") presumes an undefined figure-to-house identity
  table, and every one of its ~11 branches also has its trigger figure
  omitted. Neither issue alone would be new; together, there is no
  verifiable calculation to compute at all, not even a partial one.
- Chapter 149, Method 1, results 4-7 (day of week) — the calculation itself
  (dot count of 5 named houses, cast out by 7s) is fully verified and
  computes results 1-7; only the day-name mapping for results 4-7 is
  withheld, since the source's own bracketed transcription note admits
  those specific days are not legible in the scanned original. Results 1-3
  (Sunday/Monday/Tuesday) are implemented normally.

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
| Ch.83 M1, Ch.85 M2, "secrets" fragment else-branch, Ch.86 M2 (day/night, stability) | **New this stage (Prompt 9)** — two more of the project's known-since-Prompt-1 unsourced axes, hit for the first time. `reviewReasonCode: 'day_night_classification_unsourced'` / `'stability_classification_unsourced'`. Needs a source table for either axis, in a later chapter or an explicit product decision |
| Ch.91 M1 (present/past/future) | **New this stage (Prompt 9)** — a classification this project has never even declared a field for; confirmed via a full re-grep to occur exactly once in either manuscript, nowhere defined. `reviewReasonCode: 'temporal_classification_unsourced'` |
| Ch.82 M2 | **New this stage (Prompt 9)** — source cut off mid-sentence before naming what to check after recasting h1/h4/h5/h7; needs the original manuscript's next page |
| Ch.90 M1 | **New this stage (Prompt 9)** — reuses `interpretation_not_stated`; calculation complete (dots of bad-fortune houses, cast out by 12s), but the source's own worked examples never state what any result means |
| Ch.94, Ch.97 | **New this stage (Prompt 9)** — same "figures omitted, meanings survive" shape as the chapters 2-27 Group A entries above; need the original manuscript scan |
| Ch.95 (reference table) | **New this stage (Prompt 9)** — a life-stage lookup table, entirely omitted from the transcription, and never phrased as a chart-verdict question in the first place (unlike every other gap in this queue, restoring the original text would still leave this as a `content/`-style reference table, not a `QuestionDefinition`) |
| Ch.107 (Nazir), Ch.108 (Nutik), Ch.118 (Itisal), Ch.119 (Ifusal) | **New this stage (Prompt 10)** — each opens by adding a named "constant figure" to H1's own figure, but none of the four is ever defined with a dot-pattern anywhere in either manuscript. `reviewReasonCode: 'constant_figure_undefined'` (a new code). Needs a later chapter, or either manuscript's own appendix, to actually state each constant's pattern. Chapter 2's own Sirri Sa'ael reference is the same shape of gap, confirmed by this stage, though left unedited (out of this stage's own scope) |
| Ch.102 M1 | **New this stage (Prompt 10)** — the recast chart's own first-4-houses trigger-figure list was never transcribed; the recast itself is shown, the list is not |
| Ch.103 M2 | **New this stage (Prompt 10)** — states two independent line-conditions on the same house (fire closed / air closed) without saying which wins if both are true at once; left `uncertain` for that specific combination rather than picking a silent priority order |
| Ch.109-117 | **Confirmed non-existent (Prompt 10)** — the manuscript's own front matter states this numbering gap is intentional on the author's part, not a transcription loss. Nothing to resolve; recorded here so a future stage doesn't mistake it for an omission |
| `RECAST_FROM_HOUSES` "is deterministic" test | **RESOLVED (Prompt 10)** — pre-existing test flakiness (comparing two calls' full chart JSON, including each call's own fresh `createdAt` wall-clock timestamp) fixed to compare `.houses` only. Not a chapter 101-120 regression; `RECAST_FROM_HOUSES`/`buildChart` themselves were not touched |
| `bodyPartInPain.ts` (ch.105) `sourceHouses` display | **RESOLVED (Prompt 10)** — `ADD_FIGURES`'s own union-without-dedup of its inputs' `sourceHouses` produced a 4x-repeated house list when all four inputs legitimately share the same 4 houses (unlike every earlier "quartet" chapter, whose 4 inputs are always disjoint house sets). Fixed locally, inside this one file only, by overriding the result figure's `sourceHouses` to the true, deduplicated set; `ADD_FIGURES` itself is unchanged and remains correct for its other callers |
| Ch.127, Methods 1-2 | **New this stage (Prompt 11)** — the chapter specifically flagged by the Prompt 8/9 audit for re-investigation. Confirmed: uses "male star"/"female star" terminology without ever defining a mapping — same gap as chapters 41/48/68, not resolved. Chapter 141 (the other flagged occurrence) is out of this stage's scope, for a future stage |
| Ch.122 M1/M2, Ch.129 M1, Ch.130 M1, Ch.132 M3 (stability sub-methods) | **New this stage (Prompt 11)** — five more occurrences of the `stability_classification_unsourced` gap first hit at chapter 85, this stage's single most common blocker. Needs a source table for the `stability` axis, or an explicit product decision |
| Ch.124 M1, Ch.132 M1/M2 | **New this stage (Prompt 11)** — three more "figures omitted" gaps, same shape as chapters 4-27/94/97/102 above; need the original manuscript's figure lists |
| Ch.124 M2 / Ch.137 M2 shared calculation | **Confirmed independent duplication, not a gap (Prompt 11)** — the identical H1+H5 "found in chart" calculation answers two genuinely distinct questions (theft confirmation vs. truthfulness); both registered separately per instruction section 5, and both independently compute the same result on the fixture chart (cross-checked in `questions-stage8.test.ts`) |
| Ch.136 M1 overlap case | **New this stage (Prompt 11)** — states 3 specific conditions (reached home safely / on the way / reached town not home) with no priority when more than one triggers; left `uncertain` for that combination, matching the chapter 103 M2 precedent. Needs the source's own stated priority, if one exists elsewhere in the manuscript |
| Ch.141 M1 | **New this stage (Prompt 12), and the chapter specifically flagged by the Prompt 8 audit** — confirmed: uses "male star" terminology without ever defining a mapping, same gap as chapters 41/48/68/127. Further corroborated by the manuscript's own front matter (`KM_EDITION_NOTE`), which explicitly states no verified gender source exists anywhere in the transcription — the strongest evidence yet that this gap cannot be resolved from this source material at all |
| Chapter total corrected (153 -> 142 numbered + 11 unnumbered) | **New finding this stage (Prompt 12)** — earlier prompts described the source as "numbered 1-153"; inspecting the full `KM_CHAPTERS` array structurally shows its highest chapter number is 151, and the total of 153 entries is 142 numbered + 11 unnumbered fragments, not a numbering ceiling. This transcription's own header comment ("~150 question-specific methods") corroborates 151 as the real upper bound. Nothing to resolve — a documentation correction, not a source gap |
| Ch.142 | **New this stage (Prompt 12)** — a dual blocker: an undefined figure-to-house "own house" identity table, plus every branch's trigger figure omitted. Needs the original manuscript's own description of the identity mapping, and its branch figure list |
| Ch.149 M1, results 4-7 | **New this stage (Prompt 12)** — the calculation (dot count of 5 houses, cast out by 7s) is fully verified; only the day-4-7 mapping is withheld, since the source's own bracketed note admits those days are illegible in the scanned original. Needs the original manuscript's next page/edge |
| Ch.151 | **New this stage (Prompt 12)** — not registered at all: its own calculation ("pair" the 4 Mothers) has no established meaning in this project (closest precedent: chapter 33's own unresolved "cast out by 4s" mechanic), and all 16 branch trigger figures are omitted. Needs the original manuscript's own description of "pairing" plus its branch figure list |

## Not yet implemented

Nothing remains unread. Chapters 1-151 — the manuscript's own complete
numbered range (chapters 109-117 do not exist in the source's own
hand-numbering, confirmed intentional by the manuscript's own front
matter) — have now all been reviewed for this structured engine, across
Prompts 1-12. `lib/raml/methodVerdicts.ts`'s general parser remains
available as a lighter-weight fallback (no audit trail, no cross-method
consensus) for any intention this engine doesn't cover — see its own file
header for current numbers. What remains unresolved from here on is not
unread material but the genuinely unsourced gaps documented throughout
this file: the male/female-star classification (7 occurrences), the
stability axis (7 occurrences across chapters 85/86/122/129/130/132), the
day/night and present/past/future axes (1 occurrence each), the four
undefined constant figures (Nazir/Nutik/Itisal/Ifusal), and the handful of
omitted-figure/omitted-mechanism chapters (142, 151, and the others listed
above) — each would need the original, unredacted manuscript pages to
resolve, not further reading of this transcription.

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

**Prompt 9, honestly:** `casting.ts`, `chartModel.ts`, and `ruleEngine.ts`
remain completely untouched — confirmed by re-reading all three in full,
and no chapter 81-100 finding ever came close to needing a change to
them. No chapter 1-80 calculation was corrected this stage either.
`types.ts` gained exactly three additive changes: three new
`ReviewReasonCode` union members (`day_night_classification_unsourced`,
`stability_classification_unsourced`, `temporal_classification_
unsourced`), no existing value's meaning changed. `operations.ts` gained
**zero** new primitives — every chapter 81-100 method composed entirely
from the 20+ primitives Prompts 1-7 already built; the two candidate
inline calculations (ch.90 M1's bad-fortune dot sum, ch.98's house-repeat
cause lookup) were each judged, and documented, as not meeting this
project's own three-or-more-occurrence extraction bar. `reading.ts`,
`interpretation.ts`, and every UI component were read but not modified —
every result shape chapters 81-100 produced (favourable/unfavourable/
mixed/conflict, descriptive/agree, insufficient-data-with-full-
explanation) was confirmed, via live rendering, to already be rendered
honestly by the existing components. No new source rule was invented
anywhere: chapter 82 Method 2, chapter 90 Method 1, chapters 94/97, and
chapters 83/85/86/91's newly-hit unsourced axes were all left without a
verdict rather than guessed one; chapter 84's good/middle-good branches
and chapter 98's zero-match/multiple-match cases were left `uncertain`
rather than assumed. The male/female-star search was continued into
chapters 81-100 as instructed and found nothing new — the gap stands
exactly as Prompt 8 left it. No chapter 101+ work was started, and no
chapter 1-100 source rule, figure classification, or user input was
invented anywhere in this stage.

**Prompt 10, honestly:** `casting.ts` and `chartModel.ts` remain
completely untouched. `ruleEngine.ts` was not touched either. No chapter
1-100 calculation was corrected this stage. `types.ts` gained exactly one
additive change: one new `ReviewReasonCode` union member
(`constant_figure_undefined`), no existing value's meaning changed.
`operations.ts` gained **zero** new primitives — every chapter 101-120
method composed entirely from the 20+ primitives Prompts 1-9 already
built. Two small, well-scoped fixes were made outside the new question
files: a pre-existing, unrelated test-flakiness bug in
`operations.test.ts` (comparing volatile timestamps that were never
meant to be compared), and a `sourceHouses` display artifact confined to
`bodyPartInPain.ts` alone (a genuinely new house-reuse pattern this
specific chapter introduces, not a bug in the shared `ADD_FIGURES`
primitive, which needed no change). `reading.ts`, `interpretation.ts`,
and every UI component were read but not modified — every result shape
chapters 101-120 produced (favourable/unfavourable/conflict/mixed,
descriptive/agree, insufficient-data-with-full-explanation) was confirmed,
via live rendering, to already be rendered honestly by the existing
components. No new source rule was invented anywhere: chapter 102's
omitted trigger list, chapters 107/108/118/119's four undefined constant
figures, and chapter 103 Method 2's fire/air overlap were all left
without a verdict rather than guessed one. The male/female-star search
was continued into chapters 101-120 as instructed and found nothing new —
the gap stands exactly as Prompt 9 left it. Chapters 109-117 were
confirmed, not assumed, to not exist in the source's own numbering. No
chapter 121+ work was started, and no chapter 1-120 source rule, figure
classification, constant-figure value, or user input was invented
anywhere in this stage.

**Prompt 11, honestly:** `casting.ts`, `chartModel.ts`, and `ruleEngine.ts`
remain completely untouched. No chapter 1-120 calculation was corrected
this stage. `types.ts` gained **zero** changes — every chapter 121-140
gap fit an existing `ReviewReasonCode` (`stability_classification_unsourced`,
`gender_classification_unsourced`, or plain `uncertain` with a `reviewNote`
for the omitted-figure-list methods), so no new code was needed.
`operations.ts` gained **zero** new primitives — every chapter 121-140
method composed entirely from the primitives Prompts 1-9 already built,
including `FIND_FIGURE_QUARTER` (chapter 134) and `COUNT_OPENED_LINES`
(chapter 130 Method 2) reused exactly as-is. Chapter 127 — the chapter
specifically named by this prompt's own instructions for the gender-
classification investigation — was read in full, together with its
surrounding text and the manuscript's front matter, and confirmed NOT to
supply a male/female-star mapping; `gender_classification_unsourced` was
retained rather than assumed resolved, and chapters 41/48/68 were checked
and left unchanged, since nothing about them was affected. No stability
table was invented either, despite this stage hitting that gap five
times — the highest rate of any stage so far; each occurrence was split
into a direction sub-method (verified, and in three cases fully
resolvable via direction alone once the OR-logic was worked through
literally) and a stability sub-method (left blocked). `reading.ts`,
`interpretation.ts`, and every UI component were read but not modified —
every result shape chapters 121-140 produced (favourable/unfavourable,
descriptive/agree, insufficient-data-with-full-explanation) was confirmed,
via live rendering against the fixture chart, to already be rendered
honestly by the existing components; no UI bug was found this stage
(unlike Prompt 10's `sourceHouses` display fix). No new source rule was
invented anywhere: chapter 124 Method 1's and chapter 132 Methods 1-2's
omitted trigger-figure lists, and chapter 136's three-way overlap case,
were all left without a verdict rather than guessed one. No chapter 141+
work was started, and no chapter 1-140 source rule, figure classification,
constant-figure value, or user input was invented anywhere in this stage.

**Prompt 12, honestly:** `casting.ts`, `chartModel.ts`, and `ruleEngine.ts`
remain completely untouched. No chapter 1-140 calculation was corrected
this stage. `types.ts` gained **zero** changes — chapter 141's gap fit the
existing `gender_classification_unsourced` code, and chapters 142/149/151's
gaps all used plain `uncertain` status with a `reviewNote`, matching the
established convention for omitted-figure/omitted-mechanism chapters
throughout this project. `operations.ts` gained **zero** new primitives —
every chapter 141-150 method composed entirely from primitives Prompts 1-9
already built (`ADD_MULTIPLE_HOUSES`, `COUNT_TOTAL_DOTS`, `CAST_OUT_BY`,
`CHECK_FIGURE_PRESENT_IN_CHART`). Chapter 141 — the chapter specifically
named by this prompt's own instructions for the gender-classification
investigation — was read in full, together with its surrounding text and
(this time) the manuscript's own front matter cited directly, and
confirmed NOT to supply a male/female-star mapping; `gender_classification_unsourced`
was retained rather than assumed resolved, and chapters 41/48/68/127 were
checked and left unchanged, since nothing about them was affected. One
existing test (`questions-stage8.test.ts`'s gender-blocked-count sanity
check, written in Prompt 11 when 6 was the true total) needed its
hardcoded expectation updated to 7 once chapter 141 added a genuine new
occurrence — a stale assertion fix, not a rule change; the method it
was checking was not touched. `reading.ts`, `interpretation.ts`, and every
UI component were read but not modified — every result shape chapters
141-150 produced (favourable/unfavourable/mixed, descriptive/agree,
insufficient-data-with-full-explanation) was confirmed, via live rendering
against the fixture chart including chapter 141 itself, to already be
rendered honestly by the existing components; no UI bug was found this
stage. No new source rule was invented anywhere: chapter 142's dual
blocker, chapter 149's day-4-7 gap, chapter 143's middle-good gap, and
chapter 144's good-but-non-repeating gap were all left without a verdict
rather than guessed one; chapter 151 was judged not computable at all and
was not registered, rather than being forced into a blocked
`QuestionDefinition` with no real calculation behind it. The manuscript's
own chapter-count structure was inspected directly this stage rather than
assumed — confirming chapter 151 is the highest chapter number in this
transcription and that chapters 152+ do not exist here, a correction to
this project's own earlier "numbered 1-153" description, not a change to
any implemented rule. No chapter 152+ work was started (there being
nothing to start), and no chapter 1-151 source rule, figure classification,
constant-figure value, or user input was invented anywhere in this stage.

**Prompt 13, honestly:** this stage changed no geomantic rule, no
calculation, no verdict, and no method status. `casting.ts`,
`chartModel.ts`, `ruleEngine.ts`, `types.ts` and `operations.ts` were each
read in full and each left untouched — no new operation, no new
`ReviewReasonCode`, no new type. What changed was the project's own record
of itself: 24 unresolved methods were given the canonical code that already
existed for their exact blocker (three of those codes had been declared
since Prompt 6 and never once attached to anything), three more were
deliberately left uncoded with their reasons written down and enforced by
test, one user-facing note that made a false claim about its own behaviour
was reworded, one consolidated method was pointed at the fragment it
actually implements, and two fully computable fragments that had fallen
between numbered stages — both already selectable by users — were finally
registered. Every one of those is additive: nothing that previously
produced an answer produces a different one.

The audit's own conclusions are now executable rather than prose. 166 new
invariants assert the book's boundaries (153 entries, 142 numbered, highest
151, 109-117 intentionally absent, nothing beyond 151), that every numbered
chapter is either implemented or documented as not implemented with a
stated reason, that every unresolved method explains itself in words a user
will actually see, that each unresolved dependency keeps exactly one
canonical label, and that "the calculation ran but the source never says
what it means" stays visibly distinct from "the calculation could not run."

Nothing was resolved that the source does not resolve. The male/female-star
classification, the stability, day/night and present/past/future axes, the
five constant figures, the twenty omitted figure lists, chapter 142's
undefined mapping and chapter 151's undefined pairing mechanism all remain
exactly as unresolved as the surviving manuscript leaves them — now each
with a precise, machine-readable reason attached, so what this application
cannot know is as legible as what it can.

Kanzul Mikban is complete. There is no chapter 152, and no chapters
161-180; 151 is the last chapter the source has.

---

## Prompt 14 — product & UX audit (no source changes)

This stage did not touch the engine. It asked one question of the product
built on top of it: can a real user discover, cast, understand and trust the
result of every supported question without the interface hiding, distorting
or inventing anything? The answer required four fixes, none of which changes
a geomantic rule.

**The 13 selectable entries the engine does not answer.** The picker offers
one entry per transcription entry (153), while the engine implements 140
questions. Before this stage both kinds of gap silently fell through to the
older fallback parser. They are now classified explicitly in
`lib/raml/questionAvailability.ts`, which contains no geomantic rule — only a
plain-language record of what each entry is:

| Disposition | Count | What it means |
| --- | --- | --- |
| `engine` | 140 | The engine answers it directly. |
| `consolidated` | 5 | The same source rule the engine already implements under another id — a chapter and a fragment that repeat one method. Selecting it now runs the canonical question and says so. |
| `no-automatic-reading` | 8 | Real source material, but not a chart-verdict question: two reference tables, one ritual, one open-ended technique, one separate counting method, and three passages whose identifying figures the transcription lost (including Chapter 151, *Dreams and Their Interpretations*). |

The five consolidated entries are: the repeated pregnancy chapter, the extra
pregnancy methods, the two repeated sick-person fragments, and the behaviour
chapter whose own note says it repeats Chapter 43 word for word. In every
case the engine already implements that chapter's method — users were being
given a degraded reading of a rule the app owns in full.

**Three interface defects, each measured before and after.**

1. A finished reading opened roughly 800px down the screen — past the
   question, past the verdict — because the app scrolls an inner container
   (now marked `data-app-scroll`) rather than the window, and casting
   finishes at the bottom of the board. Measured `scrollTop` 804 at 360px
   wide and 700 at 390px; 0 after the fix, on all 21 verified cases.
2. The fallback reading screen told every user that "the houses each method
   calls for have already been read off your own chart below" — untrue for a
   reference table or a ritual. That claim now sits on the readable branch
   only; the other branch says plainly that there is no automatic reading,
   gives the specific reason, and notes that the limit is the manuscript's,
   not the chart's.
3. The picker gave no warning before selection. Entries with no automatic
   reading now carry a short badge ("Reference table", "Figures missing",
   "Practice, not a reading", "Open-ended", "Different method").

Accessibility gaps found and fixed: the two free-text inputs had no label,
the result screen had no second-level heading, and the reading's arrival was
silent to a screen reader (`role="status"` now announces it). No horizontal
overflow was found at 360px or 390px. The one remaining console warning — a
missing icon — was fixed with a real app icon rather than documented away.

**Nothing in the engine moved.** `casting.ts`, `chartModel.ts`,
`ruleEngine.ts`, `operations.ts` and `types.ts` are untouched, no question
file changed, no rule status changed, no blocked method became executable,
and no classification the manuscript omits was supplied. 37 new product
invariants (`lib/raml/productUx.test.ts`) hold the product layer to the
engine's own honesty: every registered question reachable, every result kind
presented as itself, every unresolved state explaining its own reason, every
counted method showing its houses or its working, every reading attributed
to a named chapter, and every reading a pure function of the chart — no
clock, no randomness, nothing the user cannot reproduce.

---

## Prompt 15 — information architecture & user experience (no source changes)

The engine and its result screens were finished and audited; this stage was
about turning 153 catalogue entries into something a person can navigate.
Again nothing in the engine moved: no question file, no rule status, no
calculation, no classification.

**The catalogue layer.** `lib/raml/questionCatalog.ts` derives, at module
load, everything the browsing UI needs from what already existed — the
intention list, the engine's registered questions, the manuscript's chapter
numbers, and Prompt 14's availability layer. Its one substantive addition is
a *plain-language title*: the engine has always carried a short question for
each chapter ("Will I get money today?") while the picker showed only the
manuscript's heading ("If You Want to Know If You Will Get Money Today or
Not"). 145 of the 153 entries now lead with the short question and keep the
heading as supporting text; the other 8 have no engine question and keep the
heading alone.

**Taxonomy.** The ten existing categories are unchanged as primary homes. On
top of them, each entry carries product *tags*: a further category is added
only when a token in the question's OWN wording supports it (a trip that
returns "with money" is travel and money both). Tags drive browsing and
search only. Counts after tagging: Love & Couple 28, Money & Possessions 11,
Work & Success 15, Health & Hardships 15, Family & Loved Ones 23, Travel &
Change 13, Legal & Conflict 28, Lost & Stolen Things 20, Fate & Timing 40,
Dreams 1. No category is empty, and every entry is reachable from at least
one of them.

**Search** is a plain client-side filter over title, manuscript heading,
category, chapter number and availability badge, with a small synonym map
(jail→prison, cash→money, spouse→wife/husband…). Every word typed must match,
so words narrow rather than widen. It can only ever return entries that are
already in the catalogue — no dependency was added, and nothing is generated.

**Flow.** Choosing a question now opens a confirmation screen — QUESTION /
WHAT THIS READING DOES / SOURCE / Start Reading — whose brief is built from
the real method counts, so a question whose methods cannot be read says so
*before* the sand is cast rather than after. The optional free-text field now
states plainly that it does not change the geomancy calculation and is kept
with the casting on the device.

**Result.** The qualification about unreadable methods moved directly under
the answer it qualifies; the working is a proper disclosure control
("How this was determined", `aria-expanded`); and a compact summary card ends
every reading with question, state, one-line interpretation and chapter, plus
a plain-text "Copy reading". Conflicts read "Mixed / Conflicting indications"
and blocked readings "Insufficient information" — never a softened verdict.

**Status language.** `lib/raml/statusLanguage.ts` translates the engine's own
vocabulary for the screen: `needs_review` → "Source detail missing",
`uncertain` → "Not defined in the source", `insufficient_data` → "Not enough
source information" with "There is not enough source-defined information to
determine the answer." The engine keeps its exact terms; only the wording a
reader sees changed.

**Analytics.** There are none — no tag, no SDK, no beacon. Castings and
recent questions live in `localStorage` on the device. Any future statement
about which questions are popular would therefore be fabricated, which is why
the landing section is called "Suggested questions". Metrics worth adding
later, if the owner wants them: questions selected, confirmations that went
on to a casting, castings completed, category vs. search entry, and how often
a reading lands on the insufficient state.

---

## Prompt 16 — reading history (no source changes)

A user's own past readings, kept on their device and rebuilt from the engine
rather than remembered. Nothing in the engine moved.

**What is stored.** One localStorage key, `truth-geomancer:castings`, holding
at most 100 records of exactly five fields: `v` (schema version), `id`,
`createdAt`, `questionId`, optional `intentionText`, and the four Mothers. No
verdict, no summary, no method list — those are recomputed. No account, no
location, no identifier of any kind, and no network call: `lib/raml/history.ts`
contains no fetch, XHR, WebSocket or beacon, and a test asserts it.

**Why replay rather than snapshot.** The engine is a pure function of the
chart (asserted in `productUx.test.ts`), so a saved chart plus a question id
reproduces the whole reading exactly. That removes a whole class of lie: a
stored verdict could drift out of step with the rules it came from, while a
replayed one cannot. The browser matrix compared a freshly cast reading with
the same reading reopened from history — character for character identical.

**When a reading cannot be rebuilt.** If the question is no longer in the app,
history says so — "This reading can no longer be reconstructed from the saved
information" — rather than answering with some other question's rule. The
chart itself is still shown, because it is still intact.

**States a past reading can carry** (ten): favourable, unfavourable, mixed /
conflicting, the descriptive answer itself, insufficient information, source
detail missing, not defined in the source, no automatic reading, a general
chart reading, and cannot-be-reconstructed. Each is rendered as words plus an
icon, never colour alone.

**Migration.** The pre-Prompt-16 record stored the user's free text under
`question` and the chosen question under `intentionId`. Those are read,
converted in place on first load, and written back once; an existing user
keeps every casting, with their words and the traditional question now in the
right places. If the rewrite cannot be saved, the migration still applies in
memory and nothing is lost.

**Saving is automatic**, and the result screen says only what is true —
"Saved on this device — nothing is sent anywhere" — or, when the browser
refuses to store anything, that the reading will not appear in Past Readings.
There is no "Save" button, because there is nothing for it to do.

**Storage is treated as hostile**: invalid JSON, a non-array payload, a record
with no date, a bad date, missing or malformed Mothers, an empty id — each is
dropped and the rest kept; a quota error sheds the oldest readings rather than
failing; a browser with no storage, or one that throws on touching it, leaves
the app fully working and merely unable to remember. 52 tests cover this.

---

## Prompt 17 — casting interaction & readability (no engine changes)

**The board no longer shows the count.** The engine needs the number of marks
on each line — parity decides single or double — and it still has it, in
`lib/raml/castingBoardState.ts`, which is the old in-component grid lifted out
so it can be tested directly. What changed is what a reader sees. The board
used to print "8 tap" beside each line and reveal a draw's figure as soon as
its four lines were marked; both are gone. A tap now answers with a pulse, a
short haptic tick where the device offers one, and a quiet "Marked" state, and
the accessibility tree hears "Fire tap registered." — never a number. The only
digits on the screen are the draw stage ("Draw 2 of 4 · 3 of 4 lines marked"),
which counts lines, not taps, and never passes four.

Nothing about the arithmetic moved: the same tap sequence gives the same
Mothers, the same houses and the same reading, asserted against the suite's
hand-verified fixture chart and across tap counts of matching parity.

**The working is readable.** `How this was determined` was 11-12px throughout —
the one part of the app a practising geomancer actually studies was the hardest
to read. A shared type scale now lives in `app/globals.css` (section 18px,
method 21px, source quote 17px/1.6, evidence 16px, verdict 19px, metadata
15px), and it is expressed in rem, so a reader who raises their browser's own
font size finally gets larger text — the app's px sizes had been ignoring that
setting entirely. Verified at 100/125/150/200%: text scales proportionally, and
no width or font setting produces horizontal overflow or clipped content.

---

## Prompt 18 — reader accessibility and text size (no engine changes)

**The app was ignoring the reader's own browser setting.** Prompt 17 had moved
the reading and the method details onto a rem-based scale, but the rest of the
app was still full of `text-[11px]` and `text-xs` brackets, and px does not
respond to a browser font-size preference at all. Twelve files in the reading
flow were converted onto the same nine tokens, so the question list, the
confirmation step, the casting board, the result, history and settings now all
answer to one scale.

**A reader can also choose the size in the app.** `lib/raml/readerSize.ts`
stores one of three values — `standard`, `large`, `xlarge` — under
`truth-geomancer:reader-size` and sets `data-reader-size` on `<html>`. The
stylesheet turns that into a single multiplier, `--reader-scale` (1, 1.15,
1.32), and every type token is `calc(Xrem * var(--reader-scale))`. That is the
whole mechanism, and it is deliberately narrow: the multiplier touches type
sizes only, so figure glyph geometry, the chart grid, icons and the logo keep
their proportions. Measured on the source quote: 17px → 19.55px → 22.44px, and
33.66px at Extra large with the browser at 150%.

A small inline script in `<head>` applies the stored value before first paint,
so a reader who has chosen Extra large never sees a frame of Standard text.
Anything else in that key — `HUGE`, a JSON object, an empty string, `null`,
`42` — falls back to Standard rather than throwing, and a browser that refuses
storage gets a plain sentence saying the setting will not be remembered instead
of a control that silently fails. 24 tests cover the parsing, the fallback and
the write path.

**Contrast is now measured rather than judged.** The palette dims sand
(`#d9b878`) with Tailwind alpha suffixes, and by eye `text-sand/35` reads as
ordinary quiet metadata — it is 2.23:1. Every text colour below 65% was raised,
across the reading flow and the marketplace and chrome pages alike; 65% is the
lowest alpha that clears 4.5:1 on both the page (`#161009`, 4.80:1) and a card
(`#1f1610`, 4.67:1). `lib/raml/readability.test.ts` recomputes the ratio for
every `text-sand/NN` in `app/` and `components/` on each run, so the floor
cannot quietly slip back.

**Focus is visible everywhere.** A single `:focus-visible` rule gives every
link, button, input and `tabindex` element a 2px clay outline with an offset.
Verified by tabbing Settings end to end — every stop, including the three size
options, reports a real outline.

**Reading Mode was considered and not built.** The result screen already has no
decorative background, no imagery behind the text and no competing column; a
distraction-free mode would have been a second rendering path over the same
content, with its own scroll, navigation and history behaviour to keep in step.
The text-size control covers the need it was meant to serve, so the complexity
was not added. This is a decision, not an omission.

**Nothing about the reading changed.** The rendered text of a reading was
captured at Standard and at Extra large and compared: identical, 4,381
characters both times. No question, figure, house, method, consensus rule or
casting step was touched in this prompt.

**A second pass, after measuring the right thing.** The first round of this
work checked for horizontal overflow with `document.documentElement.scrollWidth`
— which is clamped by the `overflow-x: hidden` the app sets, so it reported
clean no matter what. Measuring the container that actually scrolls
(`[data-app-scroll]`) instead turned up six real problems at the larger sizes,
all now fixed and all covered by the matrix: the manuscript body (`Prose.tsx`)
was pinned at 17px and was the one screen the control could not reach; a book
card carried a rem-based fixed width that burst out of its grid cell; the book
detail header and the chapter list had flex children without `min-w-0`, so long
titles pushed past the edge instead of wrapping; outcome badges and method
consistency rows did not wrap; and six `text-sm`/`text-lg` leftovers in the
reading flow had survived the first conversion. `readability.test.ts` now also
asserts that no file under `components/raml` or `components/books` uses a raw px
or Tailwind size utility, and that every `type-*` token multiplies by
`--reader-scale`. All three guards were confirmed to fail when deliberately
violated, rather than assumed to work.

Justified text also stops being justified at the two larger reader sizes: a
phone column at that size holds a handful of words per line, and justifying it
opens rivers of white space. `overflow-wrap: break-word` on the body is the
backstop for the same situation.

**Still outstanding: haptics on real hardware.** `navigator.vibrate` is feature
detected and wrapped in try/catch, and the fallback path is verified, but no
desktop browser actually vibrates. The manual test that remains is on an
Android handset: tap one element and feel a single short tick, tap rapidly and
confirm the ticks do not queue or stall the UI, confirm no count appears,
complete four draws and confirm the reading matches the same taps on desktop.
Until that is done, haptic hardware is unverified.

---

## Prompt 19 — restoring "the stars and their uses in a chat" (no engine changes)

**What was missing.** Chapter Four of *The Master of Geomancy, Volume 1* —
"The stars and their uses in a chat" — has sixteen numbered entries (①–⑯,
pages 8–23 of the source PDF), each giving a star's meaning in House 6 and
House 2, the sadaka it calls for, an invocation with a repeat count, named
surahs, and a hand-drawn Hatim diagram. None of this had ever been
transcribed into the app. `content/stars.ts` already carried a *paraphrase*
of the house-6/house-2 meanings (its own file header says so, and it feeds
the casting engine's "My Star" tab), but the manuscript's own words were
nowhere, and the Hatim diagrams did not exist in the codebase at all —
confirmed by a repo-wide search before writing anything.

**The exact source text is restored**, in `content/manuscripts/starUses.ts`,
one entry per star, transcribed from the source PDF's own text layer rather
than the supplied screenshots alone (the screenshots were used to check the
hand-drawn Hatim, which has no text layer). The manuscript's own spellings
are kept — "sadaka", "colanut", "enemity", "massan" — because this is a
restoration, not a house-style rewrite. Three entries (Umar, Kalla Allahu,
Sulemana) run House 6 and House 2 together in one paragraph in the source;
each is split at the source's own transition sentence ("Also, if you found X
in house (2)…"), not at an invented boundary — and each such entry says so
in a `sourceAmbiguity` note. Genuine source oddities are reproduced rather
than smoothed over: Nuhu's House 6 sentence ends without a full stop,
Usman's surah name is printed in the source itself as
"Suratul...Alamnashiraha" with the gap, and Musah's closing surah has no
stated repeat count — all three are reproduced exactly and flagged, not
corrected. The sixteen Arabic invocations are each a standard,
independently-identifiable Divine Name (Ya Tahir, Ya Rahim, Ya 'Alim, …);
the only edits made to them close up a stray space the PDF's own text
extraction introduced mid-word, never a transliteration or a guess.

**Two follow-up corrections, made after closer review of the source pages.**
Ayuba's House 6 paragraph originally ended "…don't taste or eat it pleas",
reproduced as printed and flagged with a `sourceAmbiguity` note explaining
that the PDF's text layer appeared to cut the word short. A closer look at
the source page confirmed this was exactly that — a PDF-extraction artifact,
not the manuscript's own incompleteness — so it is now transcribed as
"please" and the note is gone; there is no longer an ambiguity to flag.
Separately, Sulemana's House 2 recitation is now named "Kul huwa Allahu
(Ikhlas)" rather than "Kul huwa Allahu" alone, clarifying which surah the
source's own short name refers to without changing the source's own
wording, the Arabic invocation, or the stated count.

**One naming discrepancy is documented, not resolved.** The symbol page
(Chapter Three) pairs "Hassan & Hussein" as one entry; Chapter Four's own
numbered entry (⑬) names only Hassan throughout. `content/stars.ts` already
used the paired name, kept here for consistency, but the discrepancy itself
is recorded in the entry's `sourceAmbiguity` field and asserted by a test
rather than silently picked one way.

**The Hatim diagrams — verified where the evidence supports it, marked
"under review" everywhere it doesn't.** Every diagram is a 3×3 grid: a
centre cell holding "Intentions" beneath a small geomantic figure, framed by
eight hand-written bordering marks. Two things about them are verified with
real confidence:

- The centre figure is that star's own four-line pattern. Checked by
  counting dots under 5–8x magnification against three stars whose pattern
  is already in `content/stars.ts` — Yussif (1,1,2,1), Adam (1,2,2,2), and
  Umar (2,1,2,2) — all three matched exactly. `centerFigure` is generated
  from the star's own pattern rather than re-read per diagram.
- Three of the eight bordering cells (top-left "٣", top-right "١",
  bottom-left "٢") are the same simple, unambiguous shape in every one of
  the sixteen diagrams.

Everything else about the border required real digit-by-digit inspection,
and most of it did not clear the bar. High-magnification crops gave a clean,
defensible reading of the three remaining cells for exactly three stars —
Yussif (211 / 215 / 209), Umar (202 / 201 / 200), Ayuba (308 / 307 / 306) —
plus Mahadi's top-middle cell ("33"). Umar's and Ayuba's readings each
happen to descend by exactly one across their three cells; testing that
same shape against Yussif's confirmed reading disproved it as a general
rule (211/215/209 does not descend by one), so no shared generation formula
was assumed or applied to the stars that weren't individually checked.

A single hooked mark — resembling either the Arabic-Indic numeral ٦ or the
letter ك — recurs identically in the bottom-middle cell of all sixteen
diagrams, and the same shape was also found inside Ibrahim's own variable
cells, which rules out treating it as a fixed, known-value template
constant. Rather than assert a reading for it, every cell containing it is
marked `status: 'review'` with a note describing exactly what was seen. In
total, of the 128 bordering cells across sixteen diagrams (8 × 16): 58 are
verified (the three fixed corners × 16, plus the three variable cells each
for Yussif, Umar and Ayuba, plus Mahadi's top-middle cell); 70 are under
review. No diagram is `fullyVerified`.
This is reported as a fact, not smoothed into "16 diagrams restored" — the
UI shows "under review" in place of every unverified mark, with the same
distinction repeated for screen readers rather than only conveyed visually.

**Nothing was invented.** No Hatim numeral was guessed to complete a row, no
missing repeat count was supplied, no Qur'anic reference was added, no
relationship between stars was proposed, and no generation formula was
applied beyond what was directly observed and then disproved as universal.
Where the source itself is incomplete or inconsistent, that incompleteness
is reproduced and flagged, not corrected.

**Where this lives.** `content/manuscripts/starUses.ts` (exact source
prose) and `content/manuscripts/hatim.ts` (diagram data, `HatimCell` typed
as `{status:'verified', text}` or `{status:'review', note}`) are new,
separate files — `content/stars.ts`'s paraphrase, and its use in the "My
Star" result tab, are untouched. `components/books/HatimDiagram.tsx` renders
the grid as CSS-bordered cells (crisp at any zoom, not a scanned image),
with `role="img"` carrying a summary label and a `sr-only` list carrying
every individual cell's content — including its review status — for a
screen reader. The restored chapter is wired into the existing manuscript
reader (`app/books/[id]/read/page.tsx`, the `stars-in-the-chart` chapter),
which already had a per-star loop; it now shows the manuscript's own words
instead of the paraphrase, with the Hatim beneath each entry, and a closing
note explaining the unresolved mark once rather than sixteen times.

`content/manuscripts/starUses.test.ts` (58 tests, after the two follow-up
corrections above) checks: all sixteen entries present in the manuscript's
own ①–⑯ order (not the symbol page's grouping); every entry names both
houses and at least one sadaka, invocation and recitation; the Hassan/Hussein
discrepancy is asserted rather than resolved; the three remaining source
oddities (Nuhu, Usman, Musah) are asserted byte-for-byte rather than
corrected, and Ayuba's corrected "please" is asserted in its place; every
Hatim's centre figure equals its
star's own pattern; the three fixed corner cells read identically across all
sixteen; the recurring hook mark is never assigned a value; the
descending-sequence pattern is proven NOT to generalise to Yussif; and the
coverage tally (58 verified / 70 review, out of 128) is asserted exactly
rather than approximated. None of this content touches `casting.ts`,
`chartModel.ts`, `ruleEngine.ts`, `operations.ts`, or `types.ts`, and no
existing reading, question, or result changed — the full suite (2,198 tests,
up from the Prompt 18 baseline of 2,141) and the manuscript's own structural
audit (`audit-1-151.test.ts`) both still pass unchanged.

**Browser verification.** The restored chapter, three star entries (first,
a middle one, last), and three Hatim diagrams were checked at 360/390/412
and 1280px, and at Standard, Large and Extra-large reader sizes: no
horizontal overflow, no clipped text, no oversized or overlapping grid
cells, no JS errors, no failed requests. The Hatim grid scales with the
reader-size preference like the rest of the chapter (324px wide at Large and
Extra-large on a 390px viewport, unclipped) since it is CSS, not an image.

---

## Prompt 20 — Abjad validation and a numeral display toggle (audit, no new image evidence)

**What this prompt supplied, and what it didn't.** A follow-up brief re-stated
the Prompt 19 restoration requirements and included a working table of
Divine-Name/value pairs and a specific Hatim reading for Yussif (3/211/1,
210/center/5, 2/4/209) as "source-audit targets... not permission to blindly
hard-code them." No new manuscript photographs or scans came with it — this
repository still has no image assets for the sixteen Hatim diagrams (checked:
only `public/covers/master-of-geomancy-vol-1.jpg`, the book's cover). Per the
brief's own section 5 ("do not silently change 211/210/209 to \[anything]...
first determine what the original manuscript actually shows") and section 15
("do not silently 'correct' manuscript values"), nothing in `hatim.ts` was
changed on the strength of this table alone. The existing Yussif reading
(٢١١ / ٢١٥ / ٢٠٩ — topMiddle / middleLeft / bottomRight), produced in Prompt
19 from an actual high-magnification pass over the source photograph, is kept
exactly as it was.

**What is new, and doesn't need a photograph: Abjad validation
(`content/manuscripts/abjad.ts`).** A diagnostic-only module computes the
classical Abjad-kabir letter sum of each star's Divine Name (the calling
participle "يا" is stripped first) and compares it to the manuscript's own
stated repeat count from `starUses.ts`, reporting `match` or `discrepancy` —
never overwriting either number. Running it against all sixteen invocations
found:

- **Eleven matches** — Adam (الله=66), Mahadi (زكي=37), Issah (لطيف=129),
  Ibrahim (عليم=150), Umar (جبار=206), Kalla Allahu (هادي=20), Sulemana
  (نور=256), Nuhu (وكيل=66), Hassan & Hussein (حليم=88), Usman (كافي=111),
  Musah (جامع=114) — the bare name's Abjad sum equals the manuscript's stated
  count exactly, for all eleven.
- **Five discrepancies, each documented rather than resolved:**
  - **Yussif** — طاهر sums to 215, not the stated recitation count of 251.
    215 is exactly the source-verified Hatim middle-left cell (٢١٥). Both
    numbers (251 the recitation count, 215 the Hatim cell) are genuinely
    different figures in the source and both are kept.
  - **Ayuba** — باسط sums to 72, not the stated 312. 312 is exactly what the
    source-verified Hatim geometry is built from (308/307/306 = 312−4/−5/−6).
    Both numbers are kept; only the bare name's Abjad is flagged as not
    matching 312.
  - **Iddris** — رحيم sums to 258, not the stated 115. No alternative
    reading was found anywhere else in the source; reported as an open,
    unresolved source/math discrepancy.
  - **Ali** — سالم sums to 131, not the stated 370. The Prompt 20 brief itself
    flags Ali's Divine Name as needing verification against the exact
    manuscript spelling; this is reported as unresolved, not inferred.
  - **Yunus** — the invocation combines two names ("يا حي يا قيوم"). The
    stated count (18) equals حي ("Al-Hayy") alone, not قيوم alone (156) nor
    the combined phrase (174). Reported as a partial match, not asserted
    either way.

None of this changes `starUses.ts`'s transcribed counts or `hatim.ts`'s
verified/review cells — it is a read-only cross-check layered on top of both,
exposed in the reader alongside each star's Divine Name and surfaced as
"Abjad check: match" or "Abjad check: source/math discrepancy" with the
specific note for the five discrepancies above.

**A numeral display toggle (`HatimDiagram.tsx`).** Per section 7 of the
restoration brief ("preserve the original manuscript numeral glyphs... may
additionally provide Latin equivalents... but the source glyph must remain
available"), the Hatim diagram now has an "Original / Arabic + Latin / Latin"
control (`role="radiogroup"`, default "Original"). `arabicIndicToLatin()` in
`hatim.ts` converts the stored Arabic-Indic digits to Latin digits for
display only — the stored `HatimCell.text` values are never rewritten, and
switching modes is purely a rendering choice. The screen-reader `sr-only`
list always states both forms regardless of the visual toggle, so a
non-visual reader isn't limited to whichever mode is currently selected.

**The Divine Name is now shown in the reader**, next to each star's House 6/
House 2 text: the manuscript's own Arabic invocation, its stated repeat
count labelled "(source-derived...)", and the Abjad check result. This
answers section 12's "view the Divine Name and source numerical value" /
"understand that the value is source-derived" requirements, which Prompt 19
had transcribed into data but not yet surfaced as a distinct UI element.

**Guided drawing order (section 8): still not implemented, on purpose.**
Nothing in the manuscript text restored in Prompt 19, and nothing supplied
with this prompt, establishes a stroke-by-stroke drawing sequence for any of
the sixteen Hatim diagrams. Per the brief's own instruction ("if the
manuscript does not explicitly establish the order, do not pretend that an
inferred order is authoritative... leave the guided order disabled"), no
`drawingOrder` field or "Show drawing order" control was added. This remains
unresolved, not guessed.

**Tests.** `content/manuscripts/abjad.test.ts` (13 tests) covers: one
validation per star; the calling-particle strip; the Abjad-kabir sum
function against two known values; the eleven matches; the five
discrepancies each carrying a note; that the manuscript's stated count is
never mutated; Yussif's 215-vs-251 split and its cross-check against the
existing verified Hatim cell; an explicit assertion that this session does
NOT overwrite the source-verified 211/215/209 reading with the unverified
211/210/209 working table supplied this prompt; Ayuba's 72-vs-312 split
against its Hatim geometry; Umar's clean match on both fronts; and Yunus's
partial-name match. `starUses.test.ts`'s existing 57 tests are unchanged and
still pass. Full suite: 2,211 tests passing (up from Prompt 19's 2,198),
`tsc --noEmit` clean, `next build` clean (19 static routes generated,
including both book readers).

**Files changed:** `content/manuscripts/abjad.ts` (new),
`content/manuscripts/abjad.test.ts` (new), `content/manuscripts/hatim.ts`
(added `arabicIndicToLatin`; no existing cell value changed),
`components/books/HatimDiagram.tsx` (numeral toggle; now a client component),
`app/books/[id]/read/page.tsx` (Divine Name + Abjad check surfaced per
star). `casting.ts`, `chartModel.ts`, `ruleEngine.ts`, `operations.ts`,
`types.ts` untouched.

**Still unresolved, honestly.** The Hatim border's 70 "under review" cells
from Prompt 19 are unchanged — this prompt had no new image evidence to
re-inspect them with, and none was invented. Yussif's specific 211/210/209
vs 211/215/209 question (section 5) is not "solved" here; it is documented,
cross-checked against an independent Abjad calculation (which favours 215,
not 210), and left exactly as Prompt 19 verified it, pending an actual
re-inspection of the source photograph.

---

## Prompt 21 — Hawatim source reconciliation & unresolved-cell audit

**What was investigated first, before any file was touched.** A repo-wide
search for manuscript scans (`find` for `.png/.jpg/.jpeg/.tif*/.pdf/.heic/.webp`
outside `node_modules`/`.next`), other git branches, and any `docs/`/`assets/`
folder found nothing beyond the two book-cover jpgs already known from
Prompt 20 and a single app icon. No new manuscript evidence exists in this
repository. Every finding below therefore comes from re-analysing the
numbers Prompts 19–20 already established — `starUses.ts`'s transcribed
counts, `hatim.ts`'s verified cells, and `abjad.ts`'s Abjad sums — against
each other more rigorously, not from a new image pass.

**The Yussif/Usman conflation this prompt warned about does not exist in the
data.** `starUses.ts` has always had Yussif → يا طاهر (251) and Usman → يا
كافي (111) as two separate entries; a test now asserts this explicitly
(`reconciliation.test.ts`, "Usman — identity/value distinction").

**The N-4/N-5/N-6 formula was tested against every verified cell, not
assumed.** New module `content/manuscripts/hatimPattern.ts` computes, per
star, the N implied by each already-verified `topMiddle`/`middleLeft`/
`bottomRight` cell (`cell + 4`, `cell + 5`, `cell + 6` respectively) and
checks whether they agree with each other and with a manuscript-stated
number, never writing a value into `hatim.ts`:

- **Umar** — all three verified cells agree on N=206, matching both the
  stated recitation count and the Abjad sum exactly → `confirmed_by_source`.
- **Ayuba** — all three verified cells agree on N=312 — the manuscript's
  *stated recitation count*, not its bare-name Abjad sum (72) →
  `confirmed_by_source`. This is the clearest evidence found this session
  that the Hatim's construction number is the stated count, not the Abjad
  value, in the one case where the two numbers actually differ and full
  data exists to tell them apart.
- **Mahadi** — only `topMiddle` (33) is verified; consistent with N=37
  (stated = Abjad, so it doesn't disambiguate) → `partially_confirmed`.
- **Yussif** — genuinely new finding: its three verified cells do **not**
  agree with each other. `topMiddle` (211) and `bottomRight` (209) both
  imply N=215 (matching the Abjad sum of طاهر), but `middleLeft` (215) —
  taken as a raw cell value — implies N=220 under the same formula, not
  215. Two of three cells point to N=215; the third does not fit that N at
  all → `conflicting`. This means 215 is not simply "N−5" the way Umar's
  and Ayuba's middle-left cells are; it is either the Abjad sum written
  directly, or a still-unexplained fourth number. **No value was changed.**
  The existing verified reading (211/215/209) stands; the pattern's
  disagreement with itself is documented, not resolved by picking a side.
- **The other twelve stars** have no verified variable cells at all →
  `untestable`. The pattern is not assumed to hold for them merely because
  it fits four other stars.

**The five Abjad discrepancies, examined individually (section 5):**

- **Iddris** (رحيم, stated 115 vs Abjad 258) — no alternate spelling,
  recitation-vs-Abjad explanation, or Hatim cross-check was found anywhere
  in the transcribed source. Still `SOURCE VALUE ≠ ABJAD`, with the note now
  explicitly stating **SOURCE VALUE MEANING UNRESOLVED** rather than
  implying an explanation exists.
- **Ayuba** (باسط, stated 312 vs Abjad 72) — now has a source-backed
  explanation via the pattern diagnostic above: 312 is exactly what the
  Hatim is built from. Reported as `SOURCE VALUE ≠ ABJAD` but with
  `valueConfidence: 'verified'` in the new reconciliation model, because the
  *relationship* between the two numbers is understood, unlike Iddris.
- **Ali** (سالم, stated 370 vs Abjad 131) — the brief's own repeated
  instruction not to infer from transliteration is honoured: this star is
  the one place a **SOURCE SPELLING UNRESOLVED** label is used (an explicit,
  documented flag — `SPELLING_UNCERTAIN` in `abjad.ts` — not derived from
  arithmetic), because no source image exists to confirm سالم is the
  manuscript's actual spelling.
- **Yunus** (يا حي يا قيوم, stated 18) — `abjad.ts` no longer hard-codes this
  as a special case; a new generic `findPartialMatch()` checks every word of
  a multi-word phrase for one whose bare Abjad equals the stated count, and
  finds حي (18) — any future multi-name entry would be caught the same way.
  Status upgraded from a plain `discrepancy` to `partial_match`, with its own
  **PARTIAL MATCH** label.
- **Yussif** — see the pattern-diagnostic finding above; unchanged
  conclusion (`SOURCE VALUE ≠ ABJAD`), now with a fuller explanation of
  *why* 215 only partly reconciles with the Hatim's own cells.

**Data model improvement (section 9).** `content/manuscripts/
valueReconciliation.ts` is new: for each star it exposes
`sourceStatedValue`, `abjadValue`, `hatimReferenceValue` (the N the Hatim's
own verified cells agree on — `null` when untestable or conflicting),
`abjadStatus` (the precise label below), `valueMeaning`, and
`valueConfidence` (`'verified' | 'partial' | 'unresolved'`) — kept as three
distinct fields rather than one collapsed "value", per the brief. No global
type in `stars.ts` or `hatim.ts` was touched; this is a derived, read-only
combination of the three existing canonical sources.

**Precise status wording, never "verified" for a discrepancy (section 10).**
`abjad.ts` gained `abjadStatusLabel()`, returning exactly one of: `MATCH`,
`PARTIAL MATCH`, `SOURCE VALUE ≠ ABJAD`, or `SOURCE SPELLING UNRESOLVED` (the
fifth requested wording, "SOURCE VALUE MEANING UNRESOLVED", is used in the
explanatory note text for Iddris specifically, where even the *relationship*
between the two numbers — not just their equality — is unresolved). The
reader UI (`app/books/[id]/read/page.tsx`) now shows this exact label next
to each star's Divine Name instead of the looser "match / source-math
discrepancy" wording Prompt 20 shipped.

**Numerals, drawing order, and centre figures: untouched, on purpose.** The
three numeral modes, the absence of any `drawingOrder` field, and each
star's own four-line centre figure were all re-checked against this
prompt's own instructions and left exactly as Prompt 20 (numerals) and
Prompt 19 (drawing order, centre figures) established them — no new evidence
justified a change to any of the three.

**Tests.** `reconciliation.test.ts` (new, 15 tests) covers the pattern
diagnostic's five status outcomes with real numbers (not asserted in the
abstract), the Yussif/Usman identity distinction, Ayuba's
stated-count-not-Abjad finding, Iddris/Ali staying unresolved, Yunus staying
partial, and that neither new module mutates `hatim.ts` or touches the
engine. `abjad.test.ts` (2 new tests, 15 total) covers the generic
partial-match detection and the four precise status labels. Full suite:
**2,228 tests passing** (up from Prompt 20's 2,211), `tsc --noEmit` clean,
`next build` clean (19 static routes, unchanged).

**Files changed:** `content/manuscripts/hatimPattern.ts` (new),
`content/manuscripts/valueReconciliation.ts` (new),
`content/manuscripts/reconciliation.test.ts` (new), `content/manuscripts/
abjad.ts` (generic partial-match detection, `abjadStatusLabel()`, refined
notes — no manuscript value changed), `content/manuscripts/abjad.test.ts`
(updated for the refined status model), `app/books/[id]/read/page.tsx` (uses
`abjadStatusLabel()` instead of the looser Prompt 20 wording). `hatim.ts`,
`starUses.ts`, `stars.ts`, `casting.ts`, `chartModel.ts`, `ruleEngine.ts`,
`operations.ts`, `types.ts` all untouched.

**What remains unresolved, on purpose.** All 70 "under review" Hatim cells
are exactly as Prompt 19 left them — this session found no new evidence for
any of them and invented none. Iddris's and Ali's discrepancies remain fully
unresolved. Yussif's own three verified cells do not fully reconcile with
each other even under closer analysis; that is reported as a genuine
conflict, not smoothed into a single answer. Per section 18 of this prompt:
"70 cells remain unresolved because the available source evidence does not
establish them" is the accurate, and intended, outcome here.

**Not deployed, not pushed** — per this prompt's explicit instruction.

---

## Prompt 23 — final Hawatim manuscript corrections (128/128 cells complete)

**What changed.** The user personally checked the original manuscript and
supplied authoritative values for all 70 previously-"under review" cells
across the sixteen Hatim diagrams, plus confirmed the recurring
`middleRight`/`bottomMiddle` cells are the digits 5 and 4 in every diagram.
Per this prompt's explicit instruction, these are treated as direct
manuscript verification: implemented exactly as given, with no
recalculation, no Abjad substitution, and no smoothing of numerically
irregular entries (Ibrahim 142/145/144, Ali 322/325/324, Usman 108/102/105 —
none of these fit the N-4/N-5/N-6 descent, and are stored exactly as
supplied). `content/manuscripts/hatim.ts` was rewritten around an explicit,
literal `RAW_HATIMS` table (one `[topMiddle, middleLeft, bottomRight]` triple
per star) rather than a formula — `fullyVerified` is now computed from
whether every cell in a star's own border is `status: 'verified'`, not
hard-coded.

**Coverage: 70 under review → 0 under review, 58/128 verified → 128/128
verified.** `hatimCoverageTally()` now reports `{ verifiedCells: 128,
reviewCells: 0, totalCells: 128 }`, asserted exactly in
`content/manuscripts/hatimComplete.test.ts` (a new, exhaustive test file
that checks all sixteen stars' complete 3×3 tables against the supplied
list, verbatim).

**The N-4/N-5/N-6 pattern is proven, with real data, to NOT be universal —
exactly as this prompt's section 6 required.** With all sixteen diagrams now
fully populated, `hatimPattern.ts`'s diagnostic was run against every star
for the first time (previously only 4 of 16 had enough verified cells to
test). Result: only 9 of 16 stars have their three cells agree on a single N
(`confirmed_by_source`) — Mahadi, Iddris, Issah, Umar, Ayuba, Sulemana,
Hassan & Hussein, Yunus, Musah. Two stars' cells agree with each other but on
a number matching neither the stated count nor the Abjad sum (`not_confirmed`
— Adam and Nuhu, both N=26 against a stated/Abjad value of 66). **Five
stars' own three cells do not even agree with each other** (`conflicting`) —
Yussif, Ibrahim, Kalla Allahu, Ali, and Usman — which is the clearest
possible proof that the formula was never applied as a generation rule: if
it had been, every star's three cells would trivially agree by construction.
Ibrahim (146/150/150), Ali (326/330/330), and Usman (107/111/112 — all three
different) are recorded as explicit regression tests in
`reconciliation.test.ts` and `hatimComplete.test.ts`.

**Two Abjad discrepancies gained a stronger explanation; two did not.**
Because Iddris's cells are now verified (111/110/109), its pattern
diagnostic resolves to N=115 — exactly the manuscript's stated recitation
count, not its 258 Abjad sum. This is the same relationship already found
for Ayuba (N=312, stated, not the 72 Abjad sum), and `valueReconciliation.ts`
was generalized (no longer a `starId === 'ayuba'` special case) to recognise
this pattern for any star: **Iddris moved from `valueConfidence: 'unresolved'`
to `'verified'`.** Ali's cells conflict with each other too (326/330/330 vs
their own outlier), so there is no equivalent fallback confirmation — Ali
remains `'unresolved'`, exactly as before. Yussif's cells still conflict with
each other (see Prompt 21/22), so it also stays `'unresolved'`.

**Divine Name / Abjad values were not touched.** `sourceStatedValue`,
`abjadValue`, `abjadStatus` (MATCH / PARTIAL MATCH / SOURCE VALUE ≠ ABJAD /
SOURCE SPELLING UNRESOLVED) are unchanged for all sixteen stars — only
`hatimReferenceValue` and `valueMeaning`/`valueConfidence` shift, and only
where the newly-supplied Hatim cells provide genuine new cross-check
evidence (Iddris; Adam and Nuhu moved from "not yet verified enough to
cross-check" to "partial" now that their conflicting-with-stated N is known).

**Center figures, numeral display, and drawing order: unchanged.** Each
star's own four-line pattern remains the centre figure; the Original/Arabic
+ Latin/Latin toggle still renders the same stored Arabic-Indic text through
`arabicIndicToLatin()`, never mutating it (asserted in
`hatimComplete.test.ts`); no `drawingOrder` field exists and none was added —
nothing in the newly-supplied values establishes a stroke sequence.

**UI text updated to stop describing cells as unverified.** The
`stars-in-the-chart` chapter's two explanatory paragraphs (the intro note and
the closing note after all sixteen cards) previously described the Hatim
cells as partially unread and named the recurring hook mark as unresolved;
both were rewritten to state that all bordering cells are now
manuscript-confirmed, without changing anything about how a stat is
rendered.

**Tests.** `hatimComplete.test.ts` (new, 23 tests): all sixteen stars'
complete tables asserted exactly against the supplied list; 128/128
coverage; `fullyVerified` true for all sixteen; the Ibrahim/Ali/Usman
non-formula regression proof; numeral-conversion never mutates stored data;
centre figures and "Intentions" label unchanged; no engine coupling.
`reconciliation.test.ts` (19 tests, up from 15) rewritten for the new
9-confirmed/2-not-confirmed/5-conflicting pattern breakdown and the Iddris
upgrade. `starUses.test.ts`'s three Hatim-coverage assertions were updated
(bottom-middle is now verified as ٤, `fullyVerified` is true, coverage is
128/0) — none of its other 54 assertions changed. `abjad.test.ts` unchanged
(16 Divine-Name/Abjad relationships are untouched by this prompt). Full
suite: **2,255 tests passing** (up from Prompt 21/22's 2,228), `tsc --noEmit`
clean, `next build` clean (19 static routes, unchanged).

**Files changed:** `content/manuscripts/hatim.ts` (rewritten around an
explicit `RAW_HATIMS` table; all 70 previously-review cells now verified),
`content/manuscripts/valueReconciliation.ts` (generalized the
stated-count-confirms-Hatim branch beyond the Ayuba special case),
`content/manuscripts/abjad.ts` (updated the Iddris/Ayuba/Ali explanatory
notes to reflect the new Hatim evidence — no value changed),
`content/manuscripts/hatimComplete.test.ts` (new),
`content/manuscripts/reconciliation.test.ts` (rewritten for the new data),
`content/manuscripts/starUses.test.ts` (three assertions updated),
`app/books/[id]/read/page.tsx` (two explanatory paragraphs updated).
`starUses.ts`, `stars.ts`, `hatimPattern.ts`, `HatimDiagram.tsx`,
`casting.ts`, `chartModel.ts`, `ruleEngine.ts`, `operations.ts`, `types.ts`
all untouched — the pattern diagnostic's own logic did not need to change to
correctly classify the new data.

**Browser verification.** Checked at 390×844px (mobile) and with
`data-reader-size="xlarge"`: zero occurrences of "under review" anywhere on
the page (down from the prior state), no horizontal overflow
(`scrollWidth === clientWidth === 375`), all three numeral modes render
correctly, and the three explicitly-flagged regression cases (Ibrahim
142/145/144, Ali 322/325/324, Usman 108/102/105) render exactly as supplied
in both the visual grid and the screen-reader cell list.

**Not deployed, not pushed** — per this prompt's explicit instruction.

---

## Prompt 24 — Adam Hatim correction

**A single-star correction, applied directly.** A follow-up manuscript check
found Adam's variable Hatim cells were 62/61/60, not the 22/21/20 recorded in
Prompt 23. `content/manuscripts/hatim.ts`'s `RAW_HATIMS` entry for `adam` was
updated to `[62, 61, 60]`; no other star's data was touched. Coverage stays
128/128 verified — this is a correction to an already-verified cell, not a
new one being resolved.

**This changes Adam's pattern-diagnostic result.** With the new values,
Adam's three cells now all imply N=66 (`62+4`, `61+5`, `60+6`) — exactly
matching both the stated recitation count and the Abjad sum of الله. Adam
moves from `not_confirmed` (previously implying an unexplained N=26) to
`confirmed_by_source`, and its `valueReconciliation` entry moves from
`'partial'` to full `'verified'` confidence, alongside Mahadi, Issah, Umar,
Sulemana, Hassan & Hussein, and Musah (now seven stars, not six, whose
stated count, Abjad sum, and Hatim-derived N all agree). Nuhu — which
happened to share Adam's old, now-superseded 22/21/20 values — was left
untouched, since the user's correction named only Adam; its own
`not_confirmed` status (N=26, matching neither its stated nor Abjad value of
66) stands unless it is independently re-checked.

**Tests updated to match:** `hatimComplete.test.ts` (Adam's expected table),
`reconciliation.test.ts` (Adam moved from the not-confirmed/partial groups
into the confirmed-by-source/verified groups; the Nuhu-only assertions kept
separate). Full suite: 2,255 tests passing (unchanged count — no test was
added or removed, only their expected values). `tsc --noEmit` clean, `next
build` clean.

**Not deployed, not pushed.**

---

## Prompt 25 — Ibrahim Hatim correction

**A single-cell correction.** A further manuscript check found Ibrahim's
`topMiddle` cell was 146, not the 142 recorded in Prompt 23; `middleLeft`
(145) and `bottomRight` (144) are unchanged. `RAW_HATIMS`'s `ibrahim` entry
was updated to `[146, 145, 144]`.

**This resolves Ibrahim's own pattern conflict.** With 142, Ibrahim's three
cells implied N=146/150/150 — a real disagreement (`conflicting`). With 146,
all three now imply N=150 exactly (`146+4`, `145+5`, `144+6`), matching both
Ibrahim's stated recitation count and its Abjad sum (عليم = 150). Ibrahim
moves from `conflicting`/`'partial'` to `confirmed_by_source`/`'verified'` —
now 11 of 16 stars confirm a single N (up from 9), and only four (Yussif,
Kalla Allahu, Ali, Usman) still conflict with themselves. Ali (322/325/324)
and Usman (108/102/105) remain the standing proof that the N-4/N-5/N-6
pattern is not a universal generator — Ibrahim is no longer part of that
proof, since its corrected values do fit.

**Tests updated:** `hatimComplete.test.ts` (Ibrahim's expected table, and
the non-formula regression test narrowed to Ali/Usman only),
`reconciliation.test.ts` (Ibrahim moved between groups in four separate
assertions). Full suite: 2,256 tests passing. `tsc --noEmit` and `next
build` clean. Verified live in-browser: Ibrahim's Hatim renders ٣/١٤٦/١ ·
١٤٥/Intentions/٥ · ٢/٤/١٤٤.

**Not deployed, not pushed.**

---

## Prompt 26 — Restore the missing book opening + Chapter 1 source layout

**The gap.** The reader started the book at "Chapter 1," with the
Introduction ("What is Geomancy?") nested inside that chapter's own
section — `{chapter.id === 'drawing-a-chart' ? <Prose paragraphs={INTRODUCTION} /> : null}`
rendered the Introduction's five paragraphs directly above Chapter 1's own
body, under a single "Chapter 1" heading. The Dedication (source page 1) was
never rendered anywhere. Chapter 1's own body was an accurate prose
paraphrase of the Counting and Cancelling Methods (already present, already
tested, not rewritten here) but had none of the source's worked examples or
diagrams: the Counting Method's two labelled dot-figure examples, the
Cancelling Method's four tally-mark examples, the "In adding stars"
combination sequence (H1+H2→H9 … H15+H1→H16), or the Bazdaaho formula's
letter-value table and four worked examples.

**What was added — `content/manuscripts/chapterOneDiagrams.ts` (new).**
Structured data for all four diagram types, transcribed from the source
(pages 4-6) and verified before being treated as data:

- **Counting Method** — two worked examples, four tally lines each. The
  source draws a hand figure under each raw count; magnified dot-counting
  against all six labelled figures on the page confirmed, 6/6, that the
  figure for raw count N is exactly `STARS.find(s => s.number === N).pattern`
  — the manuscript's own Bazdaaho numbering. The examples' figures are
  therefore looked up from the existing, already-tested `STARS` array
  (`starForCount()`), not redrawn or re-guessed.
- **Cancelling Method** — four worked examples, four typeset tally lines
  each, transcribed verbatim from the PDF's own text layer. The source does
  not label these four examples with a stated numeric result the way it
  does the Counting Method's, so none is computed or asserted here — the
  tokens (`'|'`/`'||'`) are reproduced exactly as printed.
- **Addition sequence** — the source's "In adding stars:" combination chain
  (Mothers+Daughters → Nieces → Witnesses → Judge → Reconciler) restated as
  house-number pairs only (`H1+H2→H9` … `H15+H1→H16`). Structural, not a
  re-derivation: it states the same sequence the protected `buildChart()`
  already computes, with no specific figure values asserted.
- **Bazdaaho formula** — the letter-value table (four entries) and its four
  worked examples. One table character extracts as "Ͻ", which does not
  match a standard Arabic letterform; it is flagged with a note and
  reproduced exactly as printed rather than guessed at. Eg. 1's own working
  line sums only three of the table's four values (2+7+8=17-16=1) rather
  than all four — an internal source inconsistency, reproduced verbatim
  rather than corrected (`BAZDAAHO_EG1_NOTE` documents this explicitly).
- The parity-addition rule ("2+2=2, 1+2=1, 1+1=2") is restated as three
  worked instances for the diagram, cross-checked in tests against the
  protected engine's own `addRows()` — same function, not reimplemented.

**Four new presentational components** consume this data:
`components/books/CountingMethodDiagram.tsx`,
`CancellingMethodDiagram.tsx`, `AdditionSequenceDiagram.tsx`,
`BazdaahoFormulaDiagram.tsx`. All deterministic HTML/CSS (dot spans, thin
tally bars, a letter-value grid) — no images, no canvas, no new SVG
dependency — matching `FigureGlyph`'s existing approach so figures stay
sharp at any zoom and scale with the reader's text-size setting.

**`content/manuscripts/master-of-geomancy-vol1.ts`:** added
`DEDICATION_TITLE` ("Dedication") and `INTRODUCTION_TITLE` ("What is
Geomancy?") — the Introduction's own source heading, carrying no chapter
number. Corrected `DEDICATION`'s wording against the source page itself:
parenthetical names in place of the previous em-dash asides, "Jannatul
Fridaus" as printed (not "Firdaus"), and the source's own sentence breaks
preserved. No new names were introduced — the dedication still names
exactly the same two parties (the sheikh/mentor, and the parents).
`CHAPTERS` itself (chapter ids, numbers, titles, and Chapter 1's existing
prose body) is unchanged.

**`app/books/[id]/read/page.tsx` restructured.** For the Master of Geomancy
book only (`book.id === 'master-of-geomancy-vol-1'`; Kanzul Mikban's reader
branch is untouched), the page now renders, in order: a Dedication section
(no chapter number, its own "Opening" eyebrow, the dedication text styled as
a centred italic opening page rather than running body text) → an
Introduction section (no chapter number, eyebrow "Introduction", heading
"What is Geomancy?") → Chapter 1 onward via the existing `CHAPTERS.map`.
The old `INTRODUCTION` nesting inside `drawing-a-chart` was removed — the
Introduction is rendered once, before any chapter, not duplicated. Chapter
1's existing prose body is unchanged; the four new diagrams are appended
after it. The Bazdaaho formula diagram is appended after Chapter 2's
existing prose body, keyed off `chapter.id === 'bazdaaho-method'`.

**Engine untouched.** `git diff --name-only` against `casting.ts`,
`lib/raml/engine/chartModel.ts`, `ruleEngine.ts`, `operations.ts`,
`types.ts`, and `content/stars.ts` is empty — none of these files changed.
The new Addition-sequence diagram states the same combination sequence
`buildChart()` already computes, and the parity-rule diagram's three
examples are asserted equal to `addRows()`'s own output in
`chapterOneDiagrams.test.ts`, rather than reimplementing either.

**Tests.** Two new files: `content/manuscripts/chapterOneDiagrams.test.ts`
(15 tests — every Counting Method figure verified against `STARS`, the six
magnified-verified figures asserted by name, Cancelling Method tokens
restricted to `'|'`/`'||'` with no invented remainder field, the addition
sequence's eight steps, the parity rule cross-checked against `addRows()`,
the Bazdaaho table and its flagged glyph, Eg. 1's discrepancy reproduced
verbatim) and `content/manuscripts/master-of-geomancy-vol1.test.ts` (6
tests — Dedication/Introduction are not `CHAPTERS` entries, the Introduction
heading carries no "chapter" wording, Chapter 1 still leads `CHAPTERS` as
before, the Dedication names exactly its two source parties). Full suite:
2,278 tests passing (2,256 prior + 22 new). `tsc --noEmit` clean, `next
build` clean (19 static/SSG routes generated, including both book readers).

**Browser-verified** at a 390×844 mobile viewport: no horizontal overflow at
either Standard or Extra Large reader size; section order is
dedication → introduction → drawing-a-chart → bazdaaho-method → …; the
Dedication renders first with no chapter number; the Introduction renders
"What is Geomancy?" with no "Chapter 1" label; Chapter 1 opens with "How to
Draw a Chart in Geomancy" followed by its existing prose, then all three new
diagram blocks; the Bazdaaho Formula diagram renders after Chapter 2's
prose; Arabic star names and the Hatim diagrams elsewhere on the page still
render correctly (20 `dir="rtl"` elements found, unaffected by this change).

**Not deployed, not pushed** — per this prompt's explicit instruction.

---

## Prompt 27 — Chapter 1: reposition practical examples under each method

**The gap.** Prompt 26 restored the Counting Method, Cancelling Method and
star-addition diagrams, but rendered all three in a single block after
Chapter 1's entire prose body — so a reader met the Counting Method's
explanation, then the Cancelling Method's explanation, then the Banaat and
chart-building paragraphs, and only after all of that, the three diagrams
grouped together. The source teaches and demonstrates one method at a time;
the practical example belongs immediately under the method it demonstrates,
not in a separate section at the chapter's end.

**What changed.** `app/books/[id]/read/page.tsx`'s rendering of the
`drawing-a-chart` chapter only. `chapter.body` itself (its five paragraphs:
[0] intro sentence, [1] Counting Method explanation, [2] Cancelling Method
explanation, [3] Banaat/Daughters formation, [4] chart continues building)
is unchanged — this is purely how those same five paragraphs are
interleaved with the diagram components on the page:

1. `chapter.body[0]` (intro sentence).
2. "The Counting Method" heading → `chapter.body[1]` → `CountingMethodDiagram`
   (its own two worked examples and closing "umuhat mother stars" line,
   unchanged).
3. "The Cancelling Method" heading → `chapter.body[2]` → `CancellingMethodDiagram`
   (its own four worked examples, unchanged).
4. `chapter.body.slice(3)` (Banaat formation, then chart-building) →
   "Adding Stars: From Mothers to the Full Chart" heading →
   `AdditionSequenceDiagram`.

The Bazdaaho Formula diagram's position is unchanged — still appended after
Chapter 2's own prose body, keyed off `chapter.id === 'bazdaaho-method'`,
outside Chapter 1 entirely. No diagram component was rewritten, and none is
rendered twice — `CountingMethodDiagram`, `CancellingMethodDiagram`,
`AdditionSequenceDiagram` and `BazdaahoFormulaDiagram` are each called
exactly once, same as before, only relocated within Chapter 1's JSX.

**Engine untouched.** `git diff --name-only` against `casting.ts`,
`lib/raml/engine/chartModel.ts`, `ruleEngine.ts`, `operations.ts`,
`types.ts` and `content/stars.ts` is empty; only `page.tsx` changed for
this prompt (no data file, no diagram component, no content file touched).

**Tests.** Full suite: 2,278 tests passing — unchanged count, since no data
or component logic changed, only page layout. `tsc --noEmit` clean, `next
build` clean.

**Browser-verified** at 390×844: Dedication still renders first, Chapter 1
still directly follows the Introduction. Inside Chapter 1's rendered HTML,
marker-position checks confirm, in order: Counting Method heading →
explanation → its two worked examples → "This first 4 is called umuhat
mother stars." → Cancelling Method heading → explanation → its four worked
examples → the Banaat paragraph → the chart-continues paragraph → the
Addition Sequence heading and its combination chips. The Bazdaaho Formula
diagram is absent from Chapter 1's HTML and present, once, in Chapter 2's.
No duplicated diagram markers (each star name, each "Eg. N." label, the
Addition Sequence heading — all appear exactly once). No horizontal
overflow at Standard or Extra Large reader size.

**Not pushed, not deployed** — per this prompt's explicit instruction.

---

## Prompt 28 — Counting Method: make the demonstration manuscript-faithful

**The gap.** Prompt 26/27's `CountingMethodDiagram` showed only the final
result of each counting line — a card with the arithmetic label, the
resulting figure, and the star's personal name (e.g. "Sulemana"). That
tells a reader the answer without showing the method: the source's own
page shows a countable row of dots per line, the source's own circled line
numbers (①②③④), and a small "4 3 2 1" result strip, none of which existed
in the prior rendering. The prior rendering also substituted the
Bazdaaho-order star names for the source's own circled-number labelling,
which the source's Chapter 1 demonstration never does.

**Data model (`content/manuscripts/chapterOneDiagrams.ts`).**
`CountingMethodLine` gained three fields: `circledNumber` (①/②/③/④, the
source's own line label), `rawCount` (the literal number of dots the
source draws for that line *before* any reduction — 18 and 19 for the two
reduced lines, not 2 and 3), and `arithmeticLabel` (renamed from
`rawLabel`, unchanged in content — "10", "18 - 16 = 2", etc., exactly as
printed). `reducedValue` is unchanged and still only feeds the existing
`starForCount()` lookup against `STARS` — no new calculation, no changed
star values. `CountingMethodExample` gained `resultOrder: [4,3,2,1]`, the
source's own display order for its four-figure result strip (the reverse
of drawing order, matching "starting counting from the fourth line, right
to left"). A new constant, `COUNTING_DIRECTION_NOTE`, quotes the source's
counting-direction sentence verbatim ("Starting counting from 4th line
from your right to the left…") exactly as supplied in this prompt, with no
extension past what was quoted. All six previously-verified reduced values
(10, 12, 14, 2, 13, 15, plus 3) and their star-figure lookups are
byte-identical to Prompt 26 — this is additive data, not a recalculation.

**`components/books/CountingMethodDiagram.tsx` rebuilt.** Each of the four
lines per example now renders: the circled number and a "Line N" label, a
`CountingMarks` row of `rawCount` individual dot marks (a reader can
literally count them — 18 or 19 marks for the reduced lines, not a
pre-reduced 2 or 3), the arithmetic label, and the resulting figure via the
same `FigureGlyph`/`starForCount` lookup as before. A `ResultOrderStrip`
below the four lines reproduces the source's own "4 3 2 1" result display,
each position pulling that line's already-looked-up figure — the same
data, shown a second time only because the source itself shows it a second
time. `COUNTING_DIRECTION_NOTE` is quoted, italicised, between the two
examples — where the source prints it. The star's personal name (Sulemana,
Nuhu, Yunus, Adam, Hassan & Hussein, Usman) is no longer visible text
anywhere in the component; it survives only as `sr-only` accessibility text
on each figure ("Resulting figure: Sulemana") and inside the file's own
verification comments — internal/source metadata, never a replacement for
the source's circled-number labelling, per this prompt's explicit
instruction.

**`content/manuscripts/master-of-geomancy-vol1.ts`:** Chapter 1's Counting
Method paragraph (`CHAPTERS[0].body[1]`) was reduced to the source's own
literal lead sentence — "**The Counting Method.** You will make 4 straight
lines with dots as shown below." — replacing the earlier paraphrase
("traditionally by striking the sand quickly, without deliberately
counting, so the number falls to chance... Starting from the fourth
line... these first four are called the Umuhat, the Mother stars."), which
this prompt identified as an invented elaboration not present on this
source page. The counting-direction sentence and the "these first four are
called Umuhat" line are not lost — they now appear where the source itself
places them: the direction sentence between the two worked examples (via
`COUNTING_DIRECTION_NOTE`, already rendered by the diagram) and the Umuhat
line as `COUNTING_METHOD_CLOSING` after both examples (already rendered by
the diagram since Prompt 26) — so nothing is duplicated, only relocated
into the diagram it was describing. The Cancelling Method paragraph
(`body[2]`) and the rest of the chapter are unchanged.

**`app/books/[id]/read/page.tsx` is unchanged** for this prompt — the
existing splice point (Counting Method heading → `body[1]` → diagram) from
Prompt 27 already places the corrected paragraph and the rebuilt diagram in
the right position; no page-level restructuring was needed.

**Engine untouched.** `git diff --name-only` against `casting.ts`,
`lib/raml/engine/chartModel.ts`, `ruleEngine.ts`, `operations.ts`,
`types.ts` and `content/stars.ts` is empty. Only content and component
files changed: `chapterOneDiagrams.ts`, `CountingMethodDiagram.tsx`,
`master-of-geomancy-vol1.ts`, and their two test files.

**Tests.** 5 new regression tests in `chapterOneDiagrams.test.ts` (circled
numbers in drawing order; `rawCount` distinct from `reducedValue` for the
two reduced lines and correct for all six unreduced ones; `resultOrder`
equals `[4,3,2,1]` for both examples; `COUNTING_DIRECTION_NOTE`'s exact
quoted text) and one in `master-of-geomancy-vol1.test.ts` (the corrected
lead sentence is present, the "striking the sand" phrase is absent). Full
suite: 2,283 tests passing (2,278 prior + 5 new). `tsc --noEmit` clean,
`next build` clean.

**Browser-verified** at 390×844: no horizontal overflow at Standard or
Extra Large reader size. Marker-position checks on the rendered HTML confirm
the full order — Counting Method heading → corrected lead paragraph → e.g.
1 (circled numbers, "Line N" labels, dot-mark rows with correct
`aria-label` counts [10,12,14,18] → result strip "4 3 2 1") → the
direction-note quote → e.g. 2 (dot-mark counts [13,15,18,19] → its own
result strip) → the "umuhat mother stars" closing line → Cancelling
Method. Confirmed, after stripping React's hydration comment markers and
each figure's `sr-only` span, that none of the six star names appear as
visible text anywhere in Chapter 1's rendered HTML — each survives only
inside its `sr-only` span, exactly once per occurrence. "e.g." (2, one per
example), circled numbers (8, four per example), and "Resulting stars"
strips (2) each appear exactly once where expected — no duplicated
examples.

**Not pushed, not deployed** — per this prompt's explicit instruction.

---

## Prompt 29 — Redesign the Cancelling Method as a source-faithful practical tutorial

**The gap.** The Cancelling Method diagram showed each example as four
static tally-mark rows with no derived result — a reader saw the source's
own typeset marks but not how they resolve into a line mark, a Mother
Star, or the rest of the chart. There was also no complete-chart view, and
the "In adding stars" chain showed abstract "H1 + H2 → H9" text chips
rather than real figures.

**How the Cancelling Method was improved.** `CancellingMethodDiagram.tsx`
now shows, per line, a four-stage flow: the original line as a countable
row of plain dots → the same dots grouped and cancelled in pairs (each
"||" pair struck through, the lone surviving "|" left plain) → what
remains (one or two dots) → that remainder restated as the line's formal
mark (`DotRowGlyph`). All four stages display one value —
`cancelledLineMark(tokens)`, a new pure function in
`chapterOneDiagrams.ts` — derived purely from the odd/even parity of the
already-verified tokens (a lone "|" survives → mark 1; all "||" → mark 2),
the same convention already stated in the source and cross-tested
elsewhere against `addRows()`. No token, dot count, or example was altered
— `CANCELLING_METHOD_EXAMPLES` is byte-identical to Prompt 26.

**How right-to-left cancellation is demonstrated.** Each line's
"cancel in pairs" row carries the caption `CANCEL_DIRECTION_LABEL` ("Cancel
pairs from right → left") and an accessible label stating the direction
and outcome explicitly (`"Line N: pairs cancelled from right to left, one
dot remains"`). The label is text, not animation-only, so it survives at
any reader size or with animations disabled.

**How the Mother Stars are shown.** Each example's four lines' marks are
recomputed via `cancellingMotherPattern()` and stacked into that example's
own "Mother Star N" (Eg. 1 → Mother Star 1 … Eg. 4 → Mother Star 4),
rendered with the existing `FigureGlyph`. After all four, the source's own
transition line is quoted verbatim as `CANCELLING_METHOD_CLOSING`: "So we
have 4 stars as the umuhat (Mother stars) as shown above, from there, use
the first 4 stars to get the second 4 (Banaat - Children stars) in
geomancy."

**How Banaat/Children Stars are demonstrated.** `AdditionSequenceDiagram`
gained a "From Mothers to Daughters (Banaat)" section: the four Mother
figures on the left, an arrow, the four Daughter figures on the right —
`CHAPTER_ONE_DAUGHTERS`, produced by calling `deriveDaughters()` (the
protected engine's own function, imported read-only from
`lib/raml/casting.ts`) on the four Mother patterns above, not a hand
re-derivation.

**How H1-H16 are represented.** The same file's "In adding stars" section
now shows all eight steps (H1+H2→H9 … H15+H1→H16) with real figures at
every position, not text chips. `CHAPTER_ONE_ADDITION_STEPS` (new) carries
each step's real input and result patterns, looked up from
`CHAPTER_ONE_CHART` — the full sixteen-house chart built by calling
`buildChart()` (the same protected function the live casting flow calls)
on this chapter's own four Mother patterns. This is a deliberate,
explicitly-instructed exception to this file's usual practice of keeping
Chapter 1's educational data independent of the engine: the prompt asked
for "the existing geomancy figure-combination logic" for this sequence, so
`buildChart`/`deriveDaughters`/`addPatterns` are called directly rather
than hand-duplicated. Each step's `resultPattern` is independently
recomputed via `addPatterns()` and cross-checked in tests against the
chart's own already-built house for that number.

**Complete chart status.** A new component, `CompleteChartDiagram.tsx`,
renders all sixteen houses from `CHAPTER_ONE_CHART`, grouped by the
chapter's own existing terminology (`CHART_HOUSE_GROUPS`: Mothers —
Umuhat, Daughters — Banaat, Nieces, Witnesses, Judge, Reconciler — no new
terms). It is preceded by the source's own quoted line,
`COMPLETE_CHART_INTRO`: "So we have the chat as follows:" (reproduced
exactly as printed — "chat" is the source's own spelling, not corrected,
since no general typo-correction policy is established for this file and
the prompt's own fallback is to preserve source wording). Responsive: each
group's cards wrap via flexbox rather than a fixed grid, so a two- or
one-card group (Witnesses, Judge, Reconciler) never stretches oddly at any
width.

**Chapter 1 body text.** `content/manuscripts/master-of-geomancy-vol1.ts`'s
Cancelling Method paragraph (`CHAPTERS[0].body[2]`) was reduced to the
source's own literal lead sentence — "**The Cancelling Method.** You will
make 4 straight lines with dots and start cancelling 2, 2, 2, from your
right to the left as shown below." — replacing the earlier paraphrase,
following the same precedent Prompt 28 set for the Counting Method's lead
sentence. The detail it used to carry ("what's left over becomes the
mark," "stack the four marks," "repeat for Mothers two, three and four")
is not lost — it is now taught visually, by the diagram itself, exactly
where the source teaches it.

**`app/books/[id]/read/page.tsx`:** one new splice point added after the
existing "Adding Stars" block, still inside the `drawing-a-chart` fragment
— "The Complete Chart" heading, `COMPLETE_CHART_INTRO`, and
`CompleteChartDiagram`. Ordering confirmed unchanged otherwise: Counting
Method → Cancelling Method → Banaat/chart-building prose → Adding Stars →
Complete Chart → Chapter 2 (Bazdaaho).

**Engine untouched.** `git diff --name-only` against `casting.ts`,
`lib/raml/engine/chartModel.ts`, `ruleEngine.ts`, `operations.ts`,
`types.ts` and `content/stars.ts` is empty. `casting.ts`'s
`buildChart`/`deriveDaughters`/`addPatterns` are imported and called
read-only from `chapterOneDiagrams.ts`, per this prompt's explicit
instruction to reuse "the existing geomancy figure-combination logic" —
this is a new dependency, not a modification. `components/raml/FigureGlyph.tsx`
gained one new export, `DotRowGlyph` (a single-line dot glyph, extracted
from `AdditionSequenceDiagram`'s previously-local component so
`CancellingMethodDiagram` could reuse it); `FigureGlyph` itself is
unchanged.

**Tests.** `chapterOneDiagrams.test.ts` gained a new "Mothers to the
complete chart (H1-H16)" describe block plus additional Cancelling Method
tests: parity-derived line marks cross-checked against raw token-count
odd/even for every line in every example; right-to-left direction wording;
no invented numeric field on the example objects; all four Mother Stars
valid; `deriveDaughters`' transpose (not addition) verified line-by-line;
the full sixteen-house chart's first eight houses equal the Mothers then
Daughters; all eight addition steps cross-checked against `addPatterns()`
and against the chart's own built houses; the complete-chart intro quote;
and every house 1-16 appearing in `CHART_HOUSE_GROUPS` exactly once. Full
suite: 2,292 tests passing (2,283 prior + 9 new). One pre-existing
low-contrast class (`text-sand/50` on three `aria-hidden` arrow
separators) was caught by the existing AA-contrast guard and raised to
`text-sand/65`, the established floor. `tsc --noEmit` clean, `next build`
clean.

**Browser-verified** at 390×844, Standard and Extra Large reader size: no
horizontal overflow at either size. Marker-position checks on the
rendered HTML confirm strict ordering — Counting Method → its closing line
→ Cancelling Method heading → corrected lead sentence → Eg. 1 → its
right-to-left label → Mother Star 1 → Eg. 2 → Mother Star 2 → Eg. 3 →
Mother Star 3 → Eg. 4 → Mother Star 4 → the closing "umuhat" quote → the
Banaat prose paragraph → the Adding Stars heading → Combining Two Lines →
From Mothers to Daughters → In Adding Stars → The Complete Chart heading →
its intro quote → the Mothers group → the Reconciler group. No duplicated
examples: "Eg. 1.", each "Mother Star N", "The Complete Chart", and the
Adding Stars heading each appear exactly once.

**Not pushed, not deployed** — per this prompt's explicit instruction.

---

## Prompt 30 — Restore the complete Bazdaaho Method from the manuscript

**What was missing.** `BazdaahoFormulaDiagram` showed the formula as a
four-column grid of letter/value cards and the four worked examples as
bare arithmetic text ("= 2", "= 4") — no geomantic figure anywhere, and no
representation at all of the arrangement the whole method exists to
produce: the sixteen stars, Yussif to Musah, laid out in the source's own
spatial rows. A reader saw the formula's inputs but never what it
actually arranges.

**Formula restoration.** `BAZDAAHO_FORMULA_TABLE` gained a `rowLabel`
field carrying the source's own "I"/"II" row marks (I, I, II, I), and the
diagram now renders it as four stacked rows (`rowLabel — glyph = value`)
rather than a four-column grid, matching "a visual four-row mapping." The
one previously-flagged glyph ("Ͻ") is unchanged and still marked
unresolved, with its note unchanged; no glyph was substituted for it.

**Four worked examples restoration.** Each example now shows its actual
resulting figure (`FigureGlyph`, looked up via a new
`starForBazdaahoResult()` — the example's `result` value is that star's
own existing Bazdaaho number, so this reuses `STARS` directly, not a new
lookup table) alongside its full source arithmetic. Eg. 1 was corrected to
match this prompt's own restated source quote — `values` changed from
`[2,7,8]` to `[2,7,4,8]` and `workingLine` to "2 + 7 + 4 + 8 = 17 − 16 = 1,
therefore it's 1" (all four table values now named, exactly as quoted) —
the arithmetic is still not corrected: the stated total (17) does not
match the actual sum of those four values (21), preserved exactly as
instructed rather than recomputed; `BAZDAAHO_EG1_NOTE` was reworded to
describe the inconsistency from this angle. Eg. 3's working line
("7 + 4 + 8 = 19 − 16 = 3") was already correct and is unchanged. Eg. 2
and Eg. 4 are unchanged (`= 2`, `= 4`) — the source gives no fuller
working for either.

**Complete stars 1–16 arrangement restoration.** A new component,
`BazdaahoArrangementDiagram.tsx`, and new data, `BAZDAAHO_ARRANGEMENT`,
reproduce the source's three printed rows exactly as given in this
prompt — top `[8,7,6,5,4,3,2,1]`, middle `[12,11,10,9]`, lower
`[14,15,13,16]` — left-to-right order preserved, not resorted ascending.
Every figure is looked up from the existing `STARS` array by number (no
second star-definition system, per this prompt's explicit instruction).

**Mobile design approach.** Each row's cards wrap via flexbox (`flex
flex-wrap`, fixed card width) rather than a fixed-column grid, so the
eight-star top row reflows to two rows of four on a 390px viewport without
any card stretching or shrinking below a readable size — achieving the
prompt's suggested "responsive two-stage presentation" through wrapping
rather than a second, separate UI state, while every row keeps its own
label ("Stars 1–8" / "Stars 9–12" / "Stars 13–16") and the source's
row-grouping and internal ordering stay visible at every width.

**Source-fidelity decisions.** The one unresolved glyph stays unresolved
(no Arabic letter substituted). Eg. 1's arithmetic inconsistency is
preserved, updated only because this prompt itself restated the source's
own printed working line more completely (all four values, not three) —
the correction is to fidelity, not away from it, and the "total doesn't
match the sum" inconsistency is preserved either way. `BAZDAAHO_METHOD_INTRO`
quotes the source's transition sentence into the formula verbatim,
positioned directly above it, without replacing the chapter's own existing
paraphrase in `master-of-geomancy-vol1.ts` (which was not flagged as
invented this time, so left unchanged, unlike the Counting/Cancelling
Method lead sentences in Prompts 28-29).

**Engine untouched.** `git diff --name-only` against `casting.ts`,
`lib/raml/engine/chartModel.ts`, `ruleEngine.ts`, `operations.ts`,
`types.ts` and `content/stars.ts` is empty. Every figure in both the
formula's worked examples and the complete arrangement is read from the
existing `STARS` array; nothing computes or infers a pattern.

**Tests.** `chapterOneDiagrams.test.ts` gained: the intro quote; row
labels (I/I/II/I); the unresolved glyph's row label; Eg. 1's corrected
values/workingLine and the reworded note; Eg. 3's working line; every
worked example's figure cross-checked against `STARS`, plus confirmation
the four results are exactly stars 1-4 in order; the arrangement's three
rows matching the prompt's exact given order; all sixteen stars
represented exactly once (no duplicate, no omission); and every arranged
star's figure existing in `STARS` with a valid four-line pattern. Full
suite: 2,298 tests passing (2,292 prior + 6 new). `tsc --noEmit` clean,
`next build` clean.

**Browser-verified** at 390×844, Standard and Extra Large reader size: no
horizontal overflow at either size. Marker-position checks on the
rendered HTML confirm order — Chapter 2 heading → the formula's intro
quote → "The Bazdaaho Formula" → the four-row formula table → Eg. 1
(with its full four-value working line) → Eg. 2 → Eg. 3 → Eg. 4 → the
Eg. 1 note → "The Complete Bazdaaho Arrangement" → Stars 1–8 → Stars 9–12
→ Stars 13–16 → Chapter 3. Confirmed the Complete Chart section (Prompt
29) still precedes Chapter 2 correctly. No duplicated sections: "Eg. 1.",
the arrangement heading, and each row label appear exactly once as visible
text (a second occurrence of each row label found only inside its own
`aria-label` attribute, not a duplicate render).

**Not pushed, not deployed**, consistent with this session's established
practice of committing locally and pushing only on explicit request.

---

## Prompt 31 — Kanzul Mikban Chapter 151: restore the dream-interpretation figures

**The gap.** Chapter 151, "Dreams and Their Interpretations," teaches
sixteen dream meanings, each keyed to a small four-row geomantic figure
the source prints immediately after that entry's own "If it's" /
"If it's:". The app's stored chapter text (`content/manuscripts/
kanzul-mikban.ts`) already carried the full prose accurately, but every
one of the sixteen figures was missing — the source page's own text layer
drops embedded raster images, so PDF text extraction produced "If it's,"
with nothing between the words and the comma, and nothing had ever
supplied the sixteen dropped figures since.

**Identifying each figure.** Confirmed via `f9ca6042-KM_91_to_16.pdf`
(manuscript pages 112-116, matching this prompt's own stated page
mapping exactly). Each of the sixteen embedded figure images was located
by its own exact PDF image-placement rectangle (`page.get_image_rects`),
not by guessed screen position or assumed Bazdaaho order, then rendered
at high resolution and read as a four-row dot pattern — cross-checked
programmatically via connected-component blob detection clustered into
rows, not by eye alone. Every resulting pattern was matched against the
existing canonical `STARS` array by exact equality.

**Result — `content/manuscripts/dreamInterpretations.ts` (new):**
```
#1  -> Yussif [1,1,2,1]   #9  -> Kalla Allahu [1,1,2,2]
#2  -> Adam [1,2,2,2]     #10 -> Sulemana [1,2,2,1]
#3  -> Mahadi [2,1,1,1]   #11 -> Ali [2,1,1,2]
#4  -> Yussif [1,1,2,1]   #12 -> Nuhu [2,2,1,1]
#5  -> Ibrahim [1,1,1,1]  #13 -> Hassan & Hussein [1,1,1,2]
#6  -> Issah [1,2,1,2]    #14 -> Yunus [1,2,1,1]
#7  -> Iddris [2,2,1,2]   #15 -> Usman [2,1,2,1]
#8  -> Ayuba [2,2,2,1]    #16 -> Musah [2,2,2,2]
```
Two source characteristics, confirmed rather than "corrected": #1 and #4
print the identical Yussif figure (independently re-verified, not a
misread), and Umar's figure ([2,1,2,2]) does not appear among the
sixteen at all — the chapter's sixteen dream-figures are not a
one-to-one relabelling of the sixteen Bazdaaho stars, and neither was
forced into that shape. Every pattern is looked up from `STARS`, not
redefined.

**Restoring the figures without rewriting any text.** Rather than
hand-editing `kanzul-mikban.ts`'s paragraph strings (risking a typo
across four long, multi-interpretation paragraphs), a pure parser,
`parseDreamParagraph()`, splits each existing paragraph string at its own
"N. If it's[:]" markers via regex — `lead` (any text before the first
marker, e.g. the chapter's own intro sentence) plus, per interpretation,
`markerText` (the literal "N. If it's" or "N. If it's:" substring) and
`rest` (everything up to the next marker, starting with the source's own
comma). `kanzul-mikban.ts` itself is untouched — confirmed via
`git diff --stat`, which shows zero changes to that file. A new
component, `DreamInterpretationsBody.tsx`, renders each interpretation as
its own card: `markerText`, then `FigureGlyph` (looked up via
`getDreamInterpretationPattern`), then `rest` — restoring the figure in
the exact textual position the source places it, while every word of the
interpretation and sadaka text renders unchanged.

**Wiring.** `app/books/[id]/read/page.tsx`'s existing Kanzul Mikban
render branch now special-cases `chapter.id === 'dreams-and-their-
interpretations'` to use `DreamInterpretationsBody` instead of the
generic `Prose` component; every other KM chapter is unaffected.

**Engine and scope.** `git diff --name-only` against `casting.ts`,
`lib/raml/engine/chartModel.ts`, `ruleEngine.ts`, `operations.ts` and
`types.ts` is empty. No other chapter's rendering changed. Every figure
is read from the existing `STARS` array — nothing here defines a new
figure.

**Tests** (`dreamInterpretations.test.ts`, 12 new): exactly 16
interpretations; every figure non-null, four rows, each row 1 or 2 dots;
every interpretation matched to its expected star via an independently
hand-written table (not copy-pasted from the data file) and cross-checked
against `STARS` directly; the #1/#4 duplicate and Umar's absence both
asserted explicitly; order 1-16 preserved; and — the strongest of these —
a byte-for-byte (whitespace-normalized) reconstruction of every one of
Chapter 151's five paragraphs from `lead` + each item's `markerText` +
`rest`, proving no word was dropped, added, or reordered by the split.
Full suite: 2,310 tests passing (2,298 prior + 12 new). `tsc --noEmit`
clean, `next build` clean.

**Browser-verified** at 390×844, Standard/Large/Extra Large reader size:
no horizontal overflow at any size. All 16 `FigureGlyph` instances present
in Chapter 151's rendered HTML, each confirmed immediately adjacent to its
own "N. If it's" marker in strictly increasing order 1→16; sadaka
instructions, the "[unclear in the original]" notes, and the chapter's
intro sentence all confirmed present verbatim in the rendered page.

**Not pushed, not deployed**, per this prompt's explicit instruction.

## Prompt 32 — Bazdaaho formula: source-corrected letters and the general derivation rule

Prompt 30's Bazdaaho formula table carried two unresolved letters (a
third row transcribed as the un-matchable glyph "Ͻ", and a fourth row
transcribed as a placeholder Latin "Z") because the earlier extraction
could not confidently read the source's own Arabic for those two rows.
A follow-up prompt supplied the source-supported correspondence directly
— Line 1 (Head/Fire) Bāʾ (ب) = 2, Line 2 (Chest/Air) Zāy (ز) = 7, Line 3
(Waist/Water) Dāl (د) = 4, Line 4 (Feet/Earth) Hāʾ (هـ) = 8 — and,
critically, the general rule the formula itself implements: for each of
a figure's four lines, a one-dot line contributes its letter's value and
a two-dot line contributes 0; sum the active values, and if the total
exceeds 16, the figure number is the total minus 16.

**Letters corrected.** `BAZDAAHO_FORMULA_TABLE` (`chapterOneDiagrams.ts`)
now reads د for the third row and هـ for the fourth, replacing the
unresolved "Ͻ" and placeholder "Z"; the now-obsolete `note` field and its
"unresolved glyph" UI branch (`BazdaahoFormulaDiagram.tsx`) are removed.
Zāy (row 2) was deliberately left at value 7, per this prompt's explicit
instruction not to substitute the standard modern Abjad value. Each row
also now carries a `lineLabel` ("Line 1 — Head / Fire", etc.), rendered
alongside the letter and value.

**Eg. 1 reverted and correctly explained.** Prompt 30 had set Eg. 1's
worked example to a four-term form (`2+7+4+8=17-16=1`) based on an
imprecise restatement of the source's own working line, which is in fact
three-term (`2+7+8=17-16=1`) — the Line-3 (Dal) term is absent because
Eg. 1's figure (Yussif, pattern `[1,1,2,1]`) has two dots on that line,
which the general rule makes contribute 0. `BAZDAAHO_WORKED_EXAMPLES[0]`
and `BAZDAAHO_EG1_NOTE` were both corrected: the note now *explains* the
omitted term via the rule rather than describing it as an unexplained
arithmetic mismatch to merely preserve. Eg. 2/3/4 needed no changes —
independently verified as already consistent with the rule.

**General rule added and verified against all 16 stars.**
`BAZDAAHO_LINE_VALUES` (`[2,7,4,8]`) and `bazdaahoNumberFromPattern()`
implement exactly the stated rule — no invented completion. Applying it
to every pattern in the existing `STARS` array reproduces that star's own
`.number` for all 15 non-Musah stars. Star #16 (Musah, pattern
`[2,2,2,2]`, all two-dot lines) is an edge case the literal rule text
does not cover: a raw sum of 0 is not "greater than 16", so the function
returns 0 rather than silently mapping it to 16 — this is asserted
explicitly in the test suite rather than smoothed over. A new "How a
figure's number is found" subsection in `BazdaahoFormulaDiagram.tsx`
shows the per-line one-dot/two-dot contribution and the reduction step,
built from the same `BAZDAAHO_FORMULA_TABLE` data — no new star-figure
definitions, no engine changes.

**Engine and scope.** `git diff --name-only` against `casting.ts`,
`lib/raml/engine/chartModel.ts`, `ruleEngine.ts`, `operations.ts`,
`types.ts`, `content/stars.ts` and `master-of-geomancy-vol1.ts` is empty
— only `chapterOneDiagrams.ts`, `chapterOneDiagrams.test.ts` and
`BazdaahoFormulaDiagram.tsx` changed.

**Tests** (`chapterOneDiagrams.test.ts`): the corrected four letters and
their special (non-Abjad) correspondence, with Zāy=7 asserted explicitly;
the four `lineLabel`s; Eg. 1's reverted three-term form and its corrected
note wording; `BAZDAAHO_LINE_VALUES`; the general rule matched against
all 15 non-Musah stars; Musah's raw-sum-of-0 edge case asserted as 0, not
16; and Eg. 1's own figure (Yussif) re-derived by the general rule to
confirm it matches the worked example — 5 net new tests (plus several
existing Bazdaaho assertions revised in place for the corrected data).
Full suite: 2,315 tests passing (2,310 prior + 5 new). `tsc --noEmit`
clean, `next build` clean.

**Browser-verified** at 390×844: the corrected letters (د, هـ) present,
the old unresolved glyph and placeholder absent, all four line labels
present, the new system-rule subsection present, Eg. 1's three-term
working line present and the old four-term line absent, and the
corrected note's "contributes 0" wording present.

**Committed, not pushed** — awaiting an explicit push instruction, per
this session's established pattern.


