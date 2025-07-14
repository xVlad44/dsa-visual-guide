import { GraphNode, GraphEdge, AlgorithmStep } from '../types';

export function runDFS(
  nodes: Record<string, GraphNode>,
  edges: Record<string, GraphEdge>,
  start: string
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const visited = new Set<string>();
  function dfsHelper(nodeId: string) {
    if (!nodes[nodeId]) return;
    visited.add(nodeId);
    steps.push({
      description: `Visiting node ${nodes[nodeId]?.label ?? nodeId}`,
      visitedNodes: [...visited],
      currentNode: nodeId,
      activeEdges: [],
      codeLine: 1
    });
    // For undirected graphs, consider both directions
    const neighbors = Object.values(edges)
      .filter(edge => edge.from === nodeId || edge.to === nodeId)
      .map(edge => (edge.from === nodeId ? edge.to : edge.from));
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId) && nodes[neighborId]) {
        steps.push({
          description: `Exploring neighbor ${nodes[neighborId]?.label ?? neighborId}`,
          visitedNodes: [...visited],
          currentNode: nodeId,
          activeEdges: [Object.values(edges).find(e => (e.from === nodeId && e.to === neighborId) || (e.to === nodeId && e.from === neighborId))?.id ?? ''],
          codeLine: 4
        });
        dfsHelper(neighborId);
      }
    });
  }
  dfsHelper(start);
  steps.push({
    description: 'DFS traversal complete',
    visitedNodes: [...visited],
    activeEdges: [],
    codeLine: 7
  });
  return steps;
}
