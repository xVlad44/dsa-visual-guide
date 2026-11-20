import { MinHeap } from './heap';
import type { Graph, GraphAlgorithmDef, GraphAlgorithmId, GraphEdge, GraphEvent } from './types';

type Gen = Generator<GraphEvent, void, undefined>;

export interface Adjacent {
  edge: GraphEdge;
  node: string;
}

/**
 * Adjacency lists in edge-list order. Undirected edges appear in both
 * endpoints' lists; a self-loop appears once.
 */
export function adjacency(graph: Graph): Map<string, Adjacent[]> {
  const adj = new Map<string, Adjacent[]>();
  for (const id of graph.nodes) adj.set(id, []);
  for (const edge of graph.edges) {
    if (!adj.has(edge.from) || !adj.has(edge.to)) continue;
    adj.get(edge.from)!.push({ edge, node: edge.to });
    if (!graph.directed && edge.from !== edge.to) adj.get(edge.to)!.push({ edge, node: edge.from });
  }
  return adj;
}

const bfs: GraphAlgorithmDef = {
  id: 'bfs',
  name: 'Breadth-first search',
  summary: 'Visits nodes in order of hop distance from the start, using a FIFO queue.',
  frontierName: 'Queue',
  complexity: { time: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'procedure BFS(G, s)',
    '  mark s discovered; Q ← [s]',
    '  while Q is not empty',
    '    u ← Q.dequeue()',
    '    visit u',
    '    for each edge (u, v) in G.adj[u]',
    '      if v is not discovered',
    '        mark v discovered; Q.enqueue(v)',
  ],
  *run(graph, start): Gen {
    const adj = adjacency(graph);
    if (!adj.has(start)) return;
    const discovered = new Set<string>([start]);
    const queue: string[] = [start];
    yield { type: 'push', node: start, line: 2 };
    while (queue.length > 0) {
      const u = queue.shift()!;
      yield { type: 'pop', node: u, line: 4 };
      yield { type: 'visit', node: u, line: 5 };
      for (const { edge, node: v } of adj.get(u)!) {
        yield { type: 'inspect', edge: edge.id, node: v, line: 7 };
        if (!discovered.has(v)) {
          discovered.add(v);
          queue.push(v);
          yield { type: 'push', node: v, edge: edge.id, line: 8 };
        }
      }
    }
    yield { type: 'done', line: 3 };
  },
};

function* dfsFrom(adj: Map<string, Adjacent[]>, u: string, via: string | undefined, visited: Set<string>): Gen {
  yield { type: 'push', node: u, edge: via, line: 1 };
  visited.add(u);
  yield { type: 'visit', node: u, line: 2 };
  for (const { edge, node: v } of adj.get(u)!) {
    yield { type: 'inspect', edge: edge.id, node: v, line: 4 };
    if (!visited.has(v)) yield* dfsFrom(adj, v, edge.id, visited);
  }
  yield { type: 'pop', node: u, line: 6 };
}

const dfs: GraphAlgorithmDef = {
  id: 'dfs',
  name: 'Depth-first search',
  summary: 'Follows each branch as deep as it goes before backtracking; the frontier is the call stack.',
  frontierName: 'Call stack',
  complexity: { time: 'O(V + E)', space: 'O(V)' },
  pseudocode: [
    'procedure DFS(G, u)',
    '  mark u visited',
    '  for each edge (u, v) in G.adj[u]',
    '    if v is not visited',
    '      DFS(G, v)',
    '  return',
  ],
  *run(graph, start): Gen {
    const adj = adjacency(graph);
    if (!adj.has(start)) return;
    yield* dfsFrom(adj, start, undefined, new Set());
    yield { type: 'done', line: 6 };
  },
};

const dijkstra: GraphAlgorithmDef = {
  id: 'dijkstra',
  name: "Dijkstra's algorithm",
  summary: 'Settles nodes in order of shortest distance using a binary-heap priority queue. Weights must be non-negative.',
  frontierName: 'Priority queue',
  complexity: { time: 'O((V + E) log V)', space: 'O(V + E)' },
  pseudocode: [
    'procedure Dijkstra(G, s)',
    '  dist[v] ← ∞ for every v; dist[s] ← 0',
    '  PQ ← {(0, s)}',
    '  while PQ is not empty',
    '    (d, u) ← PQ.extractMin()',
    '    if u is settled then continue',
    '    settle u',
    '    for each edge (u, v, w) in G.adj[u]',
    '      if dist[u] + w < dist[v]',
    '        dist[v] ← dist[u] + w; PQ.insert((dist[v], v))',
  ],
  *run(graph, start): Gen {
    const adj = adjacency(graph);
    if (!adj.has(start)) return;
    const dist = new Map<string, number>();
    for (const id of graph.nodes) dist.set(id, Infinity);
    dist.set(start, 0);
    const settled = new Set<string>();
    const pq = new MinHeap<string>();
    pq.push(0, start);
    yield { type: 'push', node: start, priority: 0, line: 3 };
    while (pq.size > 0) {
      const { priority: d, value: u } = pq.pop()!;
      yield { type: 'pop', node: u, line: 5 };
      if (settled.has(u) || d > dist.get(u)!) {
        yield { type: 'stale', node: u, line: 6 };
        continue;
      }
      settled.add(u);
      yield { type: 'visit', node: u, line: 7 };
      for (const { edge, node: v } of adj.get(u)!) {
        if (settled.has(v)) continue;
        yield { type: 'inspect', edge: edge.id, node: v, line: 9 };
        const alt = d + edge.weight;
        if (alt < dist.get(v)!) {
          dist.set(v, alt);
          pq.push(alt, v);
          yield { type: 'relax', edge: edge.id, node: v, dist: alt, line: 10 };
        }
      }
    }
    yield { type: 'done', line: 4 };
  },
};

export const GRAPH_ALGORITHMS: Record<GraphAlgorithmId, GraphAlgorithmDef> = { bfs, dfs, dijkstra };

/** Returns a message when the graph can't be run with this algorithm, else null. */
export function validateGraph(algo: GraphAlgorithmId, graph: Graph): string | null {
  if (algo === 'dijkstra') {
    const negative = graph.edges.find(e => e.weight < 0);
    if (negative) return `Dijkstra needs non-negative weights (edge ${negative.from} → ${negative.to} has ${negative.weight}).`;
  }
  return null;
}
