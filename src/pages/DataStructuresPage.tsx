import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Minus, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Chips } from '@/components/viz/Chips';
import { ShortcutHint } from '@/components/viz/Legend';
import { Panel } from '@/components/viz/Panel';
import { ComplexityTable, Stat, StatGrid } from '@/components/viz/Stat';
import { Transport } from '@/components/viz/Transport';
import { Stage, VizLayout } from '@/components/viz/VizLayout';
import { bstInsert, emptyBst, height, layoutBst, traverse, type Bst, type Traversal } from '@/engine/ds/bst';
import { mulberry32, newSeed, randInt } from '@/engine/rng';
import { cn } from '@/lib/utils';
import { DEFAULT_SPEED, nearestSpeed } from '@/player/clock';
import { parseEnum, parseInt10, useQueryState } from '@/player/urlState';
import { usePlayer } from '@/player/usePlayer';
import { usePlayerShortcuts } from '@/player/useShortcuts';

const KINDS = ['stack', 'queue', 'list', 'bst'] as const;
type Kind = (typeof KINDS)[number];

const OPTIONS = [
  { value: 'stack' as const, label: 'Stack' },
  { value: 'queue' as const, label: 'Queue' },
  { value: 'list' as const, label: 'Linked list' },
  { value: 'bst' as const, label: 'Binary search tree' },
];

const INFO: Record<Kind, { title: string; summary: string; rows: Array<[string, string]> }> = {
  stack: {
    title: 'Stack (LIFO)',
    summary: 'Last in, first out: elements are pushed onto and popped from the top.',
    rows: [
      ['Push', 'O(1)'],
      ['Pop', 'O(1)'],
      ['Peek top', 'O(1)'],
    ],
  },
  queue: {
    title: 'Queue (FIFO)',
    summary: 'First in, first out: elements join at the rear and leave from the front.',
    rows: [
      ['Enqueue', 'O(1)'],
      ['Dequeue', 'O(1)'],
      ['Peek front', 'O(1)'],
    ],
  },
  list: {
    title: 'Singly linked list',
    summary: 'Each node holds a value and a pointer to the next node. This list keeps only a head pointer.',
    rows: [
      ['Insert at tail', 'O(n), walks from head'],
      ['Delete head', 'O(1)'],
      ['Search', 'O(n)'],
    ],
  },
  bst: {
    title: 'Binary search tree',
    summary: 'Each node’s left subtree holds smaller values and its right subtree equal or larger ones. This tree is not balanced.',
    rows: [
      ['Insert / search (average)', 'O(log n)'],
      ['Insert / search (worst)', 'O(n)'],
      ['Traversal', 'O(n)'],
    ],
  },
};

interface Item {
  id: number;
  value: number;
}

const SAMPLE_BST = [50, 30, 70, 20, 40, 60, 80];

export default function DataStructuresPage() {
  const [params, update] = useQueryState();
  const kind = parseEnum<Kind>(params.get('ds'), KINDS, 'stack');
  const speed = nearestSpeed(parseInt10(params.get('speed'), 1, 100_000) ?? 2);

  const [input, setInput] = useState('');
  const [stack, setStack] = useState<Item[]>([]);
  const [queue, setQueue] = useState<Item[]>([]);
  const [list, setList] = useState<Item[]>([]);
  const [tree, setTree] = useState<Bst>(emptyBst);
  const [insertPath, setInsertPath] = useState<{ path: number[]; id: number } | null>(null);
  const [offsets, setOffsets] = useState<Record<number, { dx: number; dy: number }>>({});
  const [traversal, setTraversal] = useState<{ order: Traversal; ids: number[] } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const seq = useRef(1);

  const player = usePlayer(traversal ? traversal.ids.length + 1 : 1, speed, traversal);
  usePlayerShortcuts(player, {}, kind === 'bst' && traversal !== null);

  const value = /^-?\d{1,3}$/.test(input.trim()) ? Number(input.trim()) : null;
  const invalid = input.trim() !== '' && value === null;
  const record = (line: string) => setLog(l => [line, ...l].slice(0, 8));
  const item = (v: number): Item => ({ id: seq.current++, value: v });

  const add = (v: number | null = value) => {
    if (v === null) return;
    if (kind === 'stack') {
      setStack(s => [...s, item(v)]);
      record(`push ${v}`);
    } else if (kind === 'queue') {
      setQueue(q => [...q, item(v)]);
      record(`enqueue ${v}`);
    } else if (kind === 'list') {
      setList(l => [...l, item(v)]);
      record(`insert ${v} at tail (${list.length} hops)`);
    } else {
      const res = bstInsert(tree, v);
      setTree(res.tree);
      setInsertPath({ path: res.path, id: res.id });
      setTraversal(null);
      record(`insert ${v} (${res.path.length} comparison${res.path.length === 1 ? '' : 's'})`);
    }
    setInput('');
  };

  const remove = () => {
    if (kind === 'stack' && stack.length) {
      record(`pop → ${stack[stack.length - 1].value}`);
      setStack(s => s.slice(0, -1));
    } else if (kind === 'queue' && queue.length) {
      record(`dequeue → ${queue[0].value}`);
      setQueue(q => q.slice(1));
    } else if (kind === 'list' && list.length) {
      record(`delete head → ${list[0].value}`);
      setList(l => l.slice(1));
    }
  };

  const clear = () => {
    if (kind === 'stack') setStack([]);
    if (kind === 'queue') setQueue([]);
    if (kind === 'list') setList([]);
    if (kind === 'bst') {
      setTree(emptyBst());
      setInsertPath(null);
      setOffsets({});
      setTraversal(null);
    }
    record('clear');
  };

  const sample = () => {
    if (kind === 'bst') {
      let t = tree;
      for (const v of SAMPLE_BST) t = bstInsert(t, v).tree;
      setTree(t);
      setInsertPath(null);
      setTraversal(null);
      record(`insert ${SAMPLE_BST.join(', ')}`);
      return;
    }
    const rng = mulberry32(newSeed());
    const values = Array.from({ length: 5 }, () => randInt(rng, 1, 99));
    const items = values.map(item);
    if (kind === 'stack') setStack(s => [...s, ...items]);
    if (kind === 'queue') setQueue(q => [...q, ...items]);
    if (kind === 'list') setList(l => [...l, ...items]);
    record(`add ${values.join(', ')}`);
  };

  const size = kind === 'stack' ? stack.length : kind === 'queue' ? queue.length : kind === 'list' ? list.length : Object.keys(tree.nodes).length;
  const addLabel = kind === 'stack' ? 'Push' : kind === 'queue' ? 'Enqueue' : 'Insert';
  const removeLabel = kind === 'stack' ? 'Pop' : kind === 'queue' ? 'Dequeue' : 'Delete head';
  const visited = traversal ? traversal.ids.slice(0, player.index) : [];
  const message = (() => {
    if (kind === 'bst' && traversal) {
      if (player.index === 0) return `${traversal.order} traversal ready. Press play or step forward.`;
      const id = traversal.ids[player.index - 1];
      return `Visit ${tree.nodes[id].value} (${player.index} of ${traversal.ids.length})`;
    }
    return log[0] ? `Last operation: ${log[0]}` : 'Empty. Add a value to start.';
  })();

  return (
    <div className="container">
      <PageHeader index="04" eyebrow="Data structures" title="Data structures">
        Operate on each structure directly and watch the shape change. Tree traversals replay on the shared player.
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2">
        <Chips legend="Data structure" name="ds" value={kind} options={OPTIONS} onChange={k => update({ ds: k })} />
        <p className="text-sm text-muted-foreground">{INFO[kind].summary}</p>
      </div>

      <VizLayout
        stage={
          <Stage
            label={`${INFO[kind].title} visualisation`}
            status={kind === 'bst' && traversal ? player.status : 'idle'}
            message={message}
            playing={player.playing}
            footer={
              kind === 'bst' && traversal ? <Transport player={player} speed={speed} onSpeed={s => update({ speed: s })} unit="visit" /> : null
            }
          >
            <div className="stage-grid flex min-h-[320px] items-center justify-center overflow-hidden px-4 py-6 sm:min-h-[380px]">
              {size === 0 ? (
                <div className="flex max-w-xs flex-col items-center gap-3 text-center">
                  <p className="text-sm text-muted-foreground">Empty {INFO[kind].title.toLowerCase().replace(/ \(.*\)/, '')}. Type a value below, or start from sample values.</p>
                  <Button size="sm" variant="outline" onClick={sample}>
                    <Sparkles /> Add sample values
                  </Button>
                </div>
              ) : kind === 'stack' ? (
                <StackView items={stack} />
              ) : kind === 'queue' ? (
                <QueueView items={queue} />
              ) : kind === 'list' ? (
                <ListView items={list} />
              ) : (
                <TreeView
                  tree={tree}
                  path={insertPath}
                  visited={visited}
                  current={visited[visited.length - 1] ?? null}
                  offsets={offsets}
                  onDrag={(id, dx, dy) => setOffsets(o => ({ ...o, [id]: { dx, dy } }))}
                />
              )}
            </div>
            {kind === 'bst' && traversal && (
              <p className="border-t px-4 py-3 font-mono text-sm">
                <span className="text-muted-foreground">{traversal.order}: </span>[{visited.map(id => tree.nodes[id].value).join(', ')}]
              </p>
            )}
          </Stage>
        }
        aside={
          <>
            <Panel title={INFO[kind].title}>
              <ComplexityTable rows={INFO[kind].rows} />
            </Panel>
            <Panel title="State">
              <StatGrid>
                <Stat label="Size" value={size} />
                {kind === 'stack' && <Stat label="Top" value={stack.length ? stack[stack.length - 1].value : '–'} />}
                {kind === 'queue' && <Stat label="Front / rear" value={queue.length ? `${queue[0].value} / ${queue[queue.length - 1].value}` : '–'} />}
                {kind === 'list' && <Stat label="Head" value={list.length ? list[0].value : '–'} />}
                {kind === 'bst' && <Stat label="Height" value={height(tree)} />}
              </StatGrid>
              <h3 className="mb-1.5 mt-4 text-xs text-muted-foreground">Operation log</h3>
              {log.length === 0 ? (
                <p className="text-xs text-muted-foreground">No operations yet.</p>
              ) : (
                <ol className="space-y-1 font-mono text-xs">
                  {log.map((l, i) => (
                    <li key={`${l}-${i}`} className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}>
                      {l}
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </>
        }
        below={
          <Panel title="Operations">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
              onSubmit={e => {
                e.preventDefault();
                add();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ds-value" className="sr-only">
                  Value
                </label>
                <input
                  id="ds-value"
                  inputMode="numeric"
                  placeholder="Value, e.g. 42"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  aria-invalid={invalid}
                  aria-describedby="ds-help"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono tabular sm:w-40"
                />
                <span id="ds-help" className={cn('text-xs', invalid ? 'text-destructive' : 'text-muted-foreground')}>
                  {invalid ? 'Whole numbers from −999 to 999' : 'Enter adds it'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={value === null}>
                  <Plus /> {addLabel}
                </Button>
                {kind !== 'bst' && (
                  <Button type="button" variant="outline" onClick={remove} disabled={size === 0}>
                    <Minus /> {removeLabel}
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={sample}>
                  <Sparkles /> Sample
                </Button>
                <Button type="button" variant="ghost" onClick={clear} disabled={size === 0}>
                  <RotateCcw /> Clear
                </Button>
              </div>
            </form>
            {kind === 'bst' && (
              <div className="mt-5 border-t pt-4">
                <p className="mb-2 text-sm">Traverse</p>
                <div className="flex flex-wrap gap-2">
                  {(['inorder', 'preorder', 'postorder'] as Traversal[]).map(o => (
                    <Button
                      key={o}
                      size="sm"
                      variant={traversal?.order === o ? 'default' : 'outline'}
                      disabled={size === 0}
                      onClick={() => {
                        setInsertPath(null);
                        setTraversal({ order: o, ids: traverse(tree, o) });
                      }}
                    >
                      {o[0].toUpperCase() + o.slice(1)}
                    </Button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Drag a node to move it. Inserting a value highlights the nodes it was compared with.</p>
                {traversal && (
                  <div className="mt-4 hidden md:block">
                    <ShortcutHint />
                  </div>
                )}
              </div>
            )}
          </Panel>
        }
      />
    </div>
  );
}

function Cell({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('flex h-11 min-w-14 items-center justify-center rounded-md border-2 px-3 font-mono font-semibold tabular animate-fade-in', className)}>
      {value}
    </div>
  );
}

function StackView({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col items-center">
      <ol className="flex flex-col-reverse items-center gap-1.5" aria-label="Stack, top first">
        {items.map((it, i) => {
          const top = i === items.length - 1;
          return (
            <li key={it.id} className="relative flex items-center">
              <Cell value={it.value} className={top ? 'border-primary bg-primary/15' : 'border-border bg-card'} />
              {top && <span className="absolute left-full ml-3 whitespace-nowrap font-mono text-xs text-ink">← top</span>}
            </li>
          );
        })}
      </ol>
      <div className="mt-2 h-1.5 w-28 rounded bg-border" aria-hidden />
    </div>
  );
}

function QueueView({ items }: { items: Item[] }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <ol className="mx-auto flex w-max items-end gap-1.5" aria-label="Queue, front first">
        {items.map((it, i) => (
          <li key={it.id} className="flex flex-col items-center gap-1">
            <span className="h-4 font-mono text-[10px] uppercase tracking-wider text-ink">
              {i === 0 ? 'front' : i === items.length - 1 ? 'rear' : ''}
            </span>
            <Cell value={it.value} className={i === 0 ? 'border-primary bg-primary/15' : 'border-border bg-card'} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ListView({ items }: { items: Item[] }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <ol className="mx-auto flex w-max items-end" aria-label="Linked list from head">
        {items.map((it, i) => (
          <li key={it.id} className="flex items-end">
            <div className="flex flex-col items-center gap-1">
              <span className="h-4 font-mono text-[10px] uppercase tracking-wider text-ink">{i === 0 ? 'head' : ''}</span>
              <div className="flex animate-fade-in overflow-hidden rounded-md border-2 border-border bg-card font-mono">
                <span className="flex h-11 min-w-12 items-center justify-center px-3 font-semibold tabular">{it.value}</span>
                <span className="flex h-11 w-8 items-center justify-center border-l-2 border-border text-xs text-muted-foreground">
                  {i === items.length - 1 ? '∅' : '•'}
                </span>
              </div>
            </div>
            {i < items.length - 1 && <ArrowRight className="mx-1 mb-3.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
          </li>
        ))}
      </ol>
    </div>
  );
}

const SLOT = 56;
const LEVEL = 72;
const R = 20;

function TreeView({
  tree,
  path,
  visited,
  current,
  offsets,
  onDrag,
}: {
  tree: Bst;
  path: { path: number[]; id: number } | null;
  visited: number[];
  current: number | null;
  offsets: Record<number, { dx: number; dy: number }>;
  onDrag: (id: number, dx: number, dy: number) => void;
}) {
  const layout = useMemo(() => layoutBst(tree), [tree]);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; dx: number; dy: number } | null>(null);
  const ids = Object.keys(layout).map(Number);
  const maxRank = Math.max(0, ...ids.map(id => layout[id].rank));
  const maxDepth = Math.max(0, ...ids.map(id => layout[id].depth));
  const width = (maxRank + 1) * SLOT + SLOT;
  const heightPx = (maxDepth + 1) * LEVEL + 40;
  const pos = (id: number) => ({
    x: SLOT + layout[id].rank * SLOT + (offsets[id]?.dx ?? 0),
    y: 36 + layout[id].depth * LEVEL + (offsets[id]?.dy ?? 0),
  });
  const visitedSet = new Set(visited);
  const pathSet = new Set(path?.path ?? []);

  const toSvg = (e: React.PointerEvent) => {
    const ctm = svg.current?.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return { x: (e.clientX - ctm.e) / ctm.a, y: (e.clientY - ctm.f) / ctm.d };
  };

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${width} ${heightPx}`}
      className="h-auto max-h-[440px] w-full touch-none"
      style={{ maxWidth: width * 1.4 }}
      role="img"
      aria-label={`Binary search tree with ${ids.length} nodes`}
      onPointerMove={e => {
        const d = drag.current;
        if (!d) return;
        const p = toSvg(e);
        onDrag(d.id, d.dx + p.x - d.x, d.dy + p.y - d.y);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
    >
      {ids.map(id => {
        const n = tree.nodes[id];
        const a = pos(id);
        return [n.left, n.right]
          .filter((c): c is number => c !== null)
          .map(c => {
            const b = pos(c);
            const lit = visitedSet.has(c) && visitedSet.has(id);
            return <line key={`${id}-${c}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? 'hsl(var(--algo-sorted))' : 'hsl(var(--muted-foreground))'} strokeOpacity={lit ? 1 : 0.5} strokeWidth={lit ? 2.5 : 1.5} />;
          });
      })}
      {ids.map(id => {
        const { x, y } = pos(id);
        const isCurrent = id === current;
        const isVisited = visitedSet.has(id);
        const onPath = pathSet.has(id);
        const isNew = path?.id === id;
        const fill = isCurrent ? 'hsl(var(--algo-comparing))' : isVisited ? 'hsl(var(--algo-sorted))' : isNew ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--card))';
        const stroke = isCurrent ? 'hsl(var(--foreground))' : isVisited ? 'hsl(var(--algo-sorted))' : onPath || isNew ? 'hsl(var(--algo-comparing))' : 'hsl(var(--muted-foreground))';
        return (
          <g
            key={id}
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={e => {
              const p = toSvg(e);
              drag.current = { id, x: p.x, y: p.y, dx: offsets[id]?.dx ?? 0, dy: offsets[id]?.dy ?? 0 };
              (e.target as Element).setPointerCapture?.(e.pointerId);
            }}
          >
            <circle cx={x} cy={y} r={R} fill={fill} stroke={stroke} strokeWidth={onPath || isCurrent ? 2.5 : 1.5} strokeDasharray={onPath && !isVisited ? '4 3' : undefined} />
            <text
              x={x}
              y={y}
              dy="0.35em"
              textAnchor="middle"
              className="pointer-events-none select-none font-mono text-[13px] font-semibold"
              fill={isCurrent || isVisited ? '#0A0F1E' : 'hsl(var(--foreground))'}
            >
              {tree.nodes[id].value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
