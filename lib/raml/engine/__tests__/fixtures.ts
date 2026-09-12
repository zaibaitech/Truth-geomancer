// A hand-verified, non-random chart used across the engine test suite.
// Mothers chosen for variety (16 distinct-ish resulting figures, not the
// degenerate all-Populus/all-Via case), and every house below was checked
// by hand against the addition rule (same parity -> double, different ->
// single) before being relied on in assertions elsewhere in this suite.
import { buildChart } from '../../casting';
import type { Pattern } from '@/content/stars';

export const FIXTURE_MOTHERS: [Pattern, Pattern, Pattern, Pattern] = [
  [1, 1, 2, 1], // Yussif
  [1, 2, 2, 2], // Adam
  [2, 1, 1, 1], // Mahadi
  [2, 2, 1, 2], // Iddris
];

export function fixtureChart() {
  return buildChart(FIXTURE_MOTHERS);
}

// Expected star id per house, hand-derived — see the PR/commit description
// for the worked arithmetic. Index 0 = H1.
export const FIXTURE_STAR_IDS = [
  'yussif', // H1
  'adam', // H2
  'mahadi', // H3
  'iddris', // H4
  'kalla-allahu', // H5
  'issah', // H6
  'nuhu', // H7
  'issah', // H8
  'usman', // H9
  'usman', // H10
  'ali', // H11
  'sulemana', // H12
  'musah', // H13
  'ibrahim', // H14
  'ibrahim', // H15
  'iddris', // H16
];
