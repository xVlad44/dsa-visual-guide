import { useEffect, useRef } from 'react';
import type { SortFrame } from '@/engine/sorting/trace';
import { cn } from '@/lib/utils';
import { barStates, CANVAS_THRESHOLD, type BarState } from './bars';

const STATE_CLASS: Record<BarState, string> = {
  default: 'bg-algo-default',
  comparing: 'bg-algo-comparing',
  swapping: 'bg-algo-swapping',
  active: 'bg-algo-active',
  sorted: 'bg-algo-sorted',
};

const STATE_VAR: Record<BarState, string> = {
  default: '--algo-default',
  comparing: '--algo-comparing',
  swapping: '--algo-swapping',
  active: '--algo-active',
  sorted: '--algo-sorted',
};

interface BarsViewProps {
  frame: SortFrame;
  maxValue: number;
  /** animate height changes (off at high playback speeds) */
  animate: boolean;
  theme: string;
  /** value and index labels (default on when they fit) */
  labels?: boolean;
}

export function BarsView(props: BarsViewProps) {
  return props.frame.array.length > CANVAS_THRESHOLD ? <CanvasBars {...props} /> : <DomBars {...props} />;
}

function DomBars({ frame, maxValue, animate, labels = true }: BarsViewProps) {
  const n = frame.array.length;
  const states = barStates(frame);
  const showValues = labels && n <= 32;
  const showIndices = labels && n <= 40;
  const gap = n <= 24 ? 'gap-1 sm:gap-1.5' : n <= 60 ? 'gap-[2px]' : 'gap-px';
  const range = frame.range;
  return (
    <div className="flex h-full flex-col">
      <div className={cn('relative flex min-h-0 flex-1 items-end', gap, showValues && 'pt-5')}>
        {frame.array.map((v, i) => {
          const pct = maxValue > 0 ? (v / maxValue) * 100 : 0;
          const dim = range !== null && (i < range[0] || i > range[1]) && states[i] !== 'sorted';
          return (
            <div key={i} className="relative h-full min-w-0 flex-1">
              <div
                className={cn(
                  'absolute inset-x-0 bottom-0 rounded-t-[3px]',
                  STATE_CLASS[states[i]],
                  dim && 'opacity-30',
                  animate && 'transition-[height] duration-150 ease-out',
                )}
                style={{ height: `${Math.max(pct, 1.5)}%` }}
              />
              {showValues && (
                <span
                  className={cn(
                    'absolute inset-x-0 text-center font-mono text-[10px] tabular sm:text-[11px]',
                    states[i] === 'default' || states[i] === 'sorted' ? 'text-muted-foreground' : 'font-semibold text-foreground',
                    dim && 'opacity-40',
                  )}
                  style={{ bottom: `calc(${Math.max(pct, 1.5)}% + 3px)` }}
                >
                  {v}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {showIndices && (
        <div className={cn('flex pt-1.5', gap, n > 16 && 'hidden sm:flex')} aria-hidden>
          {frame.array.map((_, i) => {
            const hot = states[i] !== 'default' && states[i] !== 'sorted';
            return (
              <span
                key={i}
                className={cn(
                  'min-w-0 flex-1 text-center font-mono text-[10px] tabular',
                  hot ? 'font-semibold text-ink' : 'text-muted-foreground/70',
                )}
              >
                {hot ? '▲' : i}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function readColors(): Record<BarState, string> {
  const css = getComputedStyle(document.documentElement);
  const out = {} as Record<BarState, string>;
  (Object.keys(STATE_VAR) as BarState[]).forEach(k => {
    out[k] = `hsl(${css.getPropertyValue(STATE_VAR[k]).trim()})`;
  });
  return out;
}

/** Canvas renderer for large arrays: one draw call per bar, no DOM nodes per element. */
function CanvasBars({ frame, maxValue, theme }: BarsViewProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 0, h: 0 });
  const colors = useRef<Record<BarState, string> | null>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  const draw = () => {
    const c = canvas.current;
    if (!c || size.current.w === 0) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const f = frameRef.current;
    const n = f.array.length;
    const states = barStates(f);
    const col = colors.current ?? (colors.current = readColors());
    const slot = w / n;
    const gap = slot > 3 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const bh = Math.max(1, (f.array[i] / maxValue) * h);
      const dim = f.range !== null && (i < f.range[0] || i > f.range[1]) && states[i] !== 'sorted';
      ctx.globalAlpha = dim ? 0.3 : 1;
      ctx.fillStyle = col[states[i]];
      ctx.fillRect(i * slot, h - bh, Math.max(0.5, slot - gap), bh);
    }
    ctx.globalAlpha = 1;
  };

  // size the backing store to the element, in device pixels
  useEffect(() => {
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      size.current = { w: width, h: height };
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      draw();
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // theme switch: re-read the colour tokens
  useEffect(() => {
    colors.current = null;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(draw);

  return (
    <div ref={wrap} className="h-full w-full">
      <canvas ref={canvas} className="block h-full w-full" />
    </div>
  );
}
