/**
 * Sorting trace vocabulary. An algorithm is a generator that sorts its input in
 * place and yields one event per elementary operation. The UI never runs the
 * algorithm itself: it replays these events (see trace.ts).
 *
 * `line` is the 1-based pseudocode line the operation belongs to.
 */
export type SortEvent =
  /** compare a[i] with a[j] */
  | { type: 'compare'; i: number; j: number; line: number }
  /** compare a[i] with a value held in a variable (key, pivot, running max) */
  | { type: 'compareKey'; i: number; key: number; line: number }
  /** compare two values in the auxiliary buffer (merge sort); i, j are buffer positions */
  | { type: 'compareAux'; i: number; j: number; a: number; b: number; line: number }
  /** load a[i] into a variable or an auxiliary buffer */
  | { type: 'read'; i: number; line: number }
  | { type: 'swap'; i: number; j: number; line: number }
  /** a[i] = value; `from` is set when the value is copied straight from a[from] */
  | { type: 'write'; i: number; value: number; from?: number; line: number }
  /** highlight a special element (quick sort pivot, selection sort minimum); null clears */
  | { type: 'pivot'; i: number | null; line: number }
  /** active subarray, inclusive; lo > hi clears it */
  | { type: 'range'; lo: number; hi: number; line: number }
  /** a[i] now holds its final value */
  | { type: 'sorted'; i: number; line: number }
  | { type: 'done'; line: number };

/**
 * Operation counters, derived only from events:
 *  - comparisons: compare + compareKey + compareAux
 *  - swaps: swap events
 *  - writes: element assignments into the main array (a swap is 2 writes)
 *  - reads: element reads from the main array (compare 2, compareKey 1, read 1,
 *    swap 2, write 1 when copied from another index). Aux-buffer reads are not counted.
 */
export interface Counters {
  comparisons: number;
  swaps: number;
  writes: number;
  reads: number;
}

export interface Complexity {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export const SORT_IDS = ['bubble', 'insertion', 'selection', 'merge', 'quick', 'heap', 'radix', 'bucket'] as const;
export type SortId = (typeof SORT_IDS)[number];

export interface SortAlgorithm {
  id: SortId;
  name: string;
  /** one-line description of the strategy */
  summary: string;
  complexity: Complexity;
  pseudocode: readonly string[];
  /** reference growth shape for the "operations vs n" chart, plus its label */
  growth: (n: number) => number;
  growthLabel: string;
  /** Sorts `a` in place, yielding one event per elementary operation. */
  run(a: number[]): Generator<SortEvent, void, undefined>;
}
