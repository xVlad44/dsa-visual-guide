/**
 * N-Queens by backtracking, one queen per row.
 * The board is `cols[row] = column` (or -1 for an empty row).
 */

export type QueensEvent =
  | { type: 'try'; row: number; col: number; line: number }
  | { type: 'conflict'; row: number; col: number; withRow: number; withCol: number; line: number }
  | { type: 'place'; row: number; col: number; line: number }
  | { type: 'remove'; row: number; col: number; line: number }
  | { type: 'solution'; cols: number[]; line: number }
  | { type: 'done'; line: number };

export const QUEENS_PSEUDOCODE = [
  'procedure solve(row)',
  '  if row = n: record solution; return',
  '  for col ← 0 to n − 1',
  '    if no queen attacks (row, col)',
  '      place a queen at (row, col)',
  '      solve(row + 1)',
  '      remove the queen from (row, col)',
] as const;

/** First queen (lowest row) that attacks (row, col), or null. */
function attacker(cols: number[], row: number, col: number): number | null {
  for (let r = 0; r < row; r++) {
    const c = cols[r];
    if (c === col || Math.abs(c - col) === row - r) return r;
  }
  return null;
}

export interface QueensOptions {
  /** stop after the first solution (the visualiser) or enumerate all (tests) */
  firstOnly?: boolean;
}

export function* nQueens(n: number, opts: QueensOptions = {}): Generator<QueensEvent, number, undefined> {
  const cols = new Array<number>(n).fill(-1);
  let found = 0;
  let stop = false;

  function* solve(row: number): Generator<QueensEvent, void, undefined> {
    if (row === n) {
      found++;
      yield { type: 'solution', cols: cols.slice(), line: 2 };
      if (opts.firstOnly) stop = true;
      return;
    }
    for (let col = 0; col < n && !stop; col++) {
      yield { type: 'try', row, col, line: 4 };
      const r = attacker(cols, row, col);
      if (r !== null) {
        yield { type: 'conflict', row, col, withRow: r, withCol: cols[r], line: 4 };
        continue;
      }
      cols[row] = col;
      yield { type: 'place', row, col, line: 5 };
      yield* solve(row + 1);
      if (stop) return;
      cols[row] = -1;
      yield { type: 'remove', row, col, line: 7 };
    }
  }

  yield* solve(0);
  yield { type: 'done', line: 1 };
  return found;
}

export interface QueensFrame {
  index: number;
  event: QueensEvent | null;
  cols: number[];
  /** cell under consideration */
  cursor: { row: number; col: number } | null;
  /** queen that blocks the cursor cell */
  blocker: { row: number; col: number } | null;
  solutions: number;
  placements: number;
  backtracks: number;
}

export function recordQueens(n: number, firstOnly = true): QueensFrame[] {
  const frames: QueensFrame[] = [];
  let cols = new Array<number>(n).fill(-1);
  let solutions = 0;
  let placements = 0;
  let backtracks = 0;
  frames.push({ index: 0, event: null, cols: cols.slice(), cursor: null, blocker: null, solutions, placements, backtracks });
  let k = 0;
  for (const e of nQueens(n, { firstOnly })) {
    k++;
    let cursor: QueensFrame['cursor'] = null;
    let blocker: QueensFrame['blocker'] = null;
    switch (e.type) {
      case 'try':
        cursor = { row: e.row, col: e.col };
        break;
      case 'conflict':
        cursor = { row: e.row, col: e.col };
        blocker = { row: e.withRow, col: e.withCol };
        break;
      case 'place':
        cols = cols.slice();
        cols[e.row] = e.col;
        placements++;
        cursor = { row: e.row, col: e.col };
        break;
      case 'remove':
        cols = cols.slice();
        cols[e.row] = -1;
        backtracks++;
        cursor = { row: e.row, col: e.col };
        break;
      case 'solution':
        solutions++;
        break;
    }
    frames.push({ index: k, event: e, cols, cursor, blocker, solutions, placements, backtracks });
  }
  return frames;
}

/** True when no two queens share a row, column or diagonal and every row has one. */
export function isValidQueens(cols: readonly number[]): boolean {
  const n = cols.length;
  for (let r = 0; r < n; r++) {
    if (cols[r] < 0 || cols[r] >= n) return false;
    for (let s = 0; s < r; s++) {
      if (cols[s] === cols[r] || Math.abs(cols[s] - cols[r]) === r - s) return false;
    }
  }
  return true;
}
