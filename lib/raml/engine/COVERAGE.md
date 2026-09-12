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

## Totals (as of this stage — Stage 3 / Prompt 4, chapters 20-40)

| | Count |
|---|---|
| Total source chapters (Kanzul Mikban, numbered 1-153) | 153 |
| Numbered chapters reviewed and entered into this engine | 40 (chapters 1-19, 20-32, 34-40 — chapter 33 reviewed but out of scope, see below) |
| Numbered chapters not yet reviewed | 113 (chapters 41-153) |
| Unnumbered sub-chapters/continuations reviewed this stage | 3 ("If It's Good to Stay in a Particular House" — registered; two Ch.28 continuation fragments — not registered, no computable shape at all) |
| Questions registered in `QUESTION_REGISTRY` | **40** |
| Total methods across all registered questions | 85 |
| **Verified** (computed automatically, count toward the result) | **63** |
| **Needs review** (calculable, but the rule itself is ambiguous or descriptive) | **6** |
| **Uncertain** (not computable — almost always omitted source figures) | **16** |
| Automated tests covering this engine | 438 (all passing) |

### Stage 1+2 (chapters 1-19) subtotal — unchanged since Prompt 2

| | Count |
|---|---|
| Chapters | 19 |
| Methods | 48 |
| Verified | 35 |
| Needs review | 2 |
| Uncertain | 11 |

### Stage 3 (chapters 20-40) subtotal — this stage

| | Count |
|---|---|
| Numbered/sub- chapters reviewed | 23 (20, 21, the unnumbered "good to stay in a house", 22-32, 33, 34-40, plus 2 unnumbered Ch.28 continuation fragments) |
| Questions registered | 21 |
| Methods | 37 |
| Verified | 28 |
| Needs review | 4 |
| Uncertain | 5 |
| Not registered at all (no computable shape, or architecturally out of scope) | 3 (chapter 33; both Ch.28 continuation fragments) |

## Implemented, by chapter

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
| 18 | `if-you-will-get-your-stolen-things-back` (Part B only) | 3 | 3 | 0 | 0 |
| 19 | `if-you-will-win-a-case-in-court` | 4 | 3 | 0 | 1 |
| **Subtotal (1-19)** | | **48** | **35** | **2** | **11** |
| 20 | `who-will-win-an-election-or-a-chieftaincy` | 2 | 2 | 0 | 0 |
| 21 | `if-your-wife-or-sister-has-had-sex` | 3 | 1 | 1 | 1 |
| — | `if-it-s-good-to-stay-in-a` (unnumbered, between 21-22) | 3 | 3 | 0 | 0 |
| 22 | `if-it-s-good-to-stay-in-a-2` | 2 | 2 | 0 | 0 |
| 23 | `is-there-much-trees-water-sand-or-stones` | 1 | 0 | 1 | 0 |
| 24 | `if-you-will-be-safe-entering-a-canoe` | 2 | 2 | 0 | 0 |
| 25 | `if-there-are-armed-robbers-on-your-way` | 1 | 1 | 0 | 0 |
| 26 | `if-there-will-be-a-fight-argument-etc` | 1 | 0 | 0 | 1 |
| 27 | `about-farming-and-food-in-the-year` | 2 | 0 | 0 | 2 |
| 28 | `if-you-will-get-money-or-good-strangers` | 1 | 1 | 0 | 0 |
| 28→ | Two "gift/visitor figure" continuation fragments | — | not registered | — | — |
| 29 | `if-you-will-be-successful-where-you-are` | 1 | 1 | 0 | 0 |
| 30 | `if-you-will-be-successful-and-get-what` | 1 | 1 | 0 | 0 |
| 31 | `about-a-lost-thing-stolen-things` | 1 | 0 | 1 | 0 |
| 32 | `if-it-will-rain-today-or-not` | 4 | 4 | 0 | 0 |
| 33 | *(cast-out-by-4s dot-line method)* | — | not registered | — | — |
| 34 | `if-your-enemies-are-working-against-you-or` | 2 | 2 | 0 | 0 |
| 35 | `if-your-family-is-doing-well-while-you` | 1 | 1 | 0 | 0 |
| 36 | `if-you-want-to-locate-someone-or-something` | 1 | 0 | 1 | 0 |
| 37 | `how-to-predict-a-game-who-will-win` | 2 | 1 | 0 | 1 |
| 38 | `if-two-lovers-will-be-compatible-for-marriage` | 2 | 2 | 0 | 0 |
| 39 | `if-your-visitor-or-the-person-that-comes` | 2 | 2 | 0 | 0 |
| 40 | `if-spiritual-work-you-want-to-do-for` | 2 | 2 | 0 | 0 |
| **Subtotal (20-40)** | | **37** | **28** | **4** | **5** |
| **Grand total (1-40)** | | **85** | **63** | **6** | **16** |

## Architectural gaps (Stage 3) — computable, but not favourable/unfavourable

Three chapters this stage produce a real, fully mechanical calculation whose
*answer* is descriptive (a terrain type, a compass direction, a thief's
gender/rough location) rather than favourable/unfavourable/mixed. The
engine's `MethodOutcome` vocabulary has no honest way to represent "the
answer is water" — asserting any outcome would mischaracterize what the
source says — so these are `needs_review` for an architectural reason, not
because the source is ambiguous or missing:

- **Chapter 23** (terrain type: stones/trees/water/sand)
- **Chapter 31** (lost/stolen thing: thief's gender + rough distance)
- **Chapter 36** (locate someone/something: compass direction)

Two further methods are `uncertain` for a distinct architectural reason —
not an omitted figure, but a concept the ChartModel has never encoded:

- **Chapter 37, Method 2** — decided by which physical "side" (right/left)
  of the drawn chart a figure lands on; this project's `ChartModel` has no
  left/right spatial layout for its 16 houses.
- **Chapter 33** (not registered at all) — "make a long line and cancel 4s
  until you reach 1-4 dots" is a *different* divination mechanic that
  doesn't derive from the 16-house chart this app casts at all; there is no
  UI for it and implementing one is out of scope for this stage.

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
- **Chapter 23** (terrain type), **Chapter 31** (lost/stolen thing), and
  **Chapter 36** (locate someone/something) — architectural gap, not an
  ambiguous rule: each computes a real, unambiguous answer, but that answer
  is descriptive (an element/direction/gender) rather than favourable/
  unfavourable, which this engine's outcome vocabulary has no honest way to
  represent. See "Architectural gaps" above.

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

## Not yet implemented

Chapters 41-153 (113 numbered chapters) have not been read for this
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
Witness/Judge/Reconciler generation) was not touched in this stage, nor was
`ruleEngine.ts`, `chartModel.ts`, or any chapter 1-19 question file.
`operations.ts` was extended only additively: one genuinely new primitive
(`RECAST_FROM_HOUSES`) plus four small quality/adjacency tallies
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
