import { GraphNode, GraphEdge, AlgorithmStep } from '../types';

export function runBFS(
  nodes: Record<string, GraphNode>,
  edges: Record<string, GraphEdge>,
  start: string
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const queue = [start];
  const visited = new Set<string>();
  const nodeOrder: string[] = [];

  steps.push({
    description: `Starting BFS from node ${nodes[start]?.label ?? start}`,
    visitedNodes: [],
    currentNode: start,
    activeEdges: [],
    codeLine: 1
  });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (!visited.has(currentId) && nodes[currentId]) {
      visited.add(currentId);
      nodeOrder.push(currentId);
      steps.push({
        description: `Visiting node ${nodes[currentId]?.label ?? currentId}`,
        visitedNodes: [...visited],
        currentNode: currentId,
        activeEdges: [],
        codeLine: 7
      });
      // For undirected graphs, consider both directions
      const neighbors = Object.values(edges)
        .filter(edge => edge.from === currentId || edge.to === currentId)
        .map(edge => (edge.from === currentId ? edge.to : edge.from));
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId) && nodes[neighborId]) {
          queue.push(neighborId);
          steps.push({
            description: `Adding node ${nodes[neighborId]?.label ?? neighborId} to queue`,
            visitedNodes: [...visited],
            currentNode: currentId,
            activeEdges: [Object.values(edges).find(e => (e.from === currentId && e.to === neighborId) || (e.to === currentId && e.from === neighborId))?.id ?? ''],
            codeLine: 9
          });
        }
      });
    }
  }
  steps.push({
    description: 'BFS traversal complete',
    visitedNodes: [...visited],
    activeEdges: [],
    codeLine: 12
  });
  return steps;
}
