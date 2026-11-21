import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { AlgoNode, type AlgoNodeData } from '@/components/graph/AlgoNode';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Chips } from '@/components/viz/Chips';
import { Legend, ShortcutHint } from '@/components/viz/Legend';
import { Panel } from '@/components/viz/Panel';
import { Pseudocode } from '@/components/viz/Pseudocode';
import { ComplexityTable, Stat, StatGrid } from '@/components/viz/Stat';
import { StatusPill, Transport } from '@/components/viz/Transport';
import { GRAPH_ALGORITHMS, validateGraph } from '@/engine/graph/algorithms';
import { formatEdgeList, parseEdgeList, type ParseError } from '@/engine/graph/parse';
import { describeGraphEvent, recordGraph } from '@/engine/graph/trace';
import { GRAPH_IDS, type Graph, type GraphAlgorithmId, type GraphEdge } from '@/engine/graph/types';
import { DEFAULT_SPEED, nearestSpeed } from '@/player/clock';
import { parseEnum, parseInt10, useQueryState } from '@/player/urlState';
import { usePlayer } from '@/player/usePlayer';
import { usePlayerShortcuts } from '@/player/useShortcuts';

const EXAMPLE = '1 2 4\n1 3 2\n2 3 5\n2 4 10\n3 5 3\n5 4 4\n4 6 11';

interface GNode {
  id: string;
  x: number;
  y: number;
}
interface Model {
  nodes: GNode[];
  edges: GraphEdge[];
}

const nodeTypes = { algo: AlgoNode };

function circle(i: number, count: number): { x: number; y: number } {
  const r = Math.max(110, count * 22);
  const a = (2 * Math.PI * i) / Math.max(count, 1) - Math.PI / 2;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

/** Rebuilds the model from text, keeping the positions of nodes that still exist. */
function modelFromText(text: string, prev: Model | null): { model: Model; errors: ParseError[] } {
  const parsed = parseEdgeList(text);
  const old = new Map(prev?.nodes.map(n => [n.id, n]) ?? []);
  const nodes = parsed.nodes.map((id, i) => old.get(id) ?? { id, ...circle(i, parsed.nodes.length) });
  const edges = parsed.edges.map((e, i) => ({ id: `e${i}`, ...e }));
  return { model: { nodes, edges }, errors: parsed.errors };
}

function textFromModel(m: Model): string {
  const linked = new Set(m.edges.flatMap(e => [e.from, e.to]));
  return formatEdgeList(m.edges, m.nodes.filter(n => !linked.has(n.id)).map(n => n.id));
}

const ALGO_OPTIONS = GRAPH_IDS.map(id => ({ value: id, label: id === 'dijkstra' ? 'Dijkstra' : id.toUpperCase() }));

export default function GraphPage() {
  return (
    <ReactFlowProvider>
      <GraphWorkspace />
    </ReactFlowProvider>
  );
}

function GraphWorkspace() {
  const [params, update] = useQueryState();
  const algoId = parseEnum<GraphAlgorithmId>(params.get('algo'), GRAPH_IDS, 'bfs');
  const speed = nearestSpeed(parseInt10(params.get('speed'), 1, 100_000) ?? DEFAULT_SPEED);
  const directed = params.get('d') === '1';
  const algo = GRAPH_ALGORITHMS[algoId];
  const flow = useReactFlow();

  // text is initialised from the URL once, then written back on every edit
  const [text, setText] = useState(() => params.get('g') ?? EXAMPLE);
  const [{ model, errors }, setParsed] = useState(() => modelFromText(params.get('g') ?? EXAMPLE, null));
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const edgeSeq = useRef(0);

  const setModel = useCallback(
    (next: Model) => {
      setParsed({ model: next, errors: [] });
      const t = textFromModel(next);
      setText(t);
      update({ g: t === EXAMPLE ? null : t });
    },
    [update],
  );

  const onText = (t: string) => {
    setText(t);
    setParsed(prev => modelFromText(t, prev.model));
    update({ g: t === EXAMPLE ? null : t });
  };

  const requestedStart = params.get('start');
  const start = model.nodes.some(n => n.id === requestedStart) ? requestedStart : (model.nodes[0]?.id ?? null);

  // the engine only sees structure; dragging a node must not re-record the trace
  const structureKey = JSON.stringify([model.nodes.map(n => n.id), model.edges.map(e => [e.from, e.to, e.weight]), directed]);
  const graph: Graph = useMemo(
    () => ({ nodes: model.nodes.map(n => n.id), edges: model.edges, directed }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structureKey],
  );
  const problem = graph.nodes.length === 0 ? null : validateGraph(algoId, graph);
  const trace = useMemo(
    () => (start && !problem ? recordGraph(algoId, graph, start) : null),
    [algoId, graph, start, problem],
  );

  const player = usePlayer(trace?.frames.length ?? 1, speed, trace);
  usePlayerShortcuts(player);
  const frame = trace?.frames[player.index] ?? null;

  // refit the view when nodes are added or removed
  const nodeCount = model.nodes.length;
  useEffect(() => {
    const id = requestAnimationFrame(() => flow.fitView({ padding: 0.3, duration: 200 }));
    return () => cancelAnimationFrame(id);
  }, [nodeCount, flow]);

  const treeEdgeIds = useMemo(() => new Set(Object.values(frame?.treeEdges ?? {})), [frame]);
  const weighted = algoId === 'dijkstra' || model.edges.some(e => e.weight !== 1);

  const rfNodes: Node<AlgoNodeData>[] = model.nodes.map(n => ({
    id: n.id,
    type: 'algo',
    position: { x: n.x, y: n.y },
    selected: selection.has(n.id),
    data: {
      label: n.id,
      isStart: n.id === start,
      isCurrent: frame?.current === n.id,
      isVisited: frame?.visited.includes(n.id) ?? false,
      inFrontier: frame?.frontier.some(f => f.node === n.id) ?? false,
      distance: algoId === 'dijkstra' && frame?.distances ? frame.distances[n.id] : undefined,
    },
  }));

  const rfEdges: Edge[] = model.edges.map(e => {
    const active = frame?.activeEdge === e.id;
    const tree = treeEdgeIds.has(e.id);
    const color = active ? 'hsl(var(--algo-comparing))' : tree ? 'hsl(var(--algo-sorted))' : 'hsl(var(--muted-foreground))';
    return {
      id: e.id,
      source: e.from,
      target: e.to,
      type: 'straight',
      selected: selection.has(e.id),
      label: weighted ? String(e.weight) : undefined,
      labelStyle: { fill: 'hsl(var(--foreground))', fontFamily: 'var(--font-mono)', fontSize: 11 },
      labelBgStyle: { fill: 'hsl(var(--card))' },
      labelBgPadding: [4, 2] as [number, number],
      style: { stroke: color, strokeWidth: active ? 3.5 : tree ? 2.5 : 1.5, opacity: active || tree ? 1 : 0.6 },
      markerEnd: directed ? { type: MarkerType.ArrowClosed, color, width: 18, height: 18 } : undefined,
    };
  });

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      let next = model;
      let removed = false;
      let moved = false;
      const sel = new Set(selection);
      for (const c of changes) {
        if (c.type === 'position' && c.position) {
          const p = c.position;
          next = { ...next, nodes: next.nodes.map(n => (n.id === c.id ? { ...n, x: p.x, y: p.y } : n)) };
          moved = true;
        } else if (c.type === 'remove') {
          next = { nodes: next.nodes.filter(n => n.id !== c.id), edges: next.edges.filter(e => e.from !== c.id && e.to !== c.id) };
          removed = true;
        } else if (c.type === 'select') {
          if (c.selected) sel.add(c.id);
          else sel.delete(c.id);
        }
      }
      setSelection(sel);
      if (removed) setModel(next);
      else if (moved) setParsed(p => ({ ...p, model: next }));
    },
    [model, selection, setModel],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const sel = new Set(selection);
      let next = model;
      let changed = false;
      for (const c of changes) {
        if (c.type === 'remove') {
          next = { ...next, edges: next.edges.filter(e => e.id !== c.id) };
          changed = true;
        } else if (c.type === 'select') {
          if (c.selected) sel.add(c.id);
          else sel.delete(c.id);
        }
      }
      setSelection(sel);
      if (changed) setModel(next);
    },
    [model, selection, setModel],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      setModel({ ...model, edges: [...model.edges, { id: `c${edgeSeq.current++}`, from: c.source, to: c.target, weight: 1 }] });
    },
    [model, setModel],
  );

  const nextLabel = () => {
    const used = new Set(model.nodes.map(n => n.id));
    let k = 1;
    while (used.has(String(k))) k++;
    return String(k);
  };

  const addNodeAt = (pos: { x: number; y: number }) => setModel({ ...model, nodes: [...model.nodes, { id: nextLabel(), x: pos.x - 20, y: pos.y - 20 }] });

  const onPaneClick = (e: React.MouseEvent) => {
    // touch taps are usually attempts to scroll or pan; phones use the Add node button
    const pointer = (e.nativeEvent as PointerEvent).pointerType;
    if (pointer === 'touch') return;
    addNodeAt(flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  };

  const addNodeCentered = () => {
    const el = document.querySelector('.react-flow');
    const r = el?.getBoundingClientRect();
    const centre = r ? flow.screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : { x: 0, y: 0 };
    addNodeAt({ x: centre.x + (model.nodes.length % 3) * 30, y: centre.y + (model.nodes.length % 2) * 30 });
  };

  const label = (id: string) => id;
  const unreachable = trace && player.status === 'finished' ? graph.nodes.filter(id => !trace.order.includes(id)) : [];
  const frontier = frame?.frontier ?? [];
  const frontierShown = algoId === 'dijkstra' ? [...frontier].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)) : frontier;

  return (
    <div className="container">
      <PageHeader index="02" eyebrow="Graph traversal" title="Graph algorithms">
        Edit the graph as text or on the canvas. The trace re-records on every change, so the player is always ready.
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2">
        <Chips legend="Algorithm" name="graph-algo" value={algoId} options={ALGO_OPTIONS} onChange={id => update({ algo: id })} />
        <p className="text-sm text-muted-foreground">{algo.summary}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <section className="min-w-0 rounded-lg border bg-card" aria-label={`${algo.name} visualisation`}>
          <div className="flex min-h-11 items-center gap-3 border-b px-4 py-2">
            <StatusPill status={player.status} />
            <p className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:text-[13px]" aria-live={player.playing ? 'off' : 'polite'}>
              {problem ?? (trace ? describeGraphEvent(frame?.event ?? null, label, algo.frontierName, algoId === 'dijkstra' ? 'Settle' : 'Visit') : 'Empty graph.')}
            </p>
          </div>
          <div className="stage-grid relative h-[320px] sm:h-[400px]">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onPaneClick={onPaneClick}
              onNodeDoubleClick={(_, n) => update({ start: n.id })}
              zoomOnDoubleClick={false}
              panActivationKeyCode={null}
              zoomOnScroll={false}
              preventScrolling={false}
              minZoom={0.3}
              maxZoom={2}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              aria-label="Graph canvas"
            >
              <Controls showInteractive={false} position="bottom-left" />
            </ReactFlow>
            {model.nodes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="max-w-xs text-sm text-muted-foreground">
                  Empty graph. Type an edge list below, click the canvas, or start from the example.
                </p>
                <Button size="sm" variant="outline" className="pointer-events-auto" onClick={() => onText(EXAMPLE)}>
                  Load example
                </Button>
              </div>
            )}
            {problem && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-md border border-destructive/50 bg-card px-3 py-2 text-sm" role="alert">
                {problem}
              </div>
            )}
          </div>
          <Legend
            className="border-t px-4 py-3"
            items={[
              { label: 'Current', swatch: 'bg-algo-comparing' },
              { label: algoId === 'dijkstra' ? 'Settled' : 'Visited', swatch: 'bg-algo-sorted' },
              { label: `In ${algo.frontierName.toLowerCase()} (dashed ring)`, swatch: 'bg-algo-active' },
              { label: algoId === 'dijkstra' ? 'Shortest-path tree edge' : 'Traversal tree edge', swatch: 'bg-algo-sorted' },
            ]}
          />
          <Transport player={player} speed={speed} onSpeed={s => update({ speed: s })} disabled={!trace} />
        </section>

        <aside className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Panel title="Pseudocode">
            <Pseudocode lines={algo.pseudocode} active={frame?.event?.line ?? null} />
          </Panel>
          <Panel title="State">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="mb-1.5 text-xs text-muted-foreground">
                  {algo.frontierName}
                  {algoId === 'bfs' && ' (front first)'}
                  {algoId === 'dfs' && ' (bottom first)'}
                  {algoId === 'dijkstra' && ' (by distance)'}
                </h3>
                <ul className="flex min-h-8 flex-wrap gap-1.5 font-mono text-xs">
                  {frontierShown.length === 0 && <li className="py-1.5 text-muted-foreground">empty</li>}
                  {frontierShown.map((f, i) => (
                    <li key={`${f.node}-${i}`} className="rounded border border-dashed border-algo-active px-2 py-1">
                      {label(f.node)}
                      {f.priority !== undefined && <span className="text-muted-foreground">:{f.priority}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-1.5 text-xs text-muted-foreground">{algoId === 'dijkstra' ? 'Settle order' : 'Visit order'}</h3>
                <p className="min-h-6 break-words font-mono text-xs">
                  {frame && frame.visited.length > 0 ? frame.visited.map(label).join(' → ') : <span className="text-muted-foreground">none yet</span>}
                </p>
                {unreachable.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Not reachable from {start}: {unreachable.join(', ')}
                  </p>
                )}
              </div>
              {algoId === 'dijkstra' && frame?.distances && (
                <div>
                  <h3 className="mb-1.5 text-xs text-muted-foreground">Distance from {start}</h3>
                  <dl className="flex flex-wrap gap-1.5 font-mono text-xs">
                    {graph.nodes.map(id => (
                      <div key={id} className="flex gap-1.5 rounded border px-2 py-1">
                        <dt className="text-muted-foreground">{id}</dt>
                        <dd>{Number.isFinite(frame.distances![id]) ? frame.distances![id] : '∞'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              <StatGrid>
                <Stat label={algoId === 'dijkstra' ? 'Settled' : 'Visited'} value={frame?.counters.visited ?? 0} total={graph.nodes.length} />
                <Stat label="Edges inspected" value={frame?.counters.edgesInspected ?? 0} />
                <Stat label="Frontier ops" value={frame?.counters.frontierOps ?? 0} hint="pushes and pops" />
                {algoId === 'dijkstra' ? (
                  <Stat label="Relaxations" value={frame?.counters.relaxations ?? 0} />
                ) : (
                  <Stat label="Edges" value={graph.edges.length} />
                )}
              </StatGrid>
              <ComplexityTable
                rows={[
                  ['Time', algo.complexity.time],
                  ['Space', algo.complexity.space],
                ]}
              />
            </div>
          </Panel>
        </aside>

        <Panel title="Graph" className="lg:col-start-1 lg:row-start-2">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <label htmlFor="edges" className="text-sm">
                Edge list
              </label>
              <textarea
                id="edges"
                value={text}
                onChange={e => onText(e.target.value)}
                spellCheck={false}
                rows={8}
                aria-describedby="edges-help"
                aria-invalid={errors.length > 0}
                className="min-h-40 resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm leading-6"
              />
              <p id="edges-help" className="text-xs text-muted-foreground">
                One per line: <code className="font-mono">from to [weight]</code>. A single label adds an isolated node.
              </p>
              {errors.length > 0 && (
                <ul role="alert" className="space-y-0.5 text-xs text-destructive">
                  {errors.map(e => (
                    <li key={e.line}>
                      Line {e.line}: {e.message} (skipped)
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-5">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Directed edges
                  <span className="block text-xs text-muted-foreground">Traversals follow edges from → to only</span>
                </span>
                <Switch checked={directed} onCheckedChange={v => update({ d: v ? '1' : null })} />
              </label>
              {model.nodes.length > 0 && (
                <div className="flex flex-col gap-2 text-sm">
                  <span>Start node</span>
                  {model.nodes.length <= 16 ? (
                    <Chips
                      legend="Start node"
                      name="start"
                      value={start ?? ''}
                      options={model.nodes.map(n => ({ value: n.id, label: n.id }))}
                      onChange={id => update({ start: id })}
                    />
                  ) : (
                    <select
                      value={start ?? ''}
                      onChange={e => update({ start: e.target.value })}
                      className="h-10 rounded-md border border-input bg-background px-3"
                      aria-label="Start node"
                    >
                      {model.nodes.map(n => (
                        <option key={n.id}>{n.id}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={addNodeCentered}>
                  <Plus /> Add node
                </Button>
                <Button variant="outline" size="sm" onClick={() => onText(EXAMPLE)}>
                  <RotateCcw /> Example
                </Button>
                <Button variant="outline" size="sm" onClick={() => onText('')} disabled={model.nodes.length === 0}>
                  <Trash2 /> Clear
                </Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                On the canvas: click empty space to add a node, drag from a node’s bottom handle to another node to connect, select and press
                Backspace to delete, double-click a node to start there.
              </p>
            </div>
          </div>
          <div className="mt-5 hidden border-t pt-4 md:block">
            <ShortcutHint />
          </div>
        </Panel>
      </div>
    </div>
  );
}
