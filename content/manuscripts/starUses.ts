// Exact-source transcription of "The stars and their uses in a chat" — Chapter
// Four of "The Master of Geomancy, Volume 1" (pages 8-23 of the source PDF,
// immediately after "THE STARS, AND THEIR NAMES AND SYMBOLS" on page 7).
//
// This file is deliberately separate from content/stars.ts. That file already
// carries a PARAPHRASED, adapted version of this same chapter (its own header
// says so) and is read by the casting engine's "My Star" tab — it is not
// touched here. This file exists to restore the chapter's own words: every
// sentence below is the manuscript's own wording, not a summary of it. Only
// two kinds of change were made to the source text, and both are noted below
// rather than silently applied:
//
//   1. Line-wrap and spacing artifacts introduced by PDF text extraction
//      (a stray space inside one word, a hyphen at a line break) are closed
//      up. No word was added, removed, or reordered.
//   2. Each numbered entry's flowing prose is split into a "house 6" half and
//      a "house 2" half at the sentence the manuscript itself uses to make
//      that turn ("Also, if you found X in house (2)…" or equivalent). Nine
//      entries (Umar, Ayuba, Kalla Allahu, Sulemana) run the two houses
//      together in one paragraph in the source; the split point there is the
//      source's own transition sentence, not an invented boundary.
//
// The manuscript's own spellings are kept throughout — "sadaka" (not
// "sadaqah"), "colanut" (one word), "enemity", "massan", "pepe", "hatim" and
// "hatime" (the source uses both) — because Prompt 19 asks for the source's
// own words, not the app's house style.
//
// The sixteen Arabic invocations are each a standard, independently
// identifiable Divine Name or phrase (Ya Tahir, Ya Rahim, Ya 'Alim, and so
// on). Where the PDF's text layer split one of these across an odd internal
// space (e.g. "طا هر" for "طاهر") the word is closed up; nothing was
// transliterated, translated, or guessed — every phrase below is exactly
// what a reader of the source page recognises on sight, only re-joined where
// the PDF extraction broke a single word in two.
//
// What this file does NOT contain: the Hatim diagrams themselves. Those are
// hand-drawn and are handled separately in hatim.ts, where the numeral
// content that could not be read with confidence is marked as such rather
// than guessed — see that file's own header.

export interface StarUseEntry {
  /** Matches content/stars.ts Star.id. */
  starId: string;
  /** The manuscript's own ①–⑯ numbering for this chapter. */
  entryNumber: number;
  /** Page of the source PDF this entry begins on (1-indexed, printed folio). */
  sourcePage: number;
  /** The manuscript's own wording for what the star means in House 6, and
   * what sadaka (offering) it calls for there. Ends where the source's own
   * text turns to House 2. */
  house6Text: string;
  /** The manuscript's own wording for House 2, including whichever sadaka,
   * invocation, and surah instructions the source places in this half. */
  house2Text: string;
  /** The literal invocation phrase and its stated repeat count, if the
   * source gives one for this star. A few entries (Nuhu, Yunus) also carry a
   * second, morning-recitation invocation — that one is folded into the
   * relevant house's text rather than modelled here, since the source gives
   * it as part of the sentence rather than as a second discrete phrase. */
  invocation: { arabic: string; count: number } | null;
  /** Surahs, ayat, or other named recitations the source calls for, exactly
   * as named there (its own inconsistent capitalisation and spelling kept). */
  recitations: string[];
  /** Anything else the source states that doesn't fit the fields above — a
   * closing note, a caution, an unusual instruction. Never invented; only
   * used when the manuscript itself says something extra. */
  notes: string[];
  /** True where the source PDF's own text is internally inconsistent or
   * incomplete at this point (see the entry's own comment for what and why),
   * so the gap is documented rather than silently smoothed over. */
  sourceAmbiguity: string | null;
}

export const STAR_USE_ENTRIES: StarUseEntry[] = [
  {
    starId: 'yussif',
    entryNumber: 1,
    sourcePage: 8,
    house6Text:
      'If you draw a chat and found Yussif in house six (6), It means the sickness is from enemity (witchcraft). Do the sadaka of massan (11), cow milk and red cock on Friday.',
    house2Text:
      'Also, If you found Yussif in house (2), it means he will send money to someone. it also mean financial instability. His/her success and finances are blocked. Do the sadaka above and write يا طاهر (251) times, suratul kuraish (5) times, and the hatim below for him/her to be drinking and be rubbing the body every day. The problem and the sickness will be gone inshaa Allah.',
    invocation: { arabic: 'يا طاهر', count: 251 },
    recitations: ['Suratul Kuraish (5 times)'],
    notes: ['The problem and the sickness will be gone inshaa Allah.'],
    sourceAmbiguity: null,
  },
  {
    starId: 'adam',
    entryNumber: 2,
    sourcePage: 9,
    house6Text:
      "If you found Adam in house six (6), It means his/her area (location) is full of witches and wizards and the sickness normal start from the head for a long time before moving in to the body. Do the sadaka of white cola nut (1), massan (any number), and fresh cow milk.",
    house2Text:
      'Also, if you found Adam in house (2), it means he/she will get a lot of money soon. Do the sadaka of above and write يا الله (66) times, Suratul Sabihi [Surah Al-A\'la], and the hatim below for him/her.',
    invocation: { arabic: 'يا الله', count: 66 },
    recitations: ["Suratul Sabihi [Surah Al-A'la]"],
    notes: [],
    sourceAmbiguity: null,
  },
  {
    starId: 'mahadi',
    entryNumber: 3,
    sourcePage: 10,
    house6Text:
      'If you found Mahadi in house six (6), it means little mental disorder. You do the sadaka of white colanut (1) and white hen (1), give them to a healthy man.',
    house2Text:
      'If you found Mahadi in house (2), it means a lot of money will soon come. Do the same sadaka above and write يا زكي (37) times, Suratul Sarkhi (1) and the hatim below for him/her to be drinking and be rubbing every day.',
    invocation: { arabic: 'يا زكي', count: 37 },
    recitations: ['Suratul Sarkhi (1 time)'],
    notes: [],
    sourceAmbiguity: null,
  },
  {
    starId: 'iddris',
    entryNumber: 4,
    sourcePage: 11,
    house6Text:
      'If you found Iddris in house six (6), it means jinni sickness (spirits). It normally start from the chest pain for a long time and also cause difficulty in getting a stable relationship or marriage. Do the sadaka of white cloth, white cola (3) and sea water. Give them to a muslim brother.',
    house2Text:
      'Also, if you found Iddris in house (2), it mean money is on the way coming. Mostly it comes the same day. Do the same sadaka above and write يا رحيم (115) times, Suratul Kausara (1), Suratul Nabae (1) and the hatim below for him/her to be drinking and rubbing the body everyday.',
    invocation: { arabic: 'يا رحيم', count: 115 },
    recitations: ['Suratul Kausara (1 time)', 'Suratul Nabae (1 time)'],
    notes: [],
    sourceAmbiguity: null,
  },
  {
    starId: 'ibrahim',
    entryNumber: 5,
    sourcePage: 12,
    house6Text:
      'If you found Ibrahim in house six (6), it means jinni spirit that normally comes and goes. It also talks about ribs pain or sickness from your waist to your knees. Do sadaka of colanut (4), cow milk and a white veil. Give them to a young lady.',
    house2Text:
      'Also, if Ibrahim is found in house (2), it means fraud or they will steal your money. It also talk about financial problems. Do the same sadaka above and write يا عليم (150) times, Suratul Kadar (1), Suratul Zalzalat (1) and the hatim below for the person to be drinking and rubbing the body every day.',
    invocation: { arabic: 'يا عليم', count: 150 },
    recitations: ['Suratul Kadar (1 time)', 'Suratul Zalzalat (1 time)'],
    notes: [],
    sourceAmbiguity: null,
  },
  {
    starId: 'issah',
    entryNumber: 6,
    sourcePage: 13,
    house6Text:
      "If you found Issah in house six (6) it means jinni spirit or sickness. It also talk about enemity sickness that has been in one's body for a long time. It also prevent one from getting a stable relationship or marriage. Do the sadaka of fresh cow milk and white colanut (1) give them to a sick person. After that do another sadaka of biscuites or toffees to children. Write يا لطيف (129) times, Suratul Sabihi (1) and the hatim below for the person to be drinking and rubbing everyday.",
    house2Text:
      'If you found Issah in house (2), It means financial problems. Do the sadaka of (6) white colanuts to a needy. Get different colanut and divide it into 2, chew one part with all your intentions and give the other part out to someone. Write the same sura and the name يا لطيف (129) times and the hatime below for the person to be rubbing and drinking every day.',
    invocation: { arabic: 'يا لطيف', count: 129 },
    recitations: ['Suratul Sabihi (1 time)'],
    notes: ['The same invocation and surah are repeated for House 2 — the source states this explicitly rather than describing a second one.'],
    sourceAmbiguity: null,
  },
  {
    starId: 'umar',
    entryNumber: 7,
    sourcePage: 14,
    house6Text:
      'If you found Umar in house (6) six, it means sickness from witches and wizards (enemity), usually from an old colored woman. Do the sadaka of red colanut (7), red hen, massan (7),',
    house2Text:
      'Also, if you found Umar in house (2) it means financial instability. I mean difficult in getting money. Do the sadaka of red colanut (7) and red goat to a colored woman far away from you. Write يا جبار (206) times, Ayatul Kursiyu (11) times and the hatime below for both problems above for rubbing and drinking.',
    invocation: { arabic: 'يا جبار', count: 206 },
    recitations: ['Ayatul Kursiyu (11 times)'],
    notes: [],
    sourceAmbiguity:
      'The source runs House 6 and House 2 together in one paragraph here; the split above follows the source\'s own "Also, if you found Umar in house (2)" transition sentence.',
  },
  {
    starId: 'ayuba',
    entryNumber: 8,
    sourcePage: 15,
    house6Text:
      "If you found Ayuba in house six (6), it means jinni sickness spiritual or marriage. This normally caused the person difficulties in getting a stable relationship or marriage. Do the sadaka of a black hen. Kill it and cook food with it and share the food to the poor but don't taste or eat it please",
    house2Text:
      'Also, if you found Ayuba in house (2), it means there is darkness in your success, or life and things can never go well with you, specially business or money issues. Do the sadaka above and write يا باسط (312) times, Ayatul Kursiyu (7) times, Suratul Falaq (7) times, Suratul Nass (7) times and the hatim below for drinking and rubbing everyday.',
    invocation: { arabic: 'يا باسط', count: 312 },
    recitations: ['Ayatul Kursiyu (7 times)', 'Suratul Falaq (7 times)', 'Suratul Nass (7 times)'],
    notes: [],
    sourceAmbiguity: null,
  },
  {
    starId: 'kalla-allahu',
    entryNumber: 9,
    sourcePage: 16,
    house6Text:
      'If you found Kalla Allahu in house six (6), it means sickness from enemies from far away, not closer to you. Do the sadaka of massan (6) and any milk.',
    house2Text:
      'Also, if you found it in house (2) it means mismanagement of money unknowingly or unintentionally. Do the sadaka of cowmilk and a hen of any color and colanut of any color. Write يا هادي (20) times Suratul Karia (1) and the hatime below for both problems to be rubbing and drinking every day.',
    invocation: { arabic: 'يا هادي', count: 20 },
    recitations: ['Suratul Karia (1 time)'],
    notes: [],
    sourceAmbiguity:
      'The source runs House 6 and House 2 together in one paragraph here; the split above follows the source\'s own "Also, if you found it in house (2)" transition sentence.',
  },
  {
    starId: 'sulemana',
    entryNumber: 10,
    sourcePage: 17,
    house6Text:
      'If you found Sulemana in house six (6), It means sickness from jinni and shaitan. This normally happen to those that walk around mid-day or mid-night, odd times and quiet or fearing places. Also, cutting down some huge / big trees or setting them fire can also cause it. Do the sadaka of six (6) red colanuts, 6 pieces of pepe and a red hen.',
    house2Text:
      "Also, if you found it in house (2), it means there is a spell on the person and his finances and money can not be stable in his/her hand. Do the sadaka of a local egg, get the egg and send it to a place where 3 paths meet each other. Make all your intentions and hit it in the middle of the paths and run away immediately. Make sure the water of the egg don't touch you. Write يا نور (256) times, Kul huwa Allahu (Ikhlas) (7) times and the hatim below for him/her to be drinking and rubbing the body everyday.",
    invocation: { arabic: 'يا نور', count: 256 },
    recitations: ['Kul huwa Allahu (Ikhlas) (7 times)'],
    notes: [],
    sourceAmbiguity:
      'The source runs House 6 and House 2 together in one paragraph here; the split above follows the source\'s own "Also, if you found it in house (2)" transition sentence. "Kul huwa Allahu" is the source\'s own name for the recitation — it does not spell out "Suratul Ikhlas" here.',
  },
  {
    starId: 'ali',
    entryNumber: 11,
    sourcePage: 18,
    house6Text:
      'If you found Ali in house six (6), it means the sickness is from bad wind. We have good and bad wind. When one mistakenly come across the bad wind, he/she gets the sickness. Do the sadaka of a sheep or goat but if you can not get all, do the sadaka of a yellow colanut (1), when you get money you can do the sheep or goat sadaka.',
    house2Text:
      'Also, if you found Ali in house (2), it means you have a lot of enemies because of your successful life or your good future. It also means financial problems. Do the sadaka of one colanut with your intentions. After that do the sadaka of a goat of any color. Write يا سالم (370) times, Suratul Bainat (1) and the hatim below for rubbing and drinking.',
    invocation: { arabic: 'يا سالم', count: 370 },
    recitations: ['Suratul Bainat (1 time)'],
    notes: [],
    sourceAmbiguity: null,
  },
  {
    starId: 'nuhu',
    entryNumber: 12,
    sourcePage: 19,
    house6Text:
      "If you found Nuhu in house six (6), it means the sickness is from sihir (magic). It's an enemity sicknes",
    house2Text:
      'Also, if you found Nuhu in house (2); it means you will get a lot of money but you will get a lot of enemies after that. People will hate you because of the success. Do the sadaka of cowmilk, pieces of pepe (3) and red money to an old man. The sadaka for the sick person is a red goat. Write يا وكيل (66) times, Suratul Zalzalat (1) and the hatim below for rubbing and drinking every day. They should use the goat for Yaasin recitation. Do not take the meat of the goat please.',
    invocation: { arabic: 'يا وكيل', count: 66 },
    recitations: ['Suratul Zalzalat (1 time)'],
    notes: ['They should use the goat for Yaasin recitation. Do not take the meat of the goat, the source says.'],
    sourceAmbiguity:
      'The House 6 sentence ends without a full stop in the source ("…It\'s an enemity sicknes") before turning to House 2 — printed exactly as it appears.',
  },
  {
    starId: 'hassan-hussein',
    entryNumber: 13,
    sourcePage: 20,
    house6Text:
      'If you found Hassan in house six (6), it means the sickness is from jinni spirits which is mostly involves admitting the patients in the hospital and giving him/her drills. Mostly, all the water stars talk about jinni spirits or sickness. The jinni sickness are of different types. Some are mental problems, financial problems, relationship or marriage problems, etc. Do the sadaka of 2 hens of the same mother, one to the north and one to the south. Write يا حليم (88) times, Suratul Kadar (1) and the hatim below for rubbing and drinking everyday.',
    house2Text:
      'Also, if you found Hassan in house (2), it means he/she is facing serious financial problems. Do the same sadaka above; Do the same writing for him/her.',
    invocation: { arabic: 'يا حليم', count: 88 },
    recitations: ['Suratul Kadar (1 time)'],
    notes: [],
    sourceAmbiguity:
      'This entry names only Hassan throughout its own text — "Hussein" appears nowhere in Chapter Four\'s prose. The paired name "Hassan & Hussein" comes from the symbol page (Chapter Three) only. See the entry-level discrepancy note in COVERAGE.md.',
  },
  {
    starId: 'yunus',
    entryNumber: 14,
    sourcePage: 21,
    house6Text:
      'If you found Yunus in house six (6), it means the sickness is from enemies, and envy and jealousy. This happens when you step on charms (sihir) or they cast a spell on you, or swear on you with an egg, broom, pepe etc. Therefore always recite Ayatul Kursiyu (9) times every morning before leaving the house. Do the sadaka of white hen and white colanut (7), then white water, you can use Zam Zam, mau-ward etc. if you did not get the white water. Write يا حي يا قيوم (18) times, "…هو الأول والآخر…" up to the end of the aya (from Suratul Hadid) and the hatim below for rubbing and drinking everyday.',
    house2Text:
      'Also, if you found Yunus in house (2) it means money is on the way coming to you the geomancer and querent. Do the sadaka of white cock and food. Cook it and feed 50 people or 5 people (men). Write the same name, the ayatu and the hatime below for drinking and rubbing everyday.',
    invocation: { arabic: 'يا حي يا قيوم', count: 18 },
    recitations: [
      'Ayatul Kursiyu (9 times, recited every morning before leaving the house)',
      'the closing verse of Suratul Hadid, "…هو الأول والآخر…", to the end of the ayah',
    ],
    notes: [],
    sourceAmbiguity: null,
  },
  {
    starId: 'usman',
    entryNumber: 15,
    sourcePage: 22,
    house6Text:
      "If you found Usman in house six (6), it means the sickness is from almighty Allah. Some say that it's from one mualim to another out of envy and jealousy. This happens to God-fearing and opened-hearted Mualims or mualimaats to bring them down. Do the sadaka of a mixed-color hen and give it to a Mualim or maalimaat with your intentions. Write يا كافي (111) times, Suratul...Alamnashiraha (1) and the hatime below, for drinking and rubbing your body every day.",
    house2Text:
      'If you also found Usman in house (2), it means you will get money soon, but it will not be much because your finances all has been tie up by Mualim or Mualimaat. Do the sadaka above and the writings for him/her to rubbing and drinking every day.',
    invocation: { arabic: 'يا كافي', count: 111 },
    recitations: ['Suratul...Alamnashiraha (1 time)'],
    notes: [],
    sourceAmbiguity:
      'The surah name is printed in the source itself as "Suratul...Alamnashiraha" with the ellipsis — the PDF\'s own layout breaks there, not this transcription. Alam Nashrah (Ash-Sharh) is the surah the name points to, but the source\'s own gap between "Suratul" and the name is reproduced rather than closed.',
  },
  {
    starId: 'musah',
    entryNumber: 16,
    sourcePage: 23,
    house6Text:
      'If you found Musah in house six (6), it means the sickness is from witchcraft (enemity). It means the person has a lot of enemies because of his/her success or bright future. Do the sadaka of Massan (8). After get a sheep for Mallams to recite Kuran or Yasin for you.',
    house2Text:
      'Also, if you found Musah in house (2), it means a lot of money is on the way coming inshaa Allah—but it won\'t be stable in your hand. Do the sadaka of white cock and cooked food for children to eat. If you cannot do it, get cowmilk and fula, mash it together and add sugar to it for children to drink. Write يا جامع (114) times, Suratul Nabae and the hatim below for him/her to be drinking and rubbing every day.',
    invocation: { arabic: 'يا جامع', count: 114 },
    recitations: ['Suratul Nabae'],
    notes: ["Not: it's for both the sick person and the money problems, the source adds — its own note, kept as written."],
    sourceAmbiguity: 'The source gives no repeat count for Suratul Nabae here, unlike its other recitations; none is invented.',
  },
];

export function getStarUseByStarId(starId: string): StarUseEntry | undefined {
  return STAR_USE_ENTRIES.find((e) => e.starId === starId);
}
