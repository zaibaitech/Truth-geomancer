// Central question registry (section 4). Keyed by the SAME id already used
// in content/intentions.ts, so the existing casting-flow question picker can
// drive this engine with no new UI concept — an intention the user already
// selects before casting either has an entry here (automatic engine
// reading) or it doesn't yet (falls back to lib/raml/methodVerdicts.ts's
// general parser, unaffected by any of this).
//
// This is the first-phase pilot only (section 12) — five questions, not all
// 153 chapters. Adding a sixth means writing one more file like the ones in
// this directory and adding it below; nothing about the engine itself needs
// to change.

import type { QuestionDefinition } from '../types';
import { moneyQuestion } from './money';
import { businessQuestion } from './business';
import { courtCaseQuestion } from './courtCase';
import { stolenThingsQuestion } from './stolenThings';
import { travelReturnQuestion } from './travelReturn';

export const QUESTION_REGISTRY: Record<string, QuestionDefinition> = {
  [moneyQuestion.id]: moneyQuestion,
  [businessQuestion.id]: businessQuestion,
  [courtCaseQuestion.id]: courtCaseQuestion,
  [stolenThingsQuestion.id]: stolenThingsQuestion,
  [travelReturnQuestion.id]: travelReturnQuestion,
};

export function getQuestionDefinition(id: string): QuestionDefinition | undefined {
  return QUESTION_REGISTRY[id];
}

export { moneyQuestion, businessQuestion, courtCaseQuestion, stolenThingsQuestion, travelReturnQuestion };
