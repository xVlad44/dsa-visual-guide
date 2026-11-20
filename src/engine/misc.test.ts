import { describe, expect, it } from 'vitest';
import { advance, MAX_FRAME_MS } from '../player/clock';
import { bstInsert, emptyBst, height, layoutBst, traverse, type Bst } from './ds/bst';
import { generateInput, INPUT_KINDS, mulberry32, randInt } from './rng';

describe('seeded inputs', () => {
  it('are deterministic per seed and differ across seeds', () => {
    expect(generateInput('random', 50, 42)).toEqual(generateInput('random', 50, 42));
    expect(generateInput('random', 50, 42)).not.toEqual(generateInput('random', 50, 43));
  });

  it('respect length, range and the shape of each kind', () => {
    for (const kind of INPUT_KINDS) {
      for (const n of [0, 1, 16, 200]) {
        const a = generateInput(kind, n, 7);
        expect(a).toHaveLength(n);
        a.forEach(v => {
          expect(Number.isInteger(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(Math.max(99, n));
        });
        if (kind === 'sorted') expect(a).toEqual([...a].sort((x, y) => x - y));
        if (kind === 'reversed') expect(a).toEqual([...a].sort((x, y) => y - x));
        if (kind === 'few-unique') expect(new Set(a).size).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe('player clock', () => {
  it('advances one step per second at speed 1, independent of frame rate', () => {
    for (const fps of [30, 60, 144]) {
      let t = { index: 0, carry: 0, ended: false };
      for (let f = 0; f < fps * 3; f++) t = advance(t.index, t.carry, 1000 / fps, 1, 100);
      expect(t.index).toBe(3);
    }
  });

  it('applies several steps per frame when speed exceeds the frame rate', () => {
    expect(advance(0, 0, 1000 / 60, 600, 1000).index).toBe(10);
  });

  it('stops at the last frame and reports the end', () => {
    expect(advance(8, 0.9, 200, 100, 10)).toEqual({ index: 10, carry: 0, ended: true });
    expect(advance(10, 0, 16, 5, 10).ended).toBe(true);
  });

  it('ignores long gaps such as a backgrounded tab', () => {
    expect(advance(0, 0, 60_000, 10, 1_000_000).index).toBe(Math.floor((MAX_FRAME_MS * 10) / 1000));
  });
});

/* plain recursive reference, independent of the engine's tree representation */
interface RefNode {
  v: number;
  l?: RefNode;
  r?: RefNode;
}
function refInsert(t: RefNode | undefined, v: number): RefNode {
  if (!t) return { v };
  if (v < t.v) t.l = refInsert(t.l, v);
  else t.r = refInsert(t.r, v);
  return t;
}
function refWalk(t: RefNode | undefined, order: 'pre' | 'post', out: number[] = []): number[] {
  if (!t) return out;
  if (order === 'pre') out.push(t.v);
  refWalk(t.l, order, out);
  refWalk(t.r, order, out);
  if (order === 'post') out.push(t.v);
  return out;
}

describe('binary search tree', () => {
  it('traversals match a reference implementation on seeded inserts', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = mulberry32(seed);
      const values = Array.from({ length: randInt(rng, 0, 30) }, () => randInt(rng, 1, 50));
      let tree: Bst = emptyBst();
      let ref: RefNode | undefined;
      for (const v of values) {
        tree = bstInsert(tree, v).tree;
        ref = refInsert(ref, v);
      }
      const vals = (ids: number[]) => ids.map(id => tree.nodes[id].value);
      expect(vals(traverse(tree, 'inorder'))).toEqual([...values].sort((a, b) => a - b));
      expect(vals(traverse(tree, 'preorder'))).toEqual(refWalk(ref, 'pre'));
      expect(vals(traverse(tree, 'postorder'))).toEqual(refWalk(ref, 'post'));
    }
  });

  it('layout gives every node a distinct inorder rank', () => {
    let tree = emptyBst();
    for (const v of [50, 30, 70, 20, 40, 60, 80, 35, 45, 65]) tree = bstInsert(tree, v).tree;
    const pos = layoutBst(tree);
    const ranks = Object.values(pos).map(p => p.rank).sort((a, b) => a - b);
    expect(ranks).toEqual(Array.from({ length: 10 }, (_, i) => i));
    expect(Math.max(...Object.values(pos).map(p => p.depth)) + 1).toBe(height(tree));
  });

  it('insert path ends at the new node’s parent', () => {
    let tree = emptyBst();
    for (const v of [10, 5, 15]) tree = bstInsert(tree, v).tree;
    const { tree: t2, path, id } = bstInsert(tree, 7);
    const parent = t2.nodes[path[path.length - 1]];
    expect(parent.left === id || parent.right === id).toBe(true);
    expect(path.map(p => t2.nodes[p].value)).toEqual([10, 5]);
  });
});
