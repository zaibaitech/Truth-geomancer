// Central question registry (section 4). Keyed by the SAME id already used
// in content/intentions.ts, so the existing casting-flow question picker can
// drive this engine with no new UI concept — an intention the user already
// selects before casting either has an entry here (automatic engine
// reading) or it doesn't yet (falls back to lib/raml/methodVerdicts.ts's
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
};
