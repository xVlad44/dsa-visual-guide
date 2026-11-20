import type { Counters, SortAlgorithm, SortEvent } from './types';

/** Mutable replay state. */
export interface SortState {
  array: number[];
  /** 1 when the element at that index holds its final value */
  sorted: Uint8Array;
  pivot: number | null;
  range: [number, number] | null;
}

/** One frame of a replay: the state after `index` events, plus the event that produced it. */
export interface SortFrame extends SortState {
  index: number;
  event: SortEvent | null;
  counters: Counters;
}

export function initialState(input: readonly number[]): SortState {
  return { array: input.slice(), sorted: new Uint8Array(input.length), pivot: null, range: null };
}

function cloneState(s: SortState): SortState {
  return { array: s.array.slice(), sorted: s.sorted.slice(), pivot: s.pivot, range: s.range };
}

/** Applies one event to the state. This is the only place replay semantics live. */
export function applyEvent(s: SortState, e: SortEvent): void {
  switch (e.type) {
    case 'swap': {
      const t = s.array[e.i];
      s.array[e.i] = s.array[e.j];
      s.array[e.j] = t;
      // the pivot marker follows the element, not the slot
      if (s.pivot === e.i) s.pivot = e.j;
      else if (s.pivot === e.j) s.pivot = e.i;
      break;
    }
    case 'write':
      s.array[e.i] = e.value;
      break;
    case 'pivot':
      s.pivot = e.i;
      break;
    case 'range':
      s.range = e.lo <= e.hi ? [e.lo, e.hi] : null;
      break;
    case 'sorted':
      s.sorted[e.i] = 1;
      if (s.pivot === e.i) s.pivot = null;
      break;
    case 'done':
      s.sorted.fill(1);
      s.pivot = null;
      s.range = null;
      break;
    default:
      // compare / compareKey / compareAux / read change nothing
      break;
  }
}

/** Cost of one event in each counter (see Counters for the definitions). */
export function eventCost(e: SortEvent): Counters {
  switch (e.type) {
    case 'compare':
      return { comparisons: 1, swaps: 0, writes: 0, reads: 2 };
    case 'compareKey':
      return { comparisons: 1, swaps: 0, writes: 0, reads: 1 };
    case 'compareAux':
      return { comparisons: 1, swaps: 0, writes: 0, reads: 0 };
    case 'read':
      return { comparisons: 0, swaps: 0, writes: 0, reads: 1 };
    case 'swap':
      return { comparisons: 0, swaps: 1, writes: 2, reads: 2 };
    case 'write':
      return { comparisons: 0, swaps: 0, writes: 1, reads: e.from === undefined ? 0 : 1 };
    default:
      return { comparisons: 0, swaps: 0, writes: 0, reads: 0 };
  }
}

/**
 * A recorded run with random access to any frame.
 *
 * Seeking is O(C + n): the state is snapshotted every C events, so frame k is
 * rebuilt from the nearest snapshot. Stepping forward from the last frame is
 * O(1) amortised. Counters are prefix sums, so they are O(1) for any frame.
 */
export class SortTrace {
  readonly initial: number[];
  readonly events: SortEvent[];
  /** array after all events: equal to the algorithm's own output */
  readonly final: number[];
  private readonly every: number;
  private readonly checkpoints: SortState[] = [];
  private readonly prefix: { comparisons: Int32Array; swaps: Int32Array; writes: Int32Array; reads: Int32Array };
  private cursor: SortState & { index: number };

  constructor(initial: readonly number[], events: SortEvent[], checkpointEvery = 256) {
    this.initial = initial.slice();
    this.events = events;
    this.every = Math.max(1, checkpointEvery);
    const len = events.length + 1;
    this.prefix = {
      comparisons: new Int32Array(len),
      swaps: new Int32Array(len),
      writes: new Int32Array(len),
      reads: new Int32Array(len),
    };
    const s = initialState(initial);
    for (let k = 0; k < events.length; k++) {
      if (k % this.every === 0) this.checkpoints.push(cloneState(s));
      const c = eventCost(events[k]);
      this.prefix.comparisons[k + 1] = this.prefix.comparisons[k] + c.comparisons;
      this.prefix.swaps[k + 1] = this.prefix.swaps[k] + c.swaps;
      this.prefix.writes[k + 1] = this.prefix.writes[k] + c.writes;
      this.prefix.reads[k + 1] = this.prefix.reads[k] + c.reads;
      applyEvent(s, events[k]);
    }
    if (events.length % this.every === 0) this.checkpoints.push(cloneState(s));
    this.final = s.array.slice();
    this.cursor = { ...initialState(initial), index: 0 };
  }

  /** Number of frames: one before the first event, one after each event. */
  get length(): number {
    return this.events.length + 1;
  }

  counters(k: number): Counters {
    const i = Math.max(0, Math.min(k, this.events.length));
    return {
      comparisons: this.prefix.comparisons[i],
      swaps: this.prefix.swaps[i],
      writes: this.prefix.writes[i],
      reads: this.prefix.reads[i],
    };
  }

  frame(k: number): SortFrame {
    const target = Math.max(0, Math.min(Math.floor(k), this.events.length));
    const ahead = target - this.cursor.index;
    if (ahead < 0 || ahead > this.every) {
      const cp = Math.floor(target / this.every);
      this.cursor = { ...cloneState(this.checkpoints[cp]), index: cp * this.every };
    }
    while (this.cursor.index < target) {
      applyEvent(this.cursor, this.events[this.cursor.index]);
      this.cursor.index++;
    }
    return {
      index: target,
      array: this.cursor.array.slice(),
      sorted: this.cursor.sorted.slice(),
      pivot: this.cursor.pivot,
      range: this.cursor.range,
      event: target > 0 ? this.events[target - 1] : null,
      counters: this.counters(target),
    };
  }
}

export class TraceLimitError extends Error {
  constructor(limit: number) {
    super(`trace exceeded ${limit} events`);
  }
}

/** Runs an algorithm on a copy of the input and records every event. */
export function recordSort(algo: SortAlgorithm, input: readonly number[], maxEvents = 2_000_000): SortTrace {
  const work = input.slice();
  const events: SortEvent[] = [];
  for (const e of algo.run(work)) {
    events.push(e);
    if (events.length > maxEvents) throw new TraceLimitError(maxEvents);
  }
  return new SortTrace(input, events);
}

/** Totals only, without storing the trace: used for the operations-vs-n chart. */
export function countOperations(algo: SortAlgorithm, input: readonly number[]): Counters {
  const total: Counters = { comparisons: 0, swaps: 0, writes: 0, reads: 0 };
  for (const e of algo.run(input.slice())) {
    const c = eventCost(e);
    total.comparisons += c.comparisons;
    total.swaps += c.swaps;
    total.writes += c.writes;
    total.reads += c.reads;
  }
  return total;
}

/** Human description of an event, for the status line. */
export function describeSortEvent(e: SortEvent | null, array: readonly number[]): string {
  if (!e) return 'Ready. Press play or step forward.';
  switch (e.type) {
    case 'compare':
      return `Compare A[${e.i}] = ${array[e.i]} with A[${e.j}] = ${array[e.j]}`;
    case 'compareKey':
      return `Compare A[${e.i}] = ${array[e.i]} with ${e.key}`;
    case 'compareAux':
      return `Compare aux[${e.i}] = ${e.a} with aux[${e.j}] = ${e.b}`;
    case 'read':
      return `Read A[${e.i}] = ${array[e.i]}`;
    case 'swap':
      return `Swap A[${e.i}] and A[${e.j}]`;
    case 'write':
      return e.from === undefined ? `Write ${e.value} to A[${e.i}]` : `Shift A[${e.from}] = ${e.value} to A[${e.i}]`;
    case 'pivot':
      return e.i === null ? 'Clear marker' : `Mark A[${e.i}] = ${array[e.i]}`;
    case 'range':
      return e.lo <= e.hi ? `Work on A[${e.lo}..${e.hi}]` : 'Clear range';
    case 'sorted':
      return `A[${e.i}] = ${array[e.i]} is in its final position`;
    case 'done':
      return 'Sorted.';
  }
}
