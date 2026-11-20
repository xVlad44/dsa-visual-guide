export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  /** node ids, in display order */
  nodes: string[];
  edges: GraphEdge[];
  directed: boolean;
}

export const GRAPH_IDS = ['bfs', 'dfs', 'dijkstra'] as const;
export type GraphAlgorithmId = (typeof GRAPH_IDS)[number];

/**
 * Graph trace vocabulary. The frontier is the algorithm's working set:
 * the queue (BFS), the call stack (DFS) or the priority queue (Dijkstra).
 */
export type GraphEvent =
  /** add a node to the frontier; `priority` is the key in a priority queue */
  | { type: 'push'; node: string; edge?: string; priority?: number; line: number }
  /** remove the first occurrence of a node from the frontier */
  | { type: 'pop'; node: string; line: number }
  /** the node is processed (BFS/DFS) or settled (Dijkstra) */
  | { type: 'visit'; node: string; line: number }
  /** look at a neighbour through an edge */
  | { type: 'inspect'; edge: string; node: string; line: number }
  /** a shorter distance was found; also pushes (node, dist) into the priority queue */
  | { type: 'relax'; edge: string; node: string; dist: number; line: number }
  /** a popped entry was out of date (lazy deletion) */
  | { type: 'stale'; node: string; line: number }
  | { type: 'done'; line: number };

export interface FrontierEntry {
  node: string;
  priority?: number;
}

export interface GraphCounters {
  visited: number;
  edgesInspected: number;
  frontierOps: number;
  relaxations: number;
}

export interface GraphFrame {
  index: number;
  event: GraphEvent | null;
  /** visited/settled nodes, in visit order */
  visited: string[];
  current: string | null;
  activeEdge: string | null;
  frontier: FrontierEntry[];
  /** shortest-path tree edges discovered so far (node -> edge id) */
  treeEdges: Record<string, string>;
  /** Dijkstra only */
  distances: Record<string, number> | null;
  counters: GraphCounters;
}

export interface GraphAlgorithmDef {
  id: GraphAlgorithmId;
  name: string;
  summary: string;
  frontierName: string;
  complexity: { time: string; space: string };
  pseudocode: readonly string[];
  run(graph: Graph, start: string): Generator<GraphEvent, void, undefined>;
}
