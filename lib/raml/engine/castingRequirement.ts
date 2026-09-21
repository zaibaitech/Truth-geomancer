// Casting-requirement metadata (Prompt 65) and question-level resolver (Prompt 66).
// Recast public/resolver contract (Prompt 71).
//
// Optional, method-level, source-reviewed description of:
//   1. what the querent generates
//   2. what the method inspects
//   3. what the application may derive
//   4. what the result UI should display
//   5. why that classification exists
//
// Unannotated methods keep today's behaviour via PRODUCT_DEFAULT_CASTING_REQUIREMENT,
// which means "not yet classified — preserve the current pipeline," NOT
// "the source requires a full shield."
//
// `note` is an engineering/product remark. It is never manuscript text
// and must never be copied into client-safe public metadata.
//
// resolveQuestionCasting is pure over public method rows (enums/houses only).
// It does not import QUESTION_REGISTRY, calculate(), or source quotes.
//
// Recast is application-derived, never a second user-generated cast.
// UserCastInput has no recast kind. Recast lives on inspects + appDerives.
// recast_shield means: materialize the original 16-house chart, then build a
// second 16-house chart whose Mothers are the figures already sitting in
// `motherHouses` of that original chart. Those house numbers are original-
// chart numbers and may include derived houses (Daughters, Nieces, Judge).
// inspects.then is the NEW chart: its house numbers are new-chart numbers
// and must not be labelled with original-chart shield roles.

export type UserCastInput =
  | { kind: 'four_mothers' }
  | { kind: 'single_figure' }
  | { kind: 'cast_out_line'; modulus: number; lineCount: number }
  | { kind: 'source_unclear' };

export type MethodInspects =
  | { kind: 'named_houses'; houses: number[] }
  | { kind: 'derived_figures'; figureIds: string[] }
  | { kind: 'full_chart_presence' }
  | { kind: 'full_chart_count' }
  | { kind: 'adjacency' }
  | { kind: 'quarters' }
  | {
      /** Second chart derived from original-chart figures — not a new user cast.
       *  `motherHouses` = original-chart houses whose figures become new Mothers.
       *  `then` = inspection of the NEW chart (those house numbers are new-chart
       *  numbers, not original-chart roles). */
      kind: 'recast';
      motherHouses: [number, number, number, number];
      then: MethodInspects;
    }
  | { kind: 'source_unclear' };

export type AppDerivation =
  | { kind: 'none' }
  | { kind: 'named_houses'; houses: number[] }
  | {
      kind: 'pairing_tree';
      steps: Array<{
        id: string;
        label: string;
        from: string[];
      }>;
    }
  | { kind: 'full_shield' }
  | {
      /** Original 16-house shield first, then a second shield from `motherHouses`.
       *  Not a second user-generated cast. */
      kind: 'recast_shield';
      motherHouses: [number, number, number, number];
    }
  | { kind: 'source_unclear' };

export type ResultDisplay =
  | { kind: 'mothers_and_pairing' }
  | { kind: 'named_houses'; houses: number[] }
  | { kind: 'full_shield_tabs' }
  | { kind: 'recast_working' }
  | { kind: 'working_only' };

export type CastingEvidence =
  | 'source_explicit'
  | 'author_clarified'
  | 'product_default'
  | 'source_unclear';

export interface CastingRequirement {
  userGenerates: UserCastInput;
  inspects: MethodInspects;
  appDerives: AppDerivation;
  display: ResultDisplay;
  evidence: CastingEvidence;
  /** Engineering/product note only — never manuscript prose, never shown as source. */
  note?: string;
}

/**
 * Client-safe subset. Enums and house numbers only — no quotes,
 * interpretations, pairing-tree labels, or `note`.
 *
 * Optional on PublicMethodMeta. Populated only where a method has been
 * classified (Prompt 66: Chapter 151; Prompt 67: Chapter 32). Omitted = product default.
 *
 * Recast house fields are chart-namespaced:
 *   recastMotherHouses — original chart (figures taken as new Mothers)
 *   recastThenHouses   — NEW chart (inspects.then named houses)
 *   houses             — original-chart named-house inspects only
 * Never mix the three bags.
 */
export interface PublicCastingMeta {
  userGenerates: UserCastInput['kind'];
  inspects: MethodInspects['kind'];
  display: ResultDisplay['kind'];
  /** Original-chart named houses. Never recast-then (new-chart) houses. */
  houses?: number[];
  /** Original-chart houses used as new Mothers. Not a second user cast. */
  recastMotherHouses?: [number, number, number, number];
  /** Kind of inspects.then — inspection on the NEW chart. */
  recastThenInspects?: MethodInspects['kind'];
  /** Named houses on the NEW chart when recastThenInspects is named_houses. */
  recastThenHouses?: number[];
}

/** Unclassified method: keep today's four-Mother / full-shield pipeline. */
export const PRODUCT_DEFAULT_CASTING_REQUIREMENT = {
  userGenerates: { kind: 'four_mothers' },
  inspects: { kind: 'source_unclear' },
  appDerives: { kind: 'full_shield' },
  display: { kind: 'full_shield_tabs' },
  evidence: 'product_default',
} as const satisfies CastingRequirement;

export function getEffectiveCastingRequirement(method: {
  castingRequirement?: CastingRequirement;
}): CastingRequirement {
  return method.castingRequirement ?? PRODUCT_DEFAULT_CASTING_REQUIREMENT;
}

/** Strip server-only fields so a future resolver can publish this without quotes. */
export function toPublicCastingMeta(req: CastingRequirement): PublicCastingMeta {
  const meta: PublicCastingMeta = {
    userGenerates: req.userGenerates.kind,
    inspects: req.inspects.kind,
    display: req.display.kind,
  };
  if (req.inspects.kind === 'named_houses') {
    meta.houses = [...req.inspects.houses];
  } else if (req.display.kind === 'named_houses') {
    meta.houses = [...req.display.houses];
  }
  if (req.inspects.kind === 'recast') {
    meta.recastMotherHouses = [...req.inspects.motherHouses];
    meta.recastThenInspects = req.inspects.then.kind;
    if (req.inspects.then.kind === 'named_houses') {
      meta.recastThenHouses = [...req.inspects.then.houses];
    }
  } else if (req.appDerives.kind === 'recast_shield') {
    meta.recastMotherHouses = [...req.appDerives.motherHouses];
  }
  return meta;
}

/** Client-safe product default — same meaning as PRODUCT_DEFAULT_CASTING_REQUIREMENT. */
export function publicCastingDefault(): PublicCastingMeta {
  return {
    userGenerates: PRODUCT_DEFAULT_CASTING_REQUIREMENT.userGenerates.kind,
    inspects: PRODUCT_DEFAULT_CASTING_REQUIREMENT.inspects.kind,
    display: PRODUCT_DEFAULT_CASTING_REQUIREMENT.display.kind,
  };
}

// Recast is included because recast_shield always materializes the original
// 16-house chart first. Source houses may be derived (Daughter / Niece / Judge),
// so original-chart visibility stays on. That is not a second user cast.
const FULL_CHART_INSPECTS = new Set<MethodInspects['kind']>([
  'full_chart_presence',
  'full_chart_count',
  'adjacency',
  'quarters',
  'recast',
]);

export interface QuestionCastingResolution {
  userGenerates: UserCastInput['kind'] | 'mixed';
  /** Convenience chrome hint. Mixed questions keep per-method flags rather than
   * collapsing to this field — read showPairingWorking / showFullShieldTabs. */
  display: ResultDisplay['kind'];
  /** Generic Overview / Full Chart / My Star / Sadaqah chrome. True when any
   * method inspects a chart-wide operation, recast, or displays full_shield_tabs.
   * Named-house checks (H4, H9, H15) do NOT set this. Independent of pairing.
   * Recast does set this: the original 16 is a prerequisite, not cancelled. */
  showFullShieldTabs: boolean;
  /** True when ANY method explicitly displays mothers_and_pairing.
   * Does not require every method to be pairing, and does not look up a question id. */
  showPairingWorking: boolean;
  /** True when ANY method displays recast_working or inspects recast.
   * Independent of Full Chart: recast working does not hide original-chart tabs. */
  showRecastWorking: boolean;
  /** Unique union of named house numbers from methods that publish them. Sorted.
   * Original-chart named-house inspects only — never recast mother/then houses. */
  namedHouses: number[];
  /** Unique union of original-chart houses taken as new Mothers. Sorted. */
  recastMotherHouses: number[];
  /** Unique union of NEW-chart named houses from recast.then. Sorted. */
  recastThenHouses: number[];
}

function effectivePublicCasting(method: { casting?: PublicCastingMeta }): PublicCastingMeta {
  return method.casting ?? publicCastingDefault();
}

function uniqueSorted(nums: number[]): number[] {
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

/**
 * Question-level presentation from method metadata. Union, never flatten:
 * pairing, full-shield, recast, and named-house flags are independent.
 * A mixed chapter keeps per-method inspects; showPairingWorking is true when
 * ANY method is mothers_and_pairing, not only when every method is.
 * Unannotated methods use the product default (full-shield tabs), which is
 * not a source claim.
 *
 * Recast is application-derived. userGenerates stays four_mothers (or mixed
 * if other methods disagree). Recast mother houses and then-houses are
 * collected separately from namedHouses so original H13 and new-chart H13
 * cannot be confused.
 *
 * Pure: takes public method rows only — no QUESTION_REGISTRY, no quotes,
 * no question-id special cases.
 */
export function resolveQuestionCasting(
  question: { methods: Array<{ casting?: PublicCastingMeta }> } | undefined | null,
): QuestionCastingResolution {
  const methods = question?.methods ?? [];
  if (methods.length === 0) {
    return {
      userGenerates: 'four_mothers',
      display: 'full_shield_tabs',
      showFullShieldTabs: true,
      showPairingWorking: false,
      showRecastWorking: false,
      namedHouses: [],
      recastMotherHouses: [],
      recastThenHouses: [],
    };
  }

  const effective = methods.map(effectivePublicCasting);
  const userKinds = new Set(effective.map((e) => e.userGenerates));
  const displayKinds = new Set(effective.map((e) => e.display));

  const showPairingWorking = effective.some((e) => e.display === 'mothers_and_pairing');
  const showRecastWorking = effective.some((e) => e.display === 'recast_working' || e.inspects === 'recast');
  const anyFullShieldDisplay = effective.some((e) => e.display === 'full_shield_tabs');
  const anyFullChartInspect = effective.some((e) => FULL_CHART_INSPECTS.has(e.inspects));
  const showFullShieldTabs = anyFullShieldDisplay || anyFullChartInspect;

  const houseBag: number[] = [];
  const recastMotherBag: number[] = [];
  const recastThenBag: number[] = [];
  for (const e of effective) {
    if (e.houses) {
      for (const h of e.houses) houseBag.push(h);
    }
    if (e.recastMotherHouses) {
      for (const h of e.recastMotherHouses) recastMotherBag.push(h);
    }
    if (e.recastThenHouses) {
      for (const h of e.recastThenHouses) recastThenBag.push(h);
    }
  }
  const namedHouses = uniqueSorted(houseBag);
  const recastMotherHouses = uniqueSorted(recastMotherBag);
  const recastThenHouses = uniqueSorted(recastThenBag);

  const userGenerates: UserCastInput['kind'] | 'mixed' =
    userKinds.size === 1 ? Array.from(userKinds)[0]! : 'mixed';

  let display: ResultDisplay['kind'];
  if (showPairingWorking && !showFullShieldTabs && !showRecastWorking) {
    display = 'mothers_and_pairing';
  } else if (showFullShieldTabs) {
    display = 'full_shield_tabs';
  } else if (displayKinds.size === 1) {
    display = Array.from(displayKinds)[0]!;
  } else {
    display = 'full_shield_tabs';
  }

  return {
    userGenerates,
    display,
    showFullShieldTabs,
    showPairingWorking,
    showRecastWorking,
    namedHouses,
    recastMotherHouses,
    recastThenHouses,
  };
}
