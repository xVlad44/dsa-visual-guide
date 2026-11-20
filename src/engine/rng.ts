/**
 * Seedable randomness. Every input the visualiser shows is derived from a seed,
 * so a run can be reproduced exactly (and shared through the URL).
 */

export type Rng = () => number;

/** mulberry32: a small 32-bit PRNG. Same seed, same sequence, on every JS engine. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] (inclusive). */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Fisher-Yates shuffle into a new array. */
export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const INPUT_KINDS = ['random', 'nearly-sorted', 'reversed', 'few-unique', 'sorted'] as const;
export type InputKind = (typeof INPUT_KINDS)[number];

export const INPUT_LABELS: Record<InputKind, string> = {
  random: 'Random',
  'nearly-sorted': 'Nearly sorted',
  reversed: 'Reversed',
  'few-unique': 'Few unique',
  sorted: 'Already sorted',
};

/**
 * Deterministic array of n positive integers. Values stay in [1, max(99, n)],
 * which keeps radix sort at two or three digit passes and bars readable.
 */
export function generateInput(kind: InputKind, n: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const max = Math.max(99, n);
  switch (kind) {
    case 'random':
      return Array.from({ length: n }, () => randInt(rng, 1, max));
    case 'sorted':
    case 'reversed':
    case 'nearly-sorted': {
      const base = Array.from({ length: n }, () => randInt(rng, 1, max)).sort((a, b) => a - b);
      if (kind === 'reversed') return base.reverse();
      if (kind === 'nearly-sorted') {
        // swap roughly 5% of adjacent-ish pairs
        const swaps = Math.max(1, Math.round(n * 0.05));
        for (let s = 0; s < swaps && n > 1; s++) {
          const i = randInt(rng, 0, n - 2);
          const j = Math.min(n - 1, i + randInt(rng, 1, 3));
          [base[i], base[j]] = [base[j], base[i]];
        }
      }
      return base;
    }
    case 'few-unique': {
      const pool = Array.from({ length: 4 }, () => randInt(rng, 1, max));
      return Array.from({ length: n }, () => pool[randInt(rng, 0, pool.length - 1)]);
    }
  }
}

/** A fresh seed for the UI. Six digits keeps shared URLs short. */
export function newSeed(): number {
  return 100000 + Math.floor(Math.random() * 900000);
}
