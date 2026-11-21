import { useMemo } from 'react';
import { Legend, ShortcutHint } from '@/components/viz/Legend';
import { Panel } from '@/components/viz/Panel';
import { Pseudocode } from '@/components/viz/Pseudocode';
import { ComplexityTable, Stat, StatGrid } from '@/components/viz/Stat';
import { Transport } from '@/components/viz/Transport';
import { Stage, VizLayout } from '@/components/viz/VizLayout';
import { hanoi, HANOI_PSEUDOCODE, PEG_NAMES, replayHanoi } from '@/engine/backtracking/hanoi';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/player/usePlayer';
import { usePlayerShortcuts } from '@/player/useShortcuts';

const MIN_DISKS = 2;
const MAX_DISKS = 10;

interface HanoiViewProps {
  disks: number;
  speed: number;
  onChange: (patch: Record<string, string | number | null>) => void;
}

export function HanoiView({ disks, speed, onChange }: HanoiViewProps) {
  const moves = useMemo(() => [...hanoi(disks)], [disks]);
  const states = useMemo(() => replayHanoi(disks, moves), [disks, moves]);
  const player = usePlayer(states.length, speed, states);
  usePlayerShortcuts(player);
  const k = player.index;
  const towers = states[k];
  const move = k > 0 ? moves[k - 1] : null;

  const message = move
    ? `Move disk ${move.disk} from ${PEG_NAMES[move.from]} to ${PEG_NAMES[move.to]} (recursion depth ${move.depth})`
    : `Ready: move ${disks} disks from A to C, never a larger disk on a smaller one.`;

  return (
    <VizLayout
      stage={
        <Stage
          label="Tower of Hanoi visualisation"
          status={player.status}
          message={message}
          playing={player.playing}
          footer={
            <>
              <Legend
                className="border-t px-4 py-3"
                items={[
                  { label: 'Disk', swatch: 'bg-algo-default' },
                  { label: 'Disk just moved', swatch: 'bg-algo-comparing' },
                  { label: 'All disks on C', swatch: 'bg-algo-sorted' },
                ]}
              />
              <Transport player={player} speed={speed} onSpeed={s => onChange({ speed: s })} unit="move" />
            </>
          }
        >
          <div className="stage-grid px-3 pb-4 pt-8 sm:px-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              {towers.map((peg, p) => (
                <div key={p} className="flex flex-col items-center">
                  <div className="relative flex w-full flex-col-reverse items-center" style={{ height: `${Math.max(140, disks * 22 + 40)}px` }}>
                    <div className="absolute bottom-0 left-1/2 h-full w-1.5 -translate-x-1/2 rounded-t bg-border" aria-hidden />
                    {peg.map(d => {
                      const moved = move?.disk === d;
                      const done = player.status === 'finished';
                      return (
                        <div
                          key={d}
                          className={cn(
                            'relative z-[1] mb-0.5 flex h-5 items-center justify-center rounded font-mono text-[10px] font-semibold text-[#0A0F1E] transition-colors',
                            moved ? 'bg-algo-comparing' : done ? 'bg-algo-sorted' : 'bg-algo-default dark:text-[#EEF1F6]',
                          )}
                          style={{ width: `${28 + (d / disks) * 72}%` }}
                        >
                          {d}
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1.5 w-full rounded bg-border" aria-hidden />
                  <div className="mt-2 font-mono text-sm">
                    {PEG_NAMES[p]}
                    <span className="sr-only">: disks {peg.length ? peg.join(', ') : 'none'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Stage>
      }
      aside={
        <>
          <Panel title="Pseudocode">
            <Pseudocode lines={HANOI_PSEUDOCODE} active={move ? 4 : null} />
          </Panel>
          <Panel title="Moves">
            <StatGrid>
              <Stat label="Moves made" value={k} total={moves.length} />
              <Stat label="Recursion depth" value={move ? move.depth : 0} total={disks} />
            </StatGrid>
            <div className="mt-4">
              <ComplexityTable
                rows={[
                  ['Technique', 'Divide and conquer'],
                  ['Moves', `2ⁿ − 1 = ${moves.length}`],
                  ['Time', 'Θ(2ⁿ)'],
                  ['Space', 'O(n) recursion'],
                  ['Difficulty', 'Easy'],
                ]}
              />
            </div>
          </Panel>
        </>
      }
      below={
        <Panel title="Disks">
          <label className="flex max-w-xs flex-col gap-2 text-sm">
            Number of disks
            <select
              value={disks}
              onChange={e => onChange({ disks: Number(e.target.value) })}
              className="h-10 rounded-md border border-input bg-background px-3"
            >
              {Array.from({ length: MAX_DISKS - MIN_DISKS + 1 }, (_, i) => MIN_DISKS + i).map(v => (
                <option key={v} value={v}>
                  {v} disks ({2 ** v - 1} moves)
                </option>
              ))}
            </select>
          </label>
          <div className="mt-5 hidden border-t pt-4 md:block">
            <ShortcutHint />
          </div>
        </Panel>
      }
    />
  );
}
