import { useMemo } from 'react';
import { Crown } from 'lucide-react';
import { Legend, ShortcutHint } from '@/components/viz/Legend';
import { Panel } from '@/components/viz/Panel';
import { Pseudocode } from '@/components/viz/Pseudocode';
import { ComplexityTable, Stat, StatGrid } from '@/components/viz/Stat';
import { Transport } from '@/components/viz/Transport';
import { Stage, VizLayout } from '@/components/viz/VizLayout';
import { QUEENS_PSEUDOCODE, recordQueens, type QueensFrame } from '@/engine/backtracking/nqueens';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/player/usePlayer';
import { usePlayerShortcuts } from '@/player/useShortcuts';

const MIN_N = 4;
const MAX_N = 10;
/** Enumerating every solution is offered up to this size to keep traces small. */
const MAX_ALL = 8;

function describe(f: QueensFrame, n: number): string {
  const e = f.event;
  if (!e) return `Ready: place ${n} queens, one per row.`;
  const cell = (r: number, c: number) => `row ${r + 1}, column ${c + 1}`;
  switch (e.type) {
    case 'try':
      return `Try ${cell(e.row, e.col)}`;
    case 'conflict':
      return `${cell(e.row, e.col)} is attacked by the queen in ${cell(e.withRow, e.withCol)}`;
    case 'place':
      return `Place a queen at ${cell(e.row, e.col)}`;
    case 'remove':
      return `Backtrack: remove the queen at ${cell(e.row, e.col)}`;
    case 'solution':
      return `Solution ${f.solutions} found`;
    case 'done':
      return f.solutions > 0 ? `Done: ${f.solutions} solution${f.solutions === 1 ? '' : 's'}` : `Done: no solution for n = ${n}`;
  }
}

interface QueensViewProps {
  n: number;
  all: boolean;
  speed: number;
  onChange: (patch: Record<string, string | number | null>) => void;
}

export function QueensView({ n, all, speed, onChange }: QueensViewProps) {
  const findAll = all && n <= MAX_ALL;
  const frames = useMemo(() => recordQueens(n, !findAll), [n, findAll]);
  const player = usePlayer(frames.length, speed, frames);
  usePlayerShortcuts(player);
  const f = frames[player.index];
  const solved = f.event?.type === 'solution' || (f.event?.type === 'done' && f.solutions > 0 && !findAll);

  return (
    <VizLayout
      stage={
        <Stage
          label="N-Queens visualisation"
          status={player.status}
          message={describe(f, n)}
          playing={player.playing}
          footer={
            <>
              <Legend
                className="border-t px-4 py-3"
                items={[
                  { label: 'Cell being tried', swatch: 'bg-algo-comparing' },
                  { label: 'Attacked (conflict)', swatch: 'bg-algo-swapping' },
                  { label: 'Blocking queen', swatch: 'bg-algo-swapping' },
                  { label: 'Solution', swatch: 'bg-algo-sorted' },
                ]}
              />
              <Transport player={player} speed={speed} onSpeed={s => onChange({ speed: s })} />
            </>
          }
        >
          <div className="stage-grid flex justify-center px-4 py-6">
            <div
              className={cn('grid w-full max-w-[420px] overflow-hidden rounded-md border-2', solved ? 'border-algo-sorted' : 'border-border')}
              style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
              role="grid"
              aria-label={`${n} by ${n} board`}
            >
              {Array.from({ length: n * n }, (_, k) => {
                const r = Math.floor(k / n);
                const c = k % n;
                const queen = f.cols[r] === c;
                const isCursor = f.cursor?.row === r && f.cursor?.col === c;
                const isConflict = isCursor && f.event?.type === 'conflict';
                const isBlocker = f.blocker?.row === r && f.blocker?.col === c;
                return (
                  <div
                    key={k}
                    role="gridcell"
                    aria-label={`row ${r + 1}, column ${c + 1}${queen ? ', queen' : ''}`}
                    className={cn(
                      'relative flex aspect-square items-center justify-center',
                      (r + c) % 2 === 0 ? 'bg-card' : 'bg-muted',
                      isCursor && !isConflict && 'ring-2 ring-inset ring-algo-comparing',
                      isConflict && 'bg-algo-swapping/25 ring-2 ring-inset ring-algo-swapping',
                    )}
                  >
                    {queen && (
                      <Crown
                        className={cn(
                          'h-[55%] w-[55%]',
                          isBlocker ? 'text-algo-swapping' : solved ? 'text-algo-sorted' : 'text-ink',
                        )}
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    )}
                    {isConflict && !queen && (
                      <span className="font-mono text-sm font-semibold text-algo-swapping" aria-hidden>
                        ×
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Stage>
      }
      aside={
        <>
          <Panel title="Pseudocode">
            <Pseudocode lines={QUEENS_PSEUDOCODE} active={f.event?.line ?? null} />
          </Panel>
          <Panel title="Search">
            <StatGrid>
              <Stat label="Placements" value={f.placements} />
              <Stat label="Backtracks" value={f.backtracks} />
              <Stat label="Conflicts" value={f.conflicts} />
              <Stat label="Solutions" value={f.solutions} />
            </StatGrid>
            <div className="mt-4">
              <ComplexityTable
                rows={[
                  ['Technique', 'Backtracking'],
                  ['Time (worst)', 'O(N!)'],
                  ['Space', 'O(N)'],
                  ['Difficulty', 'Medium'],
                ]}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              This run: {frames.length - 1} steps. Place N queens on an N×N board so no two share a row, column or diagonal.
            </p>
          </Panel>
        </>
      }
      below={
        <Panel title="Board">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              Board size
              <select
                value={n}
                onChange={e => onChange({ n: Number(e.target.value) })}
                className="h-10 rounded-md border border-input bg-background px-3"
              >
                {Array.from({ length: MAX_N - MIN_N + 1 }, (_, i) => MIN_N + i).map(v => (
                  <option key={v} value={v}>
                    {v} × {v}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="mb-2">Search</legend>
              <label className="flex min-h-8 items-center gap-2">
                <input type="radio" name="qmode" checked={!findAll} onChange={() => onChange({ all: null })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                Stop at the first solution
              </label>
              <label className={cn('flex min-h-8 items-center gap-2', n > MAX_ALL && 'opacity-50')}>
                <input
                  type="radio"
                  name="qmode"
                  checked={findAll}
                  disabled={n > MAX_ALL}
                  onChange={() => onChange({ all: 1 })}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                Find every solution {n > MAX_ALL && `(up to ${MAX_ALL} × ${MAX_ALL})`}
              </label>
            </fieldset>
          </div>
          <div className="mt-5 hidden border-t pt-4 md:block">
            <ShortcutHint />
          </div>
        </Panel>
      }
    />
  );
}
