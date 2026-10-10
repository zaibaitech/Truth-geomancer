// Free-cast Phase B: the practice gate is strict. Over the REAL engine for every
// registered question, practice is offered only when one verified counted addition
// method's houses, order and recorded result all agree with the chart and with
// addPatterns, and it is hidden in every other case.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { addPatterns, buildChart, type Chart } from '@/lib/raml/casting';
import type { Pattern } from '@/content/stars';
import { getReadingResult } from '@/lib/server/raml/readingService';
import { QUESTION_REGISTRY } from '@/lib/raml/engine/questions';
import { ownHouseInLifeQuestion } from '@/lib/raml/engine/questions/ownHouseInLife';
import type { ReadingResult } from '@/lib/raml/engine/reading';
import { EngineReadingView } from '@/components/raml/EngineReadingView';
import { PracticeActivity } from '@/components/raml/reading/PracticeActivity';
import { ReasoningSteps } from '@/components/raml/reading/ReasoningSteps';
import { LEARN_COPY, LEARN_LINKS } from '@/content/public/freeCastLearning';
import { buildReasoningSteps } from './readingExplanation';
import { buildPractice, checkAttempt, type PracticePlan } from './readingPractice';

const P: Pattern[] = [
  [1, 1, 1, 1], [2, 2, 2, 2], [1, 2, 1, 2], [2, 1, 2, 1], [1, 1, 2, 2], [2, 2, 1, 1], [1, 2, 2, 1], [2, 1, 1, 2],
  [1, 1, 1, 2], [2, 2, 2, 1], [1, 2, 1, 1], [2, 1, 2, 2], [1, 1, 2, 1], [1, 2, 2, 2], [2, 1, 1, 1], [2, 2, 1, 2],
];
const MOTHERS: Pattern[][] = Array.from({ length: 16 }, (_, i) => [P[i], P[(i + 3) % 16], P[(i + 7) % 16], P[(i + 11) % 16]]);
const CHARTS: Chart[] = MOTHERS.map((m) => buildChart(m as [Pattern, Pattern, Pattern, Pattern]));
const SAMPLE = ownHouseInLifeQuestion.id;

let seed = 20261010;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const SAMPLE_CHARTS: Chart[] = Array.from({ length: 400 }, () =>
  buildChart([0, 1, 2, 3].map(() => P[Math.floor(rnd() * 16)]) as [Pattern, Pattern, Pattern, Pattern]),
);

interface Run { qid: string; chart: Chart; result: ReadingResult }
const ALL: Run[] = [];
for (const qid of Object.keys(QUESTION_REGISTRY)) {
  for (const chart of CHARTS) {
    const result = getReadingResult(chart, qid);
    if (result) ALL.push({ qid, chart, result });
  }
}
const SAMPLES: Run[] = SAMPLE_CHARTS.map((chart) => ({ qid: SAMPLE, chart, result: getReadingResult(chart, SAMPLE)! }));

const planFor = (r: Run, isFreeSample = true) => buildPractice(r.result, buildReasoningSteps(r.result, r.chart), r.chart, { isFreeSample });
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const dec = (s: string) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

describe('the free sample question is eligible', () => {
  it('offers practice for every sampled chart, with the engine\'s own recorded result as the answer key', () => {
    for (const r of SAMPLES) {
      const plan = planFor(r);
      expect(plan, JSON.stringify(r.result.methodResults[0].calculationSteps)).not.toBeNull();
      expect(plan!.answerKey).toEqual(r.result.methodResults[0].resultPattern);
      expect(plan!.workingLine).toBe(r.result.methodResults[0].calculationSteps[0]);
    }
  });
});

describe('eligibility holds exactly when every condition does, across all registered questions', () => {
  it('is null when the reading is not the free sample', () => {
    for (const r of ALL) expect(planFor(r, false)).toBeNull();
  });
  it('whenever offered: one counted verified method, one working line, in-order houses, fold equals the engine\'s result', () => {
    let offered = 0;
    for (const r of ALL) {
      const plan = planFor(r);
      if (!plan) continue;
      offered++;
      const counted = r.result.methodResults.filter((m) => m.counted);
      expect(counted).toHaveLength(1);
      expect(counted[0].status).toBe('verified');
      expect(counted[0].casting.inspects).not.toBe('recast');
      expect(counted[0].calculationSteps).toHaveLength(1);
      expect(plan.answerKey).toEqual(counted[0].resultPattern);
      const order = Array.from(counted[0].calculationSteps[0].matchAll(/H(\d+) \(/g)).map((m) => Number(m[1]));
      expect(plan.houses.map((h) => h.number)).toEqual(order);
      expect(plan.houses.map((h) => h.number)).toEqual(counted[0].housesUsed);
      plan.houses.forEach((h) => expect(h.pattern).toEqual(r.chart.houses[h.number - 1].pattern));
      let folded = plan.houses[0].pattern;
      for (const h of plan.houses.slice(1)) folded = addPatterns(folded, h.pattern);
      expect(folded).toEqual(plan.answerKey);
    }
    expect(offered).toBeGreaterThan(0);
  });
  it('is null for conflicting, multi-method, descriptive, insufficient, source-silent and non-addition readings', () => {
    let hidden = 0;
    for (const r of ALL) {
      const counted = r.result.methodResults.filter((m) => m.counted);
      const addition = counted.length === 1 && counted[0].calculationSteps.length === 1 && /^H\d+ \([^)]+\)( \+ H\d+ \([^)]+\))+ = .+$/.test(counted[0].calculationSteps[0]);
      if (counted.length !== 1 || r.result.isInsufficient || r.result.resultKind === 'descriptive' || !addition) {
        expect(planFor(r), r.qid).toBeNull();
        hidden++;
      }
    }
    expect(hidden).toBeGreaterThan(0);
    expect(ALL.some((r) => r.result.conflictingIndicators)).toBe(true);
    for (const r of ALL.filter((x) => x.result.conflictingIndicators)) expect(planFor(r)).toBeNull();
  });
});

describe('every single condition, flipped alone, hides practice', () => {
  const base = SAMPLES[0];
  const mutate = (fn: (r: ReadingResult, c: Chart) => void) => {
    const result = clone(base.result);
    const chart = clone(base.chart);
    fn(result, chart);
    return buildPractice(result, buildReasoningSteps(result, chart), chart, { isFreeSample: true });
  };
  it('control: unmodified is offered', () => expect(mutate(() => {})).not.toBeNull());
  it('no free-sample flag', () => expect(planFor(base, false)).toBeNull());
  it('no chart', () => expect(buildPractice(base.result, buildReasoningSteps(base.result, base.chart), undefined, { isFreeSample: true })).toBeNull());
  it('insufficient', () => expect(mutate((r) => { r.isInsufficient = true; })).toBeNull());
  it('descriptive', () => expect(mutate((r) => { (r as { resultKind: string }).resultKind = 'descriptive'; })).toBeNull());
  it('method not verified', () => expect(mutate((r) => { r.methodResults[0].status = 'needs_review'; })).toBeNull());
  it('a second counted method', () => expect(mutate((r) => { r.methodResults.push({ ...clone(r.methodResults[0]), id: 'second' }); })).toBeNull());
  it('a recast method', () => expect(mutate((r) => { r.methodResults[0].casting = { ...r.methodResults[0].casting, inspects: 'recast' } as never; })).toBeNull());
  it('a second working line', () => expect(mutate((r) => { r.methodResults[0].calculationSteps.push('extra'); })).toBeNull());
  it('a working line that is not an addition trace', () => expect(mutate((r) => { r.methodResults[0].calculationSteps = ['Count the dots = 7']; })).toBeNull());
  it('a repeated house in the trace', () => expect(mutate((r) => {
    const s = r.methodResults[0].calculationSteps[0];
    r.methodResults[0].calculationSteps[0] = s.replace(/ \+ H\d+ \(/, ' + H1 (');
  })).toBeNull());
  it('a figure name that disagrees with the chart', () => expect(mutate((r) => {
    r.methodResults[0].calculationSteps[0] = r.methodResults[0].calculationSteps[0].replace(/^H(\d+) \([^)]+\)/, 'H$1 (Nobody)');
  })).toBeNull());
  it('a recorded result that the fold does not reproduce', () => expect(mutate((r) => {
    const m = r.methodResults[0];
    m.resultPattern = (m.resultPattern!.map((v) => (v === 1 ? 2 : 1)) as unknown) as Pattern;
  })).toBeNull());
  it('a chart house that differs from the one the step shows', () => expect(mutate((r, c) => {
    const n = r.methodResults[0].housesUsed[0];
    c.houses[n - 1].pattern = c.houses[n - 1].pattern.map((v) => (v === 1 ? 2 : 1)) as unknown as Pattern;
  })).toBeNull());
});

describe('checking an attempt', () => {
  const key = SAMPLES[0].result.methodResults[0].resultPattern as Pattern;
  const combos: Array<[1 | 2, 1 | 2, 1 | 2, 1 | 2]> = [];
  for (let n = 0; n < 16; n++) combos.push([0, 1, 2, 3].map((b) => (((n >> b) & 1) === 0 ? 1 : 2)) as [1 | 2, 1 | 2, 1 | 2, 1 | 2]);
  it('of the 16 possible four-row answers exactly the engine\'s is correct', () => {
    const verdicts = combos.map((c) => checkAttempt(key, c));
    expect(verdicts.filter((v) => v === 'correct')).toHaveLength(1);
    expect(verdicts.filter((v) => v === 'incorrect')).toHaveLength(15);
    combos.forEach((c, i) => expect(verdicts[i] === 'correct').toBe(c.every((v, j) => v === key[j])));
  });
  it('treats an unfinished attempt as incomplete, never right or wrong', () => {
    expect(checkAttempt(key, [null, null, null, null])).toBe('incomplete');
    expect(checkAttempt(key, [key[0], key[1], key[2], null])).toBe('incomplete');
    expect(checkAttempt(key, [key[0], key[1]])).toBe('incomplete');
  });
});

describe('the practice component', () => {
  const run = SAMPLES[0];
  const plan = planFor(run) as PracticePlan;
  const markup = dec(renderToStaticMarkup(createElement(PracticeActivity, { plan })));
  it('starts closed with nothing preselected', () => {
    expect(markup).not.toMatch(/<details[^>]*\sopen/);
    expect((markup.match(/type="radio"/g) ?? []).length).toBe(8);
    expect(markup).not.toMatch(/checked/);
  });
  it('does not render the answer, its name or the working line before it is requested', () => {
    expect(markup).not.toContain(plan.workingLine);
    expect(markup).not.toContain(plan.resultName);
    expect(markup).not.toContain(LEARN_COPY.correct);
    expect(markup).not.toContain(LEARN_COPY.revealed);
  });
  it('offers accessible controls: grouped radios with labels, 44px targets and a polite live region', () => {
    expect((markup.match(/<fieldset/g) ?? []).length).toBe(4);
    expect((markup.match(/<legend/g) ?? []).length).toBe(4);
    expect(markup).toMatch(/role="status"[^>]*aria-live="polite"|aria-live="polite"[^>]*role="status"/);
    expect((markup.match(/min-h-\[44px\]/g) ?? []).length).toBeGreaterThanOrEqual(10);
    expect(markup).toContain(LEARN_COPY.check);
    expect(markup).toContain(LEARN_COPY.tryAgain);
    expect(markup).toContain(LEARN_COPY.showAnswer);
  });
  it('contains no storage, network or API calls', () => {
    const src = readFileSync(path.resolve(__dirname, '../../components/raml/reading/PracticeActivity.tsx'), 'utf8');
    expect(src).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(|XMLHttpRequest|sendBeacon|\/api\//);
  });
});

describe('inside the reading view', () => {
  const view = (r: Run, isFreeSample?: boolean) => dec(renderToStaticMarkup(createElement(EngineReadingView, { result: r.result, chart: r.chart, isFreeSample })));
  it('shows the practice only for an eligible free sample, after the steps', () => {
    const html = view(SAMPLES[0], true);
    expect(html).toContain(LEARN_COPY.practiceHeading);
    expect(html.indexOf(LEARN_COPY.practiceHeading)).toBeGreaterThan(html.indexOf('How the method reached this'));
    expect(html).toContain(LEARN_COPY.stepsIntro);
  });
  it('does not show it without the free-sample flag', () => {
    expect(view(SAMPLES[0], false)).not.toContain(LEARN_COPY.practiceHeading);
    expect(view(SAMPLES[0])).not.toContain(LEARN_COPY.practiceHeading);
  });
  it('leaves every reading that is not offered practice byte-identical, flag or not', () => {
    const others = ALL.filter((r) => !planFor(r));
    expect(others.length).toBeGreaterThan(0);
    for (const r of others.slice(0, 120)) expect(view(r, true)).toBe(view(r, false));
  });
  it('shows the steps intro, once and under the steps heading, for every eligible reading', () => {
    for (const r of SAMPLES.slice(0, 60)) {
      const html = view(r, true);
      expect(html.split(LEARN_COPY.stepsIntro)).toHaveLength(2);
      expect(html.indexOf(LEARN_COPY.stepsIntro)).toBeGreaterThan(html.indexOf('How the method reached this'));
      expect(html.indexOf(LEARN_COPY.stepsIntro)).toBeLessThan(html.indexOf('Houses the method uses'));
    }
  });
  it('never shows the steps intro unless practice is offered: paid, multi-method, non-addition, descriptive, insufficient, source-silent and conflicting readings', () => {
    const others = ALL.filter((r) => !planFor(r));
    const withSteps = others.filter((r) => buildReasoningSteps(r.result, r.chart).length > 0);
    // the cases the correction is about actually occur in the data set
    expect(withSteps.length).toBeGreaterThan(0);
    expect(others.some((r) => r.result.methodResults.filter((m) => m.counted).length > 1)).toBe(true);
    expect(others.some((r) => r.result.conflictingIndicators)).toBe(true);
    expect(others.some((r) => r.result.isInsufficient)).toBe(true);
    expect(others.some((r) => r.result.resultKind === 'descriptive')).toBe(true);
    expect(withSteps.some((r) => r.result.methodResults.some((m) => m.counted && !/ \+ H\d+ \(/.test(m.calculationSteps.join(' '))))).toBe(true);
    for (const r of others) {
      expect(view(r, true)).not.toContain(LEARN_COPY.stepsIntro);
      expect(view(r, false)).not.toContain(LEARN_COPY.stepsIntro);
    }
    // an eligible reading without the free-sample flag (i.e. every paid presentation) gets none either
    expect(view(SAMPLES[0], false)).not.toContain(LEARN_COPY.stepsIntro);
  });
  it('the steps card is unchanged apart from the optional intro line', () => {
    const steps = buildReasoningSteps(SAMPLES[0].result, SAMPLES[0].chart);
    const plain = renderToStaticMarkup(createElement(ReasoningSteps, { steps }));
    const withIntro = renderToStaticMarkup(createElement(ReasoningSteps, { steps, intro: LEARN_COPY.stepsIntro }));
    expect(plain).not.toContain(LEARN_COPY.stepsIntro);
    expect(withIntro.replace(`<p class="mt-1 type-body text-sand/70">${LEARN_COPY.stepsIntro}</p>`, '')).toBe(plain);
  });
  it('does not touch the answer card: its markup is the same with and without practice', () => {
    const card = (h: string) => h.slice(h.indexOf('The answer'), h.indexOf('How the method reached this'));
    expect(card(view(SAMPLES[0], true))).toBe(card(view(SAMPLES[0], false)));
    expect(card(view(SAMPLES[0], true)).length).toBeGreaterThan(50);
  });
  it('shows the learn links section only when at least one destination page exists, and never without practice', () => {
    const anyEnabled = LEARN_LINKS.some((l) => l.enabled);
    expect(view(SAMPLES[0], true).includes(LEARN_COPY.linksHeading)).toBe(anyEnabled);
    expect(view(SAMPLES[0], false)).not.toContain(LEARN_COPY.linksHeading);
  });
});
