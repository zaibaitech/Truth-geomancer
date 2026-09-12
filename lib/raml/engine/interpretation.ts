// LAYER 2 — interpretation (section 8, 14). Turns an already-computed,
// deterministic result into natural-language text. Nothing in this file
// makes a geomantic decision — every outcome/label it phrases was decided
// by a method's own calculate()/evaluate() in engine/questions/*. No model
// call, no free-text generation of the underlying verdict: this is
// templating, not interpretation-by-AI.

import type { MethodConsensus, MethodOutcome, MethodResult } from './types';

const OUTCOME_LABEL: Record<MethodOutcome, string> = {
  favourable: 'Favourable',
  unfavourable: 'Unfavourable',
  mixed: 'Mixed',
  uncertain: 'Uncertain',
  descriptive: 'Descriptive',
};

export function buildSummary(overallResult: MethodOutcome | 'insufficient_data', consensus: MethodConsensus): string {
  if (overallResult === 'insufficient_data') {
    return "This chart's own figures don't give this question's verified methods enough to go on — see the calculation details below for why.";
  }
  if (overallResult === 'descriptive') {
    return consensus.level === 'agree' && consensus.descriptiveAnswer
      ? `The verified methods indicate: ${consensus.descriptiveAnswer}.`
      : 'The verified methods give different answers for this question — see the individual methods below.';
  }
  const label = OUTCOME_LABEL[overallResult];
  switch (consensus.level) {
    case 'agree':
      return `${label} — every computable method for this question agrees.`;
    case 'mostly_agree':
      return `${label} — most of this question's computable methods agree.`;
    case 'mixed':
      return `${label} on balance, though this question's methods don't all point the same way.`;
    case 'conflict':
      return `The chart's methods for this question conflict — read the individual methods below before treating this as a clear answer.`;
    default:
      return label;
  }
}

export function buildInterpretation(questionTitle: string, methods: MethodResult[], consensus: MethodConsensus): string {
  const verified = methods.filter((m) => m.verdict);
  const flagged = methods.filter((m) => !m.verdict);

  const sentences: string[] = [];

  if (verified.length === 0) {
    sentences.push(
      `None of the methods this app can currently compute for "${questionTitle}" produced a confident result from this chart.`,
    );
  } else {
    verified.forEach((m) => {
      sentences.push(`${m.method.label}: ${m.verdict!.interpretation}`);
    });
    sentences.push(consensus.summary);
  }

  if (flagged.length > 0) {
    const note =
      flagged.length === 1
        ? `${flagged[0].method.label} is not included in this reading (${flagged[0].method.reviewNote ?? 'not yet verified'}).`
        : `${flagged.length} of this question's methods are not included in this reading, pending verification against the source manuscript.`;
    sentences.push(note);
  }

  return sentences.join(' ');
}
