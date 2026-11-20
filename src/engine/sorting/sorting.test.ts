import { describe, expect, it } from 'vitest';
import { generateInput, INPUT_KINDS, type InputKind } from '../rng';
import { SORT_ALGORITHMS } from './algorithms';
import { applyEvent, countOperations, eventCost, initialState, recordSort } from './trace';
import { SORT_IDS, type SortEvent } from './types';

const SIZES = [0, 1, 2, 3, 5, 8, 13, 32, 64];
const SEEDS = 20;

const reference = (input: readonly number[]) => [...input].sort((a, b) => a - b);

/** Every (kind, n, seed) input the property tests run over. */
function* inputs(): Generator<{ kind: InputKind; n: number; seed: number; input: number[] }> {
  for (const kind of INPUT_KINDS) {
    for (const n of SIZES) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        yield { kind, n, seed, input: generateInput(kind, n, seed * 7919 + n) };
      }
    }
  }
}

function indicesOf(e: SortEvent): number[] {
  switch (e.type) {
    case 'compare':
    case 'swap':
      return [e.i, e.j];
    case 'compareKey':
    case 'read':
    case 'sorted':
      return [e.i];
    case 'write':
      return e.from === undefined ? [e.i] : [e.i, e.from];
    case 'pivot':
      return e.i === null ? [] : [e.i];
    case 'range':
      return e.lo <= e.hi ? [e.lo, e.hi] : [];
    default:
      return [];
  }
}

describe.each(SORT_IDS.map(id => [SORT_ALGORITHMS[id].name, SORT_ALGORITHMS[id]] as const))('%s', (_name, algo) => {
  it('sorts every seeded input (output equals a reference sort, so the multiset is preserved)', () => {
    let cases = 0;
    for (const { input } of inputs()) {
      const work = input.slice();
      for (const _ of algo.run(work)) {
        /* drain */
      }
      expect(work).toEqual(reference(input));
      cases++;
    }
    expect(cases).toBe(INPUT_KINDS.length * SIZES.length * SEEDS);
  });

  it('replaying the trace reproduces the output', () => {
    for (const { input } of inputs()) {
      const trace = recordSort(algo, input);
      expect(trace.final).toEqual(reference(input));
      expect(trace.frame(trace.length - 1).array).toEqual(trace.final);
    }
  });

  it('marks an index sorted only when it already holds its final value', () => {
    const bad: string[] = [];
    for (const { input } of inputs()) {
      const expected = reference(input);
      const state = initialState(input);
      for (const e of algo.run(input.slice())) {
        applyEvent(state, e);
        if (e.type === 'sorted' && state.array[e.i] !== expected[e.i]) bad.push(`${JSON.stringify(input)}: A[${e.i}]`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('ends with done, every index final and the markers cleared', () => {
    for (const { input } of inputs()) {
      const trace = recordSort(algo, input);
      expect(trace.events[trace.events.length - 1].type).toBe('done');
      expect(trace.events.filter(e => e.type === 'done')).toHaveLength(1);
      const last = trace.frame(trace.length - 1);
      expect(Array.from(last.sorted).every(v => v === 1)).toBe(true);
      expect(last.pivot).toBeNull();
      expect(last.range).toBeNull();
    }
  });

  it('only touches in-bounds indices and points at real pseudocode lines', () => {
    const bad: string[] = [];
    for (const { input } of inputs()) {
      for (const e of algo.run(input.slice())) {
        if (indicesOf(e).some(i => i < 0 || i >= input.length)) bad.push(`index out of range: ${JSON.stringify(e)} (n=${input.length})`);
        if (e.line < 1 || e.line > algo.pseudocode.length) bad.push(`bad line: ${JSON.stringify(e)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('counters are the running sum of event costs', () => {
    for (const { input } of inputs()) {
      const trace = recordSort(algo, input);
      const run = { comparisons: 0, swaps: 0, writes: 0, reads: 0 };
      let mismatches = 0;
      trace.events.forEach((e, k) => {
        const c = eventCost(e);
        run.comparisons += c.comparisons;
        run.swaps += c.swaps;
        run.writes += c.writes;
        run.reads += c.reads;
        const got = trace.counters(k + 1);
        if (got.comparisons !== run.comparisons || got.swaps !== run.swaps || got.writes !== run.writes || got.reads !== run.reads) mismatches++;
      });
      expect(mismatches).toBe(0);
      expect(countOperations(algo, input)).toEqual(trace.counters(trace.length - 1));
    }
  });

  it('random-access frames equal a sequential replay', () => {
    const input = generateInput('random', 48, 2024);
    const trace = recordSort(algo, input);
    const state = initialState(input);
    const snapshots = [state.array.slice()];
    for (const e of trace.events) {
      applyEvent(state, e);
      snapshots.push(state.array.slice());
    }
    // seek backwards, forwards and across checkpoints in a scrambled order
    const ks = [trace.length - 1, 0, Math.floor(trace.length / 2), 1, 257, 256, 255, trace.length - 2, 3, 900];
    for (const k of ks) {
      if (k < 0 || k >= trace.length) continue;
      expect(trace.frame(k).array).toEqual(snapshots[k]);
    }
    for (let k = 0; k < trace.length; k += 7) expect(trace.frame(k).array).toEqual(snapshots[k]);
  });
});

describe('exact operation counts', () => {
  const ascending = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

  it('bubble and selection sort always make n(n−1)/2 comparisons', () => {
    for (const n of [1, 2, 5, 17, 40]) {
      for (const kind of INPUT_KINDS) {
        const input = generateInput(kind, n, n * 31);
        expect(countOperations(SORT_ALGORITHMS.bubble, input).comparisons).toBe((n * (n - 1)) / 2);
        expect(countOperations(SORT_ALGORITHMS.selection, input).comparisons).toBe((n * (n - 1)) / 2);
      }
    }
  });

  it('insertion sort is linear on sorted input and quadratic on reversed distinct input', () => {
    for (const n of [2, 10, 50]) {
      expect(countOperations(SORT_ALGORITHMS.insertion, ascending(n)).comparisons).toBe(n - 1);
      expect(countOperations(SORT_ALGORITHMS.insertion, ascending(n).reverse()).comparisons).toBe((n * (n - 1)) / 2);
    }
  });

  it('quick sort with a last-element pivot hits its worst case on sorted input', () => {
    for (const n of [2, 10, 50]) {
      expect(countOperations(SORT_ALGORITHMS.quick, ascending(n)).comparisons).toBe((n * (n - 1)) / 2);
    }
  });

  it('merge sort makes at most n⌈log₂ n⌉ comparisons', () => {
    for (const n of [2, 3, 7, 16, 33, 100]) {
      for (let seed = 1; seed <= 10; seed++) {
        const c = countOperations(SORT_ALGORITHMS.merge, generateInput('random', n, seed)).comparisons;
        expect(c).toBeLessThanOrEqual(n * Math.ceil(Math.log2(n)));
      }
    }
  });

  it('radix sort only compares while finding the maximum', () => {
    for (const n of [1, 9, 64]) {
      expect(countOperations(SORT_ALGORITHMS.radix, generateInput('random', n, 5)).comparisons).toBe(n - 1);
    }
  });
});
