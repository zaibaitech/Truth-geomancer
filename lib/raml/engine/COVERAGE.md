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

## Totals (as of this stage — Prompt 6 reconciliation audit, chapters 1-60)

| | Count |
|---|---|
| Total source chapters (Kanzul Mikban, numbered 1-153) | 153 |
| Numbered chapters reviewed and entered into this engine | 60 (chapters 1-19, 20-32, 34-45, 47-55, 57-58, 60 — chapters 33, 46, 59 reviewed but out of scope/not computable, see below) |
| Numbered chapters not yet reviewed | 93 (chapters 61-153) |
| Unnumbered sub-chapters/continuations reviewed | 2 (the "Additional Methods — pregnant" fragment — 2 of its 3 methods registered under ch.47; the "Consequence of Friendship" fragment — not registered, out of numbered scope) |
| Questions registered in `QUESTION_REGISTRY` | **57** |
| Total methods across all registered questions | 112 |
| **Verified** (computed automatically, count toward the result — includes descriptive verdicts) | **90** |
| **Needs review** (calculable, but the rule itself is genuinely ambiguous) | **6** |
| **Uncertain** (not computable — almost always omitted source figures) | **16** |
| Automated tests covering this engine | 829 (all passing) |

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
| **Grand total (1-60)** | | **112** | **90** | **6** | **16** |

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
| Ch.41 Method 1, Ch.48 Methods 1-2, "pregnant" fragment Method 3 | **Confirmed unresolvable (Prompt 6)** — exhaustively re-searched both manuscripts; no table exists anywhere, and the book's own front matter (`KM_EDITION_NOTE`) explicitly confirms the gap. Now carries a machine-readable `reviewReasonCode: 'gender_classification_unsourced'`. Needs either a later chapter that defines it or an explicit product decision to adopt an outside classical-tradition table (not authorized by this or any prior stage) |
| Ch.46 | Talismanic diagram omitted ("[talismanic diagram in the original — not reproduced here]"); also architectural — even with the diagram, this is a ritual-practice chapter, not a chart-verdict method. **Permanently classified (Prompt 6)**: ritual procedure, not a missing method |
| Ch.58 vs. Ch.21 consistency | **RESOLVED (Prompt 6)** — confirmed an implementation inconsistency (Ch.21 predates the `resultKind: 'descriptive'` model), not a genuine source difference. Ch.21 Method 2 migrated to `resultKind: 'descriptive'` to match Ch.58 exactly; regression tests confirm the underlying calculation is unchanged |
| Ch.18, Method 3 ("some scholars") | **RESOLVED (Prompt 6)** — the source's own secondary "some scholars also say" rule was previously folded into cosmetic text on Method 3's verdict instead of counted independently. Split into Method 3 (primary rule) + a new Method 4 (the scholars' rule), each now independently contributing to consensus |
| Ch.32 ("will it rain") | **Reviewed, not changed (Prompt 6)** — structurally a binary yes/no fact like chs. 47/58 (arguably `descriptive`), but fits the same "will X happen" mold as many already-`outcome` chapters (money, children, safe return) with no clear source evidence favoring a change either way. Flagged for a future stage's judgment, not auto-changed |
| Ch.31, Ch.41, Ch.48 x2 gender occurrences — two further named occurrences not yet implemented (~ch.71, ~ch.90 by manuscript line position) | A future chapter-expansion stage should expect to hit the identical unsourced-gender wall; no new investigation needed, this queue entry already covers the reasoning |

## Not yet implemented

Chapters 61-153 (93 numbered chapters) have not been read for this
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
