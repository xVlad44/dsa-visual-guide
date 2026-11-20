import { describe, expect, it } from 'vitest';
import { mulberry32, randInt } from '../rng';
import { GRAPH_ALGORITHMS, validateGraph } from './algorithms';
import { MinHeap } from './heap';
import { formatEdgeList, parseEdgeList } from './parse';
import { recordGraph } from './trace';
import type { Graph } from './types';

const SEEDS = 300;

/** Random graph: 1-10 nodes, up to 2n edges, self-loops and parallel edges allowed, weights 0-9. */
function randomGraph(seed: number): Graph {
  const rng = mulberry32(seed);
  const n = randInt(rng, 1, 10);
  const m = randInt(rng, 0, 2 * n);
  const nodes = Array.from({ length: n }, (_, i) => String(i));
  const edges = Array.from({ length: m }, (_, i) => ({
    id: `e${i}`,
    from: String(randInt(rng, 0, n - 1)),
    to: String(randInt(rng, 0, n - 1)),
    weight: randInt(rng, 0, 9),
  }));
  return { nodes, edges, directed: rng() < 0.5 };
}

/* Independent textbook references, written without the engine's helpers. */

function neighbours(g: Graph, u: string): Array<{ v: string; w: number }> {
  const out: Array<{ v: string; w: number }> = [];
  for (const e of g.edges) {
    if (e.from === u) out.push({ v: e.to, w: e.weight });
    else if (!g.directed && e.to === u) out.push({ v: e.from, w: e.weight });
  }
  return out;
}

function referenceBfs(g: Graph, s: string): string[] {
  const seen = new Set([s]);
  const q = [s];
  const order: string[] = [];
  while (q.length) {
    const u = q.shift()!;
    order.push(u);
    for (const { v } of neighbours(g, u)) {
      if (!seen.has(v)) {
        seen.add(v);
        q.push(v);
      }
    }
  }
  return order;
}

function referenceDfs(g: Graph, s: string): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const go = (u: string) => {
    seen.add(u);
    order.push(u);
    for (const { v } of neighbours(g, u)) if (!seen.has(v)) go(v);
  };
  go(s);
  return order;
}

/** Bellman-Ford: |V|-1 rounds of relaxing every edge (both ways when undirected). */
function referenceDistances(g: Graph, s: string): Record<string, number> {
  const d: Record<string, number> = {};
  for (const id of g.nodes) d[id] = Infinity;
  d[s] = 0;
  for (let round = 0; round < g.nodes.length - 1; round++) {
    for (const e of g.edges) {
      if (d[e.from] + e.weight < d[e.to]) d[e.to] = d[e.from] + e.weight;
      if (!g.directed && d[e.to] + e.weight < d[e.from]) d[e.from] = d[e.to] + e.weight;
    }
  }
  return d;
}

/** Hop distance via unit-weight Bellman-Ford. */
function hops(g: Graph, s: string) {
  return referenceDistances({ ...g, edges: g.edges.map(e => ({ ...e, weight: 1 })) }, s);
}

describe('BFS', () => {
  it('matches a reference BFS on seeded random graphs', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = randomGraph(seed);
      for (const s of g.nodes) expect(recordGraph('bfs', g, s).order).toEqual(referenceBfs(g, s));
    }
  });

  it('visits exactly the reachable nodes, in non-decreasing hop distance', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = randomGraph(seed);
      const s = g.nodes[0];
      const order = recordGraph('bfs', g, s).order;
      const h = hops(g, s);
      expect(new Set(order)).toEqual(new Set(g.nodes.filter(v => h[v] < Infinity)));
      for (let i = 1; i < order.length; i++) expect(h[order[i]]).toBeGreaterThanOrEqual(h[order[i - 1]]);
    }
  });
});

describe('DFS', () => {
  it('matches a reference recursive DFS on seeded random graphs', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = randomGraph(seed);
      for (const s of g.nodes) expect(recordGraph('dfs', g, s).order).toEqual(referenceDfs(g, s));
    }
  });

  it('leaves the call stack empty and reaches every reachable node', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = randomGraph(seed);
      const t = recordGraph('dfs', g, g.nodes[0]);
      expect(t.frames[t.frames.length - 1].frontier).toEqual([]);
      const h = hops(g, g.nodes[0]);
      expect(new Set(t.order)).toEqual(new Set(g.nodes.filter(v => h[v] < Infinity)));
    }
  });
});

describe('Dijkstra', () => {
  it('final distances equal Bellman-Ford on seeded random graphs', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = randomGraph(seed);
      for (const s of g.nodes) expect(recordGraph('dijkstra', g, s).distances).toEqual(referenceDistances(g, s));
    }
  });

  it('settles nodes in non-decreasing distance order, each exactly once', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const g = randomGraph(seed);
      const t = recordGraph('dijkstra', g, g.nodes[0]);
      const d = t.distances!;
      expect(new Set(t.order).size).toBe(t.order.length);
      for (let i = 1; i < t.order.length; i++) expect(d[t.order[i]]).toBeGreaterThanOrEqual(d[t.order[i - 1]]);
    }
  });

  it('rejects negative weights before running', () => {
    const g: Graph = { nodes: ['a', 'b'], edges: [{ id: 'e0', from: 'a', to: 'b', weight: -2 }], directed: false };
    expect(validateGraph('dijkstra', g)).toMatch(/non-negative/);
    expect(validateGraph('bfs', g)).toBeNull();
  });
});

describe('graph traces', () => {
  it('every algorithm ends with done, and counters never decrease', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const g = randomGraph(seed);
      for (const id of Object.keys(GRAPH_ALGORITHMS) as Array<keyof typeof GRAPH_ALGORITHMS>) {
        const t = recordGraph(id, g, g.nodes[0]);
        expect(t.events[t.events.length - 1].type).toBe('done');
        expect(t.frames).toHaveLength(t.events.length + 1);
        for (let k = 1; k < t.frames.length; k++) {
          const a = t.frames[k - 1].counters;
          const b = t.frames[k].counters;
          expect(b.visited).toBeGreaterThanOrEqual(a.visited);
          expect(b.edgesInspected).toBeGreaterThanOrEqual(a.edgesInspected);
        }
        for (const e of t.events) {
          expect(e.line).toBeGreaterThanOrEqual(1);
          expect(e.line).toBeLessThanOrEqual(GRAPH_ALGORITHMS[id].pseudocode.length);
        }
      }
    }
  });

  it('respects edge direction', () => {
    const g: Graph = { nodes: ['a', 'b'], edges: [{ id: 'e0', from: 'b', to: 'a', weight: 1 }], directed: true };
    expect(recordGraph('bfs', g, 'a').order).toEqual(['a']);
    expect(recordGraph('bfs', { ...g, directed: false }, 'a').order).toEqual(['a', 'b']);
  });
});

describe('MinHeap', () => {
  it('pops in priority order, ties in insertion order', () => {
    const rng = mulberry32(99);
    const heap = new MinHeap<number>();
    const pushed: Array<[number, number]> = [];
    for (let i = 0; i < 500; i++) {
      const p = randInt(rng, 0, 20);
      heap.push(p, i);
      pushed.push([p, i]);
    }
    const expected = pushed.sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(x => x[1]);
    const got: number[] = [];
    while (heap.size) got.push(heap.pop()!.value);
    expect(got).toEqual(expected);
  });
});

describe('parseEdgeList', () => {
  it('parses edges, weights and isolated nodes in order of appearance', () => {
    const p = parseEdgeList('1 2 5\n\n# comment\n3 4\n7\n2 3 -1.5');
    expect(p.errors).toEqual([]);
    expect(p.nodes).toEqual(['1', '2', '3', '4', '7']);
    expect(p.edges).toEqual([
      { from: '1', to: '2', weight: 5 },
      { from: '3', to: '4', weight: 1 },
      { from: '2', to: '3', weight: -1.5 },
    ]);
  });

  it('reports bad lines with their line numbers and keeps the rest', () => {
    const p = parseEdgeList('a b\na b c\na b 1 2\nc d 3');
    expect(p.errors).toEqual([
      { line: 2, message: 'weight "c" is not a number' },
      { line: 3, message: 'expected "from to [weight]"' },
    ]);
    expect(p.edges).toHaveLength(2);
  });

  it('round-trips through formatEdgeList', () => {
    const text = '1 2 5\n3 4\n2 3 2\n9';
    const p = parseEdgeList(text);
    expect(formatEdgeList(p.edges, ['9'])).toBe(text);
  });
});
