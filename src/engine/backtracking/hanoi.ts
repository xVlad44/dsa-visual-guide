export type Peg = 0 | 1 | 2;
export const PEG_NAMES = ['A', 'B', 'C'] as const;

export interface HanoiMove {
  disk: number;
  from: Peg;
  to: Peg;
  /** recursion depth of the call that makes this move (1 = outermost) */
  depth: number;
}

export const HANOI_PSEUDOCODE = [
  'procedure hanoi(n, from, to, via)',
  '  if n = 0 then return',
  '  hanoi(n − 1, from, via, to)',
  '  move disk n from `from` to `to`',
  '  hanoi(n − 1, via, to, from)',
] as const;

export function* hanoi(n: number, from: Peg = 0, to: Peg = 2, via: Peg = 1, depth = 1): Generator<HanoiMove, void, undefined> {
  if (n === 0) return;
  yield* hanoi(n - 1, from, via, to, depth + 1);
  yield { disk: n, from, to, depth };
  yield* hanoi(n - 1, via, to, from, depth + 1);
}

/** Pegs as stacks, bottom first. */
export type Towers = [number[], number[], number[]];

export function initialTowers(n: number): Towers {
  return [Array.from({ length: n }, (_, i) => n - i), [], []];
}

/**
 * Peg states after each move. towers[k] is the state after k moves.
 * Throws if a move is illegal, which the tests rely on.
 */
export function replayHanoi(n: number, moves: readonly HanoiMove[]): Towers[] {
  let t = initialTowers(n);
  const out: Towers[] = [t];
  for (const m of moves) {
    const src = t[m.from];
    const top = src[src.length - 1];
    if (top !== m.disk) throw new Error(`disk ${m.disk} is not on top of peg ${PEG_NAMES[m.from]}`);
    const dst = t[m.to];
    if (dst.length > 0 && dst[dst.length - 1] < m.disk) {
      throw new Error(`disk ${m.disk} cannot go on smaller disk ${dst[dst.length - 1]}`);
    }
    const next = t.map(p => p.slice()) as Towers;
    next[m.from].pop();
    next[m.to].push(m.disk);
    t = next;
    out.push(t);
  }
  return out;
}
