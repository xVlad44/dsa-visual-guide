import { describe, expect, it } from 'vitest';
import { hanoi, initialTowers, replayHanoi } from './hanoi';
import { isValidQueens, nQueens, recordQueens, QUEENS_PSEUDOCODE } from './nqueens';
import { canPlace, emptyBoard, findConflict, isSolved, makePuzzle, recordSudoku, sudokuFrame, type Board } from './sudoku';

/** All permutations of 0..n-1 in lexicographic order (the brute-force reference). */
function* permutations(n: number): Generator<number[]> {
  const p = Array.from({ length: n }, (_, i) => i);
  yield p.slice();
  for (;;) {
    let i = n - 2;
    while (i >= 0 && p[i] >= p[i + 1]) i--;
    if (i < 0) return;
    let j = n - 1;
    while (p[j] <= p[i]) j--;
    [p[i], p[j]] = [p[j], p[i]];
    p.splice(i + 1, n - i - 1, ...p.slice(i + 1).reverse());
    yield p.slice();
  }
}

function solutionsOf(n: number): number[][] {
  const out: number[][] = [];
  for (const e of nQueens(n)) if (e.type === 'solution') out.push(e.cols);
  return out;
}

describe('N-Queens', () => {
  it('finds exactly the solutions a brute-force search finds (n = 1..8)', () => {
    for (let n = 1; n <= 8; n++) {
      const brute = [...permutations(n)].filter(isValidQueens).map(p => p.join(','));
      const found = solutionsOf(n).map(s => s.join(','));
      expect(found).toEqual(brute); // same set, same (lexicographic) order
    }
  });

  it('every reported solution is valid and none repeats', () => {
    for (let n = 1; n <= 9; n++) {
      const sols = solutionsOf(n);
      sols.forEach(s => expect(isValidQueens(s)).toBe(true));
      expect(new Set(sols.map(s => s.join(','))).size).toBe(sols.length);
    }
  });

  it('first-solution mode stops on the lexicographically first solution', () => {
    for (let n = 4; n <= 10; n++) {
      const frames = recordQueens(n, true);
      const last = frames[frames.length - 1];
      expect(last.solutions).toBe(1);
      expect(last.cols).toEqual(solutionsOf(n)[0]);
    }
  });

  it('reports no solution for n = 2 and n = 3 and leaves the board empty', () => {
    for (const n of [2, 3]) {
      const frames = recordQueens(n, true);
      const last = frames[frames.length - 1];
      expect(last.solutions).toBe(0);
      expect(last.cols.every(c => c === -1)).toBe(true);
    }
  });

  it('places and removes in balance, on real pseudocode lines', () => {
    for (let n = 1; n <= 7; n++) {
      let depth = 0;
      for (const e of nQueens(n)) {
        if (e.type === 'place') depth++;
        if (e.type === 'remove') depth--;
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(e.line).toBeLessThanOrEqual(QUEENS_PSEUDOCODE.length);
      }
      expect(depth).toBe(0);
    }
  });
});

describe('Sudoku', () => {
  const agreesWithGivens = (givens: Board, result: Board) =>
    givens.every((row, r) => row.every((v, c) => v === 0 || result[r][c] === v));

  it('solves seeded generated puzzles (4×4, 6×6, 9×9) consistently with the givens', () => {
    for (const size of [4, 6, 9]) {
      for (let seed = 1; seed <= 15; seed++) {
        const givens = makePuzzle(size, seed);
        expect(findConflict(givens)).toBeNull();
        const run = recordSudoku(givens);
        expect(run.solved).toBe(true);
        expect(isSolved(run.result)).toBe(true);
        expect(agreesWithGivens(givens, run.result)).toBe(true);
        if (!run.truncated) expect(sudokuFrame(run, run.events.length).board).toEqual(run.result);
      }
    }
  });

  it('every placement in the trace is legal at the moment it is made', () => {
    const run = recordSudoku(makePuzzle(6, 3));
    const board = run.givens.map(r => r.slice());
    for (const e of run.events) {
      if (e.type === 'place') {
        expect(canPlace(board, e.row, e.col, e.value)).toBe(true);
        board[e.row][e.col] = e.value;
      } else if (e.type === 'clear') {
        board[e.row][e.col] = 0;
      }
    }
  });

  it('rejects clashing givens without searching', () => {
    const b = emptyBoard(4);
    b[0][0] = 1;
    b[0][3] = 1;
    const run = recordSudoku(b);
    expect(run.solved).toBe(false);
    expect(run.events).toEqual([{ type: 'done', solved: false, line: 9 }]);
  });

  it('detects a consistent but unsolvable board', () => {
    // cell (0,3) has no candidate: row has 1,2; column has 4,3
    const b: Board = [
      [1, 2, 0, 0],
      [0, 0, 0, 4],
      [0, 0, 0, 3],
      [0, 0, 0, 0],
    ];
    expect(findConflict(b)).toBeNull();
    const run = recordSudoku(b);
    expect(run.solved).toBe(false);
    expect(run.result).toEqual(b);
  });

  it('keeps only the first `limit` events but still returns the answer', () => {
    const run = recordSudoku(makePuzzle(9, 4), 50);
    expect(run.events).toHaveLength(50);
    expect(run.truncated).toBe(true);
    expect(run.total).toBeGreaterThan(50);
    expect(isSolved(run.result)).toBe(true);
  });
});

describe('Tower of Hanoi', () => {
  it('takes 2^n − 1 legal moves and ends with every disk on peg C', () => {
    for (let n = 1; n <= 10; n++) {
      const moves = [...hanoi(n)];
      expect(moves).toHaveLength(2 ** n - 1);
      const states = replayHanoi(n, moves); // throws on an illegal move
      expect(states[states.length - 1]).toEqual([[], [], initialTowers(n)[0]]);
      moves.forEach(m => expect(m.depth).toBeLessThanOrEqual(n));
    }
  });

  it('replayHanoi rejects an illegal move', () => {
    expect(() => replayHanoi(2, [{ disk: 2, from: 0, to: 2, depth: 1 }])).toThrow();
  });
});
