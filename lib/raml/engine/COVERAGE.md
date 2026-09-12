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

## Totals (as of this stage)

| | Count |
|---|---|
| Total source chapters (Kanzul Mikban) | 153 |
| Chapters reviewed and entered into this engine | 19 (chapters 1-19) |
| Chapters not yet reviewed for this engine | 134 (chapters 20-153) |
| Total methods extracted from those 19 chapters | 48 |
| **Verified** (computed automatically, count toward the result) | **35** |
| **Needs review** (calculable, but the rule itself is ambiguous) | **2** |
| **Uncertain** (not computable — almost always omitted source figures) | **11** |
| Automated tests covering this engine | 103 (all passing) |

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
| **Total** | | **48** | **35** | **2** | **11** |

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

None of these were guessed at. If the original manuscript pages ever surface
with these figures legible, each one becomes a small, mechanical change —
replace the `status: 'uncertain'` method with a real `evaluate()`, following
the pattern already used by every verified method in the same file.

## Not yet implemented

Chapters 20-153 (134 chapters) have not been read for this structured
engine yet. `lib/raml/methodVerdicts.ts`'s general parser already covers
some of that material with lighter-weight automatic verdicts (no audit
trail, no cross-method consensus) — see its own file header for current
numbers. Extending this engine further means repeating the same process:
read the chapter's actual text, write one file in `lib/raml/engine/
questions/`, register it in `questions/index.ts`, add tests, run the full
suite, and update this table — the same shape as every chapter above,
chapter by chapter, in order.

## Confirmation

The original casting engine (`lib/raml/casting.ts` — Mother/Daughter/Niece/
Witness/Judge/Reconciler generation) was not touched in this stage. Every
pre-existing pilot question (chapters 1-3, 18-19) produces byte-identical
results on the same fixture chart as before this stage — their own test
file (`__tests__/questions.test.ts`) is unchanged and still passes.
