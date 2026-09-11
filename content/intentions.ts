// Curated reading categories and specific questions, built directly from
// Kanzul Mikban's own 153 chapters (content/manuscripts/kanzul-mikban.ts) —
// each selectable question maps 1:1 to a real chapter/method in the book,
// grouped under ten broad categories for browsing. "General Reading" is the
// only non-chapter-backed entry (no specific method — just cast and read).

export type IconName =
  | 'sparkles' | 'heart' | 'coins' | 'briefcase' | 'activity' | 'users'
  | 'plane' | 'scale' | 'key-round' | 'clock' | 'moon';

export type CategoryId =
  | "love-couple" | "money-possessions" | "work-success" | "health-hardships" | "family-loved-ones" | "travel-change" | "legal-conflict" | "lost-stolen" | "fate-timing" | "dreams";

export interface Category {
  id: CategoryId;
  label: string;
  icon: IconName;
  description: string;
}

export interface Intention {
  id: string;
  label: string;
  categoryId: CategoryId | null;
  /** Kanzul Mikban chapter ids (content/manuscripts/kanzul-mikban.ts) this
   * question surfaces after casting. Empty for the general/no-method option. */
  chapterIds: string[];
}

export const CATEGORIES: Category[] = [
  { id: "love-couple", label: "Love & Couple", icon: "heart", description: "Marriage, feelings, and relationships" },
  { id: "money-possessions", label: "Money & Possessions", icon: "coins", description: "Wealth, profit, debts and gifts" },
  { id: "work-success", label: "Work & Success", icon: "briefcase", description: "Career, position, business and status" },
  { id: "health-hardships", label: "Health & Hardships", icon: "activity", description: "Sickness, suffering, and recovery" },
  { id: "family-loved-ones", label: "Family & Loved Ones", icon: "users", description: "Pregnancy, children, and friendship" },
  { id: "travel-change", label: "Travel & Change", icon: "plane", description: "Journeys, moving, and staying put" },
  { id: "legal-conflict", label: "Legal & Conflict", icon: "scale", description: "Enemies, court, prison, and disputes" },
  { id: "lost-stolen", label: "Lost & Stolen Things", icon: "key-round", description: "Searching, theft, and buried things" },
  { id: "fate-timing", label: "Fate & Timing", icon: "clock", description: "Timing, general luck, and everyday questions" },
  { id: "dreams", label: "Dreams", icon: "moon", description: "What a dream might mean" },
];

export const INTENTIONS: Intention[] = [
  { id: 'general', label: 'General Reading', categoryId: null, chapterIds: [] },
  {
    id: "traveling-business-and-if-you-will-return-from",
    label: "Traveling, Business, and If You Will Return from the Trip or Not",
    categoryId: "travel-change",
    chapterIds: ["traveling-business-and-if-you-will-return-from"],
  },
  {
    id: "if-you-want-to-know-if-you-will",
    label: "If You Want to Know If You Will Get Money Today or Not",
    categoryId: "money-possessions",
    chapterIds: ["if-you-want-to-know-if-you-will"],
  },
  {
    id: "business-profit-and-loss",
    label: "Business, Profit, and Loss",
    categoryId: "money-possessions",
    chapterIds: ["business-profit-and-loss"],
  },
  {
    id: "hunting-in-water-and-on-land-and-searching",
    label: "Hunting in Water and on Land, and Searching for Anything",
    categoryId: "lost-stolen",
    chapterIds: ["hunting-in-water-and-on-land-and-searching"],
  },
  {
    id: "if-you-will-win-a-fight-war-or",
    label: "If You Will Win a Fight, War, or Court Case",
    categoryId: "legal-conflict",
    chapterIds: ["if-you-will-win-a-fight-war-or"],
  },
  {
    id: "if-you-want-to-know-where-your-enemy",
    label: "If You Want to Know Where Your Enemy or a Thief Is Hidden",
    categoryId: "legal-conflict",
    chapterIds: ["if-you-want-to-know-where-your-enemy"],
  },
  {
    id: "marriage-and-its-blessings",
    label: "Marriage and Its Blessings",
    categoryId: "love-couple",
    chapterIds: ["marriage-and-its-blessings"],
  },
  {
    id: "if-she-s-going-to-stay-in-the",
    label: "Sub-topic: If She's Going to Stay in the Marriage or Not",
    categoryId: "love-couple",
    chapterIds: ["if-she-s-going-to-stay-in-the"],
  },
  {
    id: "if-one-will-stay-in-a-particular-place",
    label: "If One Will Stay in a Particular Place or Not, and If It's Good or Not",
    categoryId: "travel-change",
    chapterIds: ["if-one-will-stay-in-a-particular-place"],
  },
  {
    id: "sickness-if-he-she-will-survive",
    label: "Sickness (If He/She Will Survive)",
    categoryId: "health-hardships",
    chapterIds: ["sickness-if-he-she-will-survive"],
  },
  {
    id: "if-your-lost-thing-is-still-around-or",
    label: "If Your Lost Thing Is Still Around or Is Gone",
    categoryId: "lost-stolen",
    chapterIds: ["if-your-lost-thing-is-still-around-or"],
  },
  {
    id: "if-you-want-to-know-if-you-will-2",
    label: "If You Want to Know If You Will Be Successful in Life, at Home, or Have to Travel Away from Home",
    categoryId: "travel-change",
    chapterIds: ["if-you-want-to-know-if-you-will-2"],
  },
  {
    id: "if-you-want-to-know-if-you-will-3",
    label: "If You Want to Know If You Will Be Rich in Life or Not",
    categoryId: "money-possessions",
    chapterIds: ["if-you-want-to-know-if-you-will-3"],
  },
  {
    id: "if-you-will-get-children-from-a-lady",
    label: "If You Will Get Children from a Lady You Want to Marry",
    categoryId: "love-couple",
    chapterIds: ["if-you-will-get-children-from-a-lady"],
  },
  {
    id: "if-a-pregnancy-is-going-to-be-stable",
    label: "If a Pregnancy Is Going to Be Stable or Not (Good Condition)",
    categoryId: "family-loved-ones",
    chapterIds: ["if-a-pregnancy-is-going-to-be-stable"],
  },
  {
    id: "if-things-will-be-better-for-the-questioner",
    label: "If Things Will Be Better for the Questioner or Not",
    categoryId: "fate-timing",
    chapterIds: ["if-things-will-be-better-for-the-questioner"],
  },
  {
    id: "if-you-will-overcome-your-enemy-or-not",
    label: "If You Will Overcome Your Enemy or Not",
    categoryId: "legal-conflict",
    chapterIds: ["if-you-will-overcome-your-enemy-or-not"],
  },
  {
    id: "if-something-will-happen-in-an-hour-day",
    label: "If Something Will Happen in an Hour, Day, Week, Month, or Year",
    categoryId: "fate-timing",
    chapterIds: ["if-something-will-happen-in-an-hour-day"],
  },
  {
    id: "if-you-will-get-your-stolen-things-back",
    label: "If You Will Get Your Stolen Things Back",
    categoryId: "lost-stolen",
    chapterIds: ["if-you-will-get-your-stolen-things-back"],
  },
  {
    id: "if-you-will-win-a-case-in-court",
    label: "If You Will Win a Case in Court, Chief Palace, a Fight, or War",
    categoryId: "legal-conflict",
    chapterIds: ["if-you-will-win-a-case-in-court"],
  },
  {
    id: "who-will-win-an-election-or-a-chieftaincy",
    label: "Who Will Win an Election or a Chieftaincy Title",
    categoryId: "work-success",
    chapterIds: ["who-will-win-an-election-or-a-chieftaincy"],
  },
  {
    id: "if-your-wife-or-sister-has-had-sex",
    label: "If Your Wife or Sister Has Had Sex or Not",
    categoryId: "love-couple",
    chapterIds: ["if-your-wife-or-sister-has-had-sex"],
  },
  {
    id: "if-it-s-good-to-stay-in-a",
    label: "If It's Good to Stay in a Particular House",
    categoryId: "travel-change",
    chapterIds: ["if-it-s-good-to-stay-in-a"],
  },
  {
    id: "if-it-s-good-to-stay-in-a-2",
    label: "If It's Good to Stay in a Town or Not",
    categoryId: "travel-change",
    chapterIds: ["if-it-s-good-to-stay-in-a-2"],
  },
  {
    id: "is-there-much-trees-water-sand-or-stones",
    label: "Is There Much Trees, Water, Sand, or Stones in the Area You Are Going To",
    categoryId: "travel-change",
    chapterIds: ["is-there-much-trees-water-sand-or-stones"],
  },
  {
    id: "if-you-will-be-safe-entering-a-canoe",
    label: "If You Will Be Safe Entering a Canoe, or Will Get Fish from Fishing",
    categoryId: "travel-change",
    chapterIds: ["if-you-will-be-safe-entering-a-canoe"],
  },
  {
    id: "if-there-are-armed-robbers-on-your-way",
    label: "If There Are Armed Robbers on Your Way",
    categoryId: "legal-conflict",
    chapterIds: ["if-there-are-armed-robbers-on-your-way"],
  },
  {
    id: "if-there-will-be-a-fight-argument-etc",
    label: "If There Will Be a Fight, Argument, etc",
    categoryId: "legal-conflict",
    chapterIds: ["if-there-will-be-a-fight-argument-etc"],
  },
  {
    id: "about-farming-and-food-in-the-year",
    label: "About Farming and Food in the Year",
    categoryId: "work-success",
    chapterIds: ["about-farming-and-food-in-the-year"],
  },
  {
    id: "if-you-will-get-money-or-good-strangers",
    label: "If You Will Get Money or Good Strangers That Same Day or Not",
    categoryId: "money-possessions",
    chapterIds: ["if-you-will-get-money-or-good-strangers"],
  },
  {
    id: "if-you-will-be-successful-where-you-are",
    label: "If You Will Be Successful Where You Are Going",
    categoryId: "work-success",
    chapterIds: ["if-you-will-be-successful-where-you-are"],
  },
  {
    id: "continued-from-chapter-twenty-eight",
    label: "Reading the Gift/Visitor Figures (continued from Chapter Twenty-Eight)",
    categoryId: "fate-timing",
    chapterIds: ["continued-from-chapter-twenty-eight"],
  },
  {
    id: "reading-the-gift-visitor-figures-end-of-chapter",
    label: "Continued from Part 1 — Reading the Gift/Visitor Figures (end of Chapter Twenty-Eight/Twenty-Nine material)",
    categoryId: "fate-timing",
    chapterIds: ["reading-the-gift-visitor-figures-end-of-chapter"],
  },
  {
    id: "if-you-will-be-successful-and-get-what",
    label: "If You Will Be Successful and Get What You Want from the Trip/Traveling",
    categoryId: "travel-change",
    chapterIds: ["if-you-will-be-successful-and-get-what"],
  },
  {
    id: "about-a-lost-thing-stolen-things",
    label: "About a Lost Thing / Stolen Things",
    categoryId: "lost-stolen",
    chapterIds: ["about-a-lost-thing-stolen-things"],
  },
  {
    id: "if-it-will-rain-today-or-not",
    label: "If It Will Rain Today or Not",
    categoryId: "fate-timing",
    chapterIds: ["if-it-will-rain-today-or-not"],
  },
  {
    id: "if-someone-loves-you-much-less-or-not",
    label: "If Someone Loves You Much, Less, or Not at All",
    categoryId: "love-couple",
    chapterIds: ["if-someone-loves-you-much-less-or-not"],
  },
  {
    id: "if-your-enemies-are-working-against-you-or",
    label: "If Your Enemies Are Working Against You or Not",
    categoryId: "legal-conflict",
    chapterIds: ["if-your-enemies-are-working-against-you-or"],
  },
  {
    id: "if-your-family-is-doing-well-while-you",
    label: "If Your Family Is Doing Well (While You Are Far from Them)",
    categoryId: "family-loved-ones",
    chapterIds: ["if-your-family-is-doing-well-while-you"],
  },
  {
    id: "if-you-want-to-locate-someone-or-something",
    label: "If You Want to Locate Someone or Something",
    categoryId: "lost-stolen",
    chapterIds: ["if-you-want-to-locate-someone-or-something"],
  },
  {
    id: "how-to-predict-a-game-who-will-win",
    label: "How to Predict a Game, Who Will Win or Lose",
    categoryId: "fate-timing",
    chapterIds: ["how-to-predict-a-game-who-will-win"],
  },
  {
    id: "if-two-lovers-will-be-compatible-for-marriage",
    label: "If Two Lovers Will Be Compatible for Marriage (Their Star Signs)",
    categoryId: "love-couple",
    chapterIds: ["if-two-lovers-will-be-compatible-for-marriage"],
  },
  {
    id: "if-your-visitor-or-the-person-that-comes",
    label: "If Your Visitor, or the Person That Comes to You, Is a Good or Bad Person",
    categoryId: "fate-timing",
    chapterIds: ["if-your-visitor-or-the-person-that-comes"],
  },
  {
    id: "if-spiritual-work-you-want-to-do-for",
    label: "If Spiritual Work You Want to Do for Someone Will Work or Not",
    categoryId: "fate-timing",
    chapterIds: ["if-spiritual-work-you-want-to-do-for"],
  },
  {
    id: "the-person-that-took-an-item-stole-something",
    label: "The Person That Took an Item / Stole Something",
    categoryId: "lost-stolen",
    chapterIds: ["the-person-that-took-an-item-stole-something"],
  },
  {
    id: "if-you-will-get-what-you-want-from",
    label: "If You Will Get What You Want from Where You Are Going",
    categoryId: "fate-timing",
    chapterIds: ["if-you-will-get-what-you-want-from"],
  },
  {
    id: "the-real-behavior-character-or-life-of-someone",
    label: "The Real Behavior/Character or Life of Someone You Want to Get Married to (in Future)",
    categoryId: "love-couple",
    chapterIds: ["the-real-behavior-character-or-life-of-someone"],
  },
  {
    id: "if-a-lady-or-man-will-accept-your",
    label: "If a Lady or Man Will Accept Your Love Proposal or Not",
    categoryId: "love-couple",
    chapterIds: ["if-a-lady-or-man-will-accept-your"],
  },
  {
    id: "if-you-will-get-the-lost-thing-back",
    label: "If You Will Get the Lost Thing Back",
    categoryId: "lost-stolen",
    chapterIds: ["if-you-will-get-the-lost-thing-back"],
  },
  {
    id: "how-to-make-one-win-over-the-other",
    label: "How to Make One Win Over the Other Opponents (Enemies)",
    categoryId: "legal-conflict",
    chapterIds: ["how-to-make-one-win-over-the-other"],
  },
  {
    id: "if-a-lady-is-pregnant-or-not",
    label: "If a Lady Is Pregnant or Not",
    categoryId: "family-loved-ones",
    chapterIds: ["if-a-lady-is-pregnant-or-not"],
  },
  {
    id: "if-it-s-a-male-or-female-child",
    label: "If It's a Male or Female Child",
    categoryId: "family-loved-ones",
    chapterIds: ["if-it-s-a-male-or-female-child"],
  },
  {
    id: "if-something-is-closer-to-you-or-far",
    label: "If Something Is Closer to You or Far Away from You",
    categoryId: "fate-timing",
    chapterIds: ["if-something-is-closer-to-you-or-far"],
  },
  {
    id: "if-you-will-get-gold-in-a-place",
    label: "If You Will Get Gold in a Place Where You Are Working",
    categoryId: "money-possessions",
    chapterIds: ["if-you-will-get-gold-in-a-place"],
  },
  {
    id: "if-things-are-going-to-be-well-this",
    label: "If Things Are Going to Be Well This Year or Not (Yearly News)",
    categoryId: "fate-timing",
    chapterIds: ["if-things-are-going-to-be-well-this"],
  },
  {
    id: "the-friendship-between-two-people-if-it-s",
    label: "The Friendship Between Two People, If It's Good or Not",
    categoryId: "family-loved-ones",
    chapterIds: ["the-friendship-between-two-people-if-it-s"],
  },
  {
    id: "the-consequence-of-friendship-between-two-people",
    label: "The Consequence of Friendship Between Two People",
    categoryId: "family-loved-ones",
    chapterIds: ["the-consequence-of-friendship-between-two-people"],
  },
  {
    id: "if-a-querent-is-asking-about-someone-or",
    label: "If a Querent Is Asking About Someone or About Him/Herself",
    categoryId: "fate-timing",
    chapterIds: ["if-a-querent-is-asking-about-someone-or"],
  },
  {
    id: "where-your-success-is-or-where-you-will",
    label: "Where Your Success Is, or Where You Will Make It in Life",
    categoryId: "work-success",
    chapterIds: ["where-your-success-is-or-where-you-will"],
  },
  {
    id: "the-whereabouts-of-a-thief-or-robbers",
    label: "The Whereabouts of a Thief or Robbers",
    categoryId: "legal-conflict",
    chapterIds: ["the-whereabouts-of-a-thief-or-robbers"],
  },
  {
    id: "about-a-pregnancy-if-it-s-a-boy",
    label: "About a Pregnancy, If It's a Boy or a Girl",
    categoryId: "family-loved-ones",
    chapterIds: ["about-a-pregnancy-if-it-s-a-boy"],
  },
  {
    id: "s-if-you-want-to-know-if-she",
    label: "Additional Methods — If You Want to Know If She's Pregnant",
    categoryId: "family-loved-ones",
    chapterIds: ["s-if-you-want-to-know-if-she"],
  },
  {
    id: "when-to-travel-daytime-or-night-time",
    label: "When to Travel, Daytime or Night Time",
    categoryId: "travel-change",
    chapterIds: ["when-to-travel-daytime-or-night-time"],
  },
  {
    id: "if-couples-have-had-sex-or-not",
    label: "If Couples Have Had Sex or Not",
    categoryId: "love-couple",
    chapterIds: ["if-couples-have-had-sex-or-not"],
  },
  {
    id: "the-secret-of-the-querent-in-a-chart",
    label: "The Secret of the Querent in a Chart",
    categoryId: "fate-timing",
    chapterIds: ["the-secret-of-the-querent-in-a-chart"],
  },
  {
    id: "if-she-he-loves-you-or-not",
    label: "If She/He Loves You or Not",
    categoryId: "love-couple",
    chapterIds: ["if-she-he-loves-you-or-not"],
  },
  {
    id: "if-a-marriage-is-good-or-not",
    label: "If a Marriage Is Good or Not",
    categoryId: "love-couple",
    chapterIds: ["if-a-marriage-is-good-or-not"],
  },
  {
    id: "if-the-prayers-done-for-someone-have-been",
    label: "If the Prayers Done for Someone Have Been Answered or Not",
    categoryId: "fate-timing",
    chapterIds: ["if-the-prayers-done-for-someone-have-been"],
  },
  {
    id: "if-the-lady-or-man-you-are-going",
    label: "If the Lady or Man You Are Going to Marry Is Related to You by Family",
    categoryId: "love-couple",
    chapterIds: ["if-the-lady-or-man-you-are-going"],
  },
  {
    id: "if-a-marriage-will-last-forever",
    label: "If a Marriage Will Last Forever",
    categoryId: "love-couple",
    chapterIds: ["if-a-marriage-will-last-forever"],
  },
  {
    id: "someone-s-behavior-also-see-chapter-forty-three",
    label: "Additional Method — Someone's Behavior (also see Chapter Forty-Three)",
    categoryId: "love-couple",
    chapterIds: ["someone-s-behavior-also-see-chapter-forty-three"],
  },
  {
    id: "if-a-partner-has-a-particular-disease-or",
    label: "If a Partner Has a Particular Disease or Sickness",
    categoryId: "health-hardships",
    chapterIds: ["if-a-partner-has-a-particular-disease-or"],
  },
  {
    id: "if-someone-has-married-before-or-if-he",
    label: "If Someone Has Married Before, or If He/She Is Married",
    categoryId: "love-couple",
    chapterIds: ["if-someone-has-married-before-or-if-he"],
  },
  {
    id: "if-she-he-is-still-in-the-marriage",
    label: "Additional Method — If She/He Is Still in the Marriage or Not",
    categoryId: "love-couple",
    chapterIds: ["if-she-he-is-still-in-the-marriage"],
  },
  {
    id: "if-he-she-is-enjoying-the-marriage",
    label: "If He/She Is Enjoying the Marriage",
    categoryId: "love-couple",
    chapterIds: ["if-he-she-is-enjoying-the-marriage"],
  },
  {
    id: "if-your-partner-is-cheating-on-you",
    label: "If Your Partner Is Cheating on You",
    categoryId: "love-couple",
    chapterIds: ["if-your-partner-is-cheating-on-you"],
  },
  {
    id: "if-your-ex-husband-wife-will-re-marry",
    label: "If Your Ex-Husband/Wife Will Re-Marry Again After the Divorce",
    categoryId: "love-couple",
    chapterIds: ["if-your-ex-husband-wife-will-re-marry"],
  },
  {
    id: "if-a-pregnant-woman-will-have-childbirth-problems",
    label: "If a Pregnant Woman Will Have Childbirth Problems in Her Marriage",
    categoryId: "love-couple",
    chapterIds: ["if-a-pregnant-woman-will-have-childbirth-problems"],
  },
  {
    id: "if-a-man-will-have-manhood-problems-in",
    label: "If a Man Will Have Manhood Problems in His Marriage or Life",
    categoryId: "love-couple",
    chapterIds: ["if-a-man-will-have-manhood-problems-in"],
  },
  {
    id: "if-a-lady-or-man-has-feelings-for",
    label: "If a Lady or Man Has Feelings for You or Not",
    categoryId: "love-couple",
    chapterIds: ["if-a-lady-or-man-has-feelings-for"],
  },
  {
    id: "if-a-woman-has-married-more-than-one",
    label: "If a Woman Has Married More Than One Man at the Same Time (Polyandry)",
    categoryId: "love-couple",
    chapterIds: ["if-a-woman-has-married-more-than-one"],
  },
  {
    id: "if-someone-is-an-adulterous-son-daughter-born",
    label: "If Someone Is an Adulterous Son/Daughter (Born Out of Wedlock)",
    categoryId: "love-couple",
    chapterIds: ["if-someone-is-an-adulterous-son-daughter-born"],
  },
  {
    id: "if-he-she-is-a-womanizer-or-a",
    label: "If He/She Is a Womanizer or a Harlot",
    categoryId: "love-couple",
    chapterIds: ["if-he-she-is-a-womanizer-or-a"],
  },
  {
    id: "if-your-ex-husband-wife-girlfriend-or-boyfriend",
    label: "If Your Ex-Husband, Wife, Girlfriend, or Boyfriend Will Return or Not",
    categoryId: "love-couple",
    chapterIds: ["if-your-ex-husband-wife-girlfriend-or-boyfriend"],
  },
  {
    id: "if-the-pregnancy-is-healthy-or-not",
    label: "If the Pregnancy Is Healthy or Not",
    categoryId: "family-loved-ones",
    chapterIds: ["if-the-pregnancy-is-healthy-or-not"],
  },
  {
    id: "the-number-of-months-of-a-pregnancy-how",
    label: "The Number of Months of a Pregnancy (How Old Is the Pregnancy)",
    categoryId: "family-loved-ones",
    chapterIds: ["the-number-of-months-of-a-pregnancy-how"],
  },
  {
    id: "the-number-of-babies-in-a-pregnancy",
    label: "The Number of Babies in a Pregnancy",
    categoryId: "family-loved-ones",
    chapterIds: ["the-number-of-babies-in-a-pregnancy"],
  },
  {
    id: "if-a-pregnancy-is-yours-or-not-d",
    label: "If a Pregnancy Is Yours or Not (D.N.A.)",
    categoryId: "family-loved-ones",
    chapterIds: ["if-a-pregnancy-is-yours-or-not-d"],
  },
  {
    id: "if-she-will-put-to-bed-peacefully-or",
    label: "If She Will Put to Bed Peacefully or Not",
    categoryId: "family-loved-ones",
    chapterIds: ["if-she-will-put-to-bed-peacefully-or"],
  },
  {
    id: "the-time-she-will-put-to-bed",
    label: "The Time She Will Put to Bed",
    categoryId: "family-loved-ones",
    chapterIds: ["the-time-she-will-put-to-bed"],
  },
  {
    id: "if-it-s-day-or-night-that-she",
    label: "If It's Day or Night That She Will Put to Bed",
    categoryId: "family-loved-ones",
    chapterIds: ["if-it-s-day-or-night-that-she"],
  },
  {
    id: "if-your-enemy-is-from-your-father-s",
    label: "If Your Enemy Is from Your Father's, Mother's, Wife's, Boyfriend's/Girlfriend's, or Your Friend's Family",
    categoryId: "love-couple",
    chapterIds: ["if-your-enemy-is-from-your-father-s"],
  },
  {
    id: "how-the-future-of-two-people-s-friendship",
    label: "How the Future of Two People's Friendship Will Be",
    categoryId: "family-loved-ones",
    chapterIds: ["how-the-future-of-two-people-s-friendship"],
  },
  {
    id: "secrets-between-two-friends-who-follow-each-other",
    label: "Additional Topic — Secrets Between Two Friends Who Follow Each Other in the Chart",
    categoryId: "family-loved-ones",
    chapterIds: ["secrets-between-two-friends-who-follow-each-other"],
  },
  {
    id: "if-it-s-business-or-handwork-that-will",
    label: "If It's Business or Handwork That Will Benefit You",
    categoryId: "work-success",
    chapterIds: ["if-it-s-business-or-handwork-that-will"],
  },
  {
    id: "when-your-suffering-and-pain-or-sadness-will",
    label: "When Your Suffering and Pain or Sadness Will End",
    categoryId: "health-hardships",
    chapterIds: ["when-your-suffering-and-pain-or-sadness-will"],
  },
  {
    id: "if-you-will-get-a-position-rank-or",
    label: "If You Will Get a Position/Rank or Not",
    categoryId: "work-success",
    chapterIds: ["if-you-will-get-a-position-rank-or"],
  },
  {
    id: "if-your-success-or-wealth-will-remain-forever",
    label: "If Your Success or Wealth Will Remain Forever or Not",
    categoryId: "money-possessions",
    chapterIds: ["if-your-success-or-wealth-will-remain-forever"],
  },
  {
    id: "if-someone-s-misery-will-be-taken-away",
    label: "If Someone's Misery Will Be Taken Away from Him/Her or Not",
    categoryId: "health-hardships",
    chapterIds: ["if-someone-s-misery-will-be-taken-away"],
  },
  {
    id: "if-something-is-present-past-or-future",
    label: "If Something Is Present, Past, or Future",
    categoryId: "fate-timing",
    chapterIds: ["if-something-is-present-past-or-future"],
  },
  {
    id: "the-ending-part-of-anything-you-want-to",
    label: "The Ending Part of Anything You Want to Do in Your Life",
    categoryId: "fate-timing",
    chapterIds: ["the-ending-part-of-anything-you-want-to"],
  },
  {
    id: "if-someone-has-long-life-or-not",
    label: "If Someone Has Long Life or Not",
    categoryId: "health-hardships",
    chapterIds: ["if-someone-has-long-life-or-not"],
  },
  {
    id: "the-lifespan-and-when-someone-will-die",
    label: "The Lifespan and When Someone Will Die",
    categoryId: "health-hardships",
    chapterIds: ["the-lifespan-and-when-someone-will-die"],
  },
  {
    id: "the-stars-that-talk-about-your-youthful-time",
    label: "The Stars That Talk About Your Youthful Time, Middle Age, and Old Age",
    categoryId: "fate-timing",
    chapterIds: ["the-stars-that-talk-about-your-youthful-time"],
  },
  {
    id: "if-a-sick-person-has-long-life-or",
    label: "If a Sick Person Has Long Life or Not",
    categoryId: "health-hardships",
    chapterIds: ["if-a-sick-person-has-long-life-or"],
  },
  {
    id: "if-a-sick-person-has-long-life-repeated",
    label: "Additional Method — If a Sick Person Has Long Life (repeated later in the notebook)",
    categoryId: "health-hardships",
    chapterIds: ["if-a-sick-person-has-long-life-repeated"],
  },
  {
    id: "where-one-will-die-place-of-death",
    label: "Where One Will Die (Place of Death)",
    categoryId: "health-hardships",
    chapterIds: ["where-one-will-die-place-of-death"],
  },
  {
    id: "the-causes-of-someone-s-death",
    label: "The Causes of Someone's Death",
    categoryId: "health-hardships",
    chapterIds: ["the-causes-of-someone-s-death"],
  },
  {
    id: "if-someone-or-something-good-will-come-to",
    label: "If Someone or Something Good Will Come to You Today or Not",
    categoryId: "fate-timing",
    chapterIds: ["if-someone-or-something-good-will-come-to"],
  },
  {
    id: "if-today-is-a-good-day-or-not",
    label: "If Today Is a Good Day or Not",
    categoryId: "fate-timing",
    chapterIds: ["if-today-is-a-good-day-or-not"],
  },
  {
    id: "as-a-stranger-if-the-food-you-want",
    label: "As a Stranger, If the Food You Want to Eat Is from the Market or Home-Prepared",
    categoryId: "fate-timing",
    chapterIds: ["as-a-stranger-if-the-food-you-want"],
  },
  {
    id: "if-this-money-the-work-or-the-lady",
    label: "If This Money, the Work, or the Lady/Husband Will Be Stable in Your Life",
    categoryId: "money-possessions",
    chapterIds: ["if-this-money-the-work-or-the-lady"],
  },
  {
    id: "if-the-querent-is-sick-or-not",
    label: "If the Querent Is Sick or Not",
    categoryId: "health-hardships",
    chapterIds: ["if-the-querent-is-sick-or-not"],
  },
  {
    id: "if-the-sickness-is-from-human-jinn-or",
    label: "If the Sickness Is from Human, Jinn, or God Almighty",
    categoryId: "health-hardships",
    chapterIds: ["if-the-sickness-is-from-human-jinn-or"],
  },
  {
    id: "if-a-sick-person-has-long-life-repeated-2",
    label: "Additional Method — If a Sick Person Has Long Life (repeated again in the notebook)",
    categoryId: "health-hardships",
    chapterIds: ["if-a-sick-person-has-long-life-repeated-2"],
  },
  {
    id: "which-part-of-the-body-is-paining-the",
    label: "Which Part of the Body Is Paining the Sick Person",
    categoryId: "health-hardships",
    chapterIds: ["which-part-of-the-body-is-paining-the"],
  },
  {
    id: "parts-of-the-human-body-and-the-stars",
    label: "Parts of the Human Body and the Stars Representing Them",
    categoryId: "health-hardships",
    chapterIds: ["parts-of-the-human-body-and-the-stars"],
  },
  {
    id: "if-you-will-see-what-you-are-searching",
    label: "If You Will See What You Are Searching For or Not (Nazir)",
    categoryId: "lost-stolen",
    chapterIds: ["if-you-will-see-what-you-are-searching"],
  },
  {
    id: "if-you-will-get-to-talk-to-someone",
    label: "If You Will Get to Talk to Someone, or If Conversation Will Take Place Between Two People",
    categoryId: "fate-timing",
    chapterIds: ["if-you-will-get-to-talk-to-someone"],
  },
  {
    id: "if-you-will-get-what-you-are-searching",
    label: "If You Will Get What You Are Searching For, in a Place (Itisal)",
    categoryId: "lost-stolen",
    chapterIds: ["if-you-will-get-what-you-are-searching"],
  },
  {
    id: "if-you-won-t-get-what-you-are",
    label: "If You Won't Get What You Are Searching For (Ifusal)",
    categoryId: "lost-stolen",
    chapterIds: ["if-you-won-t-get-what-you-are"],
  },
  {
    id: "if-you-have-enemies-and-how-many",
    label: "If You Have Enemies and How Many",
    categoryId: "legal-conflict",
    chapterIds: ["if-you-have-enemies-and-how-many"],
  },
  {
    id: "if-you-will-get-knowledge-or-not-in",
    label: "If You Will Get Knowledge or Not in Your Life",
    categoryId: "fate-timing",
    chapterIds: ["if-you-will-get-knowledge-or-not-in"],
  },
  {
    id: "if-you-will-get-what-you-want-or",
    label: "If You Will Get What You Want, or If Your Intentions Will Be Gotten (Very Close) [Note: the Table of Contents lists this chapter's title as \\",
    categoryId: "fate-timing",
    chapterIds: ["if-you-will-get-what-you-want-or"],
  },
  {
    id: "if-something-will-burn",
    label: "If Something Will Burn",
    categoryId: "fate-timing",
    chapterIds: ["if-something-will-burn"],
  },
  {
    id: "if-something-has-really-been-stolen-or-not",
    label: "If Something Has Really Been Stolen or Not",
    categoryId: "lost-stolen",
    chapterIds: ["if-something-has-really-been-stolen-or-not"],
  },
  {
    id: "if-they-will-return-a-stolen-thing-back",
    label: "If They Will Return a Stolen Thing Back",
    categoryId: "lost-stolen",
    chapterIds: ["if-they-will-return-a-stolen-thing-back"],
  },
  {
    id: "the-number-of-thieves",
    label: "The Number of Thieves",
    categoryId: "legal-conflict",
    chapterIds: ["the-number-of-thieves"],
  },
  {
    id: "the-description-of-the-thief",
    label: "The Description of the Thief",
    categoryId: "legal-conflict",
    chapterIds: ["the-description-of-the-thief"],
  },
  {
    id: "if-the-thief-or-the-stolen-thing-is",
    label: "If the Thief or the Stolen Thing Is in Town or Out of Town",
    categoryId: "legal-conflict",
    chapterIds: ["if-the-thief-or-the-stolen-thing-is"],
  },
  {
    id: "if-it-is-the-accused-person-that-stole",
    label: "If It Is the Accused Person That Stole the Thing or Not",
    categoryId: "legal-conflict",
    chapterIds: ["if-it-is-the-accused-person-that-stole"],
  },
  {
    id: "the-thief-from-among-the-accused-people",
    label: "The Thief from Among the Accused People",
    categoryId: "legal-conflict",
    chapterIds: ["the-thief-from-among-the-accused-people"],
  },
  {
    id: "if-something-was-buried-or-has-been-buried",
    label: "If Something Was Buried, or Has Been Buried, in a Particular Place",
    categoryId: "lost-stolen",
    chapterIds: ["if-something-was-buried-or-has-been-buried"],
  },
  {
    id: "if-there-s-a-hidden-treasure-gold-money",
    label: "If There's a Hidden Treasure (Gold/Money) in a Particular Place",
    categoryId: "lost-stolen",
    chapterIds: ["if-there-s-a-hidden-treasure-gold-money"],
  },
  {
    id: "how-deep-something-is-buried",
    label: "How Deep Something Is Buried",
    categoryId: "lost-stolen",
    chapterIds: ["how-deep-something-is-buried"],
  },
  {
    id: "where-a-traveller-has-travelled-to",
    label: "Where a Traveller Has Travelled To",
    categoryId: "travel-change",
    chapterIds: ["where-a-traveller-has-travelled-to"],
  },
  {
    id: "if-the-traveller-has-travelled-by-air-water",
    label: "If the Traveller Has Travelled by Air, Water, or Land",
    categoryId: "travel-change",
    chapterIds: ["if-the-traveller-has-travelled-by-air-water"],
  },
  {
    id: "if-the-traveller-has-reached-where-he-she",
    label: "If the Traveller Has Reached Where He/She Is Going or Not",
    categoryId: "travel-change",
    chapterIds: ["if-the-traveller-has-reached-where-he-she"],
  },
  {
    id: "if-someone-is-truthful-or-not",
    label: "If Someone Is Truthful or Not",
    categoryId: "legal-conflict",
    chapterIds: ["if-someone-is-truthful-or-not"],
  },
  {
    id: "if-a-prisoner-will-come-out-of-prison",
    label: "If a Prisoner Will Come Out of Prison and How Long It Will Take",
    categoryId: "legal-conflict",
    chapterIds: ["if-a-prisoner-will-come-out-of-prison"],
  },
  {
    id: "if-the-prisoner-will-be-removed-peacefully",
    label: "If the Prisoner Will Be Removed Peacefully",
    categoryId: "legal-conflict",
    chapterIds: ["if-the-prisoner-will-be-removed-peacefully"],
  },
  {
    id: "how-long-the-prisoner-will-stay-in-prison",
    label: "How Long the Prisoner Will Stay in Prison/Cells",
    categoryId: "legal-conflict",
    chapterIds: ["how-long-the-prisoner-will-stay-in-prison"],
  },
  {
    id: "if-the-prisoner-is-male-or-female",
    label: "If the Prisoner Is Male or Female",
    categoryId: "legal-conflict",
    chapterIds: ["if-the-prisoner-is-male-or-female"],
  },
  {
    id: "where-kidnappers-are-keeping-a-person-hostage",
    label: "Where Kidnappers Are Keeping a Person Hostage",
    categoryId: "legal-conflict",
    chapterIds: ["where-kidnappers-are-keeping-a-person-hostage"],
  },
  {
    id: "the-consequence-of-a-prisoner",
    label: "The Consequence of a Prisoner",
    categoryId: "legal-conflict",
    chapterIds: ["the-consequence-of-a-prisoner"],
  },
  {
    id: "if-you-will-get-your-debts-deposit-or",
    label: "If You Will Get Your Debts, Deposit, or Savings Back",
    categoryId: "money-possessions",
    chapterIds: ["if-you-will-get-your-debts-deposit-or"],
  },
  {
    id: "if-someone-will-get-a-particular-position-or",
    label: "If Someone Will Get a Particular Position or Chieftaincy Title",
    categoryId: "work-success",
    chapterIds: ["if-someone-will-get-a-particular-position-or"],
  },
  {
    id: "if-you-will-own-a-house-in-your",
    label: "If You Will Own a House in Your Life",
    categoryId: "work-success",
    chapterIds: ["if-you-will-own-a-house-in-your"],
  },
  {
    id: "if-this-apartment-you-are-going-to-is",
    label: "If This Apartment You Are Going to Is Safe/Good for You",
    categoryId: "work-success",
    chapterIds: ["if-this-apartment-you-are-going-to-is"],
  },
  {
    id: "if-you-will-receive-the-expected-message",
    label: "If You Will Receive the Expected Message",
    categoryId: "fate-timing",
    chapterIds: ["if-you-will-receive-the-expected-message"],
  },
  {
    id: "which-day-a-pregnant-woman-will-put-to",
    label: "Which Day a Pregnant Woman Will Put to Bed",
    categoryId: "family-loved-ones",
    chapterIds: ["which-day-a-pregnant-woman-will-put-to"],
  },
  {
    id: "if-you-will-get-back-to-work-after",
    label: "If You Will Get Back to Work After Getting a Problem in the Workplace",
    categoryId: "work-success",
    chapterIds: ["if-you-will-get-back-to-work-after"],
  },
  {
    id: "dreams-and-their-interpretations",
    label: "Dreams and Their Interpretations",
    categoryId: "dreams",
    chapterIds: ["dreams-and-their-interpretations"],
  },
];

export function getIntentionById(id: string): Intention | undefined {
  return INTENTIONS.find((i) => i.id === id);
}

export function getCategoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function intentionsInCategory(categoryId: CategoryId): Intention[] {
  return INTENTIONS.filter((i) => i.categoryId === categoryId);
}