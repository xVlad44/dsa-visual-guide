import { generateInput, type InputKind } from '../rng';
import { countOperations } from './trace';
import type { SortAlgorithm } from './types';

export const SAMPLE_NS = [8, 16, 32, 64, 128, 256];
export const GROWTH_RUNS = 3;

export interface OpsPoint {
  n: number;
  measured: number;
  model: number;
}

/**
 * Runs the engine (counters only, no stored trace) for each sample size on
 * RUNS seeded inputs and averages comparisons + writes. The model curve is
 * c·f(n) with c fitted by least squares through the origin.
 */
export function measureGrowth(algo: SortAlgorithm, kind: InputKind, seed: number): { points: OpsPoint[]; c: number } {
  const measured = SAMPLE_NS.map(n => {
    let sum = 0;
    for (let r = 0; r < GROWTH_RUNS; r++) {
      const ops = countOperations(algo, generateInput(kind, n, seed + r));
      sum += ops.comparisons + ops.writes;
    }
    return sum / GROWTH_RUNS;
  });
  const f = SAMPLE_NS.map(n => algo.growth(n));
  const den = f.reduce((s, v) => s + v * v, 0);
  const c = den > 0 ? f.reduce((s, v, i) => s + v * measured[i], 0) / den : 0;
  return { points: SAMPLE_NS.map((n, i) => ({ n, measured: measured[i], model: c * f[i] })), c };
}
