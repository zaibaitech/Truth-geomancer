// Central question registry (section 4). Keyed by the SAME id already used
// in content/intentions.ts, so the existing casting-flow question picker can
// drive this engine with no new UI concept — an intention the user already
// selects before casting either has an entry here (automatic engine
// reading) or it doesn't yet (falls back to lib/server/raml/methodVerdicts.ts's
// general parser, unaffected by any of this).
//
// Stage 1 (5 questions): money, business, court case, stolen things, travel
// return — chapters 1, 2, 3, 18, 19.
// Stage 2 (14 more questions, chapters 4-17 in numerical order): hunting/
// searching, fight-war-court (H6/H1+H8 variant), enemy/thief location,
// marriage, staying in a place, sickness survival, lost-thing-still-around,
// success at home vs. travel, rich or not, children from a lady, pregnancy
// stability, things getting better, overcoming an enemy, and timing — see
// lib/raml/engine/COVERAGE.md for exactly which methods in each are
// verified vs. needs_review/uncertain, and which chapters (20-153) remain
// for a future stage.
//
// Adding a chapter means writing one more file like the ones in this
// directory and adding it below; nothing about the engine itself needs to
// change.

import type { QuestionDefinition } from '../types';
import { moneyQuestion } from './money';
import { businessQuestion } from './business';
import { courtCaseQuestion } from './courtCase';
import { stolenThingsQuestion } from './stolenThings';
import { travelReturnQuestion } from './travelReturn';
import { huntingSearchingQuestion } from './huntingSearching';
import { fightWarLocationQuestion } from './fightWarLocation';
import { enemyThiefLocationQuestion } from './enemyThiefLocation';
import { marriageBlessingsQuestion } from './marriageBlessings';
import { stayInPlaceQuestion } from './stayInPlace';
import { sicknessSurvivalQuestion } from './sicknessSurvival';
import { lostThingAroundQuestion } from './lostThingAround';
import { successAtHomeQuestion } from './successAtHome';
import { richOrNotQuestion } from './richOrNot';
import { childrenFromLadyQuestion } from './childrenFromLady';
import { pregnancyStableQuestion } from './pregnancyStable';
import { thingsWillBeBetterQuestion } from './thingsWillBeBetter';
import { overcomeEnemyQuestion } from './overcomeEnemy';
import { timingOfEventQuestion } from './timingOfEvent';
import { electionOrChieftaincyQuestion } from './electionOrChieftaincy';
import { wifeSisterHadSexQuestion } from './wifeSisterHadSex';
import { goodToStayInHouseQuestion } from './goodToStayInHouse';
import { goodToStayInTownQuestion } from './goodToStayInTown';
import { terrainTypeQuestion } from './terrainType';
import { safeInCanoeQuestion } from './safeInCanoe';
import { armedRobbersQuestion } from './armedRobbers';
import { fightArgumentQuestion } from './fightArgument';
import { farmingAndFoodQuestion } from './farmingAndFood';
import { moneyOrGoodStrangersQuestion } from './moneyOrGoodStrangers';
import { successWhereGoingQuestion } from './successWhereGoing';
import { successfulTripQuestion } from './successfulTrip';
import { lostThingThiefLocationQuestion } from './lostThingThiefLocation';
import { willItRainQuestion } from './willItRain';
import { enemiesWorkingAgainstYouQuestion } from './enemiesWorkingAgainstYou';
import { familyDoingWellQuestion } from './familyDoingWell';
import { locateSomeoneOrSomethingQuestion } from './locateSomeoneOrSomething';
import { predictGameWinnerQuestion } from './predictGameWinner';
import { loversCompatibleQuestion } from './loversCompatible';
import { visitorGoodOrBadQuestion } from './visitorGoodOrBad';
import { spiritualWorkWillItWorkQuestion } from './spiritualWorkWillItWork';
import { thePersonThatTookAnItemQuestion } from './thePersonThatTookAnItem';
import { getWhatYouWantWhereGoingQuestion } from './getWhatYouWantWhereGoing';
import { futureSpouseCharacterQuestion } from './futureSpouseCharacter';
import { loveProposalAcceptedQuestion } from './loveProposalAccepted';
import { getLostThingBackQuestion } from './getLostThingBack';
import { ladyPregnantQuestion } from './ladyPregnant';
import { childGenderQuestion } from './childGender';
import { closerOrFarAwayQuestion } from './closerOrFarAway';
import { getGoldWhereWorkingQuestion } from './getGoldWhereWorking';
import { yearlyNewsQuestion } from './yearlyNews';
import { friendshipGoodQuestion } from './friendshipGood';
import { askingAboutSelfOrOtherQuestion } from './askingAboutSelfOrOther';
import { whereSuccessIsQuestion } from './whereSuccessIs';
import { thiefWhereaboutsQuestion } from './thiefWhereabouts';
import { travelDaytimeOrNightQuestion } from './travelDaytimeOrNight';
import { couplesHadSexQuestion } from './couplesHadSex';
import { doesLoveYouQuestion } from './doesLoveYou';
import { marriageGoodOrNotQuestion } from './marriageGoodOrNot';
import { prayersAnsweredQuestion } from './prayersAnswered';
import { relatedByFamilyQuestion } from './relatedByFamily';
import { marriageLastForeverQuestion } from './marriageLastForever';
import { partnerDiseaseQuestion } from './partnerDisease';
import { marriedBeforeQuestion } from './marriedBefore';
import { stillInMarriageQuestion } from './stillInMarriage';
import { enjoyingMarriageQuestion } from './enjoyingMarriage';
import { partnerCheatingQuestion } from './partnerCheating';
import { exWillRemarryQuestion } from './exWillRemarry';
import { childbirthProblemsQuestion } from './childbirthProblems';
import { manhoodProblemsQuestion } from './manhoodProblems';
import { feelingsForYouQuestion } from './feelingsForYou';
import { polyandryQuestion } from './polyandry';
import { bornOutOfWedlockQuestion } from './bornOutOfWedlock';
import { womanizerQuestion } from './womanizer';
import { exWillReturnQuestion } from './exWillReturn';
import { pregnancyHealthyQuestion } from './pregnancyHealthy';
import { pregnancyMonthsQuestion } from './pregnancyMonths';
import { numberOfBabiesQuestion } from './numberOfBabies';
import { pregnancyPaternityQuestion } from './pregnancyPaternity';
import { putToBedPeacefullyQuestion } from './putToBedPeacefully';
import { timeToPutToBedQuestion } from './timeToPutToBed';
import { dayOrNightBirthQuestion } from './dayOrNightBirth';
import { enemyFamilyOriginQuestion } from './enemyFamilyOrigin';
import { friendshipFutureQuestion } from './friendshipFuture';
import { friendshipSecretsQuestion } from './friendshipSecrets';
import { businessOrHandworkQuestion } from './businessOrHandwork';
import { sufferingWillEndQuestion } from './sufferingWillEnd';
import { positionOrRankQuestion } from './positionOrRank';
import { wealthPermanenceQuestion } from './wealthPermanence';
import { miseryTakenAwayQuestion } from './miseryTakenAway';
import { presentPastFutureQuestion } from './presentPastFuture';
import { endingOfAnythingQuestion } from './endingOfAnything';
import { longLifeQuestion } from './longLife';
import { lifespanWhenDeathQuestion } from './lifespanWhenDeath';
import { sickPersonLongLifeQuestion } from './sickPersonLongLife';
import { placeOfDeathQuestion } from './placeOfDeath';
import { causesOfDeathQuestion } from './causesOfDeath';
import { somethingGoodTodayQuestion } from './somethingGoodToday';
import { todayGoodDayQuestion } from './todayGoodDay';
import { foodMarketOrHomeQuestion } from './foodMarketOrHome';
import { moneyWorkLadyStableQuestion } from './moneyWorkLadyStable';
import { querentSickQuestion } from './querentSick';
import { sicknessFromHumanJinnOrGodQuestion } from './sicknessFromHumanJinnOrGod';
import { bodyPartInPainQuestion } from './bodyPartInPain';
import { seeWhatSearchingForQuestion } from './seeWhatSearchingFor';
import { conversationWillHappenQuestion } from './conversationWillHappen';
import { getWhatSearchingForInPlaceQuestion } from './getWhatSearchingForInPlace';
import { whatBlocksYouQuestion } from './whatBlocksYou';
import { enemiesHowManyQuestion } from './enemiesHowMany';
import { getKnowledgeInLifeQuestion } from './getKnowledgeInLife';
import { getWhatYouWantVeryCloseQuestion } from './getWhatYouWantVeryClose';
import { somethingWillBurnQuestion } from './somethingWillBurn';
import { somethingReallyStolenQuestion } from './somethingReallyStolen';
import { stolenThingReturnedQuestion } from './stolenThingReturned';
import { numberOfThievesQuestion } from './numberOfThieves';
import { thiefDescriptionQuestion } from './thiefDescription';
import { thiefInTownOrOutQuestion } from './thiefInTownOrOut';
import { accusedPersonGuiltyQuestion } from './accusedPersonGuilty';
import { thiefAmongAccusedQuestion } from './thiefAmongAccused';
import { somethingBuriedQuestion } from './somethingBuried';
import { hiddenTreasureQuestion } from './hiddenTreasure';
import { howDeepBuriedQuestion } from './howDeepBuried';
import { travellerDestinationQuestion } from './travellerDestination';
import { travellerModeQuestion } from './travellerMode';
import { travellerReachedDestinationQuestion } from './travellerReachedDestination';
import { truthfulOrNotQuestion } from './truthfulOrNot';
import { prisonerComeOutQuestion } from './prisonerComeOut';
import { prisonerRemovedPeacefullyQuestion } from './prisonerRemovedPeacefully';
import { howLongPrisonerStayQuestion } from './howLongPrisonerStay';
import { prisonerMaleOrFemaleQuestion } from './prisonerMaleOrFemale';
import { kidnapperLocationQuestion } from './kidnapperLocation';
import { prisonerConsequenceQuestion } from './prisonerConsequence';
import { debtsDepositBackQuestion } from './debtsDepositBack';
import { getPositionOrChieftaincyQuestion } from './getPositionOrChieftaincy';
import { ownHouseInLifeQuestion } from './ownHouseInLife';
import { apartmentSafeForYouQuestion } from './apartmentSafeForYou';
import { receiveExpectedMessageQuestion } from './receiveExpectedMessage';
import { pregnantWomanPutToBedDayQuestion } from './pregnantWomanPutToBedDay';
import { backToWorkAfterProblemQuestion } from './backToWorkAfterProblem';
import { stayInMarriageQuestion } from './stayInMarriage';
import { friendshipConsequenceQuestion } from './friendshipConsequence';
import { dreamsAndInterpretationsQuestion } from './dreamsAndInterpretations';

const ALL_QUESTIONS: QuestionDefinition[] = [
  moneyQuestion,
  businessQuestion,
  courtCaseQuestion,
  stolenThingsQuestion,
  travelReturnQuestion,
  huntingSearchingQuestion,
  fightWarLocationQuestion,
  enemyThiefLocationQuestion,
  marriageBlessingsQuestion,
  stayInPlaceQuestion,
  sicknessSurvivalQuestion,
  lostThingAroundQuestion,
  successAtHomeQuestion,
  richOrNotQuestion,
  childrenFromLadyQuestion,
  pregnancyStableQuestion,
  thingsWillBeBetterQuestion,
  overcomeEnemyQuestion,
  timingOfEventQuestion,
  // Chapters 20-40 (Prompt 4) — see lib/raml/engine/COVERAGE.md for the
  // per-chapter table, including chapter 33 (not registered — depends on a
  // separate, non-chart-based divination mechanic this app doesn't support)
  // and the two ch.28 continuation fragments (not registered — no
  // computable shape at all, every branch's figure token was dropped).
  electionOrChieftaincyQuestion,
  wifeSisterHadSexQuestion,
  goodToStayInHouseQuestion,
  goodToStayInTownQuestion,
  terrainTypeQuestion,
  safeInCanoeQuestion,
  armedRobbersQuestion,
  fightArgumentQuestion,
  farmingAndFoodQuestion,
  moneyOrGoodStrangersQuestion,
  successWhereGoingQuestion,
  successfulTripQuestion,
  lostThingThiefLocationQuestion,
  willItRainQuestion,
  enemiesWorkingAgainstYouQuestion,
  familyDoingWellQuestion,
  locateSomeoneOrSomethingQuestion,
  predictGameWinnerQuestion,
  loversCompatibleQuestion,
  visitorGoodOrBadQuestion,
  spiritualWorkWillItWorkQuestion,
  // Chapters 41-60 (Prompt 5) — see lib/raml/engine/COVERAGE.md for the
  // per-chapter table. Not registered: chapter 46 (a talismanic/ritual
  // practice with an omitted diagram, not a chart-verdict method), chapter
  // 59 (every method is either open-ended/non-deterministic or not
  // chart-derived at all), the unnumbered "Consequence of Friendship"
  // fragment after ch.52 (fully computable but carries no chapter number,
  // out of this stage's numbered scope), and chapter 56's own intention id
  // (its one verified method is registered as childGender.ts's Method 3,
  // under chapter 48's id — see that file's header for why).
  thePersonThatTookAnItemQuestion,
  getWhatYouWantWhereGoingQuestion,
  futureSpouseCharacterQuestion,
  loveProposalAcceptedQuestion,
  getLostThingBackQuestion,
  ladyPregnantQuestion,
  childGenderQuestion,
  closerOrFarAwayQuestion,
  getGoldWhereWorkingQuestion,
  yearlyNewsQuestion,
  friendshipGoodQuestion,
  askingAboutSelfOrOtherQuestion,
  whereSuccessIsQuestion,
  thiefWhereaboutsQuestion,
  travelDaytimeOrNightQuestion,
  couplesHadSexQuestion,
  doesLoveYouQuestion,
  // Chapters 61-80 (Prompt 7) — see lib/raml/engine/COVERAGE.md for the
  // per-chapter table. Not registered: the unnumbered "Someone's Behavior"
  // fragment after ch.64 (an exact duplicate of futureSpouseCharacter.ts's
  // own Method 1, chapter 43 — its own title cross-references chapter 43
  // directly).
  marriageGoodOrNotQuestion,
  prayersAnsweredQuestion,
  relatedByFamilyQuestion,
  marriageLastForeverQuestion,
  partnerDiseaseQuestion,
  marriedBeforeQuestion,
  stillInMarriageQuestion,
  enjoyingMarriageQuestion,
  partnerCheatingQuestion,
  exWillRemarryQuestion,
  childbirthProblemsQuestion,
  manhoodProblemsQuestion,
  feelingsForYouQuestion,
  polyandryQuestion,
  bornOutOfWedlockQuestion,
  womanizerQuestion,
  exWillReturnQuestion,
  pregnancyHealthyQuestion,
  pregnancyMonthsQuestion,
  numberOfBabiesQuestion,
  pregnancyPaternityQuestion,
  // Chapters 81-100 (Prompt 9) — see lib/raml/engine/COVERAGE.md for the
  // per-chapter table. Not registered: chapter 95 ("The Stars That Talk
  // About Your Youthful Time...") — a reference table, not a chart-verdict
  // question, and entirely omitted from the transcription besides. The
  // "if-a-sick-person-has-long-life-repeated" fragment after ch.96 is a
  // confirmed duplicate of chapter 96's own question (its title says so
  // directly) and is registered as sickPersonLongLife.ts's Method 2, not
  // under its own separate intentions.ts id.
  putToBedPeacefullyQuestion,
  timeToPutToBedQuestion,
  dayOrNightBirthQuestion,
  enemyFamilyOriginQuestion,
  friendshipFutureQuestion,
  friendshipSecretsQuestion,
  businessOrHandworkQuestion,
  sufferingWillEndQuestion,
  positionOrRankQuestion,
  wealthPermanenceQuestion,
  miseryTakenAwayQuestion,
  presentPastFutureQuestion,
  endingOfAnythingQuestion,
  longLifeQuestion,
  lifespanWhenDeathQuestion,
  sickPersonLongLifeQuestion,
  placeOfDeathQuestion,
  causesOfDeathQuestion,
  somethingGoodTodayQuestion,
  todayGoodDayQuestion,
  // Chapters 101-120 (Prompt 10) — see lib/raml/engine/COVERAGE.md for the
  // per-chapter table. Chapters 109-117 do not exist in the source's own
  // hand-numbering (confirmed intentional by the manuscript's own front
  // matter, not a transcription gap). Not registered: chapter 106
  // ("Parts of the Human Body and the Stars Representing Them") — a plain
  // reference table, not a chart-verdict question, embedded inline in
  // bodyPartInPain.ts instead; the "repeated again" sick-person-long-life
  // fragment after ch.104 — a confirmed word-for-word duplicate of ch.96
  // Method 1 (its own title says so).
  foodMarketOrHomeQuestion,
  moneyWorkLadyStableQuestion,
  querentSickQuestion,
  sicknessFromHumanJinnOrGodQuestion,
  bodyPartInPainQuestion,
  seeWhatSearchingForQuestion,
  conversationWillHappenQuestion,
  getWhatSearchingForInPlaceQuestion,
  whatBlocksYouQuestion,
  enemiesHowManyQuestion,
  // Chapters 121-140 (Prompt 11) — see lib/raml/engine/COVERAGE.md for the
  // per-chapter table. Chapter 127 ("The Description of the Thief") was
  // specifically re-checked for a male/female-star definition per the
  // Prompt 8/9 audit flag — it only USES the terminology, never defines it,
  // so `gender_classification_unsourced` is retained and chapters 41/48/68
  // are unchanged. Chapters 139 and 140 share one calculation (h1+h3) split
  // by direction (upward vs. downward) into two separate questions, matching
  // the source's own two chapter titles.
  getKnowledgeInLifeQuestion,
  getWhatYouWantVeryCloseQuestion,
  somethingWillBurnQuestion,
  somethingReallyStolenQuestion,
  stolenThingReturnedQuestion,
  numberOfThievesQuestion,
  thiefDescriptionQuestion,
  thiefInTownOrOutQuestion,
  accusedPersonGuiltyQuestion,
  thiefAmongAccusedQuestion,
  somethingBuriedQuestion,
  hiddenTreasureQuestion,
  howDeepBuriedQuestion,
  travellerDestinationQuestion,
  travellerModeQuestion,
  travellerReachedDestinationQuestion,
  truthfulOrNotQuestion,
  prisonerComeOutQuestion,
  prisonerRemovedPeacefullyQuestion,
  howLongPrisonerStayQuestion,
  // Chapters 141-151 (Prompt 12) — see lib/raml/engine/COVERAGE.md for the
  // per-chapter table. Chapter 141 was specifically re-checked for a
  // male/female-star definition per the Prompt 8 audit flag — it uses the
  // terminology without ever defining it (confirmed further by the
  // manuscript's own front matter, which explicitly admits no gender table
  // survives anywhere in the transcription), so
  // `gender_classification_unsourced` is retained. The manuscript's own
  // highest chapter number is 151 — chapters 152+ do not exist in this
  // transcription (content/books.ts's chapterCount: 153 counts 142 numbered
  // entries + 11 unnumbered fragments, not a numbering ceiling). Chapter
  // 151 ("Dreams and Their Interpretations") is not registered: its own
  // calculation ("pair" the 4 Mothers) is never disambiguated, and all 16
  // of its branch trigger figures are omitted besides.
  prisonerMaleOrFemaleQuestion,
  kidnapperLocationQuestion,
  prisonerConsequenceQuestion,
  debtsDepositBackQuestion,
  getPositionOrChieftaincyQuestion,
  ownHouseInLifeQuestion,
  apartmentSafeForYouQuestion,
  receiveExpectedMessageQuestion,
  pregnantWomanPutToBedDayQuestion,
  backToWorkAfterProblemQuestion,
  // Prompt 13 (final coverage audit) — two UNNUMBERED fragments that are
  // fully computable and already have their own selectable entries in
  // content/intentions.ts, but were never registered: every earlier stage
  // scoped itself to a numbered chapter range, and these carry no chapter
  // number, so they fell between stages rather than being excluded on their
  // merits. No new source material; both implement their fragment's own
  // text exactly. See COVERAGE.md's "Prompt 13" section.
  stayInMarriageQuestion,
  friendshipConsequenceQuestion,
  dreamsAndInterpretationsQuestion,
];

export const QUESTION_REGISTRY: Record<string, QuestionDefinition> = Object.fromEntries(
  ALL_QUESTIONS.map((q) => [q.id, q]),
);

export function getQuestionDefinition(id: string): QuestionDefinition | undefined {
  return QUESTION_REGISTRY[id];
}

export {
  moneyQuestion,
  businessQuestion,
  courtCaseQuestion,
  stolenThingsQuestion,
  travelReturnQuestion,
  huntingSearchingQuestion,
  fightWarLocationQuestion,
  enemyThiefLocationQuestion,
  marriageBlessingsQuestion,
  stayInPlaceQuestion,
  sicknessSurvivalQuestion,
  lostThingAroundQuestion,
  successAtHomeQuestion,
  richOrNotQuestion,
  childrenFromLadyQuestion,
  pregnancyStableQuestion,
  thingsWillBeBetterQuestion,
  overcomeEnemyQuestion,
  timingOfEventQuestion,
  electionOrChieftaincyQuestion,
  wifeSisterHadSexQuestion,
  goodToStayInHouseQuestion,
  goodToStayInTownQuestion,
  terrainTypeQuestion,
  safeInCanoeQuestion,
  armedRobbersQuestion,
  fightArgumentQuestion,
  farmingAndFoodQuestion,
  moneyOrGoodStrangersQuestion,
  successWhereGoingQuestion,
  successfulTripQuestion,
  lostThingThiefLocationQuestion,
  willItRainQuestion,
  enemiesWorkingAgainstYouQuestion,
  familyDoingWellQuestion,
  locateSomeoneOrSomethingQuestion,
  predictGameWinnerQuestion,
  loversCompatibleQuestion,
  visitorGoodOrBadQuestion,
  spiritualWorkWillItWorkQuestion,
  thePersonThatTookAnItemQuestion,
  getWhatYouWantWhereGoingQuestion,
  futureSpouseCharacterQuestion,
  loveProposalAcceptedQuestion,
  getLostThingBackQuestion,
  ladyPregnantQuestion,
  childGenderQuestion,
  closerOrFarAwayQuestion,
  getGoldWhereWorkingQuestion,
  yearlyNewsQuestion,
  friendshipGoodQuestion,
  askingAboutSelfOrOtherQuestion,
  whereSuccessIsQuestion,
  thiefWhereaboutsQuestion,
  travelDaytimeOrNightQuestion,
  couplesHadSexQuestion,
  doesLoveYouQuestion,
  marriageGoodOrNotQuestion,
  prayersAnsweredQuestion,
  relatedByFamilyQuestion,
  marriageLastForeverQuestion,
  partnerDiseaseQuestion,
  marriedBeforeQuestion,
  stillInMarriageQuestion,
  enjoyingMarriageQuestion,
  partnerCheatingQuestion,
  exWillRemarryQuestion,
  childbirthProblemsQuestion,
  manhoodProblemsQuestion,
  feelingsForYouQuestion,
  polyandryQuestion,
  bornOutOfWedlockQuestion,
  womanizerQuestion,
  exWillReturnQuestion,
  pregnancyHealthyQuestion,
  pregnancyMonthsQuestion,
  numberOfBabiesQuestion,
  pregnancyPaternityQuestion,
  putToBedPeacefullyQuestion,
  timeToPutToBedQuestion,
  dayOrNightBirthQuestion,
  enemyFamilyOriginQuestion,
  friendshipFutureQuestion,
  friendshipSecretsQuestion,
  businessOrHandworkQuestion,
  sufferingWillEndQuestion,
  positionOrRankQuestion,
  wealthPermanenceQuestion,
  miseryTakenAwayQuestion,
  presentPastFutureQuestion,
  endingOfAnythingQuestion,
  longLifeQuestion,
  lifespanWhenDeathQuestion,
  sickPersonLongLifeQuestion,
  placeOfDeathQuestion,
  causesOfDeathQuestion,
  somethingGoodTodayQuestion,
  todayGoodDayQuestion,
  foodMarketOrHomeQuestion,
  moneyWorkLadyStableQuestion,
  querentSickQuestion,
  sicknessFromHumanJinnOrGodQuestion,
  bodyPartInPainQuestion,
  seeWhatSearchingForQuestion,
  conversationWillHappenQuestion,
  getWhatSearchingForInPlaceQuestion,
  whatBlocksYouQuestion,
  enemiesHowManyQuestion,
  getKnowledgeInLifeQuestion,
  getWhatYouWantVeryCloseQuestion,
  somethingWillBurnQuestion,
  somethingReallyStolenQuestion,
  stolenThingReturnedQuestion,
  numberOfThievesQuestion,
  thiefDescriptionQuestion,
  thiefInTownOrOutQuestion,
  accusedPersonGuiltyQuestion,
  thiefAmongAccusedQuestion,
  somethingBuriedQuestion,
  hiddenTreasureQuestion,
  howDeepBuriedQuestion,
  travellerDestinationQuestion,
  travellerModeQuestion,
  travellerReachedDestinationQuestion,
  truthfulOrNotQuestion,
  prisonerComeOutQuestion,
  prisonerRemovedPeacefullyQuestion,
  howLongPrisonerStayQuestion,
  prisonerMaleOrFemaleQuestion,
  kidnapperLocationQuestion,
  prisonerConsequenceQuestion,
  debtsDepositBackQuestion,
  getPositionOrChieftaincyQuestion,
  ownHouseInLifeQuestion,
  apartmentSafeForYouQuestion,
  receiveExpectedMessageQuestion,
  pregnantWomanPutToBedDayQuestion,
  backToWorkAfterProblemQuestion,
  stayInMarriageQuestion,
  friendshipConsequenceQuestion,
  dreamsAndInterpretationsQuestion,
};
