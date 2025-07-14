export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  visited?: boolean;
  distance?: number;
  previous?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
  directed: boolean;
}

export interface AlgorithmStep {
  description: string;
  visitedNodes: string[];
  currentNode?: string;
  activeEdges: string[];
  distances?: Record<string, number>;
  codeLine?: number;
}

export type GraphAlgorithm = 'bfs' | 'dfs' | 'dijkstra' | 'astar' | 'topological';
