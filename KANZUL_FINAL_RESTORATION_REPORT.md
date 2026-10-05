# Kanzul Mikban — Final Edition Restoration Report

> **Superseded in part by `KANZUL_PDF_PARITY_REPORT.md`.** The figure-list placeholders this report counts as remaining (27 across 11 entries) have since been replaced with the edition's figures, and the book text now matches the PDF entry-for-entry. The engine classifications below (ambiguous / contradiction / anomaly / incomplete) still stand.

Project: **Truth Geomancer**. Status: implemented in the working tree, **not committed, not pushed, not deployed**.

## 1. Final source used

`docs/Kanzul-Mikban-Final-Edition.pdf` — the author-confirmed FINAL compiled edition (116 pages by PyMuPDF; 141 chapters, numbered 1–151 with the intentional gaps at 11 and 109–117). The edition's figures are **embedded images, not text**. The PDF contains **16 unique figure images placed 367 times**; each unique image was decoded to a four-row dot pattern (rows counted top to bottom, the same order as `Pattern` in `content/stars.ts`) and matched to a canonical STARS id by **exact pattern equality** — no figure was identified by name. Calibration: the edition's own page-3 example ("even, odd, odd, even") decodes to 2112 (Ali). Cross-checks: 28 of 29 places where the edition names a star beside its figure agree with the decode; the ch.88–90 "number → figure" examples agree with STARS numbering; the ch.29 list of eight water-opened stars is exactly the eight patterns with a single third row.

Everything in the repository's figure data below was **generated from the PDF**, not typed (see `lib/raml/engine/kanzulFinalEditionFigures.ts`). The file was renamed from `DOC-20260903-WA0009 (1).pdf` to `docs/Kanzul-Mikban-Final-Edition.pdf` (sha256 `de1d3b7d…cea8`); the empty 0-byte placeholder was deleted.

## 2. Previous engine state

At the start of this task: 142 questions / 233 methods — 187 verified, 19 needs_review, 27 uncertain; 17 registered methods coded `figures_omitted_by_transcription`; 5 coded `constant_figure_undefined`; chapters 5 and 6 already restored from the earlier manuscript scan; full test baseline **3358 passed, 4 skipped, 0 failed**.

## 3. Final edition vs engine — comparison summary

- 45 chapters carry figures (366 placements inside chapters, plus the page-3 example).
- **Chapters 5 and 6: the final edition matches the earlier restoration exactly** (identical figures, order, houses). Not changed.
- Every figure-bearing chapter was compared against the registry. Beyond placeholder chapters, silent gaps (no placeholder at all) were found and handled: ch.30 (two branches), ch.94, ch.97, ch.142.
- Verified-and-matching, no change needed: ch.32, 47, 65, 70, 71, 73, 75, 120 (and the gift-visitor and ch.151 dream figures, already restored from this same PDF and identical to it).
- Chapters in the PDF with no registered question: 33, 56 (merged into 48), 46, 59 (not readings), 95, 106 (table) — plus ch.18 Part A (registered chapter, unregistered methods).

## 4. Restored chapters

4, 5, 6 (unchanged), 9 (M3), 17, 19 (M3), 21 (M3), 27, 30 (two branches), 36 (explicit lists), 94, 97, 102, 107, 108, 118, 119, 124 (M1), 132 (M1, M2). Reader text in `lib/server/content/kanzulMikban.ts` was updated for 4, 9, 17, 19, 21, 27, 30, 36, 94, 97, 102, 124, 132, 142 to **name** the figures (the original transcription cannot draw them).

## 5. Restored methods (now `verified`, no reason code)

`hunting-method-1`, `sickness-method-3`, `timing-method-1`, `timing-method-2`, `court-method-3`, `wife-sex-method-3`, `farming-method-1`, `farming-method-2`, `lifespan-when-death-method-1`, `place-of-death-method-1`, `money-work-lady-stable-method-1`, `see-what-searching-for-method-1` (Nazir), `conversation-will-happen-method-1` (Nutik), `get-what-searching-for-in-place-method-1` (Itisal), `what-blocks-you-method-1` (Ifusal), `something-really-stolen-method-1`, `hidden-treasure-method-1`, `hidden-treasure-method-2` — **18 methods**. Also: `successful-trip-method-1` gained its two named-figure branches; `locate-method-1` now follows the explicit source lists; `fight-war-location-method-1/2` and `enemy-location-method-1` unchanged from the earlier restoration.

## 6/7. Figure name → canonical STARS ID

| STARS # | Name | Canonical STARS ID | Pattern (top→bottom) | STARS element |
|---|---|---|---|---|
| 1 | Yussif | `yussif` | 1121 | fire |
| 2 | Adam | `adam` | 1222 | fire |
| 3 | Mahadi | `mahadi` | 2111 | air |
| 4 | Iddris | `iddris` | 2212 | water |
| 5 | Ibrahim | `ibrahim` | 1111 | water |
| 6 | Issah | `issah` | 1212 | water |
| 7 | Umar | `umar` | 2122 | air |
| 8 | Ayuba | `ayuba` | 2221 | sand |
| 9 | Kalla Allahu | `kalla-allahu` | 1122 | fire |
| 10 | Sulemana | `sulemana` | 1221 | sand |
| 11 | Ali | `ali` | 2112 | air |
| 12 | Nuhu | `nuhu` | 2211 | air |
| 13 | Hassan & Hussein | `hassan-hussein` | 1112 | water |
| 14 | Yunus | `yunus` | 1211 | sand |
| 15 | Usman | `usman` | 2121 | sand |
| 16 | Musah | `musah` | 2222 | fire |

## 8/9/24. Every restored figure (house, condition, result, source page)

"Source page" is the page span from the chapter heading to the next chapter's heading in the PDF (figures sit inside that span). Houses/conditions/results are the source's own wording.

| Chapter | Method ID | House | Source figure name | Canonical STARS ID | Condition | Result | Source page |
|---|---|---|---|---|---|---|---|
| 4 | `hunting-method-1` | h10 | Usman | `usman` | figure at h10 is listed | successful in the search (favourable) | p.22 |
| 4 | `hunting-method-1` | h10 | Mahadi | `mahadi` | figure at h10 is listed | successful in the search (favourable) | p.22 |
| 4 | `hunting-method-1` | h10 | Iddris | `iddris` | figure at h10 is listed | successful in the search (favourable) | p.22 |
| 4 | `hunting-method-1` | h10 | Nuhu | `nuhu` | figure at h10 is listed | successful in the search (favourable) | p.22 |
| 4 | `hunting-method-1` | h10 | Sulemana | `sulemana` | figure at h10 is listed | successful in the search (favourable) | p.22 |
| 4 | `hunting-method-1` | h10 | Ayuba | `ayuba` | figure at h10 is listed | successful in the search (favourable) | p.22 |
| 4 | `hunting-method-1` | h10 | Yunus | `yunus` | figure at h10 is listed | successful in the search (favourable) | p.22 |
| 5 | `fight-war-location-method-1` | h6 | Kalla Allahu | `kalla-allahu` | listed figure at h6 | you will win it (favourable) | pp.22–23 |
| 5 | `fight-war-location-method-1` | h6 | Ayuba | `ayuba` | listed figure at h6 | you will win it (favourable) | pp.22–23 |
| 5 | `fight-war-location-method-1` | h6 | Musah | `musah` | listed figure at h6 | you will win it (favourable) | pp.22–23 |
| 5 | `fight-war-location-method-1` | h6 | Mahadi | `mahadi` | listed figure at h6 | you will win it (favourable) | pp.22–23 |
| 5 | `fight-war-location-method-1` | h6 | Adam | `adam` | listed figure at h6 | you will win it (favourable) | pp.22–23 |
| 5 | `fight-war-location-method-1` | h6 | Ibrahim | `ibrahim` | listed figure at h6 | you will win it (favourable) | pp.22–23 |
| 5 | `fight-war-location-method-1` | h6 | Yunus | `yunus` | listed figure at h6 | you will win it (favourable) | pp.22–23 |
| 5 | `fight-war-location-method-2` | h1 / h8 | Hassan & Hussein | `hassan-hussein` | listed figure at h1 or h8 | not good, difficult to succeed (unfavourable) | pp.22–23 |
| 5 | `fight-war-location-method-2` | h1 / h8 | Issah | `issah` | listed figure at h1 or h8 | not good, difficult to succeed (unfavourable) | pp.22–23 |
| 5 | `fight-war-location-method-2` | h1 / h8 | Yunus | `yunus` | listed figure at h1 or h8 | not good, difficult to succeed (unfavourable) | pp.22–23 |
| 5 | `fight-war-location-method-2` | h1 / h8 | Ayuba | `ayuba` | listed figure at h1 or h8 | not good, difficult to succeed (unfavourable) | pp.22–23 |
| 6 | `enemy-location-method-1` | h4 / h10 | Musah | `musah` | listed figure at h4 or h10 | found in an opened land or desert (descriptive) | p.23 |
| 6 | `enemy-location-method-1` | h4 / h10 | Adam | `adam` | listed figure at h4 or h10 | found in an opened land or desert (descriptive) | p.23 |
| 6 | `enemy-location-method-1` | h4 / h10 | Iddris | `iddris` | listed figure at h4 or h10 | found in an opened land or desert (descriptive) | p.23 |
| 6 | `enemy-location-method-1` | h4 / h10 | Ayuba | `ayuba` | listed figure at h4 or h10 | found in an opened land or desert (descriptive) | p.23 |
| 9 | `sickness-method-3` | h6 | Iddris | `iddris` | listed figure at h6 | healed, insha'Allah (favourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Adam | `adam` | listed figure at h6 | healed, insha'Allah (favourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Kalla Allahu | `kalla-allahu` | listed figure at h6 | healed, insha'Allah (favourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Yussif | `yussif` | listed figure at h6 | healed, insha'Allah (favourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Umar | `umar` | listed figure at h6 | healed, insha'Allah (favourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Issah | `issah` | listed figure at h6 | healed, insha'Allah (favourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Ibrahim | `ibrahim` | listed figure at h6 | difficult to survive (unfavourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Ayuba | `ayuba` | listed figure at h6 | difficult to survive (unfavourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Ali | `ali` | listed figure at h6 | difficult to survive (unfavourable) | pp.25–26 |
| 9 | `sickness-method-3` | h6 | Musah | `musah` | listed figure at h6 | difficult to survive (unfavourable) | pp.25–26 |
| 17 | `timing-method-1` | sum h1+h6+h4+h16 | Ali | `ali` | sum is a listed figure | within an hour, a day or 1–10 days; within an hour if also in h1–h4 | pp.33–34 |
| 17 | `timing-method-1` | sum h1+h6+h4+h16 | Nuhu | `nuhu` | sum is a listed figure | within an hour, a day or 1–10 days; within an hour if also in h1–h4 | pp.33–34 |
| 17 | `timing-method-1` | sum h1+h6+h4+h16 | Umar | `umar` | sum is a listed figure | within an hour, a day or 1–10 days; within an hour if also in h1–h4 | pp.33–34 |
| 17 | `timing-method-1` | sum h1+h6+h4+h16 | Issah | `issah` | sum is a listed figure | within an hour, a day or 1–10 days; within an hour if also in h1–h4 | pp.33–34 |
| 17 | `timing-method-1` | sum h1+h6+h4+h16 | Mahadi | `mahadi` | sum is a listed figure | within an hour, a day or 1–10 days; within an hour if also in h1–h4 | pp.33–34 |
| 17 | `timing-method-1` | sum h1+h6+h4+h16 | Adam | `adam` | sum is a listed figure | within an hour, a day or 1–10 days; within an hour if also in h1–h4 | pp.33–34 |
| 17 | `timing-method-1` | sum h1+h6+h4+h16 | Yussif | `yussif` | sum is a listed figure | within an hour, a day or 1–10 days; within an hour if also in h1–h4 | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Ayuba | `ayuba` | sum is in the fast list | within an hour if in h1–h4; within 7 days if found elsewhere in the chart | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Umar | `umar` | sum is in the fast list | within an hour if in h1–h4; within 7 days if found elsewhere in the chart | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Issah | `issah` | sum is in the fast list | within an hour if in h1–h4; within 7 days if found elsewhere in the chart | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Ibrahim | `ibrahim` | sum is in the fast list | within an hour if in h1–h4; within 7 days if found elsewhere in the chart | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Iddris | `iddris` | sum is in the fast list | within an hour if in h1–h4; within 7 days if found elsewhere in the chart | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Mahadi | `mahadi` | sum is in the fast list | within an hour if in h1–h4; within 7 days if found elsewhere in the chart | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Adam | `adam` | sum is in the fast list | within an hour if in h1–h4; within 7 days if found elsewhere in the chart | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Yussif | `yussif` | sum is in the fast list | within an hour if in h1–h4; within 7 days if found elsewhere in the chart | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Kalla Allahu | `kalla-allahu` | sum is in the slow list | within a month or a year | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Sulemana | `sulemana` | sum is in the slow list | within a month or a year | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Ali | `ali` | sum is in the slow list | within a month or a year | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Nuhu | `nuhu` | sum is in the slow list | within a month or a year | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Hassan & Hussein | `hassan-hussein` | sum is in the slow list | within a month or a year | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Yunus | `yunus` | sum is in the slow list | within a month or a year | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Usman | `usman` | sum is in the slow list | within a month or a year | pp.33–34 |
| 17 | `timing-method-2` | sum h1+h13+h4+h12+h7+h10+h15+h16 | Musah | `musah` | sum is in the slow list | within a month or a year | pp.33–34 |
| 19 | `court-method-3` | sum h4+h5+h10+h11 | Mahadi | `mahadi` | sum is listed; found in h4/h10 vs h5/h11 | found in h4/h10: win; found in h5/h11: lose | pp.35–37 |
| 19 | `court-method-3` | sum h4+h5+h10+h11 | Umar | `umar` | sum is listed; found in h4/h10 vs h5/h11 | found in h4/h10: win; found in h5/h11: lose | pp.35–37 |
| 19 | `court-method-3` | sum h4+h5+h10+h11 | Adam | `adam` | sum is listed; found in h4/h10 vs h5/h11 | found in h4/h10: win; found in h5/h11: lose | pp.35–37 |
| 19 | `court-method-3` | sum h4+h5+h10+h11 | Musah | `musah` | sum is listed; found in h4/h10 vs h5/h11 | found in h4/h10: win; found in h5/h11: lose | pp.35–37 |
| 21 | `wife-sex-method-3` | h7 | Usman | `usman` | listed figure at h7 | she does / he does have sex | pp.37–38 |
| 21 | `wife-sex-method-3` | h7 | Nuhu | `nuhu` | listed figure at h7 | she does / he does have sex | pp.37–38 |
| 21 | `wife-sex-method-3` | h7 | Mahadi | `mahadi` | listed figure at h7 | she does / he does have sex | pp.37–38 |
| 21 | `wife-sex-method-3` | h7 | Ayuba | `ayuba` | listed figure at h7 | she does / he does have sex | pp.37–38 |
| 21 | `wife-sex-method-3` | h7 | Issah | `issah` | listed figure at h7 | she didn't | pp.37–38 |
| 21 | `wife-sex-method-3` | h7 | Kalla Allahu | `kalla-allahu` | listed figure at h7 | she didn't | pp.37–38 |
| 21 | `wife-sex-method-3` | h7 | Hassan & Hussein | `hassan-hussein` | listed figure at h7 | she didn't | pp.37–38 |
| 21 | `wife-sex-method-3` | h7 | Adam | `adam` | listed figure at h7 | she didn't | pp.37–38 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Yussif | `yussif` | sum is a star of the East | East people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Adam | `adam` | sum is a star of the East | East people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Kalla Allahu | `kalla-allahu` | sum is a star of the East | East people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Musah | `musah` | sum is a star of the East | East people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Usman | `usman` | sum is a star of the West | West people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Mahadi | `mahadi` | sum is a star of the West | West people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Ali | `ali` | sum is a star of the West | West people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Umar | `umar` | sum is a star of the West | West people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Iddris | `iddris` | sum is a star of the North | North people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Ibrahim | `ibrahim` | sum is a star of the North | North people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Issah | `issah` | sum is a star of the North | North people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Hassan & Hussein | `hassan-hussein` | sum is a star of the North | North people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Nuhu | `nuhu` | sum is a star of the South | South people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Yunus | `yunus` | sum is a star of the South | South people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Sulemana | `sulemana` | sum is a star of the South | South people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-1` | sum h1+h7+h4+h8 | Ayuba | `ayuba` | sum is a star of the South | South people get a bumper harvest | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Yussif | `yussif` | sum is a fire star | good harvest, locusts/grasshoppers spoil most (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Kalla Allahu | `kalla-allahu` | sum is a fire star | good harvest, locusts/grasshoppers spoil most (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Adam | `adam` | sum is a fire star | good harvest, locusts/grasshoppers spoil most (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Musah | `musah` | sum is a fire star | good harvest, locusts/grasshoppers spoil most (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Usman | `usman` | sum is a air star | bumper harvest, beasts spoil a lot (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Mahadi | `mahadi` | sum is a air star | bumper harvest, beasts spoil a lot (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Ali | `ali` | sum is a air star | bumper harvest, beasts spoil a lot (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Umar | `umar` | sum is a air star | bumper harvest, beasts spoil a lot (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Iddris | `iddris` | sum is a water star | bumper harvest, worms/maggots; low rainfall (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Ibrahim | `ibrahim` | sum is a water star | bumper harvest, worms/maggots; low rainfall (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Hassan & Hussein | `hassan-hussein` | sum is a water star | bumper harvest, worms/maggots; low rainfall (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Issah | `issah` | sum is a water star | bumper harvest, worms/maggots; low rainfall (mixed) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Nuhu | `nuhu` | sum is a sand/earth star | bumper harvest, no calamity (favourable) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Yunus | `yunus` | sum is a sand/earth star | bumper harvest, no calamity (favourable) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Sulemana | `sulemana` | sum is a sand/earth star | bumper harvest, no calamity (favourable) | pp.41–43 |
| 27 | `farming-method-2` | sum h1+h5+h10+h15 | Ayuba | `ayuba` | sum is a sand/earth star | bumper harvest, no calamity (favourable) | pp.41–43 |
| 30 | `successful-trip-method-1` | sum h1+h8+h7+h11+h16 | Hassan & Hussein | `hassan-hussein` | result is Hassan & Hussein | a lot of profit but not stable (mixed) | pp.46–47 |
| 30 | `successful-trip-method-1` | sum h1+h8+h7+h11+h16 | Issah | `issah` | result is Issah | a lot of money but very sick (mixed) | pp.46–47 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Yussif | `yussif` | result is a fire star | eastern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Adam | `adam` | result is a fire star | eastern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Musah | `musah` | result is a fire star | eastern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Kalla Allahu | `kalla-allahu` | result is a fire star | eastern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Usman | `usman` | result is a air star | western part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Mahadi | `mahadi` | result is a air star | western part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Umar | `umar` | result is a air star | western part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Ali | `ali` | result is a air star | western part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Iddris | `iddris` | result is a water star | northern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Ibrahim | `ibrahim` | result is a water star | northern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Hassan & Hussein | `hassan-hussein` | result is a water star | northern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Issah | `issah` | result is a water star | northern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Nuhu | `nuhu` | result is a sand star | southern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Ayuba | `ayuba` | result is a sand star | southern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Yunus | `yunus` | result is a sand star | southern part | pp.50–51 |
| 36 | `locate-method-1` | h1 fire+h2 air+h3 water+h4 sand lines | Sulemana | `sulemana` | result is a sand star | southern part | pp.50–51 |
| 94 | `lifespan-when-death-method-1` | h8 | Ayuba | `ayuba` | figure found | very long life, until old age. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Sulemana | `sulemana` | figure found | within his/her old age. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Adam | `adam` | figure found | after old age the person will die. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Umar | `umar` | figure found | early young age — man or lady, will be the time he/she will die. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Usman | `usman` | figure found | at the end of puberty time. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Nuhu | `nuhu` | figure found | at his/her youthful time. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Yussif | `yussif` | figure found | at his/her first year at puberty. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Ali | `ali` | figure found | in the middle of his/her puberty time. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Musah | `musah` | figure found | at the beginning of his/her puberty time. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Iddris | `iddris` | figure found | at the age of 10 years. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Issah | `issah` | figure found | he/she will die while still small. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Hassan & Hussein | `hassan-hussein` | figure found | the same — he/she will die as a small boy/girl. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Ibrahim | `ibrahim` | figure found | before he/she attains puberty time. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Kalla Allahu | `kalla-allahu` | figure found | in the middle of his/her life — that's from 40 and above. | pp.83–84 |
| 94 | `lifespan-when-death-method-1` | h8 | Mahadi | `mahadi` | figure found | in the middle of his/her youthful age/time. | pp.83–84 |
| 97 | `place-of-death-method-1` | h8 | Mahadi | `mahadi` | figure found | one will die in his/her hometown, in a masjid/mosque, or where they teach Qur'an (Makaranta). | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Adam | `adam` | figure found | one will die in his/her hometown, in a masjid/mosque, or where they teach Qur'an (Makaranta). | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Usman | `usman` | figure found | one will die in his/her hometown, the same day, with a scholar or well-known person in your town. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Hassan & Hussein | `hassan-hussein` | figure found | one will die in a village or on mountains. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Ali | `ali` | figure found | one will die in a farm or bush. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Musah | `musah` | figure found | one will die in a farm or bush. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Yussif | `yussif` | figure found | one will die in a very rich or wealthy place, or a rainy or watery place. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Sulemana | `sulemana` | figure found | one will die in a place where they break stone, or in mountains. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Ayuba | `ayuba` | figure found | one will die in an old shrine, or a damaged or dirty place. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Umar | `umar` | figure found | one will die in a fearful or robbery-prone place. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Iddris | `iddris` | figure found | one will die in a peaceful or joyful place, or around a river or sea. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Kalla Allahu | `kalla-allahu` | figure found | one will die in a big town or city — a well-respected, well-arranged place. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Nuhu | `nuhu` | figure found | one will die in a palace, a flagstaff house, or where there is a river. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Issah | `issah` | figure found | one will die in a damaged place, a place of war, or among animals. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Yunus | `yunus` | figure found | one will die in a place of knowledge, a joyful place, cool, or where there are a lot of trees. | pp.85–87 |
| 97 | `place-of-death-method-1` | h8 | Ibrahim | `ibrahim` | figure found | one will die in a waterlogged area, or where water runs — a cool and peaceful place. | pp.85–87 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Yussif | `yussif` | figure found | he/she is kidnapped in his/her own house. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Adam | `adam` | figure found | he/she is in one of the closest houses, or a neighbor's. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Mahadi | `mahadi` | figure found | he/she is in one of his/her family members' house. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Iddris | `iddris` | figure found | he/she is in his/her father's or mother's house. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Ibrahim | `ibrahim` | figure found | he/she is in one of his/her children's house. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Issah | `issah` | figure found | he/she is in a sick person's house, close to him or her. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Umar | `umar` | figure found | he/she is in his or her girlfriend's/boyfriend's, or wife's/husband's house. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Ayuba | `ayuba` | figure found | he/she is in a funeral house. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Kalla Allahu | `kalla-allahu` | figure found | he/she is on a journey — they are taking him/her somewhere out of towns. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Sulemana | `sulemana` | figure found | he/she is in a chief's, king's, or a well-known and respected person's house. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Ali | `ali` | figure found | he/she is in his/her ex's house. | pp.107–108 |
| 142 | `kidnapper-location-method-1` | figure in its own house | Nuhu | `nuhu` | figure found | he/she is in his/her enemy's house — and so on, up to the end of the stars. | pp.107–108 |
| 102 | `money-work-lady-stable-method-1` | recast chart h1–h4 | Adam | `adam` | listed figure in new first four houses | stable (descriptive) | pp.89–90 |
| 102 | `money-work-lady-stable-method-1` | recast chart h1–h4 | Kalla Allahu | `kalla-allahu` | listed figure in new first four houses | stable (descriptive) | pp.89–90 |
| 102 | `money-work-lady-stable-method-1` | recast chart h1–h4 | Nuhu | `nuhu` | listed figure in new first four houses | stable (descriptive) | pp.89–90 |
| 102 | `money-work-lady-stable-method-1` | recast chart h1–h4 | Mahadi | `mahadi` | listed figure in new first four houses | stable (descriptive) | pp.89–90 |
| 102 | `money-work-lady-stable-method-1` | recast chart h1–h4 | Ali | `ali` | listed figure in new first four houses | stable (descriptive) | pp.89–90 |
| 107 | `see-what-searching-for-method-1` | h1 | Adam | `adam` | constant figure of Nazir added to h1 | result found in chart: you will see it; quarter gives timing | p.93 |
| 108 | `conversation-will-happen-method-1` | h1 | Umar | `umar` | constant figure of Nutik added to h1 | result found in chart: conversation will take place | pp.93–94 |
| 118 | `get-what-searching-for-in-place-method-1` | h1 | Iddris | `iddris` | constant figure of Itisal added to h1 | result found in chart: you will get it | p.94 |
| 119 | `what-blocks-you-method-1` | h1 | Ayuba | `ayuba` | constant figure of Ifusal added to h1 | result found in chart: you won't get it | pp.94–95 |
| 124 | `something-really-stolen-method-1` | whole chart | Umar | `umar` | a listed figure is anywhere in the chart | true — it has been stolen | pp.98–99 |
| 124 | `something-really-stolen-method-1` | whole chart | Yunus | `yunus` | a listed figure is anywhere in the chart | true — it has been stolen | pp.98–99 |
| 124 | `something-really-stolen-method-1` | whole chart | Issah | `issah` | a listed figure is anywhere in the chart | true — it has been stolen | pp.98–99 |
| 124 | `something-really-stolen-method-1` | whole chart | Hassan & Hussein | `hassan-hussein` | a listed figure is anywhere in the chart | true — it has been stolen | pp.98–99 |
| 132 | `hidden-treasure-method-1` | sum h4+h6 | Usman | `usman` | sum is a listed figure | there is treasure | p.103 |
| 132 | `hidden-treasure-method-1` | sum h4+h6 | Yussif | `yussif` | sum is a listed figure | there is treasure | p.103 |
| 132 | `hidden-treasure-method-1` | sum h4+h6 | Sulemana | `sulemana` | sum is a listed figure | there is treasure | p.103 |
| 132 | `hidden-treasure-method-1` | sum h4+h6 | Iddris | `iddris` | sum is a listed figure | there is treasure | p.103 |
| 132 | `hidden-treasure-method-2` | whole chart | Usman | `usman` | a listed figure is anywhere in the chart | there is something | p.103 |
| 132 | `hidden-treasure-method-2` | whole chart | Mahadi | `mahadi` | a listed figure is anywhere in the chart | there is something | p.103 |
| 132 | `hidden-treasure-method-2` | whole chart | Nuhu | `nuhu` | a listed figure is anywhere in the chart | there is something | p.103 |

## 10. Methods still unresolved — by category

| Category | Methods | Why |
|---|---|---|
| `source_ambiguous_overlapping_outcomes` | `marriage-method-4` (ch.7 M4), `children-method-3` (ch.13 M3) | The supplied figure groups overlap between outcomes (ch.7: Umar under two outcomes; ch.13: Mahadi, Usman, Adam, Issah, Ayuba, Umar each in two groups). No precedence is stated; none invented. |
| `source_contradiction` | ch.121 (`get-knowledge-in-life-method-1`) | The edition **writes "Adam"** but the figure **drawn beside it decodes to Usman (2121)**. Both values recorded; existing implementation (Adam, Ali) untouched. |
| `source_anomaly` | ch.106 table (used by `body-part-in-pain-method-1`); ch.49 | ch.106: Sulemana is printed for **both Head and Neck**, Adam is never used. ch.49: Sulemana is listed under **both** the fire (near) and sand (far) stars. Neither repaired; existing implementations untouched. |
| `source_present_unregistered` | ch.18 Part A M1 (Usman, Sulemana, Ibrahim, Yunus at h4+h10) and M2 (Nuhu, Ayuba, Ibrahim, Sulemana at h9+h10); ch.95 (Youthful: Yunus, Hassan & Hussein, Umar, Nuhu, Iddris, Issah; Middle-Youth: Usman, Musah, Kalla Allahu, Ibrahim, Ali, Yussif; Youth and Old Age: Adam, Ayuba, Sulemana) | Figures are in the edition; no public question was registered, by decision. |
| `source_incomplete` | `kidnapper-location-method-1` (ch.142) | Twelve outcomes are given, then "and so on, up to the end of the stars". **Hassan & Hussein, Yunus, Usman and Musah have no outcome** and none is invented. Also held at `needs_review` because "its own house" is never defined (see §A). |
| `constant_figure_undefined` | `money-method-4` (ch.2 M4), `fight-argument-method-1` (ch.26 M1) | The Sirri Sa'ael (Damir) is never defined; no Damir figure was invented. The figure lists these chapters check against are supplied but cannot be used. |

**No method is coded `figures_omitted_by_transcription` any more.**

## 11. Source present but not registered (engine decision)

`SOURCE METHOD PRESENT — ENGINE METHOD NOT REGISTERED`: ch.18 Part A (two methods), ch.95. Not registered, per decision. Chapters 109–117 do not exist in the PDF (nothing to register); ch.11 is unnumbered in both.

## Reading choices that need the author's eye (documented, not hidden)

- **§A ch.142 "own house":** the source says "check which star is found in its own house" but never says which house is a figure's own. The twelve outcomes appear in STARS numbering order, so the method reads "own house" as the house with the figure's STARS number — an **inference**. Because of it, the method is held at `needs_review` (no verdict shown) until the author confirms.
- **ch.19 M3:** the summed figure must be one of the four listed figures **and** be found in h4/h10 (win) or h5/h11 (lose); found in both pairs → uncertain (no precedence stated).
- **ch.17 M1/M2:** "found in the first four houses" = h1–h4. M2: fast list in h1–h4 → within an hour; fast list found elsewhere in the chart → within 7 days; slow list → within a month or a year. The closing "the year will be good/hard" sentence names no star and is **not implemented**. The timing question was switched to `resultKind: 'descriptive'` (answers are time spans).
- **ch.30:** Hassan & Hussein and Issah are **upward** stars in STARS, so they are read as figure-specific exceptions to the direction rule (they could never be reached from inside the downward branch), outcome `mixed`.
- **ch.5 / ch.6 / ch.132 M2 / ch.124 M1:** "in either house" / "anywhere in the chart" readings are the most literal reading of the source wording.
- **Single positive triggers** (ch.4, ch.5 M1, ch.6): other figures stay `uncertain` — the source states no negative branch.
- **ch.27 outcome mapping:** Method 1 → `favourable` for the named region; Method 2 fire/air/water → `mixed` ("good harvest but …"), sand → `favourable`. These map the source's own wording onto the engine's vocabulary; no meaning was added. Remedy instructions are reproduced from the source.

## Usman / Nuhu method-specific overrides (not a change to STARS)

`content/stars.ts` is **unchanged** (Usman is still `sand`, Nuhu still `air`). The final edition's explicit lists group them differently, so these two methods follow the source lists:

| Method | Source list says | STARS element says |
|---|---|---|
| `locate-method-1` (ch.36) | Usman → air list → **western**; Nuhu → sand list → **southern** | Usman sand (southern); Nuhu air (western) |
| `farming-method-1` (ch.27 M1) | Usman → stars of the **West**; Nuhu → stars of the **South** | (not element-driven) |
| `farming-method-2` (ch.27 M2) | Usman → **air** stars; Nuhu → **sand/earth** stars | Usman sand; Nuhu air |
| ch.49 `closer-or-far-method-1` | no behavioural difference (both figures are "far" under either grouping); the Sulemana duplication is recorded as an anomaly | — |

## 12. Test changes

- **New:** `kanzul-final-restoration.test.ts` (31 tests) — data integrity (every pattern equals STARS; no duplicates; disjointness of the lists the source states as separate groups; ch.94/97/142 table shape), every single-figure lookup for all 16 figures (ch.4, 9, 21, 94, 97), chart-scanning methods exercised on charts built to contain specific figures (ch.17, 19, 30, 102, 124, 132), the four constants (including an independent row-by-row check of constant + H1), the ch.27/36 overrides (and that STARS is untouched), the deliberately-unimplemented methods and their codes, and chapter text naming the figures.
- **Updated:** `kanzul-figure-audit.test.ts` (new status vocabulary; no `figures_omitted` anywhere; audit accounts for every source-coded method), `source-reconciliation.test.ts` (totals 187/19/27 → **205/20/8**; omitted code 17 → **0**; constant code 5 → **2**; two new codes asserted; the ch.142 "cannot run" test now asserts the own-house calculation), `questions-stage2/3/6/7/8/9.test.ts` and `questions.test.ts` (each assertion that encoded the old "figures omitted / constant undefined / insufficient_data" state now asserts the restored behaviour on the fixture chart), `history.test.ts` (the "not defined in the source" fixture moved from ch.4 — now restored — to ch.26, the one remaining fully-uncertain question). No test was deleted to make it pass.
- **Baseline before:** 3358 passed, 4 skipped. **After:** see §13.

## 13–15. Results

- **Targeted:** `kanzul-final-restoration.test.ts` 31/31, `kanzul-figure-audit.test.ts` 9/9, `source-reconciliation.test.ts` 167/167, stage tests 2/3/6/7/8/9 and `questions.test.ts` all passing.
- **`npm test`:** 91 files passed (2 skipped); **3391 tests passed, 4 skipped, 0 failed** (net +33 vs baseline).
- **`npx tsc --noEmit`:** clean.
- **`npm run build`:** ✓ Compiled successfully.

## Audit totals (from the repository)

Entries audited 153 of 153 transcription entries; chapters carrying figures in the final edition: 45; placeholders remaining in the transcription: **27** across 11 entries (ch.2, 7, 13, 18, 26, 29, 42, 49, 60, 61, 95 — down from 53/22); registry: 142 questions / 233 methods — 205 verified, 20 needs_review, 8 uncertain.

## 16. Files changed

Core engine (minimal, documented): `lib/raml/engine/types.ts` (two new `ReviewReasonCode` members: `source_ambiguous_overlapping_outcomes`, `source_incomplete`); `lib/raml/engine/operations.ts` (one small new operation, `ADD_CONSTANT_FIGURE_TO_HOUSE`, needed to add a named constant to H1 — nothing else in the engine changed).

New: `lib/raml/engine/kanzulFinalEditionFigures.ts`, `lib/raml/engine/constantFigureSearch.ts`, `lib/raml/engine/kanzulRestoredFigures.ts` (ch.5/6, from the earlier task), `lib/raml/engine/kanzulFigureAudit.ts`, `lib/raml/engine/__tests__/kanzul-figure-audit.test.ts`, `lib/raml/engine/__tests__/kanzul-final-restoration.test.ts`, `KANZUL_FINAL_RESTORATION_REPORT.md`, and `docs/Kanzul-Mikban-Final-Edition.pdf` (the supplied final edition).

Modified question definitions: `huntingSearching.ts`, `fightWarLocation.ts`, `enemyThiefLocation.ts`, `sicknessSurvival.ts`, `timingOfEvent.ts`, `courtCase.ts`, `wifeSisterHadSex.ts`, `farmingAndFood.ts`, `successfulTrip.ts`, `locateSomeoneOrSomething.ts`, `lifespanWhenDeath.ts`, `placeOfDeath.ts`, `moneyWorkLadyStable.ts`, `seeWhatSearchingFor.ts`, `conversationWillHappen.ts`, `getWhatSearchingForInPlace.ts`, `whatBlocksYou.ts`, `somethingReallyStolen.ts`, `hiddenTreasure.ts`, `kidnapperLocation.ts`, plus reason-code relabelling in `marriageBlessings.ts`, `childrenFromLady.ts`, `fightArgument.ts`, `money.ts`.

Other modified: `lib/raml/questionRegistryMeta.ts` (generated mirror: 18 statuses, ch.142 status, ch.17 result kind), `lib/server/content/kanzulMikban.ts` (reader text), `lib/raml/engine/COVERAGE.md` (two summary rows corrected + a closing section), and the tests listed in §12.

## 17. Confirmation

No authentication, magic-link, user, session, payment, Paystack, entitlement, marketplace, database-schema, migration, environment-variable or deployment-configuration file was touched. `content/stars.ts` was not modified. No geomantic rule was invented: every figure was decoded from the supplied edition; every undefined or ambiguous case is marked and left unimplemented. Nothing was committed, pushed or deployed.
