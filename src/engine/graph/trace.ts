import { GRAPH_ALGORITHMS } from './algorithms';
import type { Graph, GraphAlgorithmId, GraphEvent, GraphFrame } from './types';

export interface GraphTrace {
  algorithm: GraphAlgorithmId;
  start: string;
  events: GraphEvent[];
  /** frames[0] is before the first event; frames[k] is after event k-1 */
  frames: GraphFrame[];
  /** visit order, i.e. the traversal result */
  order: string[];
  /** final distances (Dijkstra) */
  distances: Record<string, number> | null;
}

/**
 * Graphs in this app are small (tens of nodes), so every frame is materialised
 * up front. Sorting traces can be large and use checkpoints instead (sorting/trace.ts).
 */
export function recordGraph(algorithm: GraphAlgorithmId, graph: Graph, start: string): GraphTrace {
  const def = GRAPH_ALGORITHMS[algorithm];
  const events = Array.from(def.run(graph, start));
  const withDistances = algorithm === 'dijkstra';

  let visited: string[] = [];
  let frontier: GraphFrame['frontier'] = [];
  let treeEdges: Record<string, string> = {};
  let distances: Record<string, number> | null = null;
  if (withDistances) {
    distances = {};
    for (const id of graph.nodes) distances[id] = id === start ? 0 : Infinity;
  }
  let current: string | null = null;
  const counters = { visited: 0, edgesInspected: 0, frontierOps: 0, relaxations: 0 };

  const frames: GraphFrame[] = [
    {
      index: 0,
      event: null,
      visited: [],
      current: null,
      activeEdge: null,
      frontier: [],
      treeEdges: {},
      distances: distances ? { ...distances } : null,
      counters: { ...counters },
    },
  ];

  events.forEach((e, k) => {
    let activeEdge: string | null = null;
    switch (e.type) {
      case 'push':
        frontier = [...frontier, { node: e.node, priority: e.priority }];
        counters.frontierOps++;
        if (e.edge && !withDistances) {
          treeEdges = { ...treeEdges, [e.node]: e.edge };
          activeEdge = e.edge;
        }
        break;
      case 'pop': {
        const at = frontier.findIndex(f => f.node === e.node);
        if (at >= 0) frontier = [...frontier.slice(0, at), ...frontier.slice(at + 1)];
        counters.frontierOps++;
        current = e.node;
        break;
      }
      case 'stale':
        current = e.node;
        break;
      case 'visit':
        visited = [...visited, e.node];
        counters.visited++;
        current = e.node;
        break;
      case 'inspect':
        counters.edgesInspected++;
        activeEdge = e.edge;
        break;
      case 'relax':
        counters.relaxations++;
        counters.frontierOps++;
        distances = { ...distances!, [e.node]: e.dist };
        treeEdges = { ...treeEdges, [e.node]: e.edge };
        frontier = [...frontier, { node: e.node, priority: e.dist }];
        activeEdge = e.edge;
        break;
      case 'done':
        current = null;
        break;
    }
    frames.push({
      index: k + 1,
      event: e,
      visited,
      current,
      activeEdge,
      frontier,
      treeEdges,
      distances: distances ? { ...distances } : null,
      counters: { ...counters },
    });
  });

  const last = frames[frames.length - 1];
  return { algorithm, start, events, frames, order: last.visited, distances: last.distances };
}

export function describeGraphEvent(e: GraphEvent | null, label: (id: string) => string, frontierName: string, visitVerb = 'Visit'): string {
  if (!e) return 'Ready. Press play or step forward.';
  switch (e.type) {
    case 'push':
      return e.priority !== undefined
        ? `Insert ${label(e.node)} with distance ${e.priority} into the ${frontierName.toLowerCase()}`
        : `Push ${label(e.node)} onto the ${frontierName.toLowerCase()}`;
    case 'pop':
      return `Take ${label(e.node)} from the ${frontierName.toLowerCase()}`;
    case 'stale':
      return `${label(e.node)} is already settled: skip the stale entry`;
    case 'visit':
      return `${visitVerb} ${label(e.node)}`;
    case 'inspect':
      return `Look at neighbour ${label(e.node)}`;
    case 'relax':
      return `Shorter path to ${label(e.node)}: distance ${e.dist}`;
    case 'done':
      return 'Done.';
  }
}
