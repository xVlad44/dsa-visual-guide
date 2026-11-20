import type { SortAlgorithm, SortEvent, SortId } from './types';

type Gen = Generator<SortEvent, void, undefined>;

function swapIn(a: number[], i: number, j: number) {
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
}

const log2 = (n: number) => (n <= 1 ? 0 : Math.log2(n));

/* ------------------------------------------------------------------ bubble */

const bubble: SortAlgorithm = {
  id: 'bubble',
  name: 'Bubble sort',
  summary: 'Repeatedly swaps adjacent out-of-order pairs; each pass bubbles the largest remaining value to the end.',
  complexity: { best: 'Θ(n²)', average: 'Θ(n²)', worst: 'Θ(n²)', space: 'O(1)' },
  growth: n => n * n,
  growthLabel: 'n²',
  pseudocode: [
    'procedure bubbleSort(A, n)',
    '  for i ← 0 to n − 2',
    '    for j ← 0 to n − i − 2',
    '      if A[j] > A[j + 1]',
    '        swap A[j], A[j + 1]',
    '    A[n − i − 1] is in place',
    '  A[0] is in place',
  ],
  *run(a): Gen {
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        yield { type: 'compare', i: j, j: j + 1, line: 4 };
        if (a[j] > a[j + 1]) {
          swapIn(a, j, j + 1);
          yield { type: 'swap', i: j, j: j + 1, line: 5 };
        }
      }
      yield { type: 'sorted', i: n - i - 1, line: 6 };
    }
    if (n > 0) yield { type: 'sorted', i: 0, line: 7 };
    yield { type: 'done', line: 7 };
  },
};

/* --------------------------------------------------------------- insertion */

/** Shared by insertion sort and the per-bucket pass of bucket sort. */
function* insertionRange(a: number[], lo: number, hi: number, lines: { key: number; cmp: number; shift: number; place: number }): Gen {
  for (let i = lo + 1; i <= hi; i++) {
    const key = a[i];
    yield { type: 'read', i, line: lines.key };
    let j = i - 1;
    while (j >= lo) {
      yield { type: 'compareKey', i: j, key, line: lines.cmp };
      if (!(a[j] > key)) break;
      a[j + 1] = a[j];
      yield { type: 'write', i: j + 1, value: a[j], from: j, line: lines.shift };
      j--;
    }
    a[j + 1] = key;
    yield { type: 'write', i: j + 1, value: key, line: lines.place };
  }
}

const insertion: SortAlgorithm = {
  id: 'insertion',
  name: 'Insertion sort',
  summary: 'Grows a sorted prefix by shifting each new element left until it fits.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  growth: n => n * n,
  growthLabel: 'n²',
  pseudocode: [
    'procedure insertionSort(A, n)',
    '  for i ← 1 to n − 1',
    '    key ← A[i]',
    '    j ← i − 1',
    '    while j ≥ 0 and A[j] > key',
    '      A[j + 1] ← A[j]',
    '      j ← j − 1',
    '    A[j + 1] ← key',
  ],
  *run(a): Gen {
    const n = a.length;
    for (let i = 1; i < n; i++) {
      yield { type: 'range', lo: 0, hi: i, line: 2 };
      // one step of the outer loop: insert a[i] into a[0..i-1]
      yield* insertionStep(a, i);
    }
    yield { type: 'done', line: 8 };
  },
};

function* insertionStep(a: number[], i: number): Gen {
  const key = a[i];
  yield { type: 'read', i, line: 3 };
  let j = i - 1;
  while (j >= 0) {
    yield { type: 'compareKey', i: j, key, line: 5 };
    if (!(a[j] > key)) break;
    a[j + 1] = a[j];
    yield { type: 'write', i: j + 1, value: a[j], from: j, line: 6 };
    j--;
  }
  a[j + 1] = key;
  yield { type: 'write', i: j + 1, value: key, line: 8 };
}

/* --------------------------------------------------------------- selection */

const selection: SortAlgorithm = {
  id: 'selection',
  name: 'Selection sort',
  summary: 'Finds the minimum of the unsorted suffix and swaps it into the next position.',
  complexity: { best: 'Θ(n²)', average: 'Θ(n²)', worst: 'Θ(n²)', space: 'O(1)' },
  growth: n => n * n,
  growthLabel: 'n²',
  pseudocode: [
    'procedure selectionSort(A, n)',
    '  for i ← 0 to n − 2',
    '    min ← i',
    '    for j ← i + 1 to n − 1',
    '      if A[j] < A[min]',
    '        min ← j',
    '    if min ≠ i',
    '      swap A[i], A[min]',
    '    A[i] is in place',
    '  A[n − 1] is in place',
  ],
  *run(a): Gen {
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      yield { type: 'pivot', i, line: 3 };
      for (let j = i + 1; j < n; j++) {
        yield { type: 'compare', i: j, j: min, line: 5 };
        if (a[j] < a[min]) {
          min = j;
          yield { type: 'pivot', i: min, line: 6 };
        }
      }
      if (min !== i) {
        swapIn(a, i, min);
        yield { type: 'swap', i, j: min, line: 8 };
      }
      yield { type: 'sorted', i, line: 9 };
    }
    if (n > 0) yield { type: 'sorted', i: n - 1, line: 10 };
    yield { type: 'done', line: 10 };
  },
};

/* ------------------------------------------------------------------- merge */

function* mergeRange(a: number[], aux: number[], lo: number, mid: number, hi: number, final: boolean): Gen {
  yield { type: 'range', lo, hi, line: 6 };
  for (let k = lo; k <= hi; k++) {
    aux[k] = a[k];
    yield { type: 'read', i: k, line: 8 };
  }
  let i = lo;
  let j = mid + 1;
  for (let k = lo; k <= hi; k++) {
    let value: number;
    let line: number;
    if (i > mid) {
      value = aux[j++];
      line = 11;
    } else if (j > hi) {
      value = aux[i++];
      line = 12;
    } else {
      yield { type: 'compareAux', i: j, j: i, a: aux[j], b: aux[i], line: 13 };
      if (aux[j] < aux[i]) {
        value = aux[j++];
        line = 13;
      } else {
        value = aux[i++];
        line = 14;
      }
    }
    a[k] = value;
    yield { type: 'write', i: k, value, line };
    // in the top-level merge every write lands in its final position
    if (final) yield { type: 'sorted', i: k, line };
  }
}

function* mergeSortRange(a: number[], aux: number[], lo: number, hi: number, n: number): Gen {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  yield { type: 'range', lo, hi, line: 3 };
  yield* mergeSortRange(a, aux, lo, mid, n);
  yield* mergeSortRange(a, aux, mid + 1, hi, n);
  yield* mergeRange(a, aux, lo, mid, hi, lo === 0 && hi === n - 1);
}

const merge: SortAlgorithm = {
  id: 'merge',
  name: 'Merge sort',
  summary: 'Splits the array in halves, sorts each recursively, then merges the two sorted halves.',
  complexity: { best: 'Θ(n log n)', average: 'Θ(n log n)', worst: 'Θ(n log n)', space: 'O(n)' },
  growth: n => n * log2(n),
  growthLabel: 'n log n',
  pseudocode: [
    'procedure mergeSort(A, lo, hi)',
    '  if lo ≥ hi then return',
    '  mid ← ⌊(lo + hi) / 2⌋',
    '  mergeSort(A, lo, mid)',
    '  mergeSort(A, mid + 1, hi)',
    '  merge(A, lo, mid, hi)',
    'procedure merge(A, lo, mid, hi)',
    '  aux[lo..hi] ← A[lo..hi]',
    '  i ← lo; j ← mid + 1',
    '  for k ← lo to hi',
    '    if i > mid: A[k] ← aux[j++]',
    '    else if j > hi: A[k] ← aux[i++]',
    '    else if aux[j] < aux[i]: A[k] ← aux[j++]',
    '    else: A[k] ← aux[i++]',
  ],
  *run(a): Gen {
    const n = a.length;
    const aux = new Array<number>(n);
    yield* mergeSortRange(a, aux, 0, n - 1, n);
    yield { type: 'done', line: 1 };
  },
};

/* ------------------------------------------------------------------- quick */

function* partition(a: number[], lo: number, hi: number): Generator<SortEvent, number, undefined> {
  const pivot = a[hi];
  yield { type: 'read', i: hi, line: 9 };
  yield { type: 'pivot', i: hi, line: 9 };
  let i = lo;
  for (let j = lo; j < hi; j++) {
    yield { type: 'compareKey', i: j, key: pivot, line: 12 };
    if (a[j] < pivot) {
      swapIn(a, i, j);
      yield { type: 'swap', i, j, line: 13 };
      i++;
    }
  }
  swapIn(a, i, hi);
  yield { type: 'swap', i, j: hi, line: 15 };
  return i;
}

function* quickSortRange(a: number[], lo: number, hi: number): Gen {
  if (lo > hi) return;
  if (lo === hi) {
    yield { type: 'sorted', i: lo, line: 3 };
    return;
  }
  yield { type: 'range', lo, hi, line: 4 };
  const p = yield* partition(a, lo, hi);
  yield { type: 'sorted', i: p, line: 5 };
  yield* quickSortRange(a, lo, p - 1);
  yield* quickSortRange(a, p + 1, hi);
}

const quick: SortAlgorithm = {
  id: 'quick',
  name: 'Quick sort',
  summary: 'Partitions around the last element (Lomuto), fixing the pivot in place, then recurses on both sides.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n) avg' },
  growth: n => n * log2(n),
  growthLabel: 'n log n',
  pseudocode: [
    'procedure quickSort(A, lo, hi)',
    '  if lo > hi then return',
    '  if lo = hi: A[lo] is in place; return',
    '  p ← partition(A, lo, hi)',
    '  A[p] is in place',
    '  quickSort(A, lo, p − 1)',
    '  quickSort(A, p + 1, hi)',
    'procedure partition(A, lo, hi)',
    '  pivot ← A[hi]',
    '  i ← lo',
    '  for j ← lo to hi − 1',
    '    if A[j] < pivot',
    '      swap A[i], A[j]',
    '      i ← i + 1',
    '  swap A[i], A[hi]',
    '  return i',
  ],
  *run(a): Gen {
    yield* quickSortRange(a, 0, a.length - 1);
    yield { type: 'done', line: 1 };
  },
};

/* -------------------------------------------------------------------- heap */

function* siftDown(a: number[], start: number, size: number): Gen {
  let i = start;
  for (;;) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < size) {
      yield { type: 'compare', i: l, j: largest, line: 12 };
      if (a[l] > a[largest]) largest = l;
    }
    if (r < size) {
      yield { type: 'compare', i: r, j: largest, line: 13 };
      if (a[r] > a[largest]) largest = r;
    }
    if (largest === i) return;
    swapIn(a, i, largest);
    yield { type: 'swap', i, j: largest, line: 15 };
    i = largest;
  }
}

const heap: SortAlgorithm = {
  id: 'heap',
  name: 'Heap sort',
  summary: 'Builds a max-heap in place, then repeatedly moves the root to the end and restores the heap.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
  growth: n => n * log2(n),
  growthLabel: 'n log n',
  pseudocode: [
    'procedure heapSort(A, n)',
    '  for i ← ⌊n / 2⌋ − 1 down to 0',
    '    siftDown(A, i, n)',
    '  for end ← n − 1 down to 1',
    '    swap A[0], A[end]',
    '    A[end] is in place',
    '    siftDown(A, 0, end)',
    '  A[0] is in place',
    'procedure siftDown(A, i, size)',
    '  loop',
    '    largest ← i; l ← 2i + 1; r ← 2i + 2',
    '    if l < size and A[l] > A[largest]: largest ← l',
    '    if r < size and A[r] > A[largest]: largest ← r',
    '    if largest = i then return',
    '    swap A[i], A[largest]',
    '    i ← largest',
  ],
  *run(a): Gen {
    const n = a.length;
    if (n > 1) yield { type: 'range', lo: 0, hi: n - 1, line: 2 };
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      yield* siftDown(a, i, n);
    }
    for (let end = n - 1; end > 0; end--) {
      swapIn(a, 0, end);
      yield { type: 'swap', i: 0, j: end, line: 5 };
      yield { type: 'sorted', i: end, line: 6 };
      yield { type: 'range', lo: 0, hi: end - 1, line: 7 };
      yield* siftDown(a, 0, end);
    }
    if (n > 0) yield { type: 'sorted', i: 0, line: 8 };
    yield { type: 'done', line: 8 };
  },
};

/* ------------------------------------------------------------------- radix */

function* findMax(a: number[], line: number): Generator<SortEvent, number, undefined> {
  let max = a[0];
  yield { type: 'read', i: 0, line };
  for (let i = 1; i < a.length; i++) {
    yield { type: 'compareKey', i, key: max, line };
    if (a[i] > max) max = a[i];
  }
  return max;
}

const radix: SortAlgorithm = {
  id: 'radix',
  name: 'Radix sort (LSD)',
  summary: 'Stable counting sort on each decimal digit, least significant first. Needs non-negative integers.',
  complexity: { best: 'O(d·(n + b))', average: 'O(d·(n + b))', worst: 'O(d·(n + b))', space: 'O(n + b)' },
  growth: n => n,
  growthLabel: 'n',
  pseudocode: [
    'procedure radixSort(A, n)          ▹ base b = 10',
    '  max ← maximum of A',
    '  for exp ← 1; ⌊max / exp⌋ > 0; exp ← exp · 10',
    '    count[0..9] ← 0',
    '    for i ← 0 to n − 1: count[digit(A[i])]++',
    '    turn count into prefix sums',
    '    for i ← n − 1 down to 0',
    '      out[−−count[digit(A[i])]] ← A[i]',
    '    for i ← 0 to n − 1: A[i] ← out[i]',
  ],
  *run(a): Gen {
    const n = a.length;
    if (n > 0) {
      const max = yield* findMax(a, 2);
      for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        const count = new Array<number>(10).fill(0);
        for (let i = 0; i < n; i++) {
          yield { type: 'read', i, line: 5 };
          count[Math.floor(a[i] / exp) % 10]++;
        }
        for (let d = 1; d < 10; d++) count[d] += count[d - 1];
        const out = new Array<number>(n);
        for (let i = n - 1; i >= 0; i--) {
          yield { type: 'read', i, line: 8 };
          const d = Math.floor(a[i] / exp) % 10;
          out[--count[d]] = a[i];
        }
        for (let i = 0; i < n; i++) {
          a[i] = out[i];
          yield { type: 'write', i, value: out[i], line: 9 };
        }
      }
    }
    yield { type: 'done', line: 9 };
  },
};

/* ------------------------------------------------------------------ bucket */

const bucket: SortAlgorithm = {
  id: 'bucket',
  name: 'Bucket sort',
  summary: 'Scatters values into ⌈√n⌉ value-range buckets, writes them back in order, then insertion-sorts each bucket.',
  complexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n²)', space: 'O(n + k)' },
  growth: n => n,
  growthLabel: 'n',
  pseudocode: [
    'procedure bucketSort(A, n)',
    '  k ← ⌈√n⌉; max ← maximum of A',
    '  for i ← 0 to n − 1',
    '    put A[i] into bucket ⌊A[i] · k / (max + 1)⌋',
    '  write the buckets back into A, in bucket order',
    '  for each bucket segment A[s..e]',
    '    insertion-sort A[s..e]',
    '    A[s..e] is in place',
  ],
  *run(a): Gen {
    const n = a.length;
    if (n > 0) {
      const k = Math.max(1, Math.ceil(Math.sqrt(n)));
      const max = yield* findMax(a, 2);
      const buckets: number[][] = Array.from({ length: k }, () => []);
      for (let i = 0; i < n; i++) {
        yield { type: 'read', i, line: 4 };
        buckets[Math.floor((a[i] * k) / (max + 1))].push(a[i]);
      }
      const segments: Array<[number, number]> = [];
      let pos = 0;
      for (const b of buckets) {
        if (b.length === 0) continue;
        const start = pos;
        for (const v of b) {
          a[pos] = v;
          yield { type: 'write', i: pos, value: v, line: 5 };
          pos++;
        }
        segments.push([start, pos - 1]);
      }
      for (const [s, e] of segments) {
        yield { type: 'range', lo: s, hi: e, line: 6 };
        yield* insertionRange(a, s, e, { key: 7, cmp: 7, shift: 7, place: 7 });
        for (let t = s; t <= e; t++) yield { type: 'sorted', i: t, line: 8 };
      }
    }
    yield { type: 'done', line: 8 };
  },
};

export const SORT_ALGORITHMS: Record<SortId, SortAlgorithm> = {
  bubble,
  insertion,
  selection,
  merge,
  quick,
  heap,
  radix,
  bucket,
};
