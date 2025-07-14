import { GraphNode, GraphEdge, AlgorithmStep } from '../types';

export function runDijkstra(
  nodes: Record<string, GraphNode>,
  edges: Record<string, GraphEdge>,
  start: string
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const distances: Record<string, number> = {};
  const previous: Record<string, string> = {};
  const unvisited = new Set(Object.keys(nodes));
  Object.keys(nodes).forEach(nodeId => {
    distances[nodeId] = nodeId === start ? 0 : Infinity;
  });
  steps.push({
    description: `Initializing distances from ${nodes[start].label}`,
    visitedNodes: [],
    currentNode: start,
    activeEdges: [],
    distances: { ...distances },
    codeLine: 5
  });
  while (unvisited.size > 0) {
    let currentNode = '';
    let minDistance = Infinity;
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        currentNode = nodeId;
      }
    });
    if (minDistance === Infinity || !nodes[currentNode]) break;
    unvisited.delete(currentNode);
    steps.push({
      description: `Processing node ${nodes[currentNode]?.label ?? currentNode} (distance: ${distances[currentNode]})`,
      visitedNodes: Object.keys(nodes).filter(id => !unvisited.has(id)),
      currentNode,
      activeEdges: [],
      distances: { ...distances },
      codeLine: 9
    });
    // For undirected graphs, consider both directions
    Object.values(edges)
      .filter(edge => edge.from === currentNode || edge.to === currentNode)
      .forEach(edge => {
        // Determine the neighbor node
        let neighbor = edge.from === currentNode ? edge.to : edge.from;
        if (!unvisited.has(neighbor)) return;
        const alt = distances[currentNode] + edge.weight;
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = currentNode;
          steps.push({
            description: `Updated distance to ${nodes[neighbor]?.label ?? neighbor}: ${alt}`,
            visitedNodes: Object.keys(nodes).filter(id => !unvisited.has(id)),
            currentNode,
            activeEdges: [edge.id],
            distances: { ...distances },
            codeLine: 12
          });
        }
      });
  }
  steps.push({
    description: "Dijkstra's algorithm complete",
    visitedNodes: Object.keys(nodes),
    activeEdges: [],
    distances: { ...distances },
    codeLine: 18
  });
  return steps;
}
