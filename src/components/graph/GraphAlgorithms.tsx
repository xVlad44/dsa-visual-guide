
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus, Save, Upload, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { AlgorithmLayout } from '../AlgorithmLayout';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  visited?: boolean;
  distance?: number;
  previous?: string;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
  directed: boolean;
}

interface AlgorithmStep {
  description: string;
  visitedNodes: string[];
  currentNode?: string;
  activeEdges: string[];
  distances?: Record<string, number>;
  codeLine?: number;
}

type GraphAlgorithm = 'bfs' | 'dfs' | 'dijkstra' | 'astar' | 'topological';

const algorithms = {
  bfs: { name: 'Breadth-First Search', complexity: 'O(V + E)' },
  dfs: { name: 'Depth-First Search', complexity: 'O(V + E)' },
  dijkstra: { name: "Dijkstra's Algorithm", complexity: 'O((V + E) log V)' },
  astar: { name: 'A* Search', complexity: 'O(b^d)' },
  topological: { name: 'Topological Sort', complexity: 'O(V + E)' }
};

const codeExamples = {
  bfs: [
    'function bfs(graph, start) {',
    '  const queue = [start];',
    '  const visited = new Set();',
    '  const result = [];',
    '  while (queue.length > 0) {',
    '    const node = queue.shift();',
    '    if (!visited.has(node)) {',
    '      visited.add(node);',
    '      result.push(node);',
    '      queue.push(...graph[node]);',
    '    }',
    '  }',
    '  return result;',
    '}'
  ],
  dfs: [
    'function dfs(graph, start, visited = new Set()) {',
    '  visited.add(start);',
    '  console.log(start);',
    '  for (const neighbor of graph[start]) {',
    '    if (!visited.has(neighbor)) {',
    '      dfs(graph, neighbor, visited);',
    '    }',
    '  }',
    '}'
  ],
  dijkstra: [
    'function dijkstra(graph, start) {',
    '  const distances = {};',
    '  const previous = {};',
    '  const pq = new PriorityQueue();',
    '  for (const node in graph) {',
    '    distances[node] = node === start ? 0 : Infinity;',
    '    pq.enqueue(node, distances[node]);',
    '  }',
    '  while (!pq.isEmpty()) {',
    '    const current = pq.dequeue();',
    '    for (const neighbor in graph[current]) {',
    '      const alt = distances[current] + graph[current][neighbor];',
    '      if (alt < distances[neighbor]) {',
    '        distances[neighbor] = alt;',
    '        previous[neighbor] = current;',
    '        pq.updatePriority(neighbor, alt);',
    '      }',
    '    }',
    '  }',
    '  return { distances, previous };',
    '}'
  ]
};

export function GraphAlgorithms() {
  const [nodes, setNodes] = useState<Record<string, GraphNode>>({});
  const [edges, setEdges] = useState<Record<string, GraphEdge>>({});
  const [isDirected, setIsDirected] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Algorithm state
  const [algorithm, setAlgorithm] = useState<GraphAlgorithm>('bfs');
  const [startNode, setStartNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCode, setShowCode] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Graph editing functions
  const addNode = useCallback((x: number, y: number) => {
    const id = generateId();
    const newNode: GraphNode = {
      id,
      x,
      y,
      label: `${Object.keys(nodes).length + 1}`
    };
    setNodes(prev => ({ ...prev, [id]: newNode }));
  }, [nodes]);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => {
      const { [nodeId]: removed, ...rest } = prev;
      return rest;
    });
    setEdges(prev => {
      const filteredEdges: Record<string, GraphEdge> = {};
      Object.values(prev).forEach(edge => {
        if (edge.from !== nodeId && edge.to !== nodeId) {
          filteredEdges[edge.id] = edge;
        }
      });
      return filteredEdges;
    });
  }, []);

  const addEdge = useCallback((from: string, to: string, weight: number = 1) => {
    const id = generateId();
    const newEdge: GraphEdge = {
      id,
      from,
      to,
      weight,
      directed: isDirected
    };
    setEdges(prev => ({ ...prev, [id]: newEdge }));
  }, [isDirected]);

  const removeEdge = useCallback((edgeId: string) => {
    setEdges(prev => {
      const { [edgeId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearGraph = useCallback(() => {
    setNodes({});
    setEdges({});
    setSteps([]);
    setCurrentStep(0);
    setStartNode(null);
    setTargetNode(null);
  }, []);

  // Algorithm implementations
  const runBFS = useCallback((start: string): AlgorithmStep[] => {
    const steps: AlgorithmStep[] = [];
    const queue = [start];
    const visited = new Set<string>();
    const nodeOrder: string[] = [];

    steps.push({
      description: `Starting BFS from node ${nodes[start].label}`,
      visitedNodes: [],
      currentNode: start,
      activeEdges: [],
      codeLine: 1
    });

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (!visited.has(currentId)) {
        visited.add(currentId);
        nodeOrder.push(currentId);
        
        steps.push({
          description: `Visiting node ${nodes[currentId].label}`,
          visitedNodes: [...visited],
          currentNode: currentId,
          activeEdges: [],
          codeLine: 7
        });

        // Add neighbors to queue
        const neighbors = Object.values(edges)
          .filter(edge => edge.from === currentId)
          .map(edge => edge.to);
        
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            queue.push(neighborId);
            steps.push({
              description: `Adding node ${nodes[neighborId].label} to queue`,
              visitedNodes: [...visited],
              currentNode: currentId,
              activeEdges: [Object.values(edges).find(e => e.from === currentId && e.to === neighborId)!.id],
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
  }, [nodes, edges]);

  const runDFS = useCallback((start: string): AlgorithmStep[] => {
    const steps: AlgorithmStep[] = [];
    const visited = new Set<string>();
    
    const dfsHelper = (nodeId: string) => {
      visited.add(nodeId);
      
      steps.push({
        description: `Visiting node ${nodes[nodeId].label}`,
        visitedNodes: [...visited],
        currentNode: nodeId,
        activeEdges: [],
        codeLine: 1
      });

      const neighbors = Object.values(edges)
        .filter(edge => edge.from === nodeId)
        .map(edge => edge.to);
      
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          steps.push({
            description: `Exploring neighbor ${nodes[neighborId].label}`,
            visitedNodes: [...visited],
            currentNode: nodeId,
            activeEdges: [Object.values(edges).find(e => e.from === nodeId && e.to === neighborId)!.id],
            codeLine: 4
          });
          dfsHelper(neighborId);
        }
      });
    };

    dfsHelper(start);
    
    steps.push({
      description: 'DFS traversal complete',
      visitedNodes: [...visited],
      activeEdges: [],
      codeLine: 7
    });

    return steps;
  }, [nodes, edges]);

  const runDijkstra = useCallback((start: string): AlgorithmStep[] => {
    const steps: AlgorithmStep[] = [];
    const distances: Record<string, number> = {};
    const previous: Record<string, string> = {};
    const unvisited = new Set(Object.keys(nodes));
    
    // Initialize distances
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
      // Find unvisited node with minimum distance
      let currentNode = '';
      let minDistance = Infinity;
      
      unvisited.forEach(nodeId => {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          currentNode = nodeId;
        }
      });

      if (minDistance === Infinity) break;

      unvisited.delete(currentNode);
      
      steps.push({
        description: `Processing node ${nodes[currentNode].label} (distance: ${distances[currentNode]})`,
        visitedNodes: Object.keys(nodes).filter(id => !unvisited.has(id)),
        currentNode,
        activeEdges: [],
        distances: { ...distances },
        codeLine: 9
      });

      // Update distances to neighbors
      Object.values(edges)
        .filter(edge => edge.from === currentNode)
        .forEach(edge => {
          const neighbor = edge.to;
          const alt = distances[currentNode] + edge.weight;
          
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = currentNode;
            
            steps.push({
              description: `Updated distance to ${nodes[neighbor].label}: ${alt}`,
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
  }, [nodes, edges]);

  const runAlgorithm = useCallback(() => {
    if (!startNode) return;
    
    let algorithmSteps: AlgorithmStep[] = [];
    
    switch (algorithm) {
      case 'bfs':
        algorithmSteps = runBFS(startNode);
        break;
      case 'dfs':
        algorithmSteps = runDFS(startNode);
        break;
      case 'dijkstra':
        algorithmSteps = runDijkstra(startNode);
        break;
      default:
        return;
    }
    
    setSteps(algorithmSteps);
    setCurrentStep(0);
  }, [algorithm, startNode, runBFS, runDFS, runDijkstra]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const playAlgorithm = useCallback(() => {
    if (currentStep >= steps.length - 1) return;
    
    setIsPlaying(true);
    const runStep = () => {
      nextStep();
      if (currentStep < steps.length - 1) {
        timeoutRef.current = setTimeout(runStep, speed);
      } else {
        setIsPlaying(false);
      }
    };
    timeoutRef.current = setTimeout(runStep, speed);
  }, [currentStep, steps.length, nextStep, speed]);

  const pauseAlgorithm = useCallback(() => {
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const resetAlgorithm = useCallback(() => {
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // SVG event handlers
  const handleSVGClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (!isAddingEdge) {
      addNode(x, y);
    }
  }, [addNode, isAddingEdge]);

  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    if (isAddingEdge) {
      if (edgeFrom && edgeFrom !== nodeId) {
        addEdge(edgeFrom, nodeId);
        setIsAddingEdge(false);
        setEdgeFrom(null);
      } else {
        setEdgeFrom(nodeId);
      }
    } else {
      setSelectedNode(nodeId);
    }
  }, [isAddingEdge, edgeFrom, addEdge]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (isAddingEdge) return;
    
    setIsDragging(true);
    setSelectedNode(nodeId);
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const node = nodes[nodeId];
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y
      });
    }
  }, [isAddingEdge, nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !selectedNode || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    setNodes(prev => ({
      ...prev,
      [selectedNode]: { ...prev[selectedNode], x, y }
    }));
  }, [isDragging, selectedNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentStepData = steps[currentStep];

  const controls = (
    <div className="flex flex-wrap items-center gap-4">
      <Tabs value={algorithm} onValueChange={(value) => setAlgorithm(value as GraphAlgorithm)}>
        <TabsList>
          <TabsTrigger value="bfs">BFS</TabsTrigger>
          <TabsTrigger value="dfs">DFS</TabsTrigger>
          <TabsTrigger value="dijkstra">Dijkstra</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Button
          onClick={isPlaying ? pauseAlgorithm : playAlgorithm}
          disabled={steps.length === 0 || currentStep >= steps.length - 1}
          variant="gradient"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        
        <Button
          onClick={prevStep}
          disabled={isPlaying || currentStep === 0}
          variant="outline"
          size="sm"
        >
          <SkipForward className="h-4 w-4 rotate-180" />
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={isPlaying || currentStep >= steps.length - 1}
          variant="outline"
          size="sm"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        <Button onClick={runAlgorithm} disabled={!startNode} variant="accent">
          Run Algorithm
        </Button>
        
        <Button onClick={resetAlgorithm} variant="outline">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">Directed:</span>
          <Switch checked={isDirected} onCheckedChange={setIsDirected} />
        </div>
        
        <Button
          onClick={() => setIsAddingEdge(!isAddingEdge)}
          variant={isAddingEdge ? "destructive" : "outline"}
          size="sm"
        >
          {isAddingEdge ? 'Cancel Edge' : 'Add Edge'}
        </Button>
        
        <Button onClick={clearGraph} variant="outline" size="sm">
          Clear Graph
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">Speed:</span>
        <Slider
          value={[1100 - speed]}
          onValueChange={([value]) => setSpeed(1100 - value)}
          min={100}
          max={1000}
          step={50}
          className="w-20"
        />
      </div>
    </div>
  );

  const sidebar = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">{algorithms[algorithm].name}</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Complexity: </span>
            <span className="text-muted-foreground">{algorithms[algorithm].complexity}</span>
          </div>
          <div>
            <span className="font-medium">Nodes: </span>
            <span className="text-muted-foreground">{Object.keys(nodes).length}</span>
          </div>
          <div>
            <span className="font-medium">Edges: </span>
            <span className="text-muted-foreground">{Object.keys(edges).length}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Start Node</h4>
        <div className="flex flex-wrap gap-1">
          {Object.values(nodes).map(node => (
            <Button
              key={node.id}
              size="sm"
              variant={startNode === node.id ? "default" : "outline"}
              onClick={() => setStartNode(node.id)}
            >
              {node.label}
            </Button>
          ))}
        </div>
      </div>

      {currentStepData && (
        <div>
          <h4 className="font-medium mb-2">Current Step</h4>
          <p className="text-sm text-muted-foreground">
            {currentStepData.description}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      )}

      {currentStepData?.distances && (
        <div>
          <h4 className="font-medium mb-2">Distances</h4>
          <div className="space-y-1 text-sm">
            {Object.entries(currentStepData.distances).map(([nodeId, distance]) => (
              <div key={nodeId} className="flex justify-between">
                <span>{nodes[nodeId]?.label}:</span>
                <span className="font-mono">
                  {distance === Infinity ? '∞' : distance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-2">Instructions</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Click on canvas to add nodes</li>
          <li>• Click "Add Edge" then click two nodes</li>
          <li>• Drag nodes to reposition</li>
          <li>• Select start node and run algorithm</li>
          <li>• Use playback controls to step through</li>
        </ul>
      </div>
    </div>
  );

  return (
    <AlgorithmLayout
      title="Graph Algorithm Visualizer"
      description="Create graphs and visualize pathfinding algorithms step by step"
      controls={controls}
      sidebar={sidebar}
    >
      <div className="relative w-full h-96 border-2 border-muted rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair"
          onClick={handleSVGClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Render edges */}
          {Object.values(edges).map(edge => {
            const fromNode = nodes[edge.from];
            const toNode = nodes[edge.to];
            if (!fromNode || !toNode) return null;

            const isActive = currentStepData?.activeEdges.includes(edge.id);
            
            return (
              <g key={edge.id}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  strokeWidth={isActive ? 3 : 2}
                  className="transition-all duration-300"
                />
                {isDirected && (
                  <polygon
                    points={`${toNode.x - 5},${toNode.y - 5} ${toNode.x + 5},${toNode.y - 5} ${toNode.x},${toNode.y + 5}`}
                    fill={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  />
                )}
                {edge.weight !== 1 && (
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2 - 5}
                    textAnchor="middle"
                    className="text-xs font-bold fill-foreground"
                  >
                    {edge.weight}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render nodes */}
          {Object.values(nodes).map(node => {
            const isStart = startNode === node.id;
            const isVisited = currentStepData?.visitedNodes.includes(node.id);
            const isCurrent = currentStepData?.currentNode === node.id;
            const isSelected = selectedNode === node.id;
            
            let fillColor = "hsl(var(--background))";
            let strokeColor = "hsl(var(--primary))";
            
            if (isCurrent) {
              fillColor = "hsl(var(--primary))";
              strokeColor = "hsl(var(--primary-glow))";
            } else if (isVisited) {
              fillColor = "hsl(var(--success))";
              strokeColor = "hsl(var(--success))";
            } else if (isStart) {
              fillColor = "hsl(var(--accent))";
              strokeColor = "hsl(var(--accent))";
            }

            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="20"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3 : 2}
                  className="cursor-pointer transition-all duration-300"
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => handleNodeClick(e, node.id)}
                />
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className={`text-sm font-bold pointer-events-none ${
                    isCurrent || isVisited ? 'fill-white' : 'fill-foreground'
                  }`}
                >
                  {node.label}
                </text>
                {currentStepData?.distances && (
                  <text
                    x={node.x}
                    y={node.y - 30}
                    textAnchor="middle"
                    className="text-xs font-bold fill-primary"
                  >
                    {currentStepData.distances[node.id] === Infinity ? '∞' : currentStepData.distances[node.id]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </AlgorithmLayout>
  );
}
