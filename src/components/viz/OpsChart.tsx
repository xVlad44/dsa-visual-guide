import { useEffect, useState } from 'react';
import type { InputKind } from '@/engine/rng';
import { GROWTH_RUNS as RUNS, measureGrowth, type OpsPoint } from '@/engine/sorting/growth';
import type { SortAlgorithm } from '@/engine/sorting/types';

const W = 360;
const H = 190;
const M = { l: 46, r: 64, t: 12, b: 30 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

const compact = (v: number) =>
  v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${+(v / 1e3).toFixed(1)}k` : `${Math.round(v)}`;

interface OpsChartProps {
  algo: SortAlgorithm;
  kind: InputKind;
  seed: number;
}

/** "Operations vs n": measured engine counts against the fitted growth model. */
export function OpsChart({ algo, kind, seed }: OpsChartProps) {
  const [data, setData] = useState<{ key: string; points: OpsPoint[]; c: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const key = `${algo.id}:${kind}:${seed}`;

  // measured off the critical path so changing algorithm stays responsive
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      const result = measureGrowth(algo, kind, seed);
      if (!cancelled) setData({ key, ...result });
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [algo, kind, seed, key]);

  if (!data || data.key !== key) {
    return <div className="flex h-[190px] items-center justify-center text-xs text-muted-foreground">Measuring…</div>;
  }

  const { points, c } = data;
  const yMax = niceMax(Math.max(...points.map(p => Math.max(p.measured, p.model))));
  const x = (i: number) => M.l + (i / (points.length - 1)) * (W - M.l - M.r);
  const y = (v: number) => H - M.b - (v / yMax) * (H - M.t - M.b);
  const path = (get: (p: OpsPoint) => number) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(get(p)).toFixed(1)}`).join('');
  const ticks = [0, yMax / 2, yMax];
  const last = points.length - 1;
  const h = hover !== null ? points[hover] : null;

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Comparisons plus writes for n from ${points[0].n} to ${points[last].n}, measured against ${algo.growthLabel}`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="hsl(var(--border))" strokeWidth={1} />
            <text x={M.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
              {compact(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (
          <text key={p.n} x={x(i)} y={H - M.b + 16} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
            {p.n}
          </text>
        ))}
        <text x={W - M.r} y={H - 2} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
          n
        </text>

        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 3" />}

        <path d={path(p => p.model)} fill="none" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round" />
        <path d={path(p => p.measured)} fill="none" stroke="hsl(var(--chart-1))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={p.n} cx={x(i)} cy={y(p.measured)} r={hover === i ? 5 : 4} fill="hsl(var(--chart-1))" stroke="hsl(var(--card))" strokeWidth={2} />
        ))}

        {/* direct labels at the right end; text stays in text colours */}
        <text x={x(last) + 8} y={y(points[last].measured)} dy="0.32em" className="fill-foreground text-[10px]">
          measured
        </text>
        <text x={x(last) + 8} y={y(points[last].model) + (Math.abs(y(points[last].model) - y(points[last].measured)) < 12 ? 12 : 0)} dy="0.32em" className="fill-muted-foreground text-[10px]">
          c·{algo.growthLabel}
        </text>

        {/* hit targets wider than the marks */}
        {points.map((p, i) => (
          <rect
            key={p.n}
            x={x(i) - (W - M.l - M.r) / (points.length - 1) / 2}
            y={M.t}
            width={(W - M.l - M.r) / (points.length - 1)}
            height={H - M.t - M.b}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-md border bg-popover px-2.5 py-1.5 font-mono text-[11px] shadow-md"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > last / 2 ? '-105%' : '5%'})` }}
        >
          <div className="text-foreground">n = {h.n}</div>
          <div className="text-muted-foreground">measured {Math.round(h.measured).toLocaleString('en-US')}</div>
          <div className="text-muted-foreground">model {Math.round(h.model).toLocaleString('en-US')}</div>
        </div>
      )}

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden>
            <line x1="1" x2="17" y1="4" y2="4" stroke="hsl(var(--chart-1))" strokeWidth="2" />
            <circle cx="9" cy="4" r="3" fill="hsl(var(--chart-1))" />
          </svg>
          comparisons + writes, mean of {RUNS} seeded runs
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden>
            <line x1="1" x2="17" y1="4" y2="4" stroke="hsl(var(--chart-2))" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          c·{algo.growthLabel}, fitted c = {c.toFixed(2)}
        </span>
      </figcaption>

      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as table</summary>
        <table className="mt-2 w-full font-mono">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 font-normal">n</th>
              <th className="py-1 text-right font-normal">measured</th>
              <th className="py-1 text-right font-normal">model</th>
            </tr>
          </thead>
          <tbody>
            {points.map(p => (
              <tr key={p.n} className="border-t">
                <td className="py-1">{p.n}</td>
                <td className="py-1 text-right">{Math.round(p.measured).toLocaleString('en-US')}</td>
                <td className="py-1 text-right">{Math.round(p.model).toLocaleString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
