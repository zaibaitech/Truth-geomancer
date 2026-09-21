// Prompt 65 — casting-requirement metadata foundation.
// Types + default helper only. Does not wire Cast UI, ResultTabs, or calculate().
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, expectTypeOf } from 'vitest';
import { runEngine } from './index';
import { QUESTION_REGISTRY } from './questions';
import { QUESTION_REGISTRY_META } from '@/lib/raml/questionRegistryMeta';
import { usesDreamPairingPresentation } from '@/lib/raml/dreamPairingPresentation';
import { fixtureChart } from './__tests__/fixtures';
import type { MethodDefinition } from './types';
import {
  PRODUCT_DEFAULT_CASTING_REQUIREMENT,
  getEffectiveCastingRequirement,
  publicCastingDefault,
  resolveQuestionCasting,
  toPublicCastingMeta,
  type AppDerivation,
  type CastingEvidence,
  type CastingRequirement,
  type MethodInspects,
  type PublicCastingMeta,
  type ResultDisplay,
  type UserCastInput,
} from './castingRequirement';

function repoFile(relative: string): string {
  return readFileSync(path.resolve(__dirname, '..', '..', '..', relative), 'utf8');
}

const MONEY_ID = 'if-you-want-to-know-if-you-will';
const DREAMS_ID = 'dreams-and-their-interpretations';
const RAIN_ID = 'if-it-will-rain-today-or-not';

describe('optional metadata on existing MethodDefinition', () => {
  it('an existing method without castingRequirement remains valid and unclassified', () => {
    const method = QUESTION_REGISTRY[MONEY_ID].methods[0];
    expect(method.castingRequirement).toBeUndefined();
    expect(method.id).toBe('money-method-1');
    expect(typeof method.calculate).toBe('function');
    expect(typeof method.evaluate).toBe('function');
  });

  it('only Chapter 151 and Chapter 32 are annotated so far', () => {
    const annotated: string[] = [];
    for (const question of Object.values(QUESTION_REGISTRY)) {
      for (const method of question.methods) {
        if (method.castingRequirement) annotated.push(method.id);
      }
    }
    expect(annotated.sort()).toEqual(
      [
        'dreams-interpretation-method-1',
        'rain-method-1',
        'rain-method-2',
        'rain-method-3',
        'rain-method-4',
      ].sort(),
    );
  });
});

describe('product default for unclassified methods', () => {
  it('is four Mothers in, source-unclear inspection, full-shield derive/display, product_default evidence', () => {
    const method = QUESTION_REGISTRY[MONEY_ID].methods[0];
    const effective = getEffectiveCastingRequirement(method);
    expect(effective).toEqual({
      userGenerates: { kind: 'four_mothers' },
      inspects: { kind: 'source_unclear' },
      appDerives: { kind: 'full_shield' },
      display: { kind: 'full_shield_tabs' },
      evidence: 'product_default',
    });
    expect(effective).toBe(PRODUCT_DEFAULT_CASTING_REQUIREMENT);
  });

  it('does not claim the source explicitly requires a full shield', () => {
    const effective = getEffectiveCastingRequirement({});
    expect(effective.evidence).toBe('product_default');
    expect(effective.evidence).not.toBe('source_explicit');
    expect(effective.inspects.kind).toBe('source_unclear');
    expect(effective.appDerives.kind).toBe('full_shield');
  });

  it('returns a method’s own requirement when present, without rewriting it', () => {
    const own: CastingRequirement = {
      userGenerates: { kind: 'four_mothers' },
      inspects: { kind: 'named_houses', houses: [4] },
      appDerives: { kind: 'named_houses', houses: [4] },
      display: { kind: 'named_houses', houses: [4] },
      evidence: 'source_explicit',
      note: 'engineering only — not a quote',
    };
    expect(getEffectiveCastingRequirement({ castingRequirement: own })).toBe(own);
  });
});

describe('type discrimination of every supported kind', () => {
  it('UserCastInput kinds type-check', () => {
    const four: UserCastInput = { kind: 'four_mothers' };
    const single: UserCastInput = { kind: 'single_figure' };
    const castOut: UserCastInput = { kind: 'cast_out_line', modulus: 4, lineCount: 4 };
    const unclear: UserCastInput = { kind: 'source_unclear' };
    expect([four, single, castOut, unclear].map((v) => v.kind)).toEqual([
      'four_mothers',
      'single_figure',
      'cast_out_line',
      'source_unclear',
    ]);
    expect([four, single, castOut, unclear].map((v) => v.kind)).not.toContain('recast');
  });

  it('MethodInspects kinds type-check, including recursive recast', () => {
    const named: MethodInspects = { kind: 'named_houses', houses: [1, 12] };
    const derived: MethodInspects = { kind: 'derived_figures', figureIds: ['final'] };
    const presence: MethodInspects = { kind: 'full_chart_presence' };
    const count: MethodInspects = { kind: 'full_chart_count' };
    const adjacency: MethodInspects = { kind: 'adjacency' };
    const quarters: MethodInspects = { kind: 'quarters' };
    const recast: MethodInspects = {
      kind: 'recast',
      motherHouses: [3, 7, 11, 15],
      then: { kind: 'named_houses', houses: [13] },
    };
    const unclear: MethodInspects = { kind: 'source_unclear' };
    expect(
      [named, derived, presence, count, adjacency, quarters, recast, unclear].map((v) => v.kind),
    ).toEqual([
      'named_houses',
      'derived_figures',
      'full_chart_presence',
      'full_chart_count',
      'adjacency',
      'quarters',
      'recast',
      'source_unclear',
    ]);
    if (recast.kind === 'recast') expect(recast.then.kind).toBe('named_houses');
  });

  it('AppDerivation, ResultDisplay, and CastingEvidence kinds type-check', () => {
    const derivations: AppDerivation[] = [
      { kind: 'none' },
      { kind: 'named_houses', houses: [4] },
      { kind: 'pairing_tree', steps: [{ id: 'pair1', label: 'Pair 1', from: ['mother-1', 'mother-2'] }] },
      { kind: 'full_shield' },
      { kind: 'recast_shield', motherHouses: [1, 2, 3, 4] },
      { kind: 'source_unclear' },
    ];
    const displays: ResultDisplay[] = [
      { kind: 'mothers_and_pairing' },
      { kind: 'named_houses', houses: [4] },
      { kind: 'full_shield_tabs' },
      { kind: 'recast_working' },
      { kind: 'working_only' },
    ];
    const evidence: CastingEvidence[] = [
      'source_explicit',
      'author_clarified',
      'product_default',
      'source_unclear',
    ];
    expect(derivations.map((d) => d.kind)).toEqual([
      'none',
      'named_houses',
      'pairing_tree',
      'full_shield',
      'recast_shield',
      'source_unclear',
    ]);
    expect(displays.map((d) => d.kind)).toEqual([
      'mothers_and_pairing',
      'named_houses',
      'full_shield_tabs',
      'recast_working',
      'working_only',
    ]);
    expect(evidence).toEqual(['source_explicit', 'author_clarified', 'product_default', 'source_unclear']);
  });

  it('PublicCastingMeta is enums and house numbers only', () => {
    const sample: PublicCastingMeta = {
      userGenerates: 'four_mothers',
      inspects: 'recast',
      display: 'recast_working',
      recastMotherHouses: [3, 7, 11, 15],
      recastThenInspects: 'named_houses',
      recastThenHouses: [13],
    };
    expectTypeOf(sample).toMatchTypeOf<PublicCastingMeta>();
    expect(sample).not.toHaveProperty('quote');
    expect(sample).not.toHaveProperty('note');
    expect(sample).not.toHaveProperty('interpretation');
    expect(sample).not.toHaveProperty('appDerives');
    expect(sample).not.toHaveProperty('evidence');
    expect(sample).not.toHaveProperty('then');
  });
});

describe('source safety of public metadata', () => {
  it('toPublicCastingMeta copies only enums/houses and drops note', () => {
    const req: CastingRequirement = {
      userGenerates: { kind: 'four_mothers' },
      inspects: { kind: 'recast', motherHouses: [3, 7, 11, 15], then: { kind: 'named_houses', houses: [13] } },
      appDerives: { kind: 'recast_shield', motherHouses: [3, 7, 11, 15] },
      display: { kind: 'recast_working' },
      evidence: 'source_explicit',
      note: 'If you want to know the meaning of a dream, make only the first 4 stars (Umuhat) and pair them.',
    };
    const pub = toPublicCastingMeta(req);
    expect(pub).toEqual({
      userGenerates: 'four_mothers',
      inspects: 'recast',
      display: 'recast_working',
      recastMotherHouses: [3, 7, 11, 15],
      recastThenInspects: 'named_houses',
      recastThenHouses: [13],
    });
    expect(JSON.stringify(pub)).not.toMatch(/quote|interpretation|Umuhat|dream/i);
    expect(pub).not.toHaveProperty('note');
    expect(pub).not.toHaveProperty('evidence');
    expect(pub).not.toHaveProperty('then');
    expect(pub).not.toHaveProperty('houses');
  });

  it('QUESTION_REGISTRY_META has no quotes or notes; only classified methods publish casting enums', () => {
    const classified = new Set([
      'dreams-interpretation-method-1',
      'rain-method-1',
      'rain-method-2',
      'rain-method-3',
      'rain-method-4',
    ]);
    for (const question of Object.values(QUESTION_REGISTRY_META)) {
      for (const method of question.methods) {
        expect(method).not.toHaveProperty('quote');
        expect(method).not.toHaveProperty('source');
        expect(method).not.toHaveProperty('note');
        if (classified.has(method.id)) {
          expect(method.casting).toBeDefined();
          expect(JSON.stringify(method.casting)).not.toMatch(/quote|interpretation|Umuhat|pair them|following each other/i);
          expect(method.casting).not.toHaveProperty('note');
          expect(method.casting).not.toHaveProperty('evidence');
        } else {
          expect(method.casting).toBeUndefined();
          expect(Object.keys(method).sort()).toEqual(
            ['id', 'label', 'sourceBook', 'sourceChapterId', 'status'].sort(),
          );
        }
      }
    }
  });

  it('questionRegistryMeta.ts only type-imports the client-safe shape (no value import of the engine)', () => {
    const src = repoFile('lib/raml/questionRegistryMeta.ts');
    const code = src
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n');
    expect(src).toContain("import type { PublicCastingMeta } from '@/lib/raml/engine/castingRequirement'");
    expect(code).not.toMatch(/import\s+(?!type\s).*from ['"]@\/lib\/raml\/engine/);
    expect(code).not.toMatch(/from ['"]@\/lib\/raml\/engine['"]/);
    expect(code).not.toMatch(/from ['"]@\/lib\/raml\/engine\/questions/);
    expect(code).not.toMatch(/source\.quote/);
  });

  it('castingRequirement.ts contains no manuscript quotes and no question-registry import', () => {
    const src = repoFile('lib/raml/engine/castingRequirement.ts');
    expect(src).not.toMatch(/from ['"]@\/lib\/server\/content\/kanzulMikban['"]/);
    expect(src).not.toMatch(/from ['"].*\/questions['"]/);
    expect(src).not.toMatch(/source\.quote/);
    expect(src).not.toContain('If you want to know the meaning of a dream');
  });

});

describe('existing ordinary method keeps current full-shield behaviour', () => {
  it('money Method 1 still runs against the 16-house chart with no metadata attached', () => {
    const method = QUESTION_REGISTRY[MONEY_ID].methods[0];
    expect(method.castingRequirement).toBeUndefined();
    expect(getEffectiveCastingRequirement(method).display.kind).toBe('full_shield_tabs');

    const result = runEngine(fixtureChart(), MONEY_ID)!;
    const m1 = result.methods.find((m) => m.method.id === 'money-method-1')!;
    expect(m1.calculation).not.toBeNull();
    expect(m1.calculation!.housesUsed).toEqual([3, 7, 11, 15]);
    expect(m1.verdict!.outcome).toBe('favourable');
    expect(result.supportingHouses).toEqual(expect.arrayContaining([2, 3, 7, 11, 15]));
  });

  it('ResultTabs uses the resolver, not a Chapter 151 question-id check', () => {
    const tabs = repoFile('components/raml/ResultTabs.tsx');
    expect(tabs).toContain("const BASE_TABS = ['Overview', 'Full Chart', 'My Star', 'Sadaqah']");
    expect(tabs).toContain('resolveQuestionCasting');
    expect(tabs).toContain('showPairingWorking');
    expect(tabs).toContain('showFullShieldTabs');
    expect(tabs).not.toContain('usesDreamPairingPresentation(intentionId)');
    expect(tabs).not.toMatch(/intentionId === ['"]dreams-and-their-interpretations['"]/);
    expect(tabs).not.toMatch(/=== DREAMS_QUESTION_ID/);
  });
});

describe('Chapter 151 metadata migration', () => {
  it('annotates the dream method as four Mothers + pairing display, not a full shield source claim', () => {
    const method = QUESTION_REGISTRY[DREAMS_ID].methods[0];
    expect(method.castingRequirement).toBeDefined();
    const effective = getEffectiveCastingRequirement(method);
    expect(effective.userGenerates.kind).toBe('four_mothers');
    expect(effective.inspects.kind).toBe('derived_figures');
    expect(effective.inspects).toEqual({ kind: 'derived_figures', figureIds: ['pair-1', 'pair-2', 'final'] });
    expect(effective.appDerives.kind).toBe('pairing_tree');
    if (effective.appDerives.kind === 'pairing_tree') {
      expect(effective.appDerives.steps.map((s) => s.id)).toEqual(['pair-1', 'pair-2', 'final']);
      expect(JSON.stringify(effective.appDerives)).not.toMatch(/Daughter|Niece|Witness|Judge|Reconciler/);
    }
    expect(effective.display.kind).toBe('mothers_and_pairing');
    expect(effective.evidence).toBe('author_clarified');
    expect(effective.evidence).not.toBe('source_explicit');
    expect(effective.note).not.toContain(
      'If you want to know the meaning of a dream, make only the first 4 stars (Umuhat) and pair them.',
    );
    expect(toPublicCastingMeta(effective)).toEqual(QUESTION_REGISTRY_META[DREAMS_ID].methods[0].casting);
  });

  it('resolver shows pairing working for Chapter 151 and full-shield tabs for unannotated questions', () => {
    const dreams = resolveQuestionCasting(QUESTION_REGISTRY_META[DREAMS_ID]);
    expect(dreams.showPairingWorking).toBe(true);
    expect(dreams.showFullShieldTabs).toBe(false);
    expect(dreams.showRecastWorking).toBe(false);
    expect(dreams.display).toBe('mothers_and_pairing');
    expect(dreams.userGenerates).toBe('four_mothers');
    expect(dreams.namedHouses).toEqual([]);
    expect(dreams.recastMotherHouses).toEqual([]);
    expect(dreams.recastThenHouses).toEqual([]);

    const rain = resolveQuestionCasting(QUESTION_REGISTRY_META[RAIN_ID]);
    expect(rain.showPairingWorking).toBe(false);
    expect(rain.showFullShieldTabs).toBe(true);
    expect(rain.display).toBe('full_shield_tabs');
    expect(rain.namedHouses).toEqual([4, 9]);
    expect(rain.recastMotherHouses).toEqual([]);
    expect(rain.recastThenHouses).toEqual([]);

    const money = resolveQuestionCasting(QUESTION_REGISTRY_META[MONEY_ID]);
    expect(money.showFullShieldTabs).toBe(true);
    expect(money.showPairingWorking).toBe(false);
  });

  it('reports mixed userGenerates when methods disagree rather than picking a winner', () => {
    const mixed = resolveQuestionCasting({
      methods: [
        { casting: { userGenerates: 'four_mothers', inspects: 'named_houses', display: 'named_houses', houses: [4] } },
        { casting: { userGenerates: 'single_figure', inspects: 'source_unclear', display: 'working_only' } },
      ],
    });
    expect(mixed.userGenerates).toBe('mixed');
    expect(mixed.showPairingWorking).toBe(false);
    expect(mixed.namedHouses).toEqual([4]);
  });

  it('unannotated / missing question keeps the product default, not a source-required shield', () => {
    expect(resolveQuestionCasting(undefined).showFullShieldTabs).toBe(true);
    expect(resolveQuestionCasting({ methods: [] }).showFullShieldTabs).toBe(true);
    expect(publicCastingDefault().inspects).toBe('source_unclear');
    expect(usesDreamPairingPresentation(DREAMS_ID)).toBe(true);
    expect(usesDreamPairingPresentation(MONEY_ID)).toBe(false);
    expect(usesDreamPairingPresentation('general')).toBe(false);
  });

  it('a MethodDefinition object without the new field still type-checks as MethodDefinition', () => {
    const stub: Pick<MethodDefinition, 'id' | 'label' | 'status'> = {
      id: 'money-method-1',
      label: 'Method 1',
      status: 'verified',
    };
    expect('castingRequirement' in stub).toBe(false);
  });
});

describe('resolveQuestionCasting — synthetic mixed-method fixtures (catalogue untouched)', () => {
  it('Test A — Chapter 151 pairing-only', () => {
    const resolved = resolveQuestionCasting(QUESTION_REGISTRY_META[DREAMS_ID]);
    expect(resolved.userGenerates).toBe('four_mothers');
    expect(resolved.showPairingWorking).toBe(true);
    expect(resolved.showFullShieldTabs).toBe(false);
    expect(resolved.showRecastWorking).toBe(false);
    expect(resolved.namedHouses).toEqual([]);
    expect(resolved.recastMotherHouses).toEqual([]);
    expect(resolved.recastThenHouses).toEqual([]);
  });

  it('Test B — named houses only do not request Full Chart', () => {
    const resolved = resolveQuestionCasting({
      methods: [
        { casting: { userGenerates: 'four_mothers', inspects: 'named_houses', display: 'named_houses', houses: [4] } },
        { casting: { userGenerates: 'four_mothers', inspects: 'named_houses', display: 'named_houses', houses: [9] } },
      ],
    });
    expect(resolved.showFullShieldTabs).toBe(false);
    expect(resolved.showPairingWorking).toBe(false);
    expect(resolved.namedHouses).toEqual([4, 9]);
    expect(resolved.userGenerates).toBe('four_mothers');
  });

  it('Test C — named house + adjacency unions houses and forces Full Chart', () => {
    const resolved = resolveQuestionCasting({
      methods: [
        { casting: { userGenerates: 'four_mothers', inspects: 'named_houses', display: 'named_houses', houses: [4] } },
        { casting: { userGenerates: 'four_mothers', inspects: 'adjacency', display: 'working_only' } },
      ],
    });
    expect(resolved.showFullShieldTabs).toBe(true);
    expect(resolved.namedHouses).toEqual([4]);
    expect(resolved.showPairingWorking).toBe(false);
  });

  it('Test D — pairing + full-chart presence keeps both flags; does not discard either method', () => {
    const resolved = resolveQuestionCasting({
      methods: [
        { casting: { userGenerates: 'four_mothers', inspects: 'derived_figures', display: 'mothers_and_pairing' } },
        { casting: { userGenerates: 'four_mothers', inspects: 'full_chart_presence', display: 'working_only' } },
      ],
    });
    expect(resolved.showPairingWorking).toBe(true);
    expect(resolved.showFullShieldTabs).toBe(true);
    expect(resolved.userGenerates).toBe('four_mothers');
  });

  it('Test E — recast working is reported without annotating a real recast method', () => {
    const resolved = resolveQuestionCasting({
      methods: [
        {
          casting: {
            userGenerates: 'four_mothers',
            inspects: 'recast',
            display: 'recast_working',
            recastMotherHouses: [3, 7, 11, 15],
          },
        },
      ],
    });
    expect(resolved.userGenerates).toBe('four_mothers');
    expect(resolved.showRecastWorking).toBe(true);
    expect(resolved.showPairingWorking).toBe(false);
    expect(resolved.showFullShieldTabs).toBe(true);
    expect(resolved.display).toBe('full_shield_tabs');
    expect(resolved.namedHouses).toEqual([]);
    expect(resolved.recastMotherHouses).toEqual([3, 7, 11, 15]);
    expect(resolved.recastThenHouses).toEqual([]);
  });

  it('Test G — recast + original named houses keep separate house bags and Full Chart', () => {
    const resolved = resolveQuestionCasting({
      methods: [
        {
          casting: {
            userGenerates: 'four_mothers',
            inspects: 'recast',
            display: 'recast_working',
            recastMotherHouses: [3, 7, 11, 15],
            recastThenInspects: 'named_houses',
            recastThenHouses: [13],
          },
        },
        {
          casting: {
            userGenerates: 'four_mothers',
            inspects: 'named_houses',
            display: 'named_houses',
            houses: [1, 12],
          },
        },
      ],
    });
    expect(resolved.userGenerates).toBe('four_mothers');
    expect(resolved.showRecastWorking).toBe(true);
    expect(resolved.showPairingWorking).toBe(false);
    expect(resolved.showFullShieldTabs).toBe(true);
    expect(resolved.namedHouses).toEqual([1, 12]);
    expect(resolved.recastMotherHouses).toEqual([3, 7, 11, 15]);
    expect(resolved.recastThenHouses).toEqual([13]);
    expect(resolved.namedHouses).not.toContain(13);
    expect(resolved.namedHouses).not.toEqual(expect.arrayContaining([3, 7, 11, 15]));
    expect(resolved.recastThenHouses).not.toEqual(resolved.namedHouses);
  });

  it('Test F — unannotated method uses product default full-shield tabs, inspects remain source_unclear', () => {
    const method = QUESTION_REGISTRY[MONEY_ID].methods[0];
    expect(method.castingRequirement).toBeUndefined();
    const effective = getEffectiveCastingRequirement(method);
    expect(effective.inspects.kind).toBe('source_unclear');
    expect(effective.evidence).toBe('product_default');
    expect(effective.evidence).not.toBe('source_explicit');

    const resolved = resolveQuestionCasting(QUESTION_REGISTRY_META[MONEY_ID]);
    expect(resolved.showFullShieldTabs).toBe(true);
    expect(resolved.showPairingWorking).toBe(false);
    expect(publicCastingDefault().inspects).toBe('source_unclear');
  });

  it('named-house union is unique and sorted even when input order is reversed or duplicated', () => {
    const resolved = resolveQuestionCasting({
      methods: [
        { casting: { userGenerates: 'four_mothers', inspects: 'named_houses', display: 'named_houses', houses: [15, 9] } },
        { casting: { userGenerates: 'four_mothers', inspects: 'named_houses', display: 'named_houses', houses: [4, 9] } },
      ],
    });
    expect(resolved.namedHouses).toEqual([4, 9, 15]);
    expect(resolved.showFullShieldTabs).toBe(false);
  });
});

describe('Chapter 32 method-level casting metadata', () => {
  const rain = QUESTION_REGISTRY[RAIN_ID];
  const byId = Object.fromEntries(rain.methods.map((m) => [m.id, m]));

  it('keeps the four source quotes unchanged', () => {
    expect(byId['rain-method-1'].source.quote).toBe(
      'After casting the chart, check if Ali is following each other in the chart. If they are, then it will rain.',
    );
    expect(byId['rain-method-2'].source.quote).toBe(
      'After drawing the chart, check h4. If you found Kallah Allahu there, it is going to rain.',
    );
    expect(byId['rain-method-3'].source.quote).toBe(
      "If you found Iddris in h9, it is going to rain, insha'Allah.",
    );
    expect(byId['rain-method-4'].source.quote).toBe(
      'Also, when water stars are following each other in a chart, it talks about rain.',
    );
  });

  it('M1 inspects adjacency and displays full-shield tabs', () => {
    const effective = getEffectiveCastingRequirement(byId['rain-method-1']);
    expect(effective.userGenerates.kind).toBe('four_mothers');
    expect(effective.inspects.kind).toBe('adjacency');
    expect(effective.appDerives.kind).toBe('full_shield');
    expect(effective.display.kind).toBe('full_shield_tabs');
    expect(effective.evidence).toBe('source_explicit');
  });

  it('M2 inspects named house 4 and is not a full-shield method', () => {
    const effective = getEffectiveCastingRequirement(byId['rain-method-2']);
    expect(effective.userGenerates.kind).toBe('four_mothers');
    expect(effective.inspects).toEqual({ kind: 'named_houses', houses: [4] });
    expect(effective.appDerives).toEqual({ kind: 'named_houses', houses: [4] });
    expect(effective.display).toEqual({ kind: 'named_houses', houses: [4] });
    expect(effective.evidence).toBe('source_explicit');
    expect(effective.display.kind).not.toBe('full_shield_tabs');
    expect(effective.inspects.kind).not.toBe('adjacency');
  });

  it('M3 inspects named house 9 without a Niece/shield-role label', () => {
    const effective = getEffectiveCastingRequirement(byId['rain-method-3']);
    expect(effective.userGenerates.kind).toBe('four_mothers');
    expect(effective.inspects).toEqual({ kind: 'named_houses', houses: [9] });
    expect(effective.appDerives).toEqual({ kind: 'named_houses', houses: [9] });
    expect(effective.display).toEqual({ kind: 'named_houses', houses: [9] });
    expect(effective.evidence).toBe('source_explicit');
    expect(effective.display.kind).not.toBe('full_shield_tabs');
    expect(JSON.stringify(effective)).not.toMatch(/Niece|Daughter|Witness|Judge|Reconciler/);
  });

  it('M4 inspects adjacency and displays full-shield tabs', () => {
    const effective = getEffectiveCastingRequirement(byId['rain-method-4']);
    expect(effective.userGenerates.kind).toBe('four_mothers');
    expect(effective.inspects.kind).toBe('adjacency');
    expect(effective.appDerives.kind).toBe('full_shield');
    expect(effective.display.kind).toBe('full_shield_tabs');
    expect(effective.evidence).toBe('source_explicit');
  });

  it('housesUsed is not the same thing as inspects — chart-wide scans leave housesUsed empty', () => {
    const result = runEngine(fixtureChart(), RAIN_ID)!;
    const m1 = result.methods.find((m) => m.method.id === 'rain-method-1')!;
    const m2 = result.methods.find((m) => m.method.id === 'rain-method-2')!;
    const m3 = result.methods.find((m) => m.method.id === 'rain-method-3')!;
    const m4 = result.methods.find((m) => m.method.id === 'rain-method-4')!;

    expect(m1.calculation!.housesUsed).toEqual([]);
    expect(byId['rain-method-1'].castingRequirement!.inspects.kind).toBe('adjacency');
    expect(m1.calculation!.housesUsed).not.toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]));

    expect(m2.calculation!.housesUsed).toEqual([4]);
    expect(m3.calculation!.housesUsed).toEqual([9]);

    expect(m4.calculation!.housesUsed).toEqual([]);
    expect(byId['rain-method-4'].castingRequirement!.inspects.kind).toBe('adjacency');
  });

  it('calculate/evaluate do not read castingRequirement', () => {
    for (const method of rain.methods) {
      expect(method.calculate.toString()).not.toMatch(/castingRequirement/);
      expect(method.evaluate.toString()).not.toMatch(/castingRequirement/);
    }
  });

  it('public metadata matches toPublicCastingMeta of the engine requirement', () => {
    const publicMethods = QUESTION_REGISTRY_META[RAIN_ID].methods;
    expect(publicMethods).toHaveLength(4);
    for (const method of rain.methods) {
      const pub = publicMethods.find((m) => m.id === method.id)!;
      expect(toPublicCastingMeta(method.castingRequirement!)).toEqual(pub.casting);
    }
  });

  it('resolver unions Chapter 32 without rewriting M2/M3 as full-shield methods', () => {
    const resolved = resolveQuestionCasting(QUESTION_REGISTRY_META[RAIN_ID]);
    expect(resolved).toEqual(expect.objectContaining({
      userGenerates: 'four_mothers',
      showFullShieldTabs: true,
      showPairingWorking: false,
      showRecastWorking: false,
      namedHouses: [4, 9],
      recastMotherHouses: [],
      recastThenHouses: [],
    }));

    const m2 = getEffectiveCastingRequirement(byId['rain-method-2']);
    const m3 = getEffectiveCastingRequirement(byId['rain-method-3']);
    expect(m2.display.kind).toBe('named_houses');
    expect(m3.display.kind).toBe('named_houses');
    expect(m2.inspects.kind).not.toBe('adjacency');
    expect(m3.inspects.kind).not.toBe('adjacency');
  });
});

const ENEMIES_ID = 'if-your-enemies-are-working-against-you-or';

describe('Prompt 71 recast metadata contract (Chapter 34 still unannotated)', () => {
  it('does not add a recast kind to UserCastInput — recast is application-derived', () => {
    const src = repoFile('lib/raml/engine/castingRequirement.ts');
    const userBlock = src.slice(src.indexOf('export type UserCastInput'), src.indexOf('export type MethodInspects'));
    expect(userBlock).not.toMatch(/kind: 'recast'/);
    expect(src).toContain("kind: 'recast'");
    expect(src).toContain('recast_shield');
  });

  it('toPublicCastingMeta namespaces new-chart houses away from original named houses', () => {
    const req: CastingRequirement = {
      userGenerates: { kind: 'four_mothers' },
      inspects: { kind: 'recast', motherHouses: [3, 7, 11, 15], then: { kind: 'named_houses', houses: [13] } },
      appDerives: { kind: 'recast_shield', motherHouses: [3, 7, 11, 15] },
      display: { kind: 'recast_working' },
      evidence: 'source_explicit',
    };
    const pub = toPublicCastingMeta(req);
    expect(pub.houses).toBeUndefined();
    expect(pub.recastMotherHouses).toEqual([3, 7, 11, 15]);
    expect(pub.recastThenInspects).toBe('named_houses');
    expect(pub.recastThenHouses).toEqual([13]);
    expect(pub.userGenerates).toBe('four_mothers');
  });

  it('Chapter 34 methods remain unclassified and calculate/evaluate ignore metadata', () => {
    const question = QUESTION_REGISTRY[ENEMIES_ID];
    expect(question.methods.map((m) => m.id)).toEqual([
      'enemies-working-method-1',
      'enemies-working-method-2',
    ]);
    for (const method of question.methods) {
      expect(method.castingRequirement).toBeUndefined();
      expect(method.calculate.toString()).not.toMatch(/castingRequirement/);
      expect(method.evaluate.toString()).not.toMatch(/castingRequirement/);
    }
    const pub = QUESTION_REGISTRY_META[ENEMIES_ID];
    for (const method of pub.methods) {
      expect(method.casting).toBeUndefined();
    }
    const resolved = resolveQuestionCasting(pub);
    expect(resolved.showFullShieldTabs).toBe(true);
    expect(resolved.showRecastWorking).toBe(false);
    expect(resolved.namedHouses).toEqual([]);
    expect(resolved.recastMotherHouses).toEqual([]);
    expect(resolved.recastThenHouses).toEqual([]);
  });

  it('Chapter 34 Method 1 still recasts original H3/H7/H11/H15 and inspects new H13', () => {
    const result = runEngine(fixtureChart(), ENEMIES_ID)!;
    const m1 = result.methods.find((m) => m.method.id === 'enemies-working-method-1')!;
    expect(m1.calculation!.housesUsed).toEqual([3, 7, 11, 15]);
    expect(m1.calculation!.steps[0]).toMatch(/used as new Mothers/);
    expect(m1.calculation!.steps[1]).toMatch(/New chart's H13/);
    expect(QUESTION_REGISTRY[ENEMIES_ID].methods[0].calculate.toString()).toContain('RECAST_FROM_HOUSES');

    const m2 = result.methods.find((m) => m.method.id === 'enemies-working-method-2')!;
    expect(m2.calculation!.housesUsed).toEqual([1, 12]);
  });

  it('ResultTabs does not hide Full Chart for recast the way exclusive pairing does', () => {
    const tabs = repoFile('components/raml/ResultTabs.tsx');
    expect(tabs).toContain('showPairingWorking && !casting.showFullShieldTabs');
    expect(tabs).not.toMatch(/showRecastWorking && !casting.showFullShieldTabs/);
    expect(tabs).not.toContain('recast_working');
  });
});
