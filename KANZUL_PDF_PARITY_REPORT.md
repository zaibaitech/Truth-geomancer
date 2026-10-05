# Kanzul Mikban — PDF-to-App Parity Report

Source of truth: `docs/Kanzul-Mikban-Final-Edition.pdf` (116 pages, sha256 `de1d3b7d…cea8`). Status: implemented in the working tree; **not committed, pushed or deployed**.

## How parity was established (and why text extraction alone was never used)

The PDF draws every geomantic figure as an **embedded image** (16 unique images, placed 367 times), so a text extractor shows lines like "If it's: , , ," where the page visibly shows figures. That is **source content present**, not missing content. `scripts/kanzul_pdf_parity.py` reads the real page structure: each figure image is decoded to its four-row dot pattern (calibrated on the edition's own page-3 example, "even, odd, odd, even" = 2112), matched to a canonical `STARS` id by exact pattern equality, and put back into the text at its true reading position; headings are the bold heading lines. The result is committed as a fixture (`kanzulPdfParity.fixture.json`) and `kanzul-pdf-parity.test.ts` compares **every entry** of the app against it. I also looked at actual PDF page images (pages 83, 92, 107) next to the app's render.

## Findings

1. **Authoritative content in the PDF:** 154 headings = **141 numbered chapters + 12 unnumbered headings + the Opening Invocation**, plus the title pages, "A Note on This Edition", the glossary (10 front-matter sections) and a table of contents. 366 figure placements inside the body, plus the page-3 example figure. Chapter numbers 109–117 do not exist in the edition (not invented); chapter 11 is **printed without a chapter number**.
2. **Represented in the app:** all 153 chapter entries, the Opening Invocation and the front matter — **every PDF entry is now represented** (see the proof below).
3. **PDF content that was missing from the app before this task:**
   - the **Opening Invocation** (page 19) and **all front matter** (title pages, edition notes, glossary, the page-3 example figure) — none of it was in the reader (an older paraphrase existed only in a code constant);
   - **138 figure positions across 25 chapters** that the transcription had dropped — 27 as an internal "[figures omitted]" placeholder and the rest as silent gaps ("If it's, it means…"): chapters 2, 7, 13, 18, 26, 29, 32, 42, 46, 49, 59, 60, 61, 70, 73, 75, 90, 95, 106, 107, 108, 118, 119, 121, 132;
   - the **chapter-106 body-part table** had no figures at all;
   - numbering/headings: chapter 11 was numbered 11 (the edition prints no number); chapter 26's title lacked its final period; one gift-visitor entry repeated its own heading inside the body text.
4. **Everything restored** (all from the PDF, none from memory or the engine): see "What was restored".
5. **Genuine source ambiguities, preserved exactly as printed (not resolved):** ch.7 Method 4 (Umar under two outcomes) and ch.13 Method 3 (six overlapping groups); ch.121 (the edition writes "Adam" next to a figure that is Usman's); ch.106 (Sulemana for both Head and Neck, Adam never used); ch.49 (Sulemana in both the fire and sand lists); ch.142 (twelve outcomes then "and so on"); ch.151 (the sixteen dream figures print Yussif twice and Umar never — as the source does); ch.94 (no stage for Yunus); the gift/visitor passage gives meanings for only eight figures.
6. **Engine-only limitations (the book text is shown in full; only the automatic reading is withheld):** ch.7 M4 and ch.13 M3 (overlapping outcomes), ch.142 (also "its own house" is never defined), ch.2 M4 and ch.26 (depend on the Sirri Sa'ael/Damir, which the edition never defines), ch.18 Part A and ch.95 (present in the book, no public question registered by decision), plus the pre-existing gender/stability/whole-figure classifications. The book is **not** labelled incomplete for any of these.
7. **Nothing is hidden because of a transcription limit.** The only "Source information incomplete for this method." notices left in the **book text** are on three entries where **the edition itself** cuts off or omits something: chapter 46 ("diagram … not reproduced here"), the additional pregnancy methods (Method 3 ends mid-text: "text continues onto the next page") and the time-she-will-put-to-bed method (Method 2 ends mid-sentence). The gift/visitor passage that continues in the next entry shows no notice. In **readings**, a withheld method says "Source information incomplete" only where the edition genuinely lacks the information (undefined Damir, undefined male/female/stability classes, truncated passages); a method the edition fully describes but that cannot be run mechanically says "This method is described in the source, but it can't be applied as an automatic reading."

## What was restored

- **Reader:** title page, "A Note on This Edition" (+ "Reading the Geomantic Figures" with the page-3 example figure, "A Note on Sources for the Figures", "A Note on Chapter Numbering"), the glossary (+ 5 sub-sections) and the Opening Invocation, verbatim, before Chapter One (`KM_TITLE_PAGE`, `KM_FRONT_MATTER`, `KM_OPENING_INVOCATION`; `components/books/KanzulFrontMatter.tsx`).
- **Figure lists and positions** in 25 chapters (names inserted at the figure positions; the reader draws each canonical figure): 2, 7, 13, 18, 26, 29, 32, 42, 46, 49, 59, 60, 61, 70, 73, 75, 90, 95, 106, 107, 108, 118, 119, 121, 132 — including the lists for chapters **29, 42, 49, 60, 61** (previously only illustrative placeholders), the **ch.106 table** (all 16 figures, as printed), and the four constant figures (Nazir, Nutik, Itisal, Ifusal). Chapters 5, 6, 4, 9, 17, 19, 21, 27, 30, 36, 94, 97, 102, 124, 132, 142 were already restored and are re-proved by the parity test; chapter 151 and the gift/visitor material were already drawn from this same PDF and are re-checked.
- **A figure the edition prints beside a name that is not that star's own** (aliases "Yusuf", "Kallah Allahu", "Osman/Uthman", "Hassan and Hussein", the constants' names, and chapter 121's "Adam" with Usman's figure) is stored as ⟦star-id⟧ and drawn as the bare figure next to the printed word — exactly what the page shows, with no name "corrected".
- **Names the edition prints without a figure** (chapters 10, 46, 79 and "Adam" in 121) stay plain text (`KANZUL_PLAIN_STAR_NAMES`).
- **Numbering/headings:** chapter 11 → unnumbered; chapter 26 title; the duplicated heading text removed from the gift-visitor entry; unnumbered headings no longer carry an invented "Continued" label.
- **Customer wording:** no internal restoration/audit/placeholder wording; withheld-method notes distinguish "source incomplete" from "can't be applied automatically" (`lib/raml/customerText.ts`).

## Proof

`kanzul-pdf-parity.test.ts` (11 tests): (a) 154 headings, 366 figures, all 16 images = STARS ids; (b) **every body entry's headings and numbering equal the edition's**; (c) front matter and invocation are the edition's text verbatim, with the example figure drawn; (d) **for all 150 text-rendered entries, the app's words, star names and figure positions are identical to the PDF's**; (e) **the figures the reader draws are exactly the PDF's figures, in the PDF's order — none omitted, none added**, each equal to its canonical STARS pattern; (f) the three entries drawn by dedicated components (dreams, gift/visitor ×2) have identical words and their figures equal the edition's, in order. `customerText.test.ts` / `kanzulStarText.test.ts` cover customer wording and figure rendering. Engine behaviour is unchanged (no method, rule or STARS change).

## Release QA (pre-commit)

- **Parity test is not circular.** `scripts/kanzul_pdf_parity.py` reads only the PDF and `content/stars.ts` (the canonical figure table); it never reads app content, and regenerating the fixture is byte-identical. Mutation checks against the app each made the parity test fail: removing a figure from the ch.5 and ch.6 lists, swapping two figures in ch.97, deleting an alias-figure markup, changing one word in ch.1, deleting a whole chapter, re-numbering chapter 11, and altering the Opening Invocation. (The source file was restored byte-for-byte after each.)
- **Rendered at 360×740, 390×844, 412×915** (headless Chromium, real components + the app's compiled CSS): front matter, Opening Invocation, ch.5, 6, 29, 94, 106, 121, 142, 151 and both gift/visitor entries — no horizontal overflow, no block element inside a paragraph (as parsed by the browser), 68/68 figure chips each carrying a four-row glyph, no orphaned punctuation. QA found and fixed two layout problems: chapter 106's table read as one run-on paragraph (now the edition's two-column table, same numbers/labels/figures, printed order), and the dream / gift-visitor items let a comma start a new line after the figure (now the figure sits inline with its text).
- **Wording sweep** over all rendered chapters, titles, front matter and every reading's notes/quotes/interpretations: the only matches are the edition's own words ("Transcribed and Compiled Edition", "transcribes", the note that the figures were reconstructed from manuscript photographs, "scanned page"/"original scan" notes about the manuscript, "survive legibly in this transcription"). No internal development language.

## Chapter-by-chapter parity matrix

"Figures present?" is PDF figures / figures the app draws. "Methods complete?" is the engine: verified methods of those registered for the entry (a withheld method's code is listed). "Differences found" describes the state **before** this task.

| Chapter | Title | PDF pages | PDF content present? | App content present? | Figures present? | Figure mapping correct? | Methods complete? (engine) | Differences found | Required action / done | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| — | Title pages | 1–2 | Yes | Yes (KM_TITLE_PAGE) | — | — | — | title page text was not shown in the reader | Added to the reader | FIXED |
| — | A Note on This Edition | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | Reading the Geomantic Figures | 3–6 | Yes | Yes (KM_FRONT_MATTER) | 1 example figure (2-1-1-2 = Ali) drawn from STARS | Yes | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | A Note on Sources for the Figures | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | A Note on Chapter Numbering | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | A Glossary of Terms Used in This Book | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | The Chart and Its Houses | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | Elements | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | Describing a Star | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | Groups of Houses | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | Named Figures and Special Techniques | 3–6 | Yes | Yes (KM_FRONT_MATTER) | — | — | — | section absent from the reader (an older paraphrase existed only in a code constant) | Added verbatim to the reader | FIXED |
| — | Opening Invocation | 19 | Yes | Yes (KM_OPENING_INVOCATION) | — | — | — | entry absent from the app | Added verbatim to the reader, before Chapter One | FIXED |
| — | Table of Contents | 7–18 | Yes | Yes (the reader's chapter list) | — | — | — | — | none — the app's chapter list is the contents | IDENTICAL (navigation) |
| 1 | Traveling, Business, and If You Will Return from the Trip or Not | 19–20 | Yes | Yes | none in PDF | n/a | 2/3 verified; withheld: whole_figure_state_undefined | none | none | IDENTICAL (no change) |
| 2 | If You Want to Know If You Will Get Money Today or Not | 20–21 | Yes | Yes | PDF 4 / app 4 | Yes — 4/4 = STARS | 3/4 verified; withheld: constant_figure_undefined | 4 figure position(s) absent from the app text (1 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn; engine: Method 4 depends on the Sirri Sa'ael (Damir), which the edition never defines | PRESERVED — source gap (Damir) |
| 3 | Business, Profit, and Loss | 21–22 | Yes | Yes | none in PDF | n/a | 2/3 verified | none | none | IDENTICAL (no change) |
| 4 | Hunting in Water and on Land, and Searching for Anything | 22 | Yes | Yes | PDF 7 / app 7 | Yes — 7/7 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 5 | If You Will Win a Fight, War, or Court Case | 22–23 | Yes | Yes | PDF 11 / app 11 | Yes — 11/11 = STARS | 2/2 verified | none | none | IDENTICAL (no change) |
| 6 | If You Want to Know Where Your Enemy or a Thief Is Hidden | 23 | Yes | Yes | PDF 4 / app 4 | Yes — 4/4 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 7 | Marriage and Its Blessings | 23–24 | Yes | Yes | PDF 8 / app 8 | Yes — 8/8 = STARS | 3/4 verified; withheld: source_ambiguous_overlapping_outcomes | 8 figure position(s) absent from the app text (1 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn; engine: Method 4 lists Umar under two outcomes; the book shows the passage and all five figure groups as printed; the automatic reading is withheld | PRESERVED — source ambiguity |
| — | Sub-topic: If She's Going to Stay in the Marriage or Not | 24–25 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 8 | If One Will Stay in a Particular Place or Not, and If It's Good or Not | 25 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 9 | Sickness (If He/She Will Survive) | 25–26 | Yes | Yes | PDF 10 / app 10 | Yes — 10/10 = STARS | 3/3 verified | none | none | IDENTICAL (no change) |
| 10 | If Your Lost Thing Is Still Around or Is Gone | 26–28 | Yes | Yes | none in PDF | n/a | 5/5 verified | none | none | IDENTICAL (no change) |
| — | If You Want to Know If You Will Be Successful in Life, at Home, or Have to Travel Away from Home | 28–29 | Yes | Yes | none in PDF | n/a | 2/2 verified | numbered 11 in the app; the edition prints no chapter number | numbering corrected (unnumbered) | FIXED |
| 12 | If You Want to Know If You Will Be Rich in Life or Not | 29 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 13 | If You Will Get Children from a Lady You Want to Marry | 29–31 | Yes | Yes | PDF 21 / app 21 | Yes — 21/21 = STARS | 4/5 verified; withheld: source_ambiguous_overlapping_outcomes | 21 figure position(s) absent from the app text (7 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn; engine: Method 3's six figure groups overlap; shown exactly as printed; the automatic reading is withheld | PRESERVED — source ambiguity |
| 14 | If a Pregnancy Is Going to Be Stable or Not (Good Condition) | 31–32 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 15 | If Things Will Be Better for the Questioner or Not | 32 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 16 | If You Will Overcome Your Enemy or Not | 32–33 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 17 | If Something Will Happen in an Hour, Day, Week, Month, or Year | 33–34 | Yes | Yes | PDF 23 / app 23 | Yes — 23/23 = STARS | 2/2 verified | none | none | IDENTICAL (no change) |
| 18 | If You Will Get Your Stolen Things Back | 34–35 | Yes | Yes | PDF 8 / app 8 | Yes — 8/8 = STARS | 4/4 verified | 8 figure position(s) absent from the app text (2 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 19 | If You Will Win a Case in Court, Chief Palace, a Fight, or War | 35–37 | Yes | Yes | PDF 4 / app 4 | Yes — 4/4 = STARS | 4/4 verified | none | none | IDENTICAL (no change) |
| 20 | Who Will Win an Election or a Chieftaincy Title | 37 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 21 | If Your Wife or Sister Has Had Sex or Not | 37–38 | Yes | Yes | PDF 8 / app 8 | Yes — 8/8 = STARS | 2/3 verified; withheld: whole_figure_state_undefined | none | none | IDENTICAL (no change) |
| — | If It's Good to Stay in a Particular House | 38 | Yes | Yes | none in PDF | n/a | 3/3 verified | none | none | IDENTICAL (no change) |
| 22 | If It's Good to Stay in a Town or Not | 38–39 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 23 | Is There Much Trees, Water, Sand, or Stones in the Area You Are Going To | 39 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 24 | If You Will Be Safe Entering a Canoe, or Will Get Fish from Fishing | 39–40 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 25 | If There Are Armed Robbers on Your Way | 40 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 26 | If There Will Be a Fight, Argument, etc. | 40–41 | Yes | Yes | PDF 10 / app 10 | Yes — 10/10 = STARS | 0/1 verified; withheld: constant_figure_undefined | 10 figure position(s) absent from the app text (3 as an internal placeholder); title lacked the final period | figure lists/positions restored from the PDF; canonical figures drawn; title corrected; engine: depends on the Sirri Sa'ael (Damir), which the edition never defines | PRESERVED — source gap (Damir) |
| 27 | About Farming and Food in the Year | 41–43 | Yes | Yes | PDF 32 / app 32 | Yes — 32/32 = STARS | 2/2 verified | none | none | IDENTICAL (no change) |
| 28 | If You Will Get Money or Good Strangers That Same Day or Not | 43–44 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 29 | If You Will Be Successful Where You Are Going | 44–45 | Yes | Yes | PDF 8 / app 8 | Yes — 8/8 = STARS | 1/1 verified | 8 figure position(s) absent from the app text (1 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| — | Reading the Gift/Visitor Figures (continued from Chapter Twenty-Eight) | 45–46 | Yes | Yes | PDF 6 / app 6 (drawn by the gift/visitor component) | Yes — 6/6 = STARS | 1/1 verified | none | none | IDENTICAL (figures already drawn) |
| — | Continued from Part 1 — Reading the Gift/Visitor Figures (end of Chapter Twenty-Eight/Twenty-Nine material) | 46 | Yes | Yes | PDF 2 / app 2 (drawn by the gift/visitor component) | Yes — 2/2 = STARS | no registered method | heading text duplicated at the start of the body paragraph (not in the edition) | duplicate removed | FIXED |
| 30 | If You Will Be Successful and Get What You Want from the Trip/Traveling | 46–47 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 31 | About a Lost Thing / Stolen Things | 47–48 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 32 | If It Will Rain Today or Not | 48–49 | Yes | Yes | PDF 3 / app 3 | Yes — 3/3 = STARS | 4/4 verified | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 33 | If Someone Loves You Much, Less, or Not at All | 49 | Yes | Yes | none in PDF | n/a | no registered method | none | none | IDENTICAL (no change) |
| 34 | If Your Enemies Are Working Against You or Not | 49–50 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 35 | If Your Family Is Doing Well (While You Are Far from Them) | 50 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 36 | If You Want to Locate Someone or Something | 50–51 | Yes | Yes | PDF 16 / app 16 | Yes — 16/16 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 37 | How to Predict a Game, Who Will Win or Lose | 51–52 | Yes | Yes | none in PDF | n/a | 1/2 verified; withheld: spatial_layout_unsupported | none | none | IDENTICAL (no change) |
| 38 | If Two Lovers Will Be Compatible for Marriage (Their Star Signs) | 52–53 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 39 | If Your Visitor, or the Person That Comes to You, Is a Good or Bad Person | 53 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 40 | If Spiritual Work You Want to Do for Someone Will Work or Not | 53–54 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 41 | The Person That Took an Item / Stole Something | 54 | Yes | Yes | none in PDF | n/a | 1/2 verified; withheld: gender_classification_unsourced | none | none | IDENTICAL (no change) |
| 42 | If You Will Get What You Want from Where You Are Going | 54–55 | Yes | Yes | PDF 5 / app 5 | Yes — 5/5 = STARS | 2/2 verified | 5 figure position(s) absent from the app text (2 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 43 | The Real Behavior/Character or Life of Someone You Want to Get Married to (in Future) | 55–56 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 44 | If a Lady or Man Will Accept Your Love Proposal or Not | 56 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 45 | If You Will Get the Lost Thing Back | 56 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 46 | How to Make One Win Over the Other Opponents (Enemies) | 56–57 | Yes | Yes | PDF 1 / app 1 | Yes — 1/1 = STARS | no registered method | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 47 | If a Lady Is Pregnant or Not | 57 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 4/4 verified | none | none | IDENTICAL (no change) |
| 48 | If It's a Male or Female Child | 57–58 | Yes | Yes | none in PDF | n/a | 1/3 verified; withheld: gender_classification_unsourced | none | none | IDENTICAL (no change) |
| 49 | If Something Is Closer to You or Far Away from You | 58 | Yes | Yes | PDF 16 / app 16 | Yes — 16/16 = STARS | 1/1 verified | 16 figure position(s) absent from the app text (4 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn; engine: the printed fire list includes Sulemana, who is also in the sand list; shown exactly as printed | PRESERVED — source anomaly |
| 50 | If You Will Get Gold in a Place Where You Are Working | 58–59 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 51 | If Things Are Going to Be Well This Year or Not (Yearly News) | 59 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 52 | The Friendship Between Two People, If It's Good or Not | 59–60 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| — | The Consequence of Friendship Between Two People | 60 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 53 | If a Querent Is Asking About Someone or About Him/Herself | 60 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 54 | Where Your Success Is, or Where You Will Make It in Life | 60–61 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 55 | The Whereabouts of a Thief or Robbers | 61 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 56 | About a Pregnancy, If It's a Boy or a Girl | 61–62 | Yes | Yes | none in PDF | n/a | no registered method | none | none | IDENTICAL (no change) |
| — | Additional Methods — If You Want to Know If She's Pregnant | 62 | Yes | Yes | none in PDF | n/a | no registered method | none | none | IDENTICAL (no change) |
| 57 | When to Travel, Daytime or Night Time | 62–63 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 58 | If Couples Have Had Sex or Not | 63 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 59 | The Secret of the Querent in a Chart | 63–64 | Yes | Yes | PDF 1 / app 1 | Yes — 1/1 = STARS | no registered method | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 60 | If She/He Loves You or Not | 64–65 | Yes | Yes | PDF 5 / app 5 | Yes — 5/5 = STARS | 2/2 verified | 5 figure position(s) absent from the app text (2 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 61 | If a Marriage Is Good or Not | 65 | Yes | Yes | PDF 3 / app 3 | Yes — 3/3 = STARS | 2/2 verified | 3 figure position(s) absent from the app text (1 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 62 | If the Prayers Done for Someone Have Been Answered or Not | 65 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 63 | If the Lady or Man You Are Going to Marry Is Related to You by Family | 65–66 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 64 | If a Marriage Will Last Forever | 66 | Yes | Yes | none in PDF | n/a | 1/2 verified; withheld: interpretation_not_stated | none | none | IDENTICAL (no change) |
| — | Additional Method — Someone's Behavior (also see Chapter Forty-Three) | 66–67 | Yes | Yes | none in PDF | n/a | no registered method | none | none | IDENTICAL (no change) |
| 65 | If a Partner Has a Particular Disease or Sickness | 67 | Yes | Yes | PDF 3 / app 3 | Yes — 3/3 = STARS | 3/3 verified | none | none | IDENTICAL (no change) |
| 66 | If Someone Has Married Before, or If He/She Is Married | 67–68 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| — | Additional Method — If She/He Is Still in the Marriage or Not | 68 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 67 | If He/She Is Enjoying the Marriage | 68–69 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 68 | If Your Partner Is Cheating on You | 69 | Yes | Yes | none in PDF | n/a | 0/1 verified; withheld: gender_classification_unsourced | none | none | IDENTICAL (no change) |
| 69 | If Your Ex-Husband/Wife Will Re-Marry Again After the Divorce | 69–70 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 70 | If a Pregnant Woman Will Have Childbirth Problems in Her Marriage | 70 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 2/2 verified | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 71 | If a Man Will Have Manhood Problems in His Marriage or Life | 70–71 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 2/2 verified | none | none | IDENTICAL (no change) |
| 72 | If a Lady or Man Has Feelings for You or Not | 71 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 73 | If a Woman Has Married More Than One Man at the Same Time (Polyandry) | 71–72 | Yes | Yes | PDF 16 / app 16 | Yes — 16/16 = STARS | 1/1 verified | 4 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 74 | If Someone Is an Adulterous Son/Daughter (Born Out of Wedlock) | 72–73 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 75 | If He/She Is a Womanizer or a Harlot | 73 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 1/1 verified | 2 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 76 | If Your Ex-Husband, Wife, Girlfriend, or Boyfriend Will Return or Not | 73–74 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 77 | If the Pregnancy Is Healthy or Not | 74 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 78 | The Number of Months of a Pregnancy (How Old Is the Pregnancy) | 74–75 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 79 | The Number of Babies in a Pregnancy | 75 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 80 | If a Pregnancy Is Yours or Not (D.N.A.) | 75–76 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 81 | If She Will Put to Bed Peacefully or Not | 76 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 82 | The Time She Will Put to Bed | 76–77 | Yes | Yes | none in PDF | n/a | 1/2 verified | none | none | IDENTICAL (no change) |
| 83 | If It's Day or Night That She Will Put to Bed | 77 | Yes | Yes | none in PDF | n/a | 0/1 verified; withheld: day_night_classification_unsourced | none | none | IDENTICAL (no change) |
| 84 | If Your Enemy Is from Your Father's, Mother's, Wife's, Boyfriend's/Girlfriend's, or Your Friend's Family | 77–78 | Yes | Yes | none in PDF | n/a | 3/3 verified | none | none | IDENTICAL (no change) |
| 85 | How the Future of Two People's Friendship Will Be | 78 | Yes | Yes | none in PDF | n/a | 1/2 verified; withheld: stability_classification_unsourced | none | none | IDENTICAL (no change) |
| — | Additional Topic — Secrets Between Two Friends Who Follow Each Other in the Chart | 78–79 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 86 | If It's Business or Handwork That Will Benefit You | 79 | Yes | Yes | none in PDF | n/a | 1/2 verified; withheld: stability_classification_unsourced | none | none | IDENTICAL (no change) |
| 87 | When Your Suffering and Pain or Sadness Will End | 79–80 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 88 | If You Will Get a Position/Rank or Not | 80 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 89 | If Your Success or Wealth Will Remain Forever or Not | 80–81 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 90 | If Someone's Misery Will Be Taken Away from Him/Her or Not | 81 | Yes | Yes | PDF 3 / app 3 | Yes — 3/3 = STARS | 1/2 verified; withheld: interpretation_not_stated | 3 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 91 | If Something Is Present, Past, or Future | 81–82 | Yes | Yes | none in PDF | n/a | 0/1 verified; withheld: temporal_classification_unsourced | none | none | IDENTICAL (no change) |
| 92 | The Ending Part of Anything You Want to Do in Your Life | 82 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 93 | If Someone Has Long Life or Not | 82–83 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 94 | The Lifespan and When Someone Will Die | 83–84 | Yes | Yes | PDF 15 / app 15 | Yes — 15/15 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 95 | The Stars That Talk About Your Youthful Time, Middle Age, and Old Age | 84–85 | Yes | Yes | PDF 15 / app 15 | Yes — 15/15 = STARS | no registered method | 15 figure position(s) absent from the app text (3 as an internal placeholder) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 96 | If a Sick Person Has Long Life or Not | 85 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| — | Additional Method — If a Sick Person Has Long Life (repeated later in the notebook) | 85 | Yes | Yes | none in PDF | n/a | no registered method | none | none | IDENTICAL (no change) |
| 97 | Where One Will Die (Place of Death) | 85–87 | Yes | Yes | PDF 16 / app 16 | Yes — 16/16 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 98 | The Causes of Someone's Death | 87–88 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 99 | If Someone or Something Good Will Come to You Today or Not | 88 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 100 | If Today Is a Good Day or Not | 88–89 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 101 | As a Stranger, If the Food You Want to Eat Is from the Market or Home-Prepared | 89 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 102 | If This Money, the Work, or the Lady/Husband Will Be Stable in Your Life | 89–90 | Yes | Yes | PDF 5 / app 5 | Yes — 5/5 = STARS | 1/1 verified | none | none | IDENTICAL (no change) |
| 103 | If the Querent Is Sick or Not | 90 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 104 | If the Sickness Is from Human, Jinn, or God Almighty | 90–91 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| — | Additional Method — If a Sick Person Has Long Life (repeated again in the notebook) | 91 | Yes | Yes | none in PDF | n/a | no registered method | none | none | IDENTICAL (no change) |
| 105 | Which Part of the Body Is Paining the Sick Person | 91–92 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 106 | Parts of the Human Body and the Stars Representing Them | 92–93 | Yes | Yes | PDF 16 / app 16 | Yes — 16/16 = STARS | no registered method | 16 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn; engine: the printed table uses Sulemana for both Head and Neck and never Adam; shown exactly as printed | PRESERVED — source anomaly |
| 107 | If You Will See What You Are Searching For or Not (Nazir) | 93 | Yes | Yes | PDF 1 / app 1 | Yes — 1/1 = STARS | 1/1 verified | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 108 | If You Will Get to Talk to Someone, or If Conversation Will Take Place Between Two People | 93–94 | Yes | Yes | PDF 1 / app 1 | Yes — 1/1 = STARS | 1/1 verified | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 118 | If You Will Get What You Are Searching For, in a Place (Itisal) | 94 | Yes | Yes | PDF 1 / app 1 | Yes — 1/1 = STARS | 1/1 verified | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 119 | If You Won't Get What You Are Searching For (Ifusal) | 94–95 | Yes | Yes | PDF 1 / app 1 | Yes — 1/1 = STARS | 1/1 verified | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 120 | If You Have Enemies and How Many | 95–96 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 2/2 verified | none | none | IDENTICAL (no change) |
| 121 | If You Will Get Knowledge or Not in Your Life | 96–97 | Yes | Yes | PDF 2 / app 2 | Yes — 2/2 = STARS | 1/1 verified | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn; engine: the edition writes 'Adam' beside a figure that is Usman's; both shown exactly as printed | PRESERVED — source contradiction |
| 122 | If You Will Get What You Want, or If Your Intentions Will Be Gotten (Very Close) [Note: the Table of Contents lists this chapter's title as "if someone has long life or not (sick person)" — but the content found at this position in the manuscript body is about intentions/getting what you want, as given here. This appears to be a mismatch in the original notebook between its own Table of Contents and body, not a transcription error; the "long life/sick person" topic appears repeatedly elsewhere, in Chapters Ninety-Three, Ninety-Six, and as an additional method near Chapter Hundred and Four.] | 97–98 | Yes | Yes | none in PDF | n/a | 2/4 verified; withheld: stability_classification_unsourced | none | none | IDENTICAL (no change) |
| 123 | If Something Will Burn | 98 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 124 | If Something Has Really Been Stolen or Not | 98–99 | Yes | Yes | PDF 4 / app 4 | Yes — 4/4 = STARS | 2/2 verified | none | none | IDENTICAL (no change) |
| 125 | If They Will Return a Stolen Thing Back | 99 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 126 | The Number of Thieves | 99–100 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 127 | The Description of the Thief | 100 | Yes | Yes | none in PDF | n/a | 0/2 verified; withheld: gender_classification_unsourced | none | none | IDENTICAL (no change) |
| 128 | If the Thief or the Stolen Thing Is in Town or Out of Town | 100–101 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 129 | If It Is the Accused Person That Stole the Thing or Not | 101 | Yes | Yes | none in PDF | n/a | 1/2 verified; withheld: stability_classification_unsourced | none | none | IDENTICAL (no change) |
| 130 | The Thief from Among the Accused People | 101–102 | Yes | Yes | none in PDF | n/a | 2/3 verified; withheld: stability_classification_unsourced | none | none | IDENTICAL (no change) |
| 131 | If Something Was Buried, or Has Been Buried, in a Particular Place | 102–103 | Yes | Yes | none in PDF | n/a | 3/3 verified | none | none | IDENTICAL (no change) |
| 132 | If There's a Hidden Treasure (Gold/Money) in a Particular Place | 103 | Yes | Yes | PDF 7 / app 7 | Yes — 7/7 = STARS | 3/4 verified; withheld: stability_classification_unsourced | 1 figure position(s) absent from the app text (silent gaps) | figure lists/positions restored from the PDF; canonical figures drawn | FIXED — figures restored |
| 133 | How Deep Something Is Buried | 103–104 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 134 | Where a Traveller Has Travelled To | 104 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 135 | If the Traveller Has Travelled by Air, Water, or Land | 104–105 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 136 | If the Traveller Has Reached Where He/She Is Going or Not | 105 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 137 | If Someone Is Truthful or Not | 105–106 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 138 | If a Prisoner Will Come Out of Prison and How Long It Will Take | 106 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 139 | If the Prisoner Will Be Removed Peacefully | 106 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 140 | How Long the Prisoner Will Stay in Prison/Cells | 106–107 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 141 | If the Prisoner Is Male or Female | 107 | Yes | Yes | none in PDF | n/a | 0/1 verified; withheld: gender_classification_unsourced | none | none | IDENTICAL (no change) |
| 142 | Where Kidnappers Are Keeping a Person Hostage | 107–108 | Yes | Yes | PDF 12 / app 12 | Yes — 12/12 = STARS | 0/1 verified; withheld: source_incomplete | none | engine: the edition gives 12 outcomes then 'and so on, up to the end of the stars'; shown exactly as printed; automatic reading withheld (also, 'its own house' is never defined) | PRESERVED — source incomplete |
| 143 | The Consequence of a Prisoner | 108–109 | Yes | Yes | none in PDF | n/a | 2/2 verified | none | none | IDENTICAL (no change) |
| 144 | If You Will Get Your Debts, Deposit, or Savings Back | 109 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 145 | If Someone Will Get a Particular Position or Chieftaincy Title | 109–110 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 146 | If You Will Own a House in Your Life | 110 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 147 | If This Apartment You Are Going to Is Safe/Good for You | 110–111 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 148 | If You Will Receive the Expected Message | 111 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 149 | Which Day a Pregnant Woman Will Put to Bed | 111–112 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 150 | If You Will Get Back to Work After Getting a Problem in the Workplace | 112 | Yes | Yes | none in PDF | n/a | 1/1 verified | none | none | IDENTICAL (no change) |
| 151 | Dreams and Their Interpretations | 112–116 | Yes | Yes | PDF 16 / app 16 (drawn by the dream-interpretations component) | Yes — 16/16 = STARS | 1/1 verified | none | none | IDENTICAL (figures already drawn) |

