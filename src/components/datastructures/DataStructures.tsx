import React, { useState, useCallback } from 'react';
import { Plus, Minus, Play, RotateCcw, ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlgorithmLayout } from '../AlgorithmLayout';
import { useTheme } from '../ThemeProvider';

interface StackNode {
  value: number;
  id: string;
}

interface QueueNode {
  value: number;
  id: string;
}

interface ListNode {
  value: number;
  id: string;
  next?: string;
}

interface TreeNode {
  value: number;
  id: string;
  left?: string;
  right?: string;
  x: number;
  y: number;
}

type DataStructure = 'stack' | 'queue' | 'list' | 'tree';
type TreeTraversal = 'inorder' | 'preorder' | 'postorder';

export function DataStructures() {
  const [activeStructure, setActiveStructure] = useState<DataStructure>('stack');
  const [inputValue, setInputValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Stack state
  const [stack, setStack] = useState<StackNode[]>([]);
  
  // Queue state
  const [queue, setQueue] = useState<QueueNode[]>([]);
  
  // Linked List state
  const [listNodes, setListNodes] = useState<Record<string, ListNode>>({});
  const [listHead, setListHead] = useState<string | null>(null);
  
  // Binary Tree state
  const [treeNodes, setTreeNodes] = useState<Record<string, TreeNode>>({});
  const [treeRoot, setTreeRoot] = useState<string | null>(null);
  const [traversalResult, setTraversalResult] = useState<number[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { theme } = useTheme();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Stack operations
  const pushToStack = useCallback(() => {
    if (!inputValue) return;
    
    setIsAnimating(true);
    const newNode: StackNode = {
      value: parseInt(inputValue),
      id: generateId()
    };
    
    setTimeout(() => {
      setStack(prev => [...prev, newNode]);
      setInputValue('');
      setIsAnimating(false);
    }, 300);
  }, [inputValue]);

  const popFromStack = useCallback(() => {
    if (stack.length === 0) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setStack(prev => prev.slice(0, -1));
      setIsAnimating(false);
    }, 300);
  }, [stack.length]);

  // Queue operations
  const enqueue = useCallback(() => {
    if (!inputValue) return;
    
    setIsAnimating(true);
    const newNode: QueueNode = {
      value: parseInt(inputValue),
      id: generateId()
    };
    
    setTimeout(() => {
      setQueue(prev => [...prev, newNode]);
      setInputValue('');
      setIsAnimating(false);
    }, 300);
  }, [inputValue]);

  const dequeue = useCallback(() => {
    if (queue.length === 0) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setQueue(prev => prev.slice(1));
      setIsAnimating(false);
    }, 300);
  }, [queue.length]);

  // Linked List operations
  const insertIntoList = useCallback(() => {
    if (!inputValue) return;
    
    const newId = generateId();
    const newNode: ListNode = {
      value: parseInt(inputValue),
      id: newId
    };

    setListNodes(prev => ({
      ...prev,
      [newId]: newNode
    }));

    if (!listHead) {
      setListHead(newId);
    } else {
      // Find the last node and link it
      let current = listHead;
      const updatedNodes = { ...listNodes };
      
      while (updatedNodes[current]?.next) {
        current = updatedNodes[current].next!;
      }
      
      updatedNodes[current] = { ...updatedNodes[current], next: newId };
      setListNodes(prev => ({ ...prev, ...updatedNodes, [newId]: newNode }));
    }
    
    setInputValue('');
  }, [inputValue, listHead, listNodes]);

  const deleteFromList = useCallback(() => {
    if (!listHead) return;
    
    const headNode = listNodes[listHead];
    if (headNode.next) {
      setListHead(headNode.next);
    } else {
      setListHead(null);
    }
    
    const { [listHead]: deleted, ...remaining } = listNodes;
    setListNodes(remaining);
  }, [listHead, listNodes]);

  // Binary Tree operations
  const insertIntoTree = useCallback(() => {
    if (!inputValue) return;

    const value = parseInt(inputValue);
    const newId = generateId();

    if (!treeRoot) {
      // First node
      const newNode: TreeNode = {
        value,
        id: newId,
        x: 400,
        y: 50
      };
      setTreeNodes({ [newId]: newNode });
      setTreeRoot(newId);
    } else {
      // Use a local copy for recursion
      const updatedNodes = { ...treeNodes };
      let inserted = false;

      function insertNode(nodeId: string, depth: number = 1, x: number, y: number): void {
        const node = updatedNodes[nodeId];
        const offsetX = 200 / Math.pow(2, depth - 1);

        if (value < node.value) {
          if (!node.left) {
            const newNode: TreeNode = {
              value,
              id: newId,
              x: node.x - offsetX,
              y: node.y + 80
            };
            node.left = newId;
            updatedNodes[newId] = newNode;
            inserted = true;
          } else {
            insertNode(node.left, depth + 1, node.x - offsetX, node.y + 80);
          }
        } else {
          if (!node.right) {
            const newNode: TreeNode = {
              value,
              id: newId,
              x: node.x + offsetX,
              y: node.y + 80
            };
            node.right = newId;
            updatedNodes[newId] = newNode;
            inserted = true;
          } else {
            insertNode(node.right, depth + 1, node.x + offsetX, node.y + 80);
          }
        }
      }

      insertNode(treeRoot, 1, updatedNodes[treeRoot].x, updatedNodes[treeRoot].y);

      if (inserted) {
        setTreeNodes(updatedNodes);
      }
    }

    setInputValue('');
  }, [inputValue, treeRoot, treeNodes, generateId]);

  const traverseTree = useCallback((type: TreeTraversal) => {
    if (!treeRoot) return;
    
    const result: number[] = [];
    const visited: string[] = [];
    
    const traverse = (nodeId: string | undefined) => {
      if (!nodeId) return;
      
      const node = treeNodes[nodeId];
      visited.push(nodeId);
      
      if (type === 'preorder') {
        result.push(node.value);
      }
      
      if (node.left) traverse(node.left);
      
      if (type === 'inorder') {
        result.push(node.value);
      }
      
      if (node.right) traverse(node.right);
      
      if (type === 'postorder') {
        result.push(node.value);
      }
    };
    
    traverse(treeRoot);
    setTraversalResult(result);
    
    // Animate traversal
    setHighlightedNodes([]);
    visited.forEach((nodeId, index) => {
      setTimeout(() => {
        setHighlightedNodes(prev => [...prev, nodeId]);
      }, index * 500);
    });
  }, [treeRoot, treeNodes]);

  const clearStructure = useCallback(() => {
    switch (activeStructure) {
      case 'stack':
        setStack([]);
        break;
      case 'queue':
        setQueue([]);
        break;
      case 'list':
        setListNodes({});
        setListHead(null);
        break;
      case 'tree':
        setTreeNodes({});
        setTreeRoot(null);
        setTraversalResult([]);
        setHighlightedNodes([]);
        break;
    }
  }, [activeStructure]);

  const renderStack = () => (
    <div className="flex flex-col items-center space-y-2 min-h-[300px] justify-end">
      <div className="text-sm font-medium mb-4">Stack (LIFO)</div>
      {stack.map((node, index) => (
        <div
          key={node.id}
          className={`w-20 h-12 bg-primary text-primary-foreground rounded border-2 border-primary-glow flex items-center justify-center font-bold transition-all duration-300 ${
            index === stack.length - 1 ? 'animate-bounce-subtle' : ''
          }`}
        >
          {node.value}
        </div>
      ))}
      <div className="w-24 h-4 bg-muted rounded-b-lg border-2 border-muted-foreground"></div>
    </div>
  );

  const renderQueue = () => (
    <div className="flex flex-col items-center space-y-4 min-h-[300px] justify-center">
      <div className="text-sm font-medium">Queue (FIFO)</div>
      <div className="flex items-center space-x-2">
        <div className="text-xs text-muted-foreground">Front</div>
        {queue.map((node, index) => (
          <div key={node.id} className="flex items-center">
            <div className="w-16 h-12 bg-accent text-accent-foreground rounded border-2 border-accent-glow flex items-center justify-center font-bold">
              {node.value}
            </div>
            {index < queue.length - 1 && <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground" />}
          </div>
        ))}
        <div className="text-xs text-muted-foreground">Rear</div>
      </div>
    </div>
  );

  const renderLinkedList = () => {
    const nodes: ListNode[] = [];
    let current = listHead;
    
    while (current) {
      nodes.push(listNodes[current]);
      current = listNodes[current].next;
    }

    return (
      <div className="flex flex-col items-center space-y-4 min-h-[300px] justify-center">
        <div className="text-sm font-medium">Linked List</div>
        <div className="flex items-center space-x-2">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              <div className="flex">
                <div className="w-16 h-12 bg-secondary text-secondary-foreground rounded-l border-2 border-secondary-glow flex items-center justify-center font-bold">
                  {node.value}
                </div>
                <div className="w-8 h-12 bg-muted border-2 border-secondary-glow border-l-0 rounded-r flex items-center justify-center">
                  {node.next ? <ArrowRight className="h-3 w-3" /> : '∅'}
                </div>
              </div>
              {index < nodes.length - 1 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const NODE_RADIUS = 24;
const LEVEL_HEIGHT = 90;

function computeTreeLayout(rootId: string | null, nodes: Record<string, TreeNode>) {
  // Simple BFS layout: assign x based on index at each level
  if (!rootId) return {};
  const positions: Record<string, { x: number; y: number }> = {};
  const queue: Array<{ id: string; depth: number; index: number; siblings: number }> = [];
  queue.push({ id: rootId, depth: 0, index: 0, siblings: 1 });

  while (queue.length) {
    const { id, depth, index, siblings } = queue.shift()!;
    const y = LEVEL_HEIGHT + depth * LEVEL_HEIGHT;
    const x = ((index + 1) * CANVAS_WIDTH) / (siblings + 1);

    positions[id] = { x, y };

    const node = nodes[id];
    let childCount = 0;
    if (node.left) childCount++;
    if (node.right) childCount++;

    if (node.left) queue.push({ id: node.left, depth: depth + 1, index: index * 2, siblings: siblings * 2 });
    if (node.right) queue.push({ id: node.right, depth: depth + 1, index: index * 2 + 1, siblings: siblings * 2 });
  }
  return positions;
}

  const renderBinaryTree = () => {
    // Choose background color based on theme
    const canvasBg = theme === 'dark' ? '#18181b' : '#f9f9f9';

    return (
      <div
        className="relative w-full overflow-auto"
        style={{ minHeight: CANVAS_HEIGHT }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          style={{ background: canvasBg, borderRadius: 8 }}
        >
          {/* Edges */}
          {Object.values(treeNodes).map(node => (
            <g key={`edges-${node.id}`}>
              {node.left && treeNodes[node.left] && (
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={treeNodes[node.left].x}
                  y2={treeNodes[node.left].y}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground"
                />
              )}
              {node.right && treeNodes[node.right] && (
                <line
                  x1={node.x}
                  y1={node.y}
                  x2={treeNodes[node.right].x}
                  y2={treeNodes[node.right].y}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground"
                />
              )}
            </g>
          ))}
          {/* Nodes */}
          {Object.values(treeNodes).map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                className={`${
                  highlightedNodes.includes(node.id)
                    ? 'fill-primary stroke-primary-glow'
                    : 'fill-background stroke-primary'
                } stroke-2 transition-all duration-300 cursor-pointer`}
                onMouseDown={e => handleMouseDown(e, node.id)}
              />
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                className={`text-sm font-bold ${
                  highlightedNodes.includes(node.id) ? 'fill-primary-foreground' : 'fill-foreground'
                }`}
                pointerEvents="none"
              >
                {node.value}
              </text>
            </g>
          ))}
        </svg>
        {traversalResult.length > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm font-medium mb-2">Traversal Result:</div>
            <div className="text-lg font-mono">
              [{traversalResult.join(', ')}]
            </div>
          </div>
        )}
      </div>
    );
  };

  const getControls = () => {
    const commonControls = (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter value"
          className="w-32"
        />
        <Button onClick={clearStructure} variant="outline">
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>
    );

    switch (activeStructure) {
      case 'stack':
        return (
          <div className="flex items-center gap-4">
            {commonControls}
            <Button onClick={pushToStack} disabled={!inputValue || isAnimating}>
              <Plus className="h-4 w-4" />
              Push
            </Button>
            <Button onClick={popFromStack} disabled={stack.length === 0 || isAnimating}>
              <Minus className="h-4 w-4" />
              Pop
            </Button>
          </div>
        );
      
      case 'queue':
        return (
          <div className="flex items-center gap-4">
            {commonControls}
            <Button onClick={enqueue} disabled={!inputValue || isAnimating}>
              <Plus className="h-4 w-4" />
              Enqueue
            </Button>
            <Button onClick={dequeue} disabled={queue.length === 0 || isAnimating}>
              <Minus className="h-4 w-4" />
              Dequeue
            </Button>
          </div>
        );
      
      case 'list':
        return (
          <div className="flex items-center gap-4">
            {commonControls}
            <Button onClick={insertIntoList} disabled={!inputValue}>
              <Plus className="h-4 w-4" />
              Insert
            </Button>
            <Button onClick={deleteFromList} disabled={!listHead}>
              <Minus className="h-4 w-4" />
              Delete Head
            </Button>
          </div>
        );
      
      case 'tree':
        return (
          <div className="flex items-center gap-4">
            {commonControls}
            <Button onClick={insertIntoTree} disabled={!inputValue}>
              <Plus className="h-4 w-4" />
              Insert
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={() => traverseTree('inorder')} 
                disabled={!treeRoot}
                variant="outline"
                size="sm"
              >
                Inorder
              </Button>
              <Button 
                onClick={() => traverseTree('preorder')} 
                disabled={!treeRoot}
                variant="outline"
                size="sm"
              >
                Preorder
              </Button>
              <Button 
                onClick={() => traverseTree('postorder')} 
                disabled={!treeRoot}
                variant="outline"
                size="sm"
              >
                Postorder
              </Button>
            </div>
          </div>
        );
      
      default:
        return commonControls;
    }
  };

  const getSidebar = () => {
    const descriptions = {
      stack: {
        title: 'Stack (LIFO)',
        description: 'A stack follows Last In, First Out principle. Elements are added and removed from the top.',
        operations: ['Push: Add element to top', 'Pop: Remove element from top', 'Peek: View top element'],
        complexity: 'All operations: O(1)'
      },
      queue: {
        title: 'Queue (FIFO)',
        description: 'A queue follows First In, First Out principle. Elements are added at rear and removed from front.',
        operations: ['Enqueue: Add element to rear', 'Dequeue: Remove element from front', 'Front: View front element'],
        complexity: 'All operations: O(1)'
      },
      list: {
        title: 'Linked List',
        description: 'A linear data structure where elements are stored in nodes, each pointing to the next node.',
        operations: ['Insert: Add new node', 'Delete: Remove node', 'Traverse: Visit all nodes'],
        complexity: 'Insert/Delete at head: O(1), Search: O(n)'
      },
      tree: {
        title: 'Binary Search Tree',
        description: 'A hierarchical data structure where each node has at most two children, with left < parent < right.',
        operations: ['Insert: Add new node maintaining BST property', 'Traversals: Visit nodes in different orders'],
        complexity: 'Average: O(log n), Worst: O(n)'
      }
    };

    const info = descriptions[activeStructure];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">{info.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {info.description}
          </p>
          
          <div className="space-y-2">
            <h4 className="font-medium">Operations:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {info.operations.map((op, index) => (
                <li key={index}>• {op}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium">Complexity:</h4>
            <p className="text-sm text-muted-foreground">{info.complexity}</p>
          </div>
        </div>

        {activeStructure === 'stack' && (
          <div>
            <h4 className="font-medium mb-2">Current State</h4>
            <p className="text-sm text-muted-foreground">
              Size: {stack.length}
              {stack.length > 0 && (
                <>
                  <br />Top: {stack[stack.length - 1].value}
                </>
              )}
            </p>
          </div>
        )}

        {activeStructure === 'queue' && (
          <div>
            <h4 className="font-medium mb-2">Current State</h4>
            <p className="text-sm text-muted-foreground">
              Size: {queue.length}
              {queue.length > 0 && (
                <>
                  <br />Front: {queue[0].value}
                  <br />Rear: {queue[queue.length - 1].value}
                </>
              )}
            </p>
          </div>
        )}

        {activeStructure === 'list' && (
          <div>
            <h4 className="font-medium mb-2">Current State</h4>
            <p className="text-sm text-muted-foreground">
              Nodes: {Object.keys(listNodes).length}
              {listHead && (
                <>
                  <br />Head: {listNodes[listHead].value}
                </>
              )}
            </p>
          </div>
        )}

        {activeStructure === 'tree' && (
          <div>
            <h4 className="font-medium mb-2">Current State</h4>
            <p className="text-sm text-muted-foreground">
              Nodes: {Object.keys(treeNodes).length}
              {treeRoot && (
                <>
                  <br />Root: {treeNodes[treeRoot].value}
                </>
              )}
            </p>
          </div>
        )}
      </div>
    );
  };

  const controls = (
    <div className="flex items-center gap-4">
      <Tabs value={activeStructure} onValueChange={(value) => setActiveStructure(value as DataStructure)}>
        <TabsList>
          <TabsTrigger value="stack">Stack</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="list">Linked List</TabsTrigger>
          <TabsTrigger value="tree">Binary Search Tree</TabsTrigger>
        </TabsList>
      </Tabs>
      {getControls()}
    </div>
  );

  const renderCurrentStructure = () => {
    switch (activeStructure) {
      case 'stack':
        return renderStack();
      case 'queue':
        return renderQueue();
      case 'list':
        return renderLinkedList();
      case 'tree':
        return renderBinaryTree();
      default:
        return null;
    }
  };

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = treeNodes[nodeId];
    setDraggedNodeId(nodeId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    setTreeNodes(prev => ({
      ...prev,
      [draggedNodeId]: {
        ...prev[draggedNodeId],
        x: newX,
        y: newY,
      },
    }));
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  return (
    <AlgorithmLayout
      title="Data Structures Visualizer"
      description="Learn and interact with fundamental data structures through visual demonstrations"
      controls={controls}
      sidebar={getSidebar()}
      codeExamples={null}
    >
      <div className="flex items-center justify-center min-h-[400px] p-4">
        {renderCurrentStructure()}
      </div>
    </AlgorithmLayout>
  );
}
