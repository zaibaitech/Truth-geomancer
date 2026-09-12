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
};
