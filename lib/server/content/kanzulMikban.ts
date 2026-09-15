// SERVER-ONLY. Relocated here from content/manuscripts/kanzul-mikban.ts by
// the Prompt 27 protected-content migration — this is the complete,
// paid Kanzul Mikban book text, and must never be imported by any
// client-reachable module again. See lib/server/contentService.ts (the
// one place this should be read from) and lib/access/README.md's content-
// delivery section. content/manuscripts/kanzulMikbanMeta.ts carries the
// public id/number/title subset for navigation, search, and source
// labels — everything that does NOT require the actual chapter text.
//
// Transcribed from the source manuscript "Kanzul Mikban" (‘Ilm al-Raml),
// a compiled notebook of ~150 question-specific geomantic reading methods.
// Chapter numbers follow the author's own hand-numbering on the manuscript
// pages (which the compiled edition's own note says takes precedence over the
// notebook's typed table of contents where the two disagree) — hence gaps like
// 109-117 and the unlabelled entry between Ten and Twelve: these are preserved
// exactly as in the source, not transcription errors.
//
// Figures embedded as hand-drawn images in the original (not extractable as
// text) are marked inline where the source listed them; see the book's own
// note on this in its front matter, reproduced in KM_EDITION_NOTE below.

export interface KmChapter {
  id: string;
  number: number | null;
  title: string;
  paragraphs: string[];
}

export const KM_TITLE = "Kanzul Mikban";
export const KM_SUBTITLE = "A Manual of Geomancy";

export const KM_EDITION_NOTE: string[] = [
  "This edition transcribes a handwritten manuscript notebook of geomantic (‘ilm al-raml) divination methods, gathered under the title Kanzul Mikban. It has been prepared for readability while preserving the wording and structure of the original as closely as possible.",
  "This book assumes the reader already knows how to cast a geomancy chart, and moves straight into what each resulting chart means. A completed chart is made up of sixteen positions, called houses and numbered h1 through h16. Each house holds one figure — a stack of four lines, each line either a single dot (an odd count) or two dots side by side (an even count).",
  "Every figure is also associated with one of four elements — Fire, Air, Water, and Sand (earth) — and many methods ask you to isolate a specific element from a house or group of houses rather than reading the whole figure.",
  "The book regularly describes a figure (also called a star) using paired qualities: opened or closed (a single dot is opened, a double dot is closed), upward or downward, good, bad, or middle-good, male or female, day or night, and stable or unstable. These qualities characterize a figure once it has been identified in a chart, but this transcription has no verified source defining exactly which of the sixteen named figures carries which quality — so unlike the figure names and elements themselves, this app does not attempt to auto-resolve a method's good/bad/upward/downward verdict for you. Read the houses the method points to on your own cast chart, and apply the quality it describes.",
  "Several methods refer to the “first 4,” “second 4,” “third 4,” or “last 4” houses — meaning houses h1–h4, h5–h8, h9–h12, and h13–h16 respectively (Umuhat for the first four). The book also refers to a handful of named techniques and constant figures used as recurring checks — among them Sirri Sa'ael (also called Damir), Itisal, Ifusal, and Nazir — and to sadaka, a charitable offering, in several remedies.",
  "The dot-figures throughout the original were reconstructed from hand-drawn manuscript photographs; where a figure could not be read with confidence, this transcription marks the gap rather than guessing. Readers relying on this text for precise ritual or divinatory use are encouraged to verify any critical figure against the original manuscript pages.",
];

export const KM_CHAPTERS: KmChapter[] = [
  {
    id: "traveling-business-and-if-you-will-return-from",
    number: 1,
    title: "Traveling, Business, and If You Will Return from the Trip or Not",
    paragraphs: [
      "Method 1: After drawing the chart, pick h1 and h8, then (h9 and h11), and add all of them. If it's a good and upward star, you will return with money and peacefully. If it's a good and downward star, you will return peacefully but without money. If it's a bad star, it's not good at all for you to travel.",
      "Method 2: After drawing the chart, pick (h1 and h7) then (h4 and h8), add all, and check the result you get: if it's fire or air star, you will return with money; if it's water or sand star, you will come back with nothing.",
      "Method 3: After casting the chart, pick h3, h7, h11 and h15 fire elements and form one star; then pick h3, h7, h11 and h15 air elements and form a star; then pick h3, h7, h11 and h15 water elements and form a star; then pick h3, h7, h11 and h15 sand elements and form a star. You will have 4 stars at the end — add them and check the star. If it's a good and single-dot star and also found in the chart, it means the trip is good and safe. But if it's a good double-dot star and also found in the chart, it means you will go and come in peace but you won't get money from the trip. If it's not found in the chart at all, it means it's not good to travel.",
    ],
  },
  {
    id: "if-you-want-to-know-if-you-will",
    number: 2,
    title: "If You Want to Know If You Will Get Money Today or Not",
    paragraphs: [
      "Method 1: After drawing the chart, pick h3, h7, h11 and h15 and add them. If the water or fire element is opened (single dot), you will get money that day; if it's not, you will not get money.",
      "Method 2: After drawing the chart, pick h2 and h11 and add them. Add the result to h7 and check if it's in the chart — you will get money, but if it's not in the chart, you will not get anything.",
      "Method 3: Pick h3, h7, h11 and h15 water elements and form a star. If the water or fire element of that star is opened (single dot), then you will get money; if it's not, you will not get money that day.",
      "Method 4: Also, check your Sirri Sa'ael (Damir); if it's any of the stars below, you will get whatever you are asking for or about: [figures omitted — symbols not preserved in this transcription]",
    ],
  },
  {
    id: "business-profit-and-loss",
    number: 3,
    title: "Business, Profit, and Loss",
    paragraphs: [
      "Method 1: Pick (h1 and h5) then (h4 and h6). Add all and check: if it's a good star, you will get a lot of profit; if it's a bad star, you won't get any profit.",
      "Method 2: Pick (h2 and h6), (h11 and h13), and add them. Then add the result to h16. If you get a good star and it's also found in the chart, you will get more profit from the business. If it's a good star but not found in the chart, it means you will go and come in peace but you will not get any profit. If it's a bad star, it means it's not good to travel at all or embark on that business trip.",
      "Method 3:",
      "Also, after drawing the chart, check h2 and h6 — if you see a bad star in both houses, it means it's not good; but if it's a good star, it's good to embark on the business trip.",
    ],
  },
  {
    id: "hunting-in-water-and-on-land-and-searching",
    number: 4,
    title: "Hunting in Water and on Land, and Searching for Anything",
    paragraphs: [
      "After drawing the chart, check h10. If you find the following stars, it means you will be successful in your search: [figures omitted — symbols not preserved in this transcription]. If it's any of the above stars, you will get whatever you are asking for or searching for — for example: job, money, title, promotion, marriage, etc.",
    ],
  },
  {
    id: "if-you-will-win-a-fight-war-or",
    number: 5,
    title: "If You Will Win a Fight, War, or Court Case",
    paragraphs: [
      "After drawing the chart, check h6. If you see any of the following stars there, it means you will win it: [figures omitted — symbols not preserved in this transcription]. If you found any of the following stars in h1",
      "and h8, it means it's not good and it will be difficult to succeed. They are as follows: [figures omitted — symbols not preserved in this transcription]",
    ],
  },
  {
    id: "if-you-want-to-know-where-your-enemy",
    number: 6,
    title: "If You Want to Know Where Your Enemy or a Thief Is Hidden",
    paragraphs: [
      "After drawing the chart, check h4 and h10. If you see any of the stars below in any of the houses, it means you will see or get him/her in an opened land or desert: [figures omitted — symbols not preserved in this transcription]",
    ],
  },
  {
    id: "marriage-and-its-blessings",
    number: 7,
    title: "Marriage and Its Blessings",
    paragraphs: [
      "Method 1: After drawing the chart, pick h1, h7, h4 and h10, and add them. If you get a downward star and it's found in the chart, you will get her and it's good; but if it's an upward star and not found in the chart, it's not good for you.",
      "Method 2: Pick h4, h8, h14 and h16 sand elements and form a star. If found in the chart, it's good; but if it's not in the chart, it's not good for you even if you get her/him.",
      "Method 3: Pick h4, h6, h12 and h16 and add them. If your result is a sand star or fire star, it's good; if it's otherwise, it's not good for you.",
      "Method 4: Check h7. If you see [figures omitted — symbols not preserved in this transcription] it means you will get a colored or white lady with a child. She's a sick person and will bring you a lot of financial difficulties. She will not get you a child nor blessings in the relationship or marriage. If it's, it means you will get a short lady/man; she/he cannot stay in the marriage — there will be a divorce even if you marry her/him. If it's, you will get a colored and beautiful lady; she will bring you lots of success and children. If it's, you will get a dark lady far from your town — it's also a good marriage. If it's, you will get a colored lady; it's good, but she will have too much jealousy and wouldn't want you to marry another.",
    ],
  },
  {
    id: "if-she-s-going-to-stay-in-the",
    number: null,
    title: "Sub-topic: If She's Going to Stay in the Marriage or Not",
    paragraphs: [
      "Method 1: Pick h9 and h8 and add them. If you get an upward star, she will not stay forever; if it's a downward star, she will stay, insha'Allah.",
      "Method 2: Pick (h2 and h7) then (h4 and h10), add them all, and check: if it's a good and downward star, she will stay and enjoy the stay. If it's a good and upward star, she will leave even though she enjoys the stay. If it's a bad and downward star, she will not enjoy the stay and will also not leave. If it's a bad and upward star, she will leave immediately because she will not enjoy her stay, and will leave faster than expected.",
    ],
  },
  {
    id: "if-one-will-stay-in-a-particular-place",
    number: 8,
    title: "If One Will Stay in a Particular Place or Not, and If It's Good or Not",
    paragraphs: [
      "Pick h2 and h16 and add them. If it's a downward star, he/she will stay there forever; if it's an upward star, he/she will leave one day. If it's a good star, it's good to stay; if it's a bad star, it's not good.",
    ],
  },
  {
    id: "sickness-if-he-she-will-survive",
    number: 9,
    title: "Sickness (If He/She Will Survive)",
    paragraphs: [
      "Method 1: After drawing the chart, pick h4 and h6 and add it to h8. Add all and check: if it's a good star, it's sickness from Allah; if it's a bad star, it's from humans. If it's found in the chart, he/she has a long life; if not found in the chart, he/she will not survive it.",
      "Method 2: After drawing the chart, pick h2, h5, h8 and h11 and add them all. If it's found in the chart, he/she will survive the sickness; if it's not found in the chart, he/she will not survive.",
      "Method 3: If you find the following stars in h6, he/she will be healed, insha'Allah: [figures omitted — symbols not preserved in this transcription]. But if you find stars like: [figures omitted — symbols not preserved in this transcription] it means it will be difficult for him/her to survive.",
    ],
  },
  {
    id: "if-your-lost-thing-is-still-around-or",
    number: 10,
    title: "If Your Lost Thing Is Still Around or Is Gone",
    paragraphs: [
      "Method 1: Pick h1 and h5 and add them. If your result is found in the chart, it's still around you or still in town. If it's not found in the chart, it's out of town.",
      "Method 2: Pick h5 and h16 and add them. If your result is an upward star, it's out of town; if it's a downward star, it's still around you.",
      "Method 3: Pick h8 and h9 and add them. If it's a downward star and also found in the chart, then you will get it back; but if it's a downward star and not found in the chart, you won't see it, though",
      "you may hear about it. If it's an upward star and found in the chart, you will hear about it.",
      "Method 4: Pick h5 and h6 and add them. If it's an upward star, you will get it; if it's a downward star, you won't get it again. Also, if it's in the chart you will see it; if it's not in the chart you won't see it again.",
      "Method 5: Also, pick h1 and h7 and add them. If it's found in the chart, you will get it back; if it's not in the chart, you won't get it again. Note: If you found this configuration in h5 and h6 [written as \"Musah\" in the original — term unclear], it means you will get calamity/a fight, or a fire-burning problem, around you. — If you want to know if you will get your lost money back or not —",
      "Method 1: Pick h5, h15, h6 and h10 and add them. If it's a water star, you will get it again; if it's a fire star, you will get it but it will take a longer time; if it's an air star, there's a probability that you will get it again — you may only hear about it, far away. If it's a sand star, forget about it.",
      "Method 2: Pick h2, h5, h8 and h11 and add them. If it's a good star and also found in the chart, you will get it early and easier. If it's a",
      "good star and not found in the chart, you will get it but not early. If it's a bad or middle-good star and found in the chart, you will only hear about it but won't get it. If it's a bad star and not found in the chart, you won't see it or hear about it.",
      "Method 3: Check h2 and h6; if both are downward stars, you will get it back; if they are not, forget it.",
      "Method 4: Pick h6 and h9 and add them. If it's a downward star, you will get it back; if it's an upward star, forget it.",
    ],
  },
  {
    id: "if-you-want-to-know-if-you-will-2",
    number: 11,
    title: "If You Want to Know If You Will Be Successful in Life, at Home, or Have to Travel Away from Home",
    paragraphs: [
      "Method 1: Pick (h1 and h2) then (h7 and h8) and add them. If it's a downward star, you will be successful at home; but if it's an upward star, you have to run from home.",
      "Method 2: Pick the same stars above and add them. If it's water or sand star, stay at home; if it's fire or air, run from home.",
    ],
  },
  {
    id: "if-you-want-to-know-if-you-will-3",
    number: 12,
    title: "If You Want to Know If You Will Be Rich in Life or Not",
    paragraphs: [
      "Pick h1, h7, h4 and h8 and add them. If it's fire or air star, you will be rich; but if it's water or sand star, it will be difficult — you need serious prayers. If it's a good star but water or sand star, you will be feeding and clothing alright but you won't be rich. If it's a bad star and also water or sand star, you can only feed from hand to mouth — some will end up begging to feed. May Allah Almighty have mercy on us.",
    ],
  },
  {
    id: "if-you-will-get-children-from-a-lady",
    number: 13,
    title: "If You Will Get Children from a Lady You Want to Marry",
    paragraphs: [
      "Method 1: Pick h1 fire element, h5 air element, h4 water element, and h10 sand element, and form a star. If it's a good and downward star, and also found in the chart, you will get children early and many kids. If it's a good star but not in the chart, you will get kids but not early. If it's a bad star, you won't.",
      "Method 2: Pick h1, h5, h11 and h14 and add them. If it's fire star, you will have kids very fast. If it's air star, you will get kids but it",
      "will take a long time. If it's water or sand star, it will be difficult to have a kid with her.",
      "Method 3: If you found the following stars in house 5, it means she will get pregnant early for you: [figures omitted — symbols not preserved in this transcription]. [figures omitted — symbols not preserved in this transcription]. If it's [figures omitted — symbols not preserved in this transcription] she will get pregnant early with no problems. If it's: [figures omitted — symbols not preserved in this transcription] it takes time before she can get pregnant. If it's [figures omitted — symbols not preserved in this transcription] she will get pregnant early but it will be disturbing her — mostly it's jinn spirits that normally cause these problems. If it's [figures omitted — symbols not preserved in this transcription] she will be getting miscarriages, or the kids will be dying — it's caused by witchcraft of enemies, sometimes jinn spirits, which is difficult to cure. If it's: [figures omitted — symbols not preserved in this transcription] it's difficult for her to have a kid.",
      "Method 4: Pick h6 and h10 and add them. If it's a downward star, she will (have kids); but if it's upward, she will not.",
      "Method 5: Pick h2, h5, h7 and h15 water elements and form a star. If the water element is opened (single dot), she will — and if it's a good star too, she will — but if it's not, she will not have kids.",
    ],
  },
  {
    id: "if-a-pregnancy-is-going-to-be-stable",
    number: 14,
    title: "If a Pregnancy Is Going to Be Stable or Not (Good Condition)",
    paragraphs: [
      "Pick h1, h5, h4 and h10 and add them. If it's a good star, it will be stable; if it's a bad star, it won't. If you get the star in the chart, it's a genuine pregnancy; if it's not found, it's not a real pregnancy. — If you want to know if it's really pregnancy or it's sickness —",
      "Method 1: Pick h1, h5, h11 and h14 and add them. If it's fire star, it's pregnancy; if it's air star, it's sickness; if it's water star, it's meat, not a full human; if it's sand star, it's only blood. If it's a good star, it will be saved; if it's a bad star, it will be difficult to cure the sickness or the problem.",
      "Method 2: Pick h1 and h6 and add them. If it's a good star, it will be successful; if it's a bad star, it's going to be a very serious problem.",
      "Method 3: Check h4. If it's fire star, it's pregnancy; if it's air star, it's sickness; if it's water star, it's food or meat; if it's sand star, it's blood.",
    ],
  },
  {
    id: "if-things-will-be-better-for-the-questioner",
    number: 15,
    title: "If Things Will Be Better for the Questioner or Not",
    paragraphs: [
      "Pick h(2 and h6), then (h3 and h7), then (h8 and h9), then (h13 and h15), then add them all. If you get a good star, you will be wealthy and have a good life. If it's a bad star, it will be difficult to be successful in life. If it's a middle-good star, things will be difficult and sometimes it will be better. If it's a bad star, it will be more difficult. If it's a good star, it's going to be blessing upon blessing. If the star repeats itself a number of times, it also shows how your life will be — whether it's a good, bad, or middle-good star.",
    ],
  },
  {
    id: "if-you-will-overcome-your-enemy-or-not",
    number: 16,
    title: "If You Will Overcome Your Enemy or Not",
    paragraphs: [
      "Method 1: Pick (h1 and h12), (h8 and h13), and add all. If you get fire or air star, you will overcome him/her, and he/she will die. If it's water star, you will overcome him/her but he/she will not die. If it's sand star, you will never succeed — you cannot do anything to him/her. You will end up hurting yourself if you don't stop.",
      "Method 2: Pick (h1 and h12), then (h13 and h14), and add them all. If you get a good star, you will be saved by Allah Almighty from his",
      "charms and problems, and you are likely to overcome him/her. But if it's a bad star, please avoid him/her — you will be hurt if you try doing anything to him/her.",
    ],
  },
  {
    id: "if-something-will-happen-in-an-hour-day",
    number: 17,
    title: "If Something Will Happen in an Hour, Day, Week, Month, or Year",
    paragraphs: [
      "Method 1: Pick (h1 and h6), then (h4 and h16), and add all. If you get: [figures omitted — symbols not preserved in this transcription] then it will happen within an hour, or a day, or 1–10 days. If any of the above is found in the first four houses, then it will happen within an hour.",
      "Method 2: Pick (h1 and h13), then (h4 and h12), then (h7 and h10), then (h15 and h16), and add all. If you get: [figures omitted — symbols not preserved in this transcription] in the first four stars, it will happen very fast — less than an hour, or an hour's time. But if it's found in the chart, it will happen within 7 days. And if it's: [figures omitted — symbols not preserved in this transcription] then it will happen within a month or a year. If you use the method above and the star",
      "is found in the chart, it means the year will be good; if not, the year will be hard.",
    ],
  },
  {
    id: "if-you-will-get-your-stolen-things-back",
    number: 18,
    title: "If You Will Get Your Stolen Things Back",
    paragraphs: [
      "Part A — If they will steal you:",
      "Method 1: Pick h4 and h10 and add them. If you get: [figures omitted — symbols not preserved in this transcription] they will steal you no matter what happens; but if it's not any of the above stars, they won't steal you.",
      "Method 2: Pick h9 and h10 and add them. If you get [figures omitted — symbols not preserved in this transcription] don't do any business with your money — you will get defrauded. Or don't stay in that area — they will steal your money.",
      "Method 3: Pick h1 and h5 and add them. If your result is in the chart, it means they will steal you; but if it's not found, they won't steal you — you can stay there and do your business. Part B — If you will get your stolen things back:",
      "Method 1: After casting the chart, pick h1 and h5 and add them. If your result is found in the chart, you will see them, or it's not gone far from you and you can still get them; but if it's not found in the chart, you won't see them again.",
      "Method 2: Pick h7 and h8 and add them. If it's a downward star, you will get them back; but if it's an upward star, you won't get them again.",
      "Method 3: Pick h2, h6, h9 and h16 and add them. If your result is found in the chart, you will get them; if it's not found in the chart, you won't see them again. Some scholars also say that after picking h2, h6, h9 and h16 and adding them: if you get a good and downward star, you will get them back peacefully. If it's a good and upward star, you will hear about them but you might not get them. If it's a middle-good or bad star, upward or downward, you won't get them back.",
    ],
  },
  {
    id: "if-you-will-win-a-case-in-court",
    number: 19,
    title: "If You Will Win a Case in Court, Chief Palace, a Fight, or War",
    paragraphs: [
      "Method 1: After casting the chart, pick h1, h5, h9 and h14 and add them. If you get a good star, you will win the case. If it's middle-",
      "good star, the case will keep long in court and you may win it with prayers. If it's a bad star, you will lose.",
      "Method 2: Pick h8, h11, h7 and h16 and add them. Add the results to h1 and check if it's a good star — you will win the case; if it's not, you will lose it. If it's a middle-good star, you may win it with serious prayers.",
      "Method 3: Pick h4, h5, h10 and h11 and add them. If you get: [figures omitted — symbols not preserved in this transcription] in h4 and h10, you will win the case. But if they are found in h5 and h11, you will lose the case.",
      "Method 4: Pick h8, h1, h9 and h11 and add them. If you get a good and upward star, you will win the case and even get money out of it. If it's a good and downward star, you will win the case without money. If it's a bad star, you will lose the case. Note: the above method (4) can also be used for travelling — that is, if it's a good and upward star, you will go and come in peace and with money; if it's a good and downward star, you will go and come in peace but you won't get money or profit from your trip. If it's a bad star, please don't travel at all — it's not safe.",
    ],
  },
  {
    id: "who-will-win-an-election-or-a-chieftaincy",
    number: 20,
    title: "Who Will Win an Election or a Chieftaincy Title",
    paragraphs: [
      "After casting the chart, pick h1, h5, h9 and h13 and add them. If you get a good star, he/she will win; but if it's a bad star, he/she will not. Choose the one you want to win and name him/her first. If it's a middle-good star, it's going to be a bracket [too close to call]. If it's not found in the chart, it means the election might not come on schedule, or it will be delayed due to some misunderstanding. You can also use h10, h12, h14 and h15 and add them — same explanation as above.",
    ],
  },
  {
    id: "if-your-wife-or-sister-has-had-sex",
    number: 21,
    title: "If Your Wife or Sister Has Had Sex or Not",
    paragraphs: [
      "Method 1: After drawing the chart, pick h6 and h16 and add them. Add the result to h7 and check if it's an opened star — she does have sex; but if it's a closed star, she didn't.",
      "Method 2: After drawing the chart, pick h7 and h13 and add them. If the star's water line is active (water element is opened, meaning single dot), she does have sex; but if it's closed, she didn't.",
      "Method 3: After casting the chart with your intention, check h7. If you see [figures omitted — symbols not preserved in this transcription] it means she does or he does have sex; but if it's: [figures omitted — symbols not preserved in this transcription] she didn't.",
    ],
  },
  {
    id: "if-it-s-good-to-stay-in-a",
    number: null,
    title: "If It's Good to Stay in a Particular House",
    paragraphs: [
      "Method 1: After casting the chart, pick sand element of h4, h8, h14 and h16 and form a star. If it's a good star, it's good to stay; but if it's a bad star, please leave the house.",
      "Method 2: After casting the chart, pick h8, h9, h2 and h6 and add them. If it's a good star, it's good to stay; but if it's a bad star, please run for your dear life.",
      "Method 3: After drawing the chart, check if the downward stars are more than the upward stars — then you can stay; but if they are not, it's not good for you to stay.",
    ],
  },
  {
    id: "if-it-s-good-to-stay-in-a-2",
    number: 22,
    title: "If It's Good to Stay in a Town or Not",
    paragraphs: [
      "Method 1: After drawing the chart, check h4. If it's a good star, it's good to stay; but if it's a bad star, it's not safe for you.",
      "Method 2: After casting the chart, count all the good stars in the chart. If they are more than the bad stars, you can stay; but if they are not, don't stay.",
    ],
  },
  {
    id: "is-there-much-trees-water-sand-or-stones",
    number: 23,
    title: "Is There Much Trees, Water, Sand, or Stones in the Area You Are Going To",
    paragraphs: [
      "After drawing the chart, pick h1, h7, h4 and h8 and add them. If it's fire star, the area has much stones. If it's an air star, the area has much trees. If it's water star, the area has much water. If it's sand star, the area has much sand.",
    ],
  },
  {
    id: "if-you-will-be-safe-entering-a-canoe",
    number: 24,
    title: "If You Will Be Safe Entering a Canoe, or Will Get Fish from Fishing",
    paragraphs: [
      "Method 1: After drawing the chart, pick h10, h12, h14 and h15 and add them. If your result is a downward star, you may not return or come out of the water safely; but if it's an upward star, you will come out in peace.",
      "Method 2: Pick h1, h5, h9 and h13 and add them. If it's a downward star, you or the whole people in the canoe are not safe and may not return. But if it's an upward star, you will be returned safely. Also, if it's a good and downward star, they will see all of you and bring you out of the water; but if it's a bad star, you won't even be seen. If it's a good and upward star, you will get more fish or money, and vice versa.",
    ],
  },
  {
    id: "if-there-are-armed-robbers-on-your-way",
    number: 25,
    title: "If There Are Armed Robbers on Your Way",
    paragraphs: [
      "After casting the chart, pick h9, h8, h12 and h16 and add them. If your result is a water star, then you don't have to travel — you may meet armed robbers on your way, which will involve bloodshed or accident.",
    ],
  },
  {
    id: "if-there-will-be-a-fight-argument-etc",
    number: 26,
    title: "If There Will Be a Fight, Argument, etc",
    paragraphs: [
      ". After casting the chart, check h2 and h1. If you found: [figures omitted — symbols not preserved in this transcription] it means there will be a fight or misunderstanding in the family or",
      "between some people in town. But if you found:, in h9, it means there will be peace. If you draw a chart and your Sirri Sa'ael (Damir) is [figures omitted — symbols not preserved in this transcription] it means you will have a fight with, or disagreement with, someone. If you found any of the above stars in h8, it means the fight is going to be very bad and may affect many people around you. If you found any of the stars above in h12, it means the fight may claim the life of some good people, or a person, in your family or around you. Get a red sheep or cow for Muslims to recite the Qur'an, for the whole family, to avert the problem. If you found: [figures omitted — symbols not preserved in this transcription] in h14, it means you will get a car, motorbike, bicycle, a horse, or something that can take you from place to place.",
    ],
  },
  {
    id: "about-farming-and-food-in-the-year",
    number: 27,
    title: "About Farming and Food in the Year",
    paragraphs: [
      "Method 1: After casting the chart, pick h1, h7, h4 and h8 and add them. If you get stars of the East [figures omitted — symbols not preserved in this transcription] it means they will get a bumper harvest in that year. If you get the",
      "stars of the West: [figures omitted — symbols not preserved in this transcription] West people will get a bumper harvest that year. If you get stars of the North [figures omitted — symbols not preserved in this transcription] people of the North will get a bumper harvest more than all in that year. If you get stars of the South: [figures omitted — symbols not preserved in this transcription] people from the South will get a bumper harvest in that year. Method 2 — general harvest, calamity, and what kind (this year): After casting the chart, pick h1, h5, h10 and h15 and add them. If you get fire stars: [figures omitted — symbols not preserved in this transcription] there will be good harvest, but locusts and grasshoppers are going to eat or spoil most of it. Write Suratul Falaq and Suratul Nass (7 times) each on paper and make it 5 layers. Bury them in the farm. Also write them the same number, wash them, and mix it with the things you are going to sow. If you get air stars: [figures omitted — symbols not preserved in this transcription] you will get a bumper harvest but animals (beasts) will eat or spoil a lot of them that year. Write Suratul Naba'a (1 time) each on 5 papers and make",
      "them layers. Bury them in the farm. Also write it 5 times, wash it, and mix it with what you are going to sow. If you get water stars [figures omitted — symbols not preserved in this transcription] you will get a bumper harvest but worms or maggots will eat or spoil a lot of them. Write Ayatul Kursiyy (9 times) on each paper and make them 5 layers. Bury them in the farm. Also write it the same number, and mix it with what you are going to sow. It also means that year's rainfall will not be much, which will cause a low harvest — pray a lot for rainfall in that year. If you get sand/earth stars: [figures omitted — symbols not preserved in this transcription]., you will get a bumper harvest and nothing bad will happen that year — no calamity will befall your farms, insha'Allah.",
    ],
  },
  {
    id: "if-you-will-get-money-or-good-strangers",
    number: 28,
    title: "If You Will Get Money or Good Strangers That Same Day or Not",
    paragraphs: [
      "After drawing the chart, pick the water element of h5, h7, h11 and h14 and form a star. Add it to h7 and check if it's found in the chart — it means you will get money or very good visitors that day. If the",
      "water element of the star is opened (single dot), it's very close; but if it's closed, it will take a longer time. If the star repeats many times in the chart, it will happen early; if not, it will take a long time. If it's fire and downward star, a man will visit you with money — a child will also come to you with something like cooked food. If it's fire and upward star, you won't get anything except good conversation. If it's air star, a lady will visit you with gifts or money; after her, a man will come with a Sadaqa gift for you to pray for him. If it's water stars and the water element is opened (single dot), you will get something from the visitor; but if it's closed (double dot), you won't get anything. If it's sand/earth star, a man will come before the woman. In most cases they are always visitors that you already know, or family members.",
    ],
  },
  {
    id: "if-you-will-be-successful-where-you-are",
    number: 29,
    title: "If You Will Be Successful Where You Are Going",
    paragraphs: [
      "After casting the chart, pick h3, h7, h11 and h15 and add them. If the element of the star you got is opened (single dot), then you will be successful in the place where you want to go; but if it's closed, it won't work. The stars that have their water elements opened",
      "(single dot) are as follows: [figures omitted — symbols not preserved in this transcription]",
    ],
  },
  {
    id: "continued-from-chapter-twenty-eight",
    number: null,
    title: "Reading the Gift/Visitor Figures (continued from Chapter Twenty-Eight)",
    paragraphs: [
      "If you use the method above and get, it means your prayers and supplications are answered — it won't reach 7 days. If you get, it means you will get something white like cloth or a shirt, money, etc. You will get the gift from a great person. If you get, it means you will get something that breathes, or that has life — you will get it from a sick person or from a servant. If you get:, it means you will get a cutlass or knife from a knife or cutlass seller. If you get, it means you will get an animal from an animal seller or buyer — you will get a lot of things from people.",
      "If you get, it means you will get a beautiful lady — you will get something good from her, or... [text continues onto the next page, not yet transcribed]",
    ],
  },
  {
    id: "reading-the-gift-visitor-figures-end-of-chapter",
    number: null,
    title: "Continued from Part 1 — Reading the Gift/Visitor Figures (end of Chapter Twenty-Eight/Twenty-Nine material)",
    paragraphs: [
      "— Reading the Gift/Visitor Figures (end of Chapter Twenty- Eight/Twenty-Nine material)...through her you will be successful. If you get:, it means you will get gold and diamond, or you will get animals, and after that you will get a lot of blessings. If you get:, it means you will get all your requests from Allah without stress or time delay.",
    ],
  },
  {
    id: "if-you-will-be-successful-and-get-what",
    number: 30,
    title: "If You Will Be Successful and Get What You Want from the Trip/Traveling",
    paragraphs: [
      "After casting the chart, pick h1, h8, h7 and h11 and add them. Add the results to h16. If the star is an upward star, it means the trip is",
      "good and safe. And if the water element of the star is opened, it means you will get a lot of profit in your business trip. If the star is a downward star, please be patient — about a month or 10 days, or at least 3 days before you travel. If it's:, it means you will get a lot of profit but it will not be stable — you will lose it after that. If it's:, it means you will get a lot of money and benefits from the trip, but you will be very, very sick — you may spend all the money on the sickness.",
    ],
  },
  {
    id: "about-a-lost-thing-stolen-things",
    number: 31,
    title: "About a Lost Thing / Stolen Things",
    paragraphs: [
      "After drawing the chart, pick h4 and h5 and add them. If you get fire or air star, it means the thief is a male; but if it's water or sand star, it means the thief is female. If the star is found in the first 4 houses (mothers' houses), it means the thief is in the same house with you. If it's found in the second 4 houses (children's houses), it means the thief is in the same area with you. If it's found in the third 4 houses (Al-fafidat), it means the thief is in the same town with you. If the star is found in the last 4 houses (Sumurakat), it",
      "means the thief is not in the same town with you — he/she is gone far away.",
    ],
  },
  {
    id: "if-it-will-rain-today-or-not",
    number: 32,
    title: "If It Will Rain Today or Not",
    paragraphs: [
      "Method 1: After casting the chart, check if Ali is following each other in the chart. If they are, then it will rain.",
      "Method 2: After drawing the chart, check h4. If you found Kallah Allahu there, it is going to rain.",
      "Method 3: If you found Iddris in h9, it is going to rain, insha'Allah.",
      "Method 4: Also, when water stars are following each other in a chart, it talks about rain.",
    ],
  },
  {
    id: "if-someone-loves-you-much-less-or-not",
    number: 33,
    title: "If Someone Loves You Much, Less, or Not at All",
    paragraphs: [
      "If you want to know if someone loves you or hates you and can harm you, make your intentions straight about it and make a long line, and start cancelling 4, 4, until it's equal to 4, 3, 2, or 1 dot. If it's one dot, he/she is your enemy and can cause harm to you. If it's 2 dots, he/she loves you very much and can stand for you in anything. If it's 3 dots, he/she is pretending to love you but it's not real love. If it's 4 dots, he/she does not love nor hate you.",
    ],
  },
  {
    id: "if-your-enemies-are-working-against-you-or",
    number: 34,
    title: "If Your Enemies Are Working Against You or Not",
    paragraphs: [
      "Method 1: After casting the chart, pick h3, h7, h11 and h15 and use them to form new Umuhat (mother houses), and cancel the old chart. Use the Umuhat to form another chart, and check h13 of the new chart you have drawn. Check the water element of h13 — if it's opened (single dot) or closed (double dot). If it's a single dot, they are not working on you, or they are, but it's not working on you because you are spiritually active. But if it's double dots, they are seriously working on you to destroy you.",
      "Method 2: After casting the chart, pick h1 and h12 and add them. If it is a good star, they are not working on you; but if it's a bad star, they are working on you seriously.",
    ],
  },
  {
    id: "if-your-family-is-doing-well-while-you",
    number: 35,
    title: "If Your Family Is Doing Well (While You Are Far from Them)",
    paragraphs: [
      "If you are far from your family and want to know how they are doing, pick h1, h4, h7 and h10 and add them. If the star is found in the first 4 houses (Umuhat), they are doing very well. If it's found in the second 4 houses (Banaat), they are doing well but they are facing financial problems. If it's found in the third 4 houses (Hafidat), they are facing financial problems and some of them are sick. If it's found in the last 4 houses (Sumurakat), they are in danger, or they are in a situation that they can't handle themselves.",
    ],
  },
  {
    id: "if-you-want-to-locate-someone-or-something",
    number: 36,
    title: "If You Want to Locate Someone or Something",
    paragraphs: [
      "Method 1: After casting the chart, pick h1 fire element, h2 air element, h3 water element, and h4 sand element, and form a star. If the star is fire star like: [figures omitted — symbols not preserved in this transcription] it means it's in",
      "the eastern part of the place. If it's air star like [figures omitted — symbols not preserved in this transcription] it means it's in the western part of the place you are. If it's water star like: [figures omitted — symbols not preserved in this transcription] it means it's in the northern part of the place you are. And if it's a sand star like: [figures omitted — symbols not preserved in this transcription] it means it's in the southern part of the place you are.",
      "Method 2: You can also make just one star and use it to locate it — either it's in the north, south, east, or west part of the place.",
    ],
  },
  {
    id: "how-to-predict-a-game-who-will-win",
    number: 37,
    title: "How to Predict a Game, Who Will Win or Lose",
    paragraphs: [
      "Method 1: After casting the chart, put your team on the right side of the chart and your opponent's team on the left. After that, use h1 as your team and h2 as the other team. If h1 is a good star more than h2, it means your team will win; but if it's a bad star, it will not. If they are all good stars, it means both teams will score a draw. If they are all middle-good or bad stars, there will be a goalless draw or no win.",
      "Method 2: After drawing the chart, pick h1 fire element, h2 air element, h3 water element and h4 sand element and form a star. Check where you can locate it in the chart. If it's on the right side, your team will win; but if it's not, your team may lose.",
    ],
  },
  {
    id: "if-two-lovers-will-be-compatible-for-marriage",
    number: 38,
    title: "If Two Lovers Will Be Compatible for Marriage (Their Star Signs)",
    paragraphs: [
      "Method 1: After drawing the chart, pick h4 and h15 and add them. If it's a good star, they will (be compatible); but if it's a bad star, they will not. If it's a middle-good star, there will be problems though it's not bad.",
      "Method 2: After drawing the chart, pick h1 and h7 and add them. If it's a good star, it's good, and vice versa.",
    ],
  },
  {
    id: "if-your-visitor-or-the-person-that-comes",
    number: 39,
    title: "If Your Visitor, or the Person That Comes to You, Is a Good or Bad Person",
    paragraphs: [
      "Method 1: After drawing the chart, check h1. If it's a good star, he/she is a good person; if it's a bad star, the person has bad intentions.",
      "Method 2: Pick h9 and h12 and add them after drawing the chart. If it's a good star, the person is good; but if it's a bad star, he/she is having bad intentions towards you. If it's a middle-good star, he/she comes to test you, to know what to do, or he/she has no good or bad intentions towards you.",
    ],
  },
  {
    id: "if-spiritual-work-you-want-to-do-for",
    number: 40,
    title: "If Spiritual Work You Want to Do for Someone Will Work or Not",
    paragraphs: [
      "Method 1: After drawing the chart, pick h1 and h5 and add them. If it's a good star, it will work very fast and easier. If it's middle-good star, it will take a long time to work. If it's a bad star, it won't work at all.",
      "Method 2: After casting the chart, pick h5 and h11 and add them. If it's a good star, it will work; if it's a bad star, it won't work; and if it's a middle-good star, it will be very long before it will work.",
    ],
  },
  {
    id: "the-person-that-took-an-item-stole-something",
    number: 41,
    title: "The Person That Took an Item / Stole Something",
    paragraphs: [
      "Method 1: After drawing the chart, check h1. If it's a male star, then it's a man that stole it; if it's a female star, it's a lady that took it.",
      "Method 2: Pick h6 and h8 and add them. If it's a good and downward star, the thing is still in town and can still be found. If it's a good and upward star, it's out of town and might be difficult to get it back, though you may hear about it. If it's a bad and downward star, you will not see it again though it's in town.",
    ],
  },
  {
    id: "if-you-will-get-what-you-want-from",
    number: 42,
    title: "If You Will Get What You Want from Where You Are Going",
    paragraphs: [
      "Method 1: After drawing the chart, pick h4 and h15 and add them. If it's a good and downward star like: [figures omitted — symbols not preserved in this transcription] it's good and you will be successful. If it's money or job, or a lady/man, that",
      "you want, it will be good and stable. If it's a good and upward star like: [figures omitted — symbols not preserved in this transcription] you will get it but it won't be stable — it will leave you, or you will lose it as time goes on. If it's middle-good star, they will be tossing you up and down, or you will keep long before you get it. Forget it if it's a bad star — it won't work for you.",
      "Method 2: Pick h1 and h5 and add them. If you get a good star, it's good to go; but if it's a bad star, don't go, please — it won't work for you.",
    ],
  },
  {
    id: "the-real-behavior-character-or-life-of-someone",
    number: 43,
    title: "The Real Behavior/Character or Life of Someone You Want to Get Married to (in Future)",
    paragraphs: [
      "After casting the chart, pick h3, h7, h11 and h14 and add them. Add the results to h12 and check what star it is. If it's a good star, he/she will have a good behavior, and vice versa.",
    ],
  },
  {
    id: "if-a-lady-or-man-will-accept-your",
    number: 44,
    title: "If a Lady or Man Will Accept Your Love Proposal or Not",
    paragraphs: [
      "After drawing the chart, pick h7, h9, h11 and h15 and add them. If it's found in the chart, then she will accept it, insha'Allah; but if it's not in the chart, you may not get him/her — it won't be accepted.",
    ],
  },
  {
    id: "if-you-will-get-the-lost-thing-back",
    number: 45,
    title: "If You Will Get the Lost Thing Back",
    paragraphs: [
      "After casting the chart, count all the (water and air elements) and (fire and sand elements). If water and air elements are more than the fire and sand elements, then you will get it back, and the vice versa.",
    ],
  },
  {
    id: "how-to-make-one-win-over-the-other",
    number: 46,
    title: "How to Make One Win Over the Other Opponents (Enemies)",
    paragraphs: [
      "After drawing the chart, pick h12 and put it, or mix it, inside h11 on a paper. Then fold it and put a heavy stone on it — for example,",
      "fixing Star (1) Yusuf inside Star (3) Mahadi [talismanic diagram in the original — not reproduced here; see original scan].",
    ],
  },
  {
    id: "if-a-lady-is-pregnant-or-not",
    number: 47,
    title: "If a Lady Is Pregnant or Not",
    paragraphs: [
      "Method 1: After casting the chart, check h5. If you found Mahadi, it means she's pregnant.",
      "Method 2: If you also found Ibrahim in h5, it means she's pregnant.",
    ],
  },
  {
    id: "if-it-s-a-male-or-female-child",
    number: 48,
    title: "If It's a Male or Female Child",
    paragraphs: [
      "Method 1: After drawing the chart, check h1. If it's a male star or female star, then that's it.",
      "Method 2: Check h10 and h11. If both houses are male stars, then it's a male; and if they are female stars too, it's female.",
    ],
  },
  {
    id: "if-something-is-closer-to-you-or-far",
    number: 49,
    title: "If Something Is Closer to You or Far Away from You",
    paragraphs: [
      "After drawing the chart, pick h5, h7, h11 and h13 and add them. If it's fire stars [figures omitted — symbols not preserved in this transcription] or water stars [figures omitted — symbols not preserved in this transcription] it's closer to you; but if it's air stars or sand star [figures omitted — symbols not preserved in this transcription] or [figures omitted — symbols not preserved in this transcription] it's far away from you.",
    ],
  },
  {
    id: "if-you-will-get-gold-in-a-place",
    number: 50,
    title: "If You Will Get Gold in a Place Where You Are Working",
    paragraphs: [
      "After drawing the chart, pick h1, h10, h11 and h14 and add them. If you get water or sand star, you will get gold there, insha'Allah. But if it's fire or air stars, you won't get anything.",
    ],
  },
  {
    id: "if-things-are-going-to-be-well-this",
    number: 51,
    title: "If Things Are Going to Be Well This Year or Not (Yearly News)",
    paragraphs: [
      "After drawing the chart, pick h1, h6, h10 and h16 and add them all. If the star is a good and downward air star, or it is a good downward water star, or a good downward sand star, then it is going to be a good and successful year, with a lot of money and long life. But if it's a good and fire star, it will be good but you will be facing financial problems. If it is a bad star, it is going to be a very difficult year — a lot of problems and sicknesses.",
    ],
  },
  {
    id: "the-friendship-between-two-people-if-it-s",
    number: 52,
    title: "The Friendship Between Two People, If It's Good or Not",
    paragraphs: [
      "After casting the chart, pick h11 and h15 and add them. If it is a good star, their friendship is going to be strong and last forever; but if it's a bad star, the friendship will not last a long time — enemies will come between them and separate them.",
    ],
  },
  {
    id: "the-consequence-of-friendship-between-two-people",
    number: null,
    title: "The Consequence of Friendship Between Two People",
    paragraphs: [
      "After drawing the chart, pick h1 and h3 and add them. If it is a good star, success will come between them, along with love and happiness; but if it is a bad star, something terrible, or a calamity, will come between them.",
    ],
  },
  {
    id: "if-a-querent-is-asking-about-someone-or",
    number: 53,
    title: "If a Querent Is Asking About Someone or About Him/Herself",
    paragraphs: [
      "After drawing the chart, pick h1 and h7 and add them. If it's a downward star, he/she is asking about him/herself; but if it's an upward star, he/she is asking about someone else.",
    ],
  },
  {
    id: "where-your-success-is-or-where-you-will",
    number: 54,
    title: "Where Your Success Is, or Where You Will Make It in Life",
    paragraphs: [
      "After drawing the chart, pick h1, h7, h4 and h8 and add all of them. If you get fire stars, it means it's in the Eastern part of the world. If it's air stars, it means it's in the Western part of the world. If it's",
      "water stars, it means it's in the Northern part of the world. And if it's sand stars, it's in the Southern part.",
    ],
  },
  {
    id: "the-whereabouts-of-a-thief-or-robbers",
    number: 55,
    title: "The Whereabouts of a Thief or Robbers",
    paragraphs: [
      "After drawing the chart, pick h1 and h12 and add them. Then add the result to h13 and check where you can locate the star in the chart. If it's found in the first 4 houses, it means the thief is in the same house or compound with you. If it's found in the second 4 houses, it means he/she is in the same area with you. If it's found in the third 4 houses, it means he/she is in the same town with you. And if it's found in the last 4 houses, it means he/she is out of town.",
    ],
  },
  {
    id: "about-a-pregnancy-if-it-s-a-boy",
    number: 56,
    title: "About a Pregnancy, If It's a Boy or a Girl",
    paragraphs: [
      "Method 1: After casting the chart, count all the dots in the chart, and start subtracting (3, 3, 3). If your result is 1 or 3, it means it's a male child; but if it's 2, it's a female child.",
    ],
  },
  {
    id: "s-if-you-want-to-know-if-she",
    number: null,
    title: "Additional Methods — If You Want to Know If She's Pregnant",
    paragraphs: [
      "Method 1: Pick h5 and h15 and add them. If it's an upward star, she's not pregnant; but if it's a downward star, she's pregnant.",
      "Method 2: After casting the chart, pick h7 and h10 and add them. If it's a good star, she's pregnant; but if it's a bad star, she's not.",
      "Method 3: Pick h5 and h6 and add them. If the star is a male star, then the baby is a male, and the vice versa. [Note: text continues onto the next page, not yet transcribed]",
    ],
  },
  {
    id: "when-to-travel-daytime-or-night-time",
    number: 57,
    title: "When to Travel, Daytime or Night Time",
    paragraphs: [
      "After drawing the chart, pick h5 and h8, then h6 and h7, and add all. If you get fire or air star, it means daytime is good. If you get water or sand star, it means night time is good for you to travel.",
    ],
  },
  {
    id: "if-couples-have-had-sex-or-not",
    number: 58,
    title: "If Couples Have Had Sex or Not",
    paragraphs: [
      "After casting the chart, pick h7 and h13 and add them. Then add it to h12. If the water element of the star is active (single dot), it means they have had sex; if it's not, it means they didn't. Additional method (repeated later in the notebook): After casting the chart, pick h5 and h1 and add them. Check the water element of the star — if it's opened (single dot), it means they have had sex; if it's closed, they didn't do anything.",
    ],
  },
  {
    id: "the-secret-of-the-querent-in-a-chart",
    number: 59,
    title: "The Secret of the Querent in a Chart",
    paragraphs: [
      "Method 1: After casting the chart, pick h1, h5, h9 and h13 and add them. Use whatever star you get to talk to the person.",
      "Method 2: After drawing the chart, let the querent him/herself choose any star of his/her choice. Whatever star he/she chose, that is the problem that brought him/her.",
      "Method 3: After drawing the chart, add Yusuf: to any star found in a house and use it to talk.",
    ],
  },
  {
    id: "if-she-he-loves-you-or-not",
    number: 60,
    title: "If She/He Loves You or Not",
    paragraphs: [
      "Method 1: After drawing the chart, pick h1 and h5 and add them. If it's a good and downward star like: [figures omitted — symbols not preserved in this transcription] then he/she really loves you very much. If it's a good and upward star like [figures omitted — symbols not preserved in this transcription] it means he/she does, but not much, or there might be a divorce or separation in future. If it's a middle-good star, it means there's double dating or cheating. If it's a bad star, it means she/he doesn't love you at all.",
      "Method 2: After drawing the chart, check h7. If it's a good star, he/she loves you. If it's a middle-good star, he/she is double dating. And if it's a bad star, he/she does not love you.",
    ],
  },
  {
    id: "if-a-marriage-is-good-or-not",
    number: 61,
    title: "If a Marriage Is Good or Not",
    paragraphs: [
      "Method 1: After casting the chart, check h7. If it's a good star like22121 [figures omitted — symbols not preserved in this transcription] then it's very good. If it's a middle- good star, it's partially good. If it's a bad star, it's not good at all.",
      "Method 2: Pick h3, h7, h11 and h14 and add them. If it's a good star, it's good; if it's a bad star, it's not good.",
    ],
  },
  {
    id: "if-the-prayers-done-for-someone-have-been",
    number: 62,
    title: "If the Prayers Done for Someone Have Been Answered or Not",
    paragraphs: [
      "Pick the water elements of the first 4 houses, second 4 houses, third 4 houses, and last 4 houses. Then add all and check if the water element of that star is opened — it's answered, and vice versa.",
    ],
  },
  {
    id: "if-the-lady-or-man-you-are-going",
    number: 63,
    title: "If the Lady or Man You Are Going to Marry Is Related to You by Family",
    paragraphs: [
      "After casting the chart, check h7. If it repeats in the first 4 houses (1–4), it means a close family member. If it's in the second 4 (5–8),",
      "it means an extended family member. If it's in the third 4 (9–12), it means an area member, or someone from a friend's family. If it's in the last 4 (13–16), it means she/he is not related to you in any way, or not even your tribe. If it's not found in the chart, it means he/she is not a [fellow] citizen.",
    ],
  },
  {
    id: "if-a-marriage-will-last-forever",
    number: 64,
    title: "If a Marriage Will Last Forever",
    paragraphs: [
      "Method 1: After drawing the chart, check h3. If it's a good star, it will last forever. If it's a middle-good star, they will have disagreements all the time, or no peace in the marriage. If it's a bad star, it won't last forever.",
      "Method 2: After the chart is drawn, pick h4, h11, h7 and 14 and add them. Check if it's a good, middle-good, or a bad star.",
    ],
  },
  {
    id: "someone-s-behavior-also-see-chapter-forty-three",
    number: null,
    title: "Additional Method — Someone's Behavior (also see Chapter Forty-Three)",
    paragraphs: [
      "After drawing the chart, pick h3, h7, h11 and h14 and add them. Add the results to h12. If you get a good star, it means good behavior, and vice versa.",
    ],
  },
  {
    id: "if-a-partner-has-a-particular-disease-or",
    number: 65,
    title: "If a Partner Has a Particular Disease or Sickness",
    paragraphs: [
      "Method 1: Check h6 after drawing the chart. If you get Issah, there, it means he/she has a particular illness or sickness.",
      "Method 2: After drawing the chart, check h14. If you get Issah there, it means he/she has a particular sickness.",
      "Method 3: If you check h6 and found Ayuba there, it means he/she has jinn spirits or a spiritual [problem affecting the] marriage.",
    ],
  },
  {
    id: "if-someone-has-married-before-or-if-he",
    number: 66,
    title: "If Someone Has Married Before, or If He/She Is Married",
    paragraphs: [
      "Check house 10 after drawing the chart. If it's a downward star, he/she is married or has married before; but if it's an upward star, she/he is not.",
    ],
  },
  {
    id: "if-she-he-is-still-in-the-marriage",
    number: null,
    title: "Additional Method — If She/He Is Still in the Marriage or Not",
    paragraphs: [
      "After drawing the chart, pick h5, h9, h10 and h11 and add them all. If it's [found] in the chart, he/she is still in the marriage; if it's not in the chart, she/he is not in the marriage.",
    ],
  },
  {
    id: "if-he-she-is-enjoying-the-marriage",
    number: 67,
    title: "If He/She Is Enjoying the Marriage",
    paragraphs: [
      "After drawing the chart, pick fire-fire elements, air-air elements, water-water elements, and sand-sand elements, and add them all. If you get a good and downward star, she/he is enjoying the marriage. If it's good and upward star, he/she is in the marriage but with no happiness or enjoyment. If it's a bad star, it means the marriage is on and off. If the star is not in the chart, it means he/she is not in the marriage anymore.",
    ],
  },
  {
    id: "if-your-partner-is-cheating-on-you",
    number: 68,
    title: "If Your Partner Is Cheating on You",
    paragraphs: [
      "After drawing the chart, check h7. If it's a man that comes to check and you found a male star in h7, it means his wife or girlfriend is cheating. And if it's a lady that comes to find out, and a female star is found in h7, it means her man is cheating.",
    ],
  },
  {
    id: "if-your-ex-husband-wife-will-re-marry",
    number: 69,
    title: "If Your Ex-Husband/Wife Will Re-Marry Again After the Divorce",
    paragraphs: [
      "After drawing the chart, pick h5 and h7 and add them. If it's a good star, he/she is going to marry again. If it's a middle-good star, he/she will not marry but will only have relationships, or will be sleeping around. If it's a bad star, he/she will not marry, have relationships, or sleep around — she/he will just live his/her life without sex or love relationships.",
    ],
  },
  {
    id: "if-a-pregnant-woman-will-have-childbirth-problems",
    number: 70,
    title: "If a Pregnant Woman Will Have Childbirth Problems in Her Marriage",
    paragraphs: [
      "Method 1: After casting the chart, check h7. If it's Yunus, it means it will be difficult for her to have kids.",
      "Method 2: Check h5; if it's Yusuf, it means she's going to have a childbirth problem in her life.",
    ],
  },
  {
    id: "if-a-man-will-have-manhood-problems-in",
    number: 71,
    title: "If a Man Will Have Manhood Problems in His Marriage or Life",
    paragraphs: [
      "Method 1: After drawing the chart, check h3. If it's Sulemana, it means he will have manhood problems in future.",
      "Method 2: After drawing the chart, check h5. If it's Ayuba, it means he will have weak manhood, or it will die (fail) in future.",
    ],
  },
  {
    id: "if-a-lady-or-man-has-feelings-for",
    number: 72,
    title: "If a Lady or Man Has Feelings for You or Not",
    paragraphs: [
      "After drawing the chart, pick h7 and h11 and add them. Then add the results to h5 and check: if it's a good star, there is feeling. If it's a bad star, there are no feelings at all. But if it's a middle-good star, it means there will be feelings in future.",
    ],
  },
  {
    id: "if-a-woman-has-married-more-than-one",
    number: 73,
    title: "If a Woman Has Married More Than One Man at the Same Time (Polyandry)",
    paragraphs: [
      "After drawing the chart, check h7. If it's Ibrahim, it means she has 4 men at the same time. If it's Umar or Yunus, it means she has 3 men. If it's Adam or Kallah Allahu, it means she has 5 men. If it's Osman/Uthman, Nuhu, or Iddris, it means she has just one man. If it's Musah, it means she has married two brothers from the same mother at",
      "the same time, and one has died, leaving one. If it's Sulemana, it means her first husband will die before she marries again. If it's Ali, it means she has married just one man and he died. If it's Issah, it means she has not married at all. If it's Yusuf, Mahadi, Hassan and Hussein, or Ayuba, it means she has married two men from different families.",
    ],
  },
  {
    id: "if-someone-is-an-adulterous-son-daughter-born",
    number: 74,
    title: "If Someone Is an Adulterous Son/Daughter (Born Out of Wedlock)",
    paragraphs: [
      "If you want to know if someone was born out of wedlock or not, draw the chart and pick sand-sand elements and form a star — that is, pick the elements of h4, h8, h12 and h16 and form one star. Check the star in the chart. If it's found, it means he/she was born out of wedlock; but if it's not in the chart, he/she is not.",
    ],
  },
  {
    id: "if-he-she-is-a-womanizer-or-a",
    number: 75,
    title: "If He/She Is a Womanizer or a Harlot",
    paragraphs: [
      "After drawing the chart, pick h7 and h9 and add them. If the star is Kallah Allah or Yusuf, then he/she is sleeping around; but if it's not, she/he is not.",
    ],
  },
  {
    id: "if-your-ex-husband-wife-girlfriend-or-boyfriend",
    number: 76,
    title: "If Your Ex-Husband, Wife, Girlfriend, or Boyfriend Will Return or Not",
    paragraphs: [
      "Method 1: After casting the chart, check the water element of h8, h9, h11 and h15. If all are active, then she/he will return.",
      "Method 2: Check the water element of h5, h6 and h7. If they are all active, then she/he will return back to you; but if they are closed, he/she will not.",
    ],
  },
  {
    id: "if-the-pregnancy-is-healthy-or-not",
    number: 77,
    title: "If the Pregnancy Is Healthy or Not",
    paragraphs: [
      "Method 1: After drawing the chart, check the present houses (h4, 7, 10) and h15. If they are all good stars, then it will be healthy and stable till birth.",
      "Method 2: After drawing the chart, check h8. If it's a good star, it's in good condition and kicking; but if it's a bad star, it's not safe.",
    ],
  },
  {
    id: "the-number-of-months-of-a-pregnancy-how",
    number: 78,
    title: "The Number of Months of a Pregnancy (How Old Is the Pregnancy)",
    paragraphs: [
      "After drawing the chart, count all the single dots of the stars from h1 to h6. If it is more than 9, then subtract 9-9 from it until it is equal to 9 or less than 9. Whatever number you get, that's the number of months.",
    ],
  },
  {
    id: "the-number-of-babies-in-a-pregnancy",
    number: 79,
    title: "The Number of Babies in a Pregnancy",
    paragraphs: [
      "After drawing the chart, check h10. If Musah is there, it means it's more than one baby. Check h5; if it repeats in the chart twice, it means twins. If it repeats thrice, it means more than two. If it repeats more than 3 times, it means more than 3 babies.",
    ],
  },
  {
    id: "if-a-pregnancy-is-yours-or-not-d",
    number: 80,
    title: "If a Pregnancy Is Yours or Not (D.N.A.)",
    paragraphs: [
      "Method 1: After drawing the chart, pick h1 and h5 and add them. If it's found in the chart, the pregnancy is yours; but if it's not in the chart, it's not yours.",
      "Method 2: Check h10 and h11 after casting the chart. If both are good stars, then it's yours; but if they are not, it's not yours.",
    ],
  },
  {
    id: "if-she-will-put-to-bed-peacefully-or",
    number: 81,
    title: "If She Will Put to Bed Peacefully or Not",
    paragraphs: [
      "After drawing the chart, check h5. If it's a good star, she will put to bed peacefully. But if it's a middle-good star, she will have a peaceful delivery, but it takes a longer time. If it's a bad star, it leads to a lot of complications, like too much bleeding or loss of blood, operations, deaths, etc.",
    ],
  },
  {
    id: "the-time-she-will-put-to-bed",
    number: 82,
    title: "The Time She Will Put to Bed",
    paragraphs: [
      "Method 1: After casting the chart, pick h1 and h5 and add them. If it's fire star, it means within some days. If it's air star, it's weeks. If it's water star, it's a month. And if it's sand star, it's more than 1 or 2 months.",
      "Method 2: After casting the chart, pick h1, h4, h5 and h7 and use them to form your first 4 houses (Umuhat), and... [text continues onto the next page, not yet transcribed]",
    ],
  },
  {
    id: "if-it-s-day-or-night-that-she",
    number: 83,
    title: "If It's Day or Night That She Will Put to Bed",
    paragraphs: [
      "After drawing the chart, pick h1 and h5 and add them. If it's a day star, she will deliver in the daytime; if it's a night star, she will put to bed at night.",
    ],
  },
  {
    id: "if-your-enemy-is-from-your-father-s",
    number: 84,
    title: "If Your Enemy Is from Your Father's, Mother's, Wife's, Boyfriend's/Girlfriend's, or Your Friend's Family",
    paragraphs: [
      "After drawing the chart, check h3, h4, and h5. If h3 is a bad star, the enmity is from a love relationship, a wife or husband, or close friends. If h4 is a bad star, the enmity is from your father's family. If h5 is a bad star, the enmity is from your mother's family.",
    ],
  },
  {
    id: "how-the-future-of-two-people-s-friendship",
    number: 85,
    title: "How the Future of Two People's Friendship Will Be",
    paragraphs: [
      "After casting the chart, pick h1 and h11 and add them. If it's a good and upward star, their friendship will be good but short — they won't follow each other for a long time, and will go their separate ways peacefully. If it's a good and downward star, their friendship will be good forever. If it's a bad and upward star, their friendship will not go far, and they will separate with anger. If it's a bad and downward star, their friendship will keep long, but they will be angry with each other in secret. If it's a stable and a bad star, their friendship will be long, but there will be problems between them all the time. If it's a good and stable star, their friendship will be longer and successful. If it's a good and unstable star, their friendship will be on and off. If it's a bad and unstable star, their friendship will be bad and they cannot stay together.",
    ],
  },
  {
    id: "secrets-between-two-friends-who-follow-each-other",
    number: null,
    title: "Additional Topic — Secrets Between Two Friends Who Follow Each Other in the Chart",
    paragraphs: [
      "After casting the chart, check h4 and h15. If both houses are good stars, or stable stars, then there can be a lot of secrets, and neither",
      "will tell the secrets to anyone. But if not, the secrets will come out all the time.",
    ],
  },
  {
    id: "if-it-s-business-or-handwork-that-will",
    number: 86,
    title: "If It's Business or Handwork That Will Benefit You",
    paragraphs: [
      "After drawing the chart, pick h2 and h10 and add them. If it's an upward or unstable star, then business will fit you; but if it's a downward or stable star, it's through handwork that will help you become successful in life.",
    ],
  },
  {
    id: "when-your-suffering-and-pain-or-sadness-will",
    number: 87,
    title: "When Your Suffering and Pain or Sadness Will End",
    paragraphs: [
      "After drawing the chart, pick h6 and h12 and add them. If it's a good star, it will end early. If it's a middle-good star, it will end but take a long time. If it's a bad star, pray hard — it will be difficult to have it taken away in your life. You have to do a lot of sacrifices and supplications.",
    ],
  },
  {
    id: "if-you-will-get-a-position-rank-or",
    number: 88,
    title: "If You Will Get a Position/Rank or Not",
    paragraphs: [
      "After drawing the chart, count all the single dots of h1, h2, h4, h5, h10, h11, and h15, and subtract 12 from it. Check which house corresponds to what's left — for example, if your answer is 3, it means Mahadi; if your answer is 7, it means Umar. Then check the star — if it's good, bad, or middle-good. If it's a good star, you will get it early and easier. If it's middle-good, you will get it but it will take a longer time. If it's a bad star, it will be difficult to get it.",
    ],
  },
  {
    id: "if-your-success-or-wealth-will-remain-forever",
    number: 89,
    title: "If Your Success or Wealth Will Remain Forever or Not",
    paragraphs: [
      "After drawing the chart, count all the single dots of h1, h2, h4, h5, h10, h11, and h15, and start subtracting 12, 12. Check whatever number you get, in the chart, where you can see it — for example, if it's 5, it means Ibrahim; if you get 2, it means Adam, etc. Then check if it's a good star — it means it will remain forever. If it's a bad star, it will soon be cut off and you will be suffering",
      "again. If it's a middle-good star, it will only reduce, but you won't be poor.",
    ],
  },
  {
    id: "if-someone-s-misery-will-be-taken-away",
    number: 90,
    title: "If Someone's Misery Will Be Taken Away from Him/Her or Not",
    paragraphs: [
      "Method 1: After drawing the chart, count all the dots of the bad stars in the chart and start subtracting 12, 12. If your result is 9, it means; if it's 12, it means; if it's 1, it means, etc. Check if the star is a good star or a bad star.",
      "Method 2: Count all the good stars in the chart. If they are more than the bad stars, it means your misery will come to an end; but if the bad stars are more than the good stars, it means it will be difficult for you to overcome it in your life.",
    ],
  },
  {
    id: "if-something-is-present-past-or-future",
    number: 91,
    title: "If Something Is Present, Past, or Future",
    paragraphs: [
      "After casting the chart, pick the present houses (h1, h4, h7, and h10) and add them. Then pick the past houses (h2, h5, h8, and h11) and add them. Then pick the houses of the future (h3, h6, h9, and",
      "h12) and add them. Then add all the results together and check if it's a present, past, or future star.",
    ],
  },
  {
    id: "the-ending-part-of-anything-you-want-to",
    number: 92,
    title: "The Ending Part of Anything You Want to Do in Your Life",
    paragraphs: [
      "After casting the chart, check h4, h14, and h15. If they are all good stars, or two of them are good stars, then it will be good, and the vice versa.",
    ],
  },
  {
    id: "if-someone-has-long-life-or-not",
    number: 93,
    title: "If Someone Has Long Life or Not",
    paragraphs: [
      "After drawing the chart, pick h1 and h9 and add them. If it is found in the first 4 houses, it means long life. If it is found in the last 4 houses, it means short life. If it is found in the second [or third] 4 houses, it means mid-long life. If it is not found in the chart at all, it means only Allah Almighty knows.",
    ],
  },
  {
    id: "the-lifespan-and-when-someone-will-die",
    number: 94,
    title: "The Lifespan and When Someone Will Die",
    paragraphs: [
      "After casting the chart, check h8. If it is, it means very long life, until old age. If it's, it means within his/her old age. If it's, it means after old age the person will die. If it is, it means early young age — man or lady, will be the time he/she will die. If it is, it means at the end of puberty time. If it is, it means at his/her youthful time. If it is, it means at his/her first year at puberty. If it is, it means in the middle of his/her puberty time. If it is, it means at the beginning of his/her puberty time. If it is, it means at the age of 10 years. If it is, it means he/she will die while still small. If it is, it means the same — he/she will die as a small boy/girl. If it is, it means before he/she attains puberty time. If it is, it means",
      "in the middle of his/her life — that's from 40 and above. If it is [figures omitted — symbols not preserved in this transcription] it means in the middle of his/her youthful age/time. Note (in the original): Almighty Allah knows best — the beginning and the end of every living thing.",
    ],
  },
  {
    id: "the-stars-that-talk-about-your-youthful-time",
    number: 95,
    title: "The Stars That Talk About Your Youthful Time, Middle Age, and Old Age",
    paragraphs: [
      "1. Youthful — [figures omitted — symbols not preserved in this transcription] 2. Middle-Youth — [figures omitted — symbols not preserved in this transcription] 3. Youth and Old Age — [figures omitted — symbols not preserved in this transcription]",
    ],
  },
  {
    id: "if-a-sick-person-has-long-life-or",
    number: 96,
    title: "If a Sick Person Has Long Life or Not",
    paragraphs: [
      "After casting the chart, pick h1 and h9 and add them. After that, check the air element — if it is a single dot, there is long life; but if it is double dots, there is no long life.",
    ],
  },
  {
    id: "if-a-sick-person-has-long-life-repeated",
    number: null,
    title: "Additional Method — If a Sick Person Has Long Life (repeated later in the notebook)",
    paragraphs: [
      "Pick all of the first 4 houses' water elements, the second 4 houses' water elements, the third 4 houses' water elements, and the last 4 houses' water elements, and add them. If the water element is closed, he/she has long life, and the vice versa.",
    ],
  },
  {
    id: "where-one-will-die-place-of-death",
    number: 97,
    title: "Where One Will Die (Place of Death)",
    paragraphs: [
      "After casting the chart, check h8. If it is or, one will die in his/her hometown, in a masjid/mosque, or where they teach",
      "Qur'an (Makaranta). If it is, one will die in his/her hometown, the same day, with a scholar or well-known person in your town. If it is, one will die in a village or on mountains. If it is, or, it means one will die in a farm or bush. If it is, one will die in a very rich or wealthy place, or a rainy or watery place. If it is, one will die in a place where they break stone, or in mountains. If it is, one will die in an old shrine, or a damaged or dirty place. If it is, one will die in a fearful or robbery-prone place. If it is, one will die in a peaceful or joyful place, or around a river or sea. If it is, one will die in a big town or city — a well-respected, well-arranged place. If it is, one will die in a palace, a flagstaff house, or where there is a river. If it is, one will die in a damaged place, a place of war, or among animals. If it is, one will die in a place of knowledge, a joyful place, cool, or where there are a lot of trees. If it",
      "is, one will die in a waterlogged area, or where water runs — a cool and peaceful place.",
    ],
  },
  {
    id: "the-causes-of-someone-s-death",
    number: 98,
    title: "The Causes of Someone's Death",
    paragraphs: [
      "After casting the chart, check h8. If the star repeats in h1, it means one will die by him/herself (suicide, by hanging, food poisoning by him/herself, shooting him/herself, etc.). If it repeats in h2, it means one will die because of money, or through money. If it repeats in h3, it means one will die through his/her family members or close relatives. If it repeats in h4, it means one will die because of lands and properties, or chieftaincy titles. If it repeats in h5, it means one will die through love or relationships and children. If it repeats in h6, it means one will die through slavery, having been a servant, or friendships. If it repeats in h7, it means one will die through rivalry, jealousy, and enviousness in a relationship/marriage. If it repeats in h8, it means one will die out of fear, inheritance, or risk/danger. If it repeats in h9, it means one will die through travelling, business, knowledge-seeking, or lottery. If it repeats in h10, it means one will die through kingship or chieftaincy issues, cases, or job searching. If it repeats in h11, it",
      "means one will die through friendship and lovers, or expectations. If it repeats in h12, it means one will die through enmity and friendship. If it repeats in h13, h14, h15, and h16, it means one will die through the same causes as h1, h2, h3, and h4 respectively, in the same way.",
    ],
  },
  {
    id: "if-someone-or-something-good-will-come-to",
    number: 99,
    title: "If Someone or Something Good Will Come to You Today or Not",
    paragraphs: [
      "After drawing the chart, pick h1 and h7 and add them. If it is a good star, be expecting positive results; but if it's not a good star, don't be expecting anything good that day. If it's a middle-good star, it means you may get something not very interesting, or with not much benefit.",
    ],
  },
  {
    id: "if-today-is-a-good-day-or-not",
    number: 100,
    title: "If Today Is a Good Day or Not",
    paragraphs: [
      "After drawing the chart, pick h2 and h8 and add them. If it's a good star, it will be good; but if it's a bad star, expect bad news that day.",
      "If it's a middle-good star, there will be no good news or bad news that day.",
    ],
  },
  {
    id: "as-a-stranger-if-the-food-you-want",
    number: 101,
    title: "As a Stranger, If the Food You Want to Eat Is from the Market or Home-Prepared",
    paragraphs: [
      "After drawing the chart, pick h6 and h10 and add them. If the star repeats in h6, it means the food is from the same house — home- prepared. If it repeats in h10, it means it's from the market. If it's not repeated in either place, but repeated in different houses, it means the food is from a different house.",
    ],
  },
  {
    id: "if-this-money-the-work-or-the-lady",
    number: 102,
    title: "If This Money, the Work, or the Lady/Husband Will Be Stable in Your Life",
    paragraphs: [
      "After drawing the chart, pick the first 4 houses and use them as your Umuhat (mother stars), and form another chart, cancelling the old one. Check the first 4 houses of the new chart — if any of these stars below are found in any of them, it will be stable; but if",
      "not, it will not be stable in your life: [figures omitted — symbols not preserved in this transcription]",
    ],
  },
  {
    id: "if-the-querent-is-sick-or-not",
    number: 103,
    title: "If the Querent Is Sick or Not",
    paragraphs: [
      "Method 1: After drawing the chart, pick h1 and h9 and add them. If the air element is opened, he/she is not sick; but if it is closed, she/he is not well.",
      "Method 2: After casting the chart, check h9. If the fire element is closed, it means he/she is not sick; but if the air element is closed, it means he/she is not well.",
    ],
  },
  {
    id: "if-the-sickness-is-from-human-jinn-or",
    number: 104,
    title: "If the Sickness Is from Human, Jinn, or God Almighty",
    paragraphs: [
      "After casting the chart, pick h4, h6, h5, and h8 and add them. If the result is a good star, it's from God. If it's a bad star, it's from jinn. If it is a middle-good star, it is from a human being.",
    ],
  },
  {
    id: "if-a-sick-person-has-long-life-repeated-2",
    number: null,
    title: "Additional Method — If a Sick Person Has Long Life (repeated again in the notebook)",
    paragraphs: [
      "After drawing the chart, pick h1 and h9 and add them. If the air element is opened, he/she has long life and may survive; if the air element is closed, it means he/she has no long life.",
    ],
  },
  {
    id: "which-part-of-the-body-is-paining-the",
    number: 105,
    title: "Which Part of the Body Is Paining the Sick Person",
    paragraphs: [
      "After drawing the chart, pick the fire element of h3, h7, h10 and h15 and form a star. Then pick the air element of h3, h7, h10 and h15 and form a star. Then pick the water element of h3, h7, h10 and h15 and form a star. Then pick the sand element of h3, h7, h10 and h15 and form a star. Then add all 4 stars and check where you can locate it among the parts of the human body (see Chapter One Hundred and Six, below).",
    ],
  },
  {
    id: "parts-of-the-human-body-and-the-stars",
    number: 106,
    title: "Parts of the Human Body and the Stars Representing Them",
    paragraphs: [
      "1. Head — 10. Right thigh — 2. Neck — 11. Left thigh — 3. Chest — 12. Right leg — 4. Right side — 13. Left leg — 5. Left side — 14. Navel — 6. Right hand — 15. Manhood — 7. Left hand — 16. Womanhood — 8. Ribs — 9. Backbone (Back) —",
    ],
  },
  {
    id: "if-you-will-see-what-you-are-searching",
    number: 107,
    title: "If You Will See What You Are Searching For or Not (Nazir)",
    paragraphs: [
      "After drawing the chart, pick the constant figure of Nazir",
      "and add it to any star found in house 1. If the star is found in the chart, you will see it, and the vice versa. If it's found in the first 4 houses in the chart (Umuhat), you will see it within some seconds or days. If it's found in the second 4 houses (Banat), you will see it within some minutes or weeks. If it's found in the third 4 houses (Hafidat), you will see it within some hours or months. And if you found it in the last 4 houses (Sumurakat), you may not see it again, or you may see it within many hours or years.",
    ],
  },
  {
    id: "if-you-will-get-to-talk-to-someone",
    number: 108,
    title: "If You Will Get to Talk to Someone, or If Conversation Will Take Place Between Two People",
    paragraphs: [
      "After drawing the chart, pick the constant figure of Nutik",
      "and add it to any star found in house 1. Check if it's found in the chart — it means conversation will take place, and vice versa. If it's",
      "found in the first 4, second 4, third 4, or last 4 houses in the chart, the explanation is the same as above (for how soon).",
    ],
  },
  {
    id: "if-you-will-get-what-you-are-searching",
    number: 118,
    title: "If You Will Get What You Are Searching For, in a Place (Itisal)",
    paragraphs: [
      "After casting the chart, pick the constant figure of Itisal and add it to any star found in house 1, and check if it is found in the chart. If it is, you will get it; but if it is not in the chart, you will not get it. If it is found in the first 4, second 4, third 4, or last 4 houses, it is the same explanation as above in (Nazir).",
    ],
  },
  {
    id: "if-you-won-t-get-what-you-are",
    number: 119,
    title: "If You Won't Get What You Are Searching For (Ifusal)",
    paragraphs: [
      "To know what will block or stop you from getting what you want: after drawing the chart, pick the constant figure of Ifusal and add it to any star found in house 1, and check if it is found in the chart. If it is, it means you won't get what you are searching for.",
      "If you want to know how long it will take, check the star: if it is found in the first 4, second 4, third 4, or last 4 houses, it is the same explanation as in Nazir.",
    ],
  },
  {
    id: "if-you-have-enemies-and-how-many",
    number: 120,
    title: "If You Have Enemies and How Many",
    paragraphs: [
      "After casting the chart, check if you see Nuhu in the chart. If it is there, it means you have enemies; but if it's not in the chart, it means you don't have enemies, or you have some but they cannot, or could not, do anything to you. The number of times it repeats is the number of enemies you have — if it repeats 3 times, you have 3 enemies; if 2 times, they are 2.",
      "Also: after casting the chart, check h12. If you get Musah, it means you have a lot of enemies in your life.",
    ],
  },
  {
    id: "if-you-will-get-knowledge-or-not-in",
    number: 121,
    title: "If You Will Get Knowledge or Not in Your Life",
    paragraphs: [
      "After casting the chart, check h1. If you get Adam, or Ali, found in h9 or h11, it means you will get knowledge and wisdom in future.",
    ],
  },
  {
    id: "if-you-will-get-what-you-want-or",
    number: 122,
    title: "If You Will Get What You Want, or If Your Intentions Will Be Gotten (Very Close) [Note: the Table of Contents lists this chapter's title as \"if someone has long life or not (sick person)\" — but the content found at this position in the manuscript body is about intentions/getting what you want, as given here. This appears to be a mismatch in the original notebook between its own Table of Contents and body, not a transcription error; the \"long life/sick person\" topic appears repeatedly elsewhere, in Chapters Ninety-Three, Ninety-Six, and as an additional method near Chapter Hundred and Four.]",
    paragraphs: [
      "Method 1: After casting the chart, check h7 and h12. If both are downward stars or stable stars, it means he/she will get what he/she wants, and it's very close.",
      "Method 2: If h11 is a downward star or a stable star, it means it will be gotten very fast.",
    ],
  },
  {
    id: "if-something-will-burn",
    number: 123,
    title: "If Something Will Burn",
    paragraphs: [
      "After drawing the chart, check the fire elements of h5, h6, h8 and h9. If they are all opened, then something will burn, or it has already burnt.",
    ],
  },
  {
    id: "if-something-has-really-been-stolen-or-not",
    number: 124,
    title: "If Something Has Really Been Stolen or Not",
    paragraphs: [
      "Method 1: After casting the chart, check if you get( [figures omitted — symbols not preserved in this transcription] ) in the chart. If so, it is true — it has been stolen. But if none of these stars is found in the chart, it means it's a lie.",
      "Method 2: After drawing the chart, pick h1 and h5 and add them. If it is found in the chart, it's true, and vice versa.",
    ],
  },
  {
    id: "if-they-will-return-a-stolen-thing-back",
    number: 125,
    title: "If They Will Return a Stolen Thing Back",
    paragraphs: [
      "After casting the chart, check h1 and h2. If they are both good stars, then check h7 and h8 — if they are bad stars, it means you will get the stolen thing back. But if h7 and h8 are good stars and h1 and h2 are bad stars, you won't get it again. If one of the stars in (h1 and h2) or (h7 and h8) is a bad or middle-good star, then check h2 — if it's a good star, it will be brought back; but if it's a bad star, they won't bring it back.",
    ],
  },
  {
    id: "the-number-of-thieves",
    number: 126,
    title: "The Number of Thieves",
    paragraphs: [
      "After drawing the chart, check h7. The number of times h7 repeats in the chart is the number of thieves.",
    ],
  },
  {
    id: "the-description-of-the-thief",
    number: 127,
    title: "The Description of the Thief",
    paragraphs: [
      "After drawing the chart, use h1 as the thief's description — a male star or a female star found there indicates a male or female thief. Some also use the star found in h7 for the description. [This passage was faint and heavily corrected in the original notebook — the general method is as above, but some detail may not be captured exactly; please check the original scan.]",
    ],
  },
  {
    id: "if-the-thief-or-the-stolen-thing-is",
    number: 128,
    title: "If the Thief or the Stolen Thing Is in Town or Out of Town",
    paragraphs: [
      "After drawing the chart, pick h1 and check if it repeats in the chat as the thief. If it is found in the chart, he/she is still in town. If it is not found in the chart, he/she is gone out of town.",
    ],
  },
  {
    id: "if-it-is-the-accused-person-that-stole",
    number: 129,
    title: "If It Is the Accused Person That Stole the Thing or Not",
    paragraphs: [
      "After drawing the chart, check h4. If it is a downward or stable star, then it is him/her; but if it's an upward or unstable star, he/she is not the one.",
    ],
  },
  {
    id: "the-thief-from-among-the-accused-people",
    number: 130,
    title: "The Thief from Among the Accused People",
    paragraphs: [
      "Method 1: After drawing the chart, pick 2 people's names and place one on your right and one on your left. Then, after drawing the chart, check h4 — if it is a downward or stable star, then it's the person on the right; but if it's an upward or unstable star, it's the person on the left. If there are many people, do this for all of them. Method 2 (directional method): After drawing the chart with that intention, place the accused people's names one on the East side and the other on the West side (see the diagram of the four directions in the original notebook). Draw the chart and divide it into two: the Umuhat (houses 1–4) and any stars under them on",
      "one side, and the Banat (houses 5–8) and any stars under them on the other. Count the single dots of each star on each side and check which side has more dots. If the East side has more single dots, that is where the thief is, and vice versa.",
    ],
  },
  {
    id: "if-something-was-buried-or-has-been-buried",
    number: 131,
    title: "If Something Was Buried, or Has Been Buried, in a Particular Place",
    paragraphs: [
      "Method 1: After drawing the chart, check h4 and h6. If both are downward stars, it means something was buried there; but if they are not, nothing was buried there.",
      "Method 2: Also, if h6 and h4 are good and stable stars, then something is buried there, and vice versa.",
      "Method 3: Also, check h6 and h8. If both are downward stars, then something is buried there.",
    ],
  },
  {
    id: "if-there-s-a-hidden-treasure-gold-money",
    number: 132,
    title: "If There's a Hidden Treasure (Gold/Money) in a Particular Place",
    paragraphs: [
      "Method 1: After casting the chart, pick h4 and h6 and add them. If it's one of the following stars, there is [treasure]; but if it's not, there is nothing there. The stars are as follows: [figures omitted — symbols not preserved in this transcription]",
      "Method 2: Also, if you get [figures omitted — symbols not preserved in this transcription] or in your chart, then there's something; but if it's not any of the above stars, then there's nothing there.",
      "Method 3: Also, if your h1 is a downward star or a stable star, it means there's something; but if it is not, there's nothing.",
    ],
  },
  {
    id: "how-deep-something-is-buried",
    number: 133,
    title: "How Deep Something Is Buried",
    paragraphs: [
      "After drawing the chart, count all the single dots from h1 to h15 and start subtracting 12, 12. If your result is from 1 to 4, it means it is an",
      "inch deep. If your result is from 5 to 8, it means an arm's length or a cubit deep. If your result is from 9 to 12, it means the height of a human being (stature/height deep).",
    ],
  },
  {
    id: "where-a-traveller-has-travelled-to",
    number: 134,
    title: "Where a Traveller Has Travelled To",
    paragraphs: [
      "After casting the chart, pick h1 and h7 and add them to h15. If the star is found in the first 4 houses (Umuhat), it means he/she has gone to the East side. If it is found in the second 4 houses (Banat), it means he/she has gone to the West side. If it is found in the third 4 houses (Hafidat), it means he/she has gone to the North side. And if it is found in the last 4 houses (Sumurakat), it means he/she has gone to the South side.",
    ],
  },
  {
    id: "if-the-traveller-has-travelled-by-air-water",
    number: 135,
    title: "If the Traveller Has Travelled by Air, Water, or Land",
    paragraphs: [
      "After casting the chart, count all the dots of the air elements, the dots of the water elements, and the dots of the sand elements, and check which one has more dots. If the air dots are more, he/she travelled by air. If the water dots are more, he/she travelled by",
      "water. If the sand dots are more, he/she travelled by car, train, motorbike, or bicycle, etc.",
    ],
  },
  {
    id: "if-the-traveller-has-reached-where-he-she",
    number: 136,
    title: "If the Traveller Has Reached Where He/She Is Going or Not",
    paragraphs: [
      "After drawing the chart, check h1. If it's a downward star, he/she has reached home safely. If it's not a downward star, he/she has not reached yet. If house 1 repeats in h3 or h9, he/she is still on the way. If it repeats in h7, he/she has reached the town but not home yet.",
    ],
  },
  {
    id: "if-someone-is-truthful-or-not",
    number: 137,
    title: "If Someone Is Truthful or Not",
    paragraphs: [
      "Method 1: After drawing the chart, check h13 and h14. If h13 is a good star, he/she is telling the truth, or is a truthful person. But if it's h14 that is a good star, it means the querent is not truthful.",
      "Method 2: Pick h1 and h5 and add them. If it is found in the chart, it is true (yes); but if it is not found in the chart, it is not true (no).",
    ],
  },
  {
    id: "if-a-prisoner-will-come-out-of-prison",
    number: 138,
    title: "If a Prisoner Will Come Out of Prison and How Long It Will Take",
    paragraphs: [
      "After drawing the chart, check h6. If it's a good star, he/she will be removed from the prison. If h8 and h16 are bad stars, it will take a long time before he/she is removed.",
    ],
  },
  {
    id: "if-the-prisoner-will-be-removed-peacefully",
    number: 139,
    title: "If the Prisoner Will Be Removed Peacefully",
    paragraphs: [
      "After casting the chart, pick h1 and h3 and add them. If it is a good and upward star, he/she will be removed peacefully and happily. If it is a bad and upward star, it will take a longer time before they can remove him/her, with sadness and a lot of stress.",
    ],
  },
  {
    id: "how-long-the-prisoner-will-stay-in-prison",
    number: 140,
    title: "How Long the Prisoner Will Stay in Prison/Cells",
    paragraphs: [
      "After drawing the chart, pick h1 and h3 and add them. If it's a good and downward star, he/she will stay in the cells for a while before",
      "they remove him/her. If it's a bad and downward star, he/she is going for life imprisonment — it will be difficult to get him/her out of the prison.",
    ],
  },
  {
    id: "if-the-prisoner-is-male-or-female",
    number: 141,
    title: "If the Prisoner Is Male or Female",
    paragraphs: [
      "After drawing the chart, pick h1 and h7 and add them. If it's a male star, he's a male, and vice versa.",
    ],
  },
  {
    id: "where-kidnappers-are-keeping-a-person-hostage",
    number: 142,
    title: "Where Kidnappers Are Keeping a Person Hostage",
    paragraphs: [
      "After drawing the chart, check which star is found in its own house. If it's:, he/she is kidnapped in his/her own house. If it's:, he/she is in one of the closest houses, or a neighbor's. If it's, he/she is in one of his/her family members' house. If it's, he/she is in his/her father's or mother's house. If it's, he/she is in one of his/her children's house. If it's, he/she is",
      "in a sick person's house, close to him or her. If it's, he/she is in his or her girlfriend's/boyfriend's, or wife's/husband's house. If it's, he/she is in a funeral house. If it's, he/she is on a journey — they are taking him/her somewhere out of towns. If it's, he/she is in a chief's, king's, or a well-known and respected person's house. If it's, he/she is in his/her ex's house. If it's, he/she is in his/her enemy's house — and so on, up to the end of the stars.",
    ],
  },
  {
    id: "the-consequence-of-a-prisoner",
    number: 143,
    title: "The Consequence of a Prisoner",
    paragraphs: [
      "Method 1: After drawing the chart, pick h1 and h6 and add them. Then pick h12 and h15 and add them. Then add all of them together. If it's a good star, it is going to be well after the prison; but if it's a bad star, it's not going to be easy after prison.",
      "Method 2: Pick h3 and h12, then h1 and h4, and add them all together. If it's a good star, it's going to be well, and vice versa.",
    ],
  },
  {
    id: "if-you-will-get-your-debts-deposit-or",
    number: 144,
    title: "If You Will Get Your Debts, Deposit, or Savings Back",
    paragraphs: [
      "After drawing the chart, pick h1 and h7, then h2 and h8, and add them all. If it's a good star and repeats in the chart itself, they will pay you, or you will get the money back. If it's a bad star, they won't pay you, and you won't get the money back. If it's a middle- good star, it will take a longer time before you get it.",
    ],
  },
  {
    id: "if-someone-will-get-a-particular-position-or",
    number: 145,
    title: "If Someone Will Get a Particular Position or Chieftaincy Title",
    paragraphs: [
      "After drawing the chart, pick h1 and h10, then h11 and h13, and add them all. If it's a good star, he/she will get it. If it's a middle-good star, he/she may get it with prayers. If it's a bad star, he/she will never get it. Allah knows best.",
    ],
  },
  {
    id: "if-you-will-own-a-house-in-your",
    number: 146,
    title: "If You Will Own a House in Your Life",
    paragraphs: [
      "After casting the chart, pick h1 and h4, then h11 and h15, and add them all. If it's a good star, you will own a house in your life. If it's a bad star, you will never own a house. If it's a middle-good star, you will own a house with prayers and sacrifices.",
    ],
  },
  {
    id: "if-this-apartment-you-are-going-to-is",
    number: 147,
    title: "If This Apartment You Are Going to Is Safe/Good for You",
    paragraphs: [
      "After casting the chart, pick h1 and h4, then add it to h5. If it's a good star, it's good and safe. If it's a bad star, it is not. If it's a middle-good star, you have to do a lot of prayers and sacrifices (spiritual cleansing).",
    ],
  },
  {
    id: "if-you-will-receive-the-expected-message",
    number: 148,
    title: "If You Will Receive the Expected Message",
    paragraphs: [
      "After casting the chart, pick h1 and h5, then add it to h15. If it's a good star, you will get it easily. If it's a bad star, you won't get it at all. If it's a middle-good star, you may get it with serious prayer and sacrifices.",
    ],
  },
  {
    id: "which-day-a-pregnant-woman-will-put-to",
    number: 149,
    title: "Which Day a Pregnant Woman Will Put to Bed",
    paragraphs: [
      "After casting the chart, count all the dots of h1, h4, h5, h7, and h15, and start subtracting 7, 7. If it's 1, that's Sunday; 2 is Monday; 3 is Tuesday; and so on through the week to Saturday. [The full day-by- day list runs off the edge of the scanned page — only the first three days are legible; please check the original for days 4–7.]",
    ],
  },
  {
    id: "if-you-will-get-back-to-work-after",
    number: 150,
    title: "If You Will Get Back to Work After Getting a Problem in the Workplace",
    paragraphs: [
      "Pick h1 and h6 and add them to h10. If it's a good star, you will. If it's a bad star, you will not. If it's a middle-good star, with prayer you will get your place back.",
    ],
  },
  {
    id: "dreams-and-their-interpretations",
    number: 151,
    title: "Dreams and Their Interpretations",
    paragraphs: [
      "If you want to know the meaning of a dream, make only the first 4 stars (Umuhat) and pair them. 1. If it's, it means enmity but long life. It also talks about sickness and family problems. Do the sadaka (charitable offering) of a red cock, red money, and a red shirt/jalabia, on Friday. 2. If it's, it means heavy money is coming to you, or a lucrative job or business. It also talks about a business trip, or someone coming to pay you their debts. Do the sadaka of your cloth or shirt, any amount of money, and a black/white hen.",
      "3. If it's, it means you will get a good stranger, a visitor, or a message. It also talks about a love relationship or marriage that will soon come. Do the sadaka of 100 kola nuts, a black cock, and any amount of money. Your business or money will be tied up for a little while before it opens. 4. If it's, it means you will get a stranger wearing white clothes. It also talks about a man/lady you will meet on your journey who might become your wife or husband in future, and about an intelligent child you will have in future. Do the sadaka of white cloth, a white cock, and one white kola nut. 5. If it's, it means a message, a messenger, or a child/pregnancy that you will soon get. It also talks about travelling across water or a flood. Do the sadaka of a white house- bird, white rice and cow's milk, or the head of a sheep or goat. 6. If it's, it means you will get a lot of money, but you may use it all for your treatment — you will be sick for some time, but insha'Allah you will be fine after that. Do the sadaka of salt, a white item [unclear in the original], and a white house-bird.",
      "7. If it's, it means your house might get burnt, or a nearby house. It also talks about a cut or blood on your body, meat that someone might bring you as sadaka, a colored man/lady coming into your life, and being stolen from (or that you will be). Do the sadaka of a red cock or duck, gold, and red money. 8. If it's, it means a new funeral, or that there will be many funerals that month or week. It talks about panic and fear. Do the sadaka of a mixed-color cock, mixed-color foods, and a black cloth. 9. If it's, it means you will soon travel — the travelling is good, and you will go and come in peace and safety. Do the sadaka of black metal and a cock that has 3 colors; give them to a traveller or a stranger. 10. If it's, it means you are cheating people and should stop, or that someone will cheat you — so be careful. It also talks about promotion or chieftaincy issues. Do the sadaka of a guinea fowl and a black cloth/white ram, for the recitation of the Qur'an, or as charity (khayrat) on your behalf.",
      "11. If it's:, it means the expectations you are thinking about will soon come — it also talks about an ex who wants to come back to you, though the expectations are not good for you. Do the sadaka of a red goat, your sandals, and 4 white kola nuts. 12. If it's:, it means money that is supposed to come to you has been blocked by an enemy. It also talks about a debt that you owe, or that is owed to you, that will cause enmity between you and that person. Do the sadaka of a red goat, red shirt, money, and red cereals. 13. If it's:, it means all your success has been blocked, and it will be very difficult to unblock. Do the sadaka of 2 fowls from the same mother — one released to the North and the other to the South. 14. If it's, it means your ancestors are asking for food from you. It also talks about your success having been blocked. You have to do sadaka to your ancestors so that things will be better for you — make food with a white hen and share it around your area.",
      "15. If it's:, it means success, love, and leadership await you in future. It also talks about a relationship or marriage. Do the sadaka of white cloth, 7 white kola nuts, white rice, cow's milk, and a white hen. 16. If it's:, it means your enemies are many — envious and jealous people are around you, and a lot of people are looking up to you to help them. It also talks about how you will lead people in future. Do the sadaka of a black cock and Massan (21) [quantity/term unclear in the original].",
    ],
  },
];