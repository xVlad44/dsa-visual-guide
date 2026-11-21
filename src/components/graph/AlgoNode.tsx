import { Handle, Position, type NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';

export interface AlgoNodeData {
  label: string;
  isStart: boolean;
  isCurrent: boolean;
  isVisited: boolean;
  inFrontier: boolean;
  /** Dijkstra distance; undefined when not running Dijkstra */
  distance?: number;
}

/**
 * Node states use shape as well as colour: the current node gets a thick
 * ring, frontier nodes a dashed ring, visited nodes are filled, the start
 * node carries a "start" tag.
 */
export function AlgoNode({ data, selected }: NodeProps<AlgoNodeData>) {
  const { label, isStart, isCurrent, isVisited, inFrontier, distance } = data;
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-muted-foreground/60" />
      {distance !== undefined && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] font-medium text-ink">
          {Number.isFinite(distance) ? distance : '∞'}
        </div>
      )}
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-sm font-semibold transition-colors',
          isCurrent
            ? 'border-foreground bg-algo-comparing text-[#0A0F1E] ring-4 ring-algo-comparing/35'
            : isVisited
              ? 'border-algo-sorted bg-algo-sorted text-[#0A0F1E]'
              : inFrontier
                ? 'border-dashed border-algo-active bg-card text-foreground'
                : 'border-muted-foreground/60 bg-card text-foreground',
          selected && 'outline outline-2 outline-offset-4 outline-ring',
        )}
      >
        {label}
      </div>
      {isStart && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          start
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-muted-foreground/60" />
    </div>
  );
}
