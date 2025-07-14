
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus, Save, Upload, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { AlgorithmLayout } from '../AlgorithmLayout';
import type { GraphNode, GraphEdge, AlgorithmStep, GraphAlgorithm } from './types';
import { runBFS } from './algorithms/bfs';
import { runDFS } from './algorithms/dfs';
import { runDijkstra } from './algorithms/dijkstra';
import { Textarea } from '../ui/textarea';
import ReactFlow, {
  Background,
  Controls,
  addEdge as rfAddEdge,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ConnectionMode,
  useReactFlow,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node component for algorithm visualization
const AlgorithmNode = ({ data, selected }: NodeProps) => {
  const { label, isStart, isVisited, isCurrent, distance } = data;
  
  let className = "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300";
  
  if (isCurrent) {
    className += " bg-primary text-primary-foreground border-primary";
  } else if (isVisited) {
    className += " bg-green-500 text-white border-green-500";
  } else if (isStart) {
    className += " bg-yellow-500 text-black border-yellow-500";
  } else {
    className += " bg-background text-foreground border-primary";
  }
  
  if (selected) {
    className += " ring-2 ring-primary ring-offset-2";
  }
  
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div className={className}>
        {label}
      </div>
      {distance !== undefined && distance !== Infinity && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-primary">
          {distance === Infinity ? '∞' : distance}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </>
  );
};

const nodeTypes = {
  algorithmNode: AlgorithmNode,
};

const algorithms = {
  bfs: { name: 'Breadth-First Search', complexity: 'O(V + E)' },
  dfs: { name: 'Depth-First Search', complexity: 'O(V + E)' },
  dijkstra: { name: "Dijkstra's Algorithm", complexity: 'O((V + E) log V)' },
  astar: { name: 'A* Search', complexity: 'O(b^d)' },
  topological: { name: 'Topological Sort', complexity: 'O(V + E)' }
};


export function GraphAlgorithms() {
  // React Flow state
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  
  // Keep original nodes/edges for algorithm compatibility
  const [nodes, setNodes] = useState<Record<string, GraphNode>>({});
  const [edges, setEdges] = useState<Record<string, GraphEdge>>({});
  const [isDirected, setIsDirected] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState<string | null>(null);
  // Algorithm state
  const [algorithm, setAlgorithm] = useState<GraphAlgorithm>('bfs');
  const [startNode, setStartNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCode, setShowCode] = useState(false);
  // Default example: from to [weight]
  const [edgeListText, setEdgeListText] = useState('1 2 5\n3 4 2\n3 2 1');
  
  // Track last programmatic update to textarea
  const lastGraphText = useRef('');
  const textareaFocused = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Convert between React Flow and internal format
  const convertToInternalFormat = useCallback(() => {
    const internalNodes: Record<string, GraphNode> = {};
    const internalEdges: Record<string, GraphEdge> = {};

    rfNodes.forEach((node) => {
      internalNodes[node.id] = {
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        label: node.data.label,
      };
    });

    rfEdges.forEach((edge) => {
      internalEdges[edge.id] = {
        id: edge.id,
        from: edge.source,
        to: edge.target,
        weight: edge.label ? parseInt(String(edge.label)) : 1,
        directed: isDirected,
      };
    });

    setNodes(internalNodes);
    setEdges(internalEdges);
  }, [rfNodes, rfEdges, isDirected]);

  // React Flow event handlers
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const newEdge: Edge = {
          id: generateId(),
          source: connection.source,
          target: connection.target,
          label: '1',
          type: isDirected ? 'straight' : 'default',
        };
        setRfEdges((eds) => rfAddEdge(newEdge, eds));
      }
    },
    [setRfEdges, isDirected]
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isAddingEdge) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const x = event.clientX - rect.left - 50; // Center the node
        const y = event.clientY - rect.top - 25;
        
        const newNode: Node = {
          id: generateId(),
          data: { label: `${rfNodes.length + 1}` },
          position: { x, y },
          type: 'default',
        };
        setRfNodes((nds) => [...nds, newNode]);
      }
    },
    [isAddingEdge, rfNodes.length, setRfNodes]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      if (isAddingEdge) {
        if (edgeFrom && edgeFrom !== node.id) {
          const newEdge: Edge = {
            id: generateId(),
            source: edgeFrom,
            target: node.id,
            label: '1',
            type: isDirected ? 'straight' : 'default',
          };
          setRfEdges((eds) => rfAddEdge(newEdge, eds));
          setIsAddingEdge(false);
          setEdgeFrom(null);
        } else {
          setEdgeFrom(node.id);
        }
      } else {
        setSelectedNode(node.id);
      }
    },
    [isAddingEdge, edgeFrom, isDirected, setRfEdges]
  );

  // Graph editing functions
  const addNode = useCallback((x: number, y: number) => {
    const newNode: Node = {
      id: generateId(),
      type: 'algorithmNode',
      data: { 
        label: `${rfNodes.length + 1}`,
        isStart: false,
        isVisited: false,
        isCurrent: false,
        distance: undefined
      },
      position: { x, y },
    };
    setRfNodes((nds) => [...nds, newNode]);
  }, [rfNodes.length, setRfNodes]);

  const removeNode = useCallback((nodeId: string) => {
    setRfNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setRfEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setRfNodes, setRfEdges]);

  const addEdge = useCallback((from: string, to: string, weight: number = 1) => {
    const newEdge: Edge = {
      id: generateId(),
      source: from,
      target: to,
      label: weight !== 1 ? String(weight) : undefined,
      type: isDirected ? 'straight' : 'default',
    };
    setRfEdges((eds) => rfAddEdge(newEdge, eds));
  }, [isDirected, setRfEdges]);

  const removeEdge = useCallback((edgeId: string) => {
    setRfEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, [setRfEdges]);

  const clearGraph = useCallback(() => {
    setRfNodes([]);
    setRfEdges([]);
    setNodes({});
    setEdges({});
    setSteps([]);
    setCurrentStep(0);
    setStartNode(null);
    setTargetNode(null);
  }, [setRfNodes, setRfEdges]);



  const runAlgorithm = useCallback(() => {
    if (!startNode) return;
    let algorithmSteps: AlgorithmStep[] = [];
    switch (algorithm) {
      case 'bfs':
        algorithmSteps = runBFS(nodes, edges, startNode);
        break;
      case 'dfs':
        algorithmSteps = runDFS(nodes, edges, startNode);
        break;
      case 'dijkstra':
        algorithmSteps = runDijkstra(nodes, edges, startNode);
        break;
      default:
        return;
    }
    setSteps(algorithmSteps);
    setCurrentStep(0);
  }, [algorithm, startNode, nodes, edges]);

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

  // Auto-parse edge list and update React Flow nodes/edges
  useEffect(() => {
    const lines = edgeListText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    if (lines.length === 0) return;
    
    const nodeSet = new Set<string>();
    const parsedEdges: { from: string; to: string; weight: number }[] = [];
    console.log('Parsing edge list:', lines);
    lines.forEach(line => {
      const parts = line.split(/\s+/);
      if (parts.length === 3) {
        const [from, to, weightStr] = parts;
        nodeSet.add(from);
        nodeSet.add(to);
        parsedEdges.push({ from, to, weight: weightStr ? parseInt(weightStr) : 1 });
      } else if (parts.length === 2) {
        const [from, to] = parts;
        nodeSet.add(from);
        nodeSet.add(to);
        parsedEdges.push({ from, to, weight: 1 });
      } else if (parts.length === 1 && parts[0]) {
        nodeSet.add(parts[0]);
      }
    });

    // Create React Flow nodes in a circle
    const nodeIds = Array.from(nodeSet);
    const angleStep = (2 * Math.PI) / Math.max(nodeIds.length, 1);
    const radius = 120;
    const centerX = 200;
    const centerY = 150;

    const newRfNodes: Node[] = nodeIds.map((id, i) => ({
      id,
      type: 'algorithmNode',
      data: { 
        label: id,
        isStart: false,
        isVisited: false,
        isCurrent: false,
        distance: undefined
      },
      position: {
        x: centerX + radius * Math.cos(i * angleStep),
        y: centerY + radius * Math.sin(i * angleStep)
      }
    }));

    const newRfEdges: Edge[] = parsedEdges.map((edge, i) => ({
      id: `e${i}`,
      source: edge.from,
      target: edge.to,
      label: edge.weight !== 1 ? String(edge.weight) : undefined,
      type: isDirected ? 'straight' : 'default',
    }));

    setRfNodes(newRfNodes);
    setRfEdges(newRfEdges);
    setSteps([]);
    setCurrentStep(0);
    setStartNode(null);
    setTargetNode(null);
  }, [edgeListText, isDirected, setRfNodes, setRfEdges]);

  // Convert React Flow data to internal format when it changes
  useEffect(() => {
    convertToInternalFormat();
  }, [convertToInternalFormat]);

  // Sync React Flow changes back to textarea
  useEffect(() => {
    const edgeLines = rfEdges.map(edge => {
      return edge.label && edge.label !== '1'
        ? `${edge.source} ${edge.target} ${edge.label}`
        : `${edge.source} ${edge.target}`;
    });
    const nodesWithEdges = new Set();
    rfEdges.forEach(edge => {
      nodesWithEdges.add(edge.source);
      nodesWithEdges.add(edge.target);
    });
    const isolatedNodes = rfNodes
      .filter(node => !nodesWithEdges.has(node.id))
      .map(node => node.data.label);
    const allLines = [...edgeLines, ...isolatedNodes];
    const newEdgeListText = allLines.join('\n');
    // Only update textarea if the graph structure changed and textarea is not focused
    if (newEdgeListText !== lastGraphText.current && !textareaFocused.current) {
      setEdgeListText(newEdgeListText);
      lastGraphText.current = newEdgeListText;
    }
  }, [rfNodes, rfEdges]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentStepData = steps[currentStep];

  // Update React Flow nodes when algorithm state changes
  useEffect(() => {
    setRfNodes((nodes) =>
      nodes.map((node) => {
        const isStart = startNode === node.id;
        const isVisited = currentStepData?.visitedNodes.includes(node.id) || false;
        const isCurrent = currentStepData?.currentNode === node.id;
        const distance = currentStepData?.distances?.[node.id];
        
        return {
          ...node,
          data: {
            ...node.data,
            isStart,
            isVisited,
            isCurrent,
            distance
          }
        };
      })
    );
  }, [currentStepData, startNode, setRfNodes]);

  // Update React Flow edges when algorithm state changes
  useEffect(() => {
    setRfEdges((edges) =>
      edges.map((edge) => {
        const isActive = currentStepData?.activeEdges.includes(edge.id) || false;
        
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            strokeWidth: isActive ? 3 : 2,
          },
          markerEnd: isDirected ? 'arrow' : undefined,
        };
      })
    );
  }, [currentStepData, isDirected, setRfEdges]);

  const controls = (
    <div className="flex flex-col items-center gap-4">
    
      <Tabs value={algorithm} onValueChange={(value) => setAlgorithm(value as GraphAlgorithm)}>
        <TabsList>
          <TabsTrigger value="bfs">BFS</TabsTrigger>
          <TabsTrigger value="dfs">DFS</TabsTrigger>
          <TabsTrigger value="dijkstra">Dijkstra</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-center gap-4">
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

  // Compute traversal result or distances for display
  let traversalResult: string[] = [];
  let distanceResult: [string, number][] = [];
  if (steps.length > 0) {
    if (algorithm === 'bfs' || algorithm === 'dfs') {
      // Find the last step with a visitedNodes array
      const lastStep = [...steps].reverse().find(s => s.visitedNodes && s.visitedNodes.length > 0);
      if (lastStep) {
        traversalResult = lastStep.visitedNodes.map(id => nodes[id]?.label ?? id);
      }
    } else if (algorithm === 'dijkstra') {
      // Find the last step with distances
      const lastStep = [...steps].reverse().find(s => s.distances);
      if (lastStep && lastStep.distances) {
        distanceResult = Object.entries(lastStep.distances).map(([id, dist]) => [nodes[id]?.label ?? id, dist]);
      }
    }
  }

  return (
    <AlgorithmLayout
      title="Graph Algorithm Visualizer"
      description="Create graphs and visualize pathfinding algorithms step by step"
      controls={controls}
      sidebar={sidebar}
    >
      {/* Graph Data Table */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div>
          <div className=" mb-1">Graph Data:</div>
          <Textarea
            className="border rounded p-2 text-sm w-48 min-h-[20rem] resize-none"
            value={edgeListText}
            onFocus={() => { textareaFocused.current = true; }}
            onBlur={() => { textareaFocused.current = false; }}
            onChange={e => {
              setEdgeListText(e.target.value);
              lastGraphText.current = e.target.value; // treat as user edit
            }}
            spellCheck={false}
          />
          <div className="text-xs text-muted-foreground mt-1">
            Format: <br />
            <code>from to [weight]</code><br />
            Example: <br />
            <code>1 2</code><br />
            <code>2 3 4</code>
          </div>
        </div>
        <div className="flex-1">
          <div className="relative w-full h-96 border-2 border-muted rounded-lg overflow-hidden">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onPaneClick={onPaneClick}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              style={{ width: '100%', height: '100%' }}
            >
            </ReactFlow>
          </div>
          {/* Traversal/Distance Result */}
          {algorithm !== 'dijkstra' && traversalResult.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-sm font-medium mb-2">Traversal Result:</div>
              <div className="text-lg font-mono">
                [{traversalResult.join(', ')}]
              </div>
            </div>
          )}
          {algorithm === 'dijkstra' && distanceResult.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-sm font-medium mb-2">Distances from Start Node:</div>
              <div className="text-lg font-mono flex flex-wrap gap-2 justify-center">
                {distanceResult.map(([label, dist]) => (
                  <span key={label}>
                    {label}: {dist === Infinity ? '∞' : dist}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AlgorithmLayout>
  );
}
