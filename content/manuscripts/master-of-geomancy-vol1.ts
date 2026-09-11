export type ChapterKind = 'prose' | 'stars-directory' | 'element-directory' | 'sadaqah-directory';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  kind: ChapterKind;
  body?: string[];
}

export const BOOK_TITLE = 'The Master of Geomancy';
export const BOOK_SUBTITLE = 'Volume 1';

export const INTRODUCTION: string[] = [
  '“Geomancy” is derived from the Latin geomantia, itself from the Greek for “divination by earth (sand).” In Arabic it carries two names: ilm al-raml, the science of the sand, and ilm al-khatt, the science of the lines.',
  'Historians — and the Prophet of Islam himself — have linked the science of the sand to one of the Prophets of God. The Prophet Muhammad ﷺ is reported to have said: “There used to be a Prophet who made geomantic lines; whoever coincides with his geomantic science, so they are the people you referred to.” The Bedouin Mu’awiyya ibn Hakam had asked the Prophet about men of his time still practising geomancy, and this was the response. Scholars of Islam agree the Prophet referred to is Prophet Idris — also credited with the discovery of the pen, and regarded as the father of astronomy, numerology and geomancy alike.',
  'Idris is said to have been named Enoch by most scholars, and Hermes by others, nicknamed Idris for his extreme inclination toward the sciences. He lived before the Noachian Flood, the son of Jared, son of Mahalalel, son of Kenan, son of Enos, son of Seth, son of Adam. He taught the people of his time — many of them idolaters — every branch of science he knew, geomancy among them, and set them the task of discovering how many gods should be worshipped, and who the Prophet of God was in their time. When it was found that only one God should be worshipped, the people divided; some rejected monotheism, yet continued practising geomancy — no longer in the pristine form Idris had taught. It is to this drift that the Prophet Muhammad ﷺ referred: “…whoever coincides with his geomantic science.”',
  'The first manuscripts describing geomancy, the Tabula Smaragdina, appeared in the 9th century AD in the advanced civilisation of the Middle East, spreading to Europe in the 11th and 12th centuries when the Spanish priest Hugo of Santalla, working in Tarazona, translated the Smaragdine Tablet.',
  'The relationship between geomantic science and sand is only circumstantial: sand was simply the available interface before papyrus or paper existed, cheap and everywhere underfoot. Today a piece of parchment, paper, or any writing surface serves the same purpose — the name “geomancy” is already archaic for this science, much as Chemistry replaced the old-fashioned Alchemy.',
];

export const DEDICATION =
  'My profound gratitude goes to my sheikh, mentor and guardian — Sheikh Alhaji Seidu Kassim Watara — and my parents, Ustaz Adam Meffe Lajina, may his gentle soul rest in perfect peace and Allah grant him Jannatul Firdaus; and my mother, still alive, may Allah grant her long life to see her grandchildren’s children.';

export const CHAPTERS: Chapter[] = [
  {
    id: 'drawing-a-chart',
    number: 1,
    title: 'How to Draw a Chart in Geomancy',
    kind: 'prose',
    body: [
      'There are two methods of drawing a chart in geomancy: the Counting Method and the Cancelling Method.',
      '**The Counting Method.** Make four straight lines of dots — traditionally by striking the sand quickly, without deliberately counting, so the number falls to chance. Starting from the fourth line (counting right to left), tally the dots on each line. If the total is more than 16, subtract 16 from it; whatever remains — 16 or fewer — is that line’s star number. Repeat for the other three lines. At the end you will have four stars: these first four are called the Umuhat, the Mother stars.',
      '**The Cancelling Method.** Draw four straight lines of dots, then cancel the dots two by two, right to left, on each line. What is left over — one dot, or two — becomes that line’s mark. Stack the four marks (one per line, top to bottom) and you have your first Mother figure. Repeat three more times for Mothers two, three and four.',
      'From the four Mothers, the second four stars — the Banaat, the Daughters — are drawn out by combining the Mothers’ corresponding lines. The rule for combining any two lines is simple: two of the same kind combine to a double dot, two different kinds combine to a single dot (double + double = double, single + double = single, single + single = double).',
      'The chart continues to build on itself: pairs of the eight Mothers and Daughters combine to give four Nieces; the Nieces combine in pairs to give the Right and Left Witnesses; the two Witnesses combine to give the Judge — the chart’s final verdict; and the Judge combines once more with the first Mother to give the sixteenth and last figure, the Reconciler.',
    ],
  },
  {
    id: 'bazdaaho-method',
    number: 2,
    title: 'The Bazdaaho Method of Arranging the Stars',
    kind: 'prose',
    body: [
      'The Bazdaaho method arranges the sixteen stars in a fixed order, from Yussif to Musah, as introduced by Sheikh Abu Abdullah az-Zanati. It gives every one of the sixteen possible four-line figures a name, a number, and a place among the four elements — Fire, Air, Water and Sand — four stars to an element.',
      'This arrangement is what lets a geomancer move from a freshly cast figure straight to a name, an element, and a body of meaning already gathered by generations of practice — rather than reasoning the dots out from nothing each time.',
    ],
  },
  {
    id: 'stars-and-symbols',
    number: 3,
    title: 'The Stars: Their Names, Symbols and Elements',
    kind: 'stars-directory',
  },
  {
    id: 'stars-in-the-chart',
    number: 4,
    title: 'The Stars and Their Uses in a Chart',
    kind: 'stars-directory',
    body: [
      'Every star speaks differently depending on which house of the chart it falls in. Two houses carry the clearest, most immediate readings: House 6 (illness and hidden enmity) and House 2 (wealth and its movement). What follows is each star’s word for both.',
    ],
  },
  {
    id: 'element-arrangement',
    number: 5,
    title: 'Arrangement of the Stars by Element',
    kind: 'element-directory',
    body: [
      'Beyond the Bazdaaho order, the sixteen stars sort into four elements — Fire, Air, Water, Sand/Earth — four stars to each. Every person belongs to one of these four, and working against one’s own element is, in this tradition, a common root of stalled success: before blaming witches, wizards or village enemies, first find your star and work with it.',
    ],
  },
  {
    id: 'knowing-your-buruji',
    number: 6,
    title: 'Knowing Your Star (Buruji)',
    kind: 'prose',
    body: [
      'To know your star — your Buruji — in life, cast a chart about your general life, then read it by any of the following:',
      '1. Check House 1. Whatever star is found there is your star, and its number.',
      '2. Take Houses 2, 4, 10 and 16 and combine them. Whichever star results — fire, air, water or sand — is your life star.',
      '3. Take Houses 1 and 8 and combine them. The resulting star is your star.',
    ],
  },
  {
    id: 'elements-and-occupations',
    number: 7,
    title: 'The Four Elements: Stars and Occupations',
    kind: 'element-directory',
    body: [
      'Knowing your element points toward the work you should do, the kind of spouse to marry, and the kind of friends to keep.',
    ],
  },
  {
    id: 'spiritual-strength',
    number: 8,
    title: 'Knowing Your Spiritual Strength',
    kind: 'prose',
    body: [
      'It is important to know the level of one’s spiritual background — it determines how seriously one must take prayer and sacrifice.',
      'Take Houses 1, 10, 13, 14 and 15. If Sand stars are the majority among them, you are doing very well — spiritually active. If Water stars dominate, you are fine, but should not relax. If Fire stars dominate, you are below where you should be, and need serious prayer. If Air stars dominate, you are at zero spiritually and need to wake up — either your prayers are missing, or they are simply not the right ones.',
    ],
  },
  {
    id: 'causes-of-problems',
    number: 9,
    title: 'Reasons and Causes of Problems',
    kind: 'prose',
    body: [
      'When things are not moving — standing still, or going backwards — several methods can surface the cause.',
      'After casting the chart, take Houses 1, 6, 8 and 16 and combine them. A Fire star result points to enmity, usually a fight between the querent (or their family) and another party. An Air star points to enemies who have taken the matter to idol-worshippers out of envy over money or a dispute. A Water star points to jinn spirits — a spiritual marriage, or exposure to bad wind. A Sand star points to Allah or the ancestors, rather than to any human enemy.',
      'A second method takes Houses 4, 6, 5 and 8 together: a good star points to Allah or the ancestors; a middling star points to enmity; a poor star points to jinn spirits.',
    ],
  },
  {
    id: 'star-sadaqah',
    number: 10,
    title: 'Every Star and Its Sadaqah',
    kind: 'sadaqah-directory',
    body: [
      'Several methods surface which sadaqah — charitable offering — is called for by a chart.',
      '1. Combine House 1 and House 6, and give the sadaqah of the resulting star.',
      '2. Whatever star falls in House 1, give its sadaqah directly.',
      '3. Combine Houses 1, 4, 7 and 10, and give the sadaqah of the resulting star.',
      'Below is every star’s own sadaqah and the day it is traditionally given.',
    ],
  },
];
