import { mulberry32, shuffled } from '../rng';

/** 0 is an empty cell. Supported sizes: 4 (2×2 boxes), 6 (2×3), 9 (3×3). */
export type Board = number[][];
export const SUDOKU_SIZES = [4, 6, 9] as const;
export type SudokuSize = (typeof SUDOKU_SIZES)[number];

export function boxDims(size: number): { rows: number; cols: number } {
  if (size === 4) return { rows: 2, cols: 2 };
  if (size === 6) return { rows: 2, cols: 3 };
  return { rows: 3, cols: 3 };
}

export function emptyBoard(size: number): Board {
  return Array.from({ length: size }, () => new Array<number>(size).fill(0));
}

export function cloneBoard(b: Board): Board {
  return b.map(r => r.slice());
}

export function canPlace(b: Board, row: number, col: number, v: number): boolean {
  const size = b.length;
  for (let x = 0; x < size; x++) {
    if (x !== col && b[row][x] === v) return false;
    if (x !== row && b[x][col] === v) return false;
  }
  const { rows, cols } = boxDims(size);
  const r0 = row - (row % rows);
  const c0 = col - (col % cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const r = r0 + i;
      const c = c0 + j;
      if ((r !== row || c !== col) && b[r][c] === v) return false;
    }
  }
  return true;
}

/** First pair of clashing givens, or null when the givens are consistent. */
export function findConflict(b: Board): { row: number; col: number } | null {
  for (let r = 0; r < b.length; r++) {
    for (let c = 0; c < b.length; c++) {
      if (b[r][c] !== 0 && !canPlace(b, r, c, b[r][c])) return { row: r, col: c };
    }
  }
  return null;
}

/** Complete, in range and consistent. */
export function isSolved(b: Board): boolean {
  const size = b.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = b[r][c];
      if (!(v >= 1 && v <= size) || !canPlace(b, r, c, v)) return false;
    }
  }
  return true;
}

export type SudokuEvent =
  | { type: 'try'; row: number; col: number; value: number; ok: boolean; line: number }
  | { type: 'place'; row: number; col: number; value: number; line: number }
  | { type: 'clear'; row: number; col: number; line: number }
  | { type: 'done'; solved: boolean; line: number };

export const SUDOKU_PSEUDOCODE = [
  'procedure solve(board)',
  '  (r, c) ← first empty cell, row by row',
  '  if there is none then return true',
  '  for v ← 1 to N',
  '    if v is allowed at (r, c)',
  '      board[r][c] ← v',
  '      if solve(board) then return true',
  '      board[r][c] ← 0',
  '  return false',
] as const;

/** Backtracking solver. Mutates `b`; returns whether a solution was found. */
export function* solveSudoku(b: Board): Generator<SudokuEvent, boolean, undefined> {
  const size = b.length;

  function* solve(): Generator<SudokuEvent, boolean, undefined> {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (b[r][c] !== 0) continue;
        for (let v = 1; v <= size; v++) {
          const ok = canPlace(b, r, c, v);
          yield { type: 'try', row: r, col: c, value: v, ok, line: 5 };
          if (!ok) continue;
          b[r][c] = v;
          yield { type: 'place', row: r, col: c, value: v, line: 6 };
          if (yield* solve()) return true;
          b[r][c] = 0;
          yield { type: 'clear', row: r, col: c, line: 8 };
        }
        return false;
      }
    }
    return true;
  }

  const solved = findConflict(b) === null && (yield* solve());
  yield { type: 'done', solved, line: solved ? 3 : 9 };
  return solved;
}

export interface SudokuRun {
  givens: Board;
  /** stored events (the first `limit` of them) */
  events: SudokuEvent[];
  /** events the solver produced in total */
  total: number;
  truncated: boolean;
  solved: boolean;
  /** the solver hit maxSteps before finishing */
  limitReached: boolean;
  /** final board (solution, or the givens when unsolvable) */
  result: Board;
}

/**
 * Records a solve. Only the first `limit` events are kept so a pathological
 * puzzle can't exhaust memory; the solver still runs to the end (or to
 * `maxSteps`, after which the run counts as unsolved) and `result` holds its answer.
 */
export function recordSudoku(givens: Board, limit = 60_000, maxSteps = 5_000_000): SudokuRun {
  const work = cloneBoard(givens);
  const events: SudokuEvent[] = [];
  let total = 0;
  let solved = false;
  let limitReached = false;
  const gen = solveSudoku(work);
  for (;;) {
    const step = gen.next();
    // explicit casts: IteratorResult only narrows under strictNullChecks,
    // and the app tsconfig compiles this file without it
    if (step.done) {
      solved = step.value as boolean;
      break;
    }
    total++;
    if (events.length < limit) events.push(step.value as SudokuEvent);
    if (total > maxSteps) {
      limitReached = true;
      break;
    }
  }
  return { givens, events, total, truncated: total > events.length, solved, limitReached, result: solved ? work : cloneBoard(givens) };
}

export interface SudokuFrame {
  index: number;
  event: SudokuEvent | null;
  board: Board;
  cursor: { row: number; col: number } | null;
  placements: number;
  backtracks: number;
}

/** Board after the first k events (k ≤ events.length), rebuilt from the givens. */
export function sudokuFrame(run: SudokuRun, k: number): SudokuFrame {
  const board = cloneBoard(run.givens);
  let placements = 0;
  let backtracks = 0;
  const upto = Math.max(0, Math.min(k, run.events.length));
  for (let i = 0; i < upto; i++) {
    const e = run.events[i];
    if (e.type === 'place') {
      board[e.row][e.col] = e.value;
      placements++;
    } else if (e.type === 'clear') {
      board[e.row][e.col] = 0;
      backtracks++;
    }
  }
  const event = upto > 0 ? run.events[upto - 1] : null;
  const cursor = event && event.type !== 'done' ? { row: event.row, col: event.col } : null;
  return { index: upto, event, board, cursor, placements, backtracks };
}

/**
 * A solvable puzzle: solve the empty grid, relabel the digits with a seeded
 * permutation, then blank out cells. Solvable by construction (it may have
 * more than one solution).
 */
export function makePuzzle(size: number, seed: number, keep = size === 9 ? 0.42 : 0.5): Board {
  const rng = mulberry32(seed);
  const solved = emptyBoard(size);
  const gen = solveSudoku(solved);
  while (!gen.next().done) {
    /* drain */
  }
  const relabel = shuffled(Array.from({ length: size }, (_, i) => i + 1), rng);
  const cells = shuffled(
    Array.from({ length: size * size }, (_, i) => i),
    rng,
  );
  const givens = emptyBoard(size);
  const keepCount = Math.round(size * size * keep);
  for (let i = 0; i < keepCount; i++) {
    const r = Math.floor(cells[i] / size);
    const c = cells[i] % size;
    givens[r][c] = relabel[solved[r][c] - 1];
  }
  return givens;
}
