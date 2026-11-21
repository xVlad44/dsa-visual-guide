import { useEffect, useMemo, useState } from 'react';
import { Check, Link2, Shuffle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { BarsView } from '@/components/viz/BarsView';
import { CANVAS_THRESHOLD } from '@/components/viz/bars';
import { Chips } from '@/components/viz/Chips';
import { Legend, ShortcutHint } from '@/components/viz/Legend';
import { Panel } from '@/components/viz/Panel';
import { Pseudocode } from '@/components/viz/Pseudocode';
import { ComplexityTable, Stat, StatGrid } from '@/components/viz/Stat';
import { StatusPill, Transport } from '@/components/viz/Transport';
import { generateInput, INPUT_KINDS, INPUT_LABELS, newSeed, type InputKind } from '@/engine/rng';
import { SORT_ALGORITHMS } from '@/engine/sorting/algorithms';
import { describeSortEvent, recordSort } from '@/engine/sorting/trace';
import { SORT_IDS, type SortId } from '@/engine/sorting/types';
import { codeExamples } from '@/lib/data';
import { DEFAULT_SPEED, nearestSpeed } from '@/player/clock';
import { parseEnum, parseInt10, useQueryState } from '@/player/urlState';
import { usePlayer } from '@/player/usePlayer';
import { usePlayerShortcuts } from '@/player/useShortcuts';

const MIN_N = 2;
const MAX_N = 512;
const DEFAULT_N = 24;

const fmt = (v: number) => v.toLocaleString('en-US');

const ALGO_OPTIONS = SORT_IDS.map(id => ({ value: id, label: SORT_ALGORITHMS[id].name.replace(/ sort.*$/, '') }));

export default function SortingPage() {
  const { theme } = useTheme();
  const [params, update] = useQueryState();
  const [fallbackSeed] = useState(newSeed);

  const algoId = parseEnum<SortId>(params.get('algo'), SORT_IDS, 'bubble');
  const n = parseInt10(params.get('n'), MIN_N, MAX_N) ?? DEFAULT_N;
  const seed = parseInt10(params.get('seed'), 1, 999_999) ?? fallbackSeed;
  const kind = parseEnum<InputKind>(params.get('input'), INPUT_KINDS, 'random');
  const speed = nearestSpeed(parseInt10(params.get('speed'), 1, 100_000) ?? DEFAULT_SPEED);

  // pin the seed in the URL so the current run can be shared as is
  useEffect(() => {
    if (params.get('seed') === null) update({ seed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const algo = SORT_ALGORITHMS[algoId];
  const input = useMemo(() => generateInput(kind, n, seed), [kind, n, seed]);
  const trace = useMemo(() => recordSort(algo, input), [algo, input]);
  const maxValue = useMemo(() => Math.max(1, ...input), [input]);
  const player = usePlayer(trace.length, speed, trace);
  const shuffle = () => update({ seed: newSeed() });
  usePlayerShortcuts(player, { onShuffle: shuffle });

  const frame = useMemo(() => trace.frame(player.index), [trace, player.index]);
  const total = trace.counters(trace.length - 1);
  const c = frame.counters;
  const line = frame.event?.line ?? null;

  return (
    <div className="container">
      <PageHeader index="01" eyebrow="Sorting" title="Sorting algorithms">
        Eight algorithms on the same seeded input. Each bar move below is one event from a recorded trace.
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2">
        <Chips legend="Algorithm" name="algo" value={algoId} options={ALGO_OPTIONS} onChange={id => update({ algo: id })} />
        <p className="text-sm text-muted-foreground">{algo.summary}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        {/* stage */}
        <section className="min-w-0 rounded-lg border bg-card" aria-label={`${algo.name} visualisation`}>
          <div className="flex min-h-11 items-center gap-3 border-b px-4 py-2">
            <StatusPill status={player.status} />
            <p className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:text-[13px]" aria-live={player.playing ? 'off' : 'polite'}>
              {describeSortEvent(frame.event, frame.array)}
            </p>
          </div>
          <div className="stage-grid h-[240px] px-3 pb-2 pt-3 sm:h-[340px] sm:px-5">
            <BarsView frame={frame} maxValue={maxValue} animate={player.playing ? speed <= 16 : true} theme={theme} />
          </div>
          <Legend
            className="px-4 pb-3"
            items={[
              { label: 'Compare / read', swatch: 'bg-algo-comparing' },
              { label: 'Swap / write', swatch: 'bg-algo-swapping' },
              { label: algoId === 'selection' ? 'Current minimum' : 'Pivot', swatch: 'bg-algo-active' },
              { label: 'Final position', swatch: 'bg-algo-sorted' },
              { label: 'Outside active range', swatch: 'bg-algo-default', dim: true },
            ]}
          />
          <Transport player={player} speed={speed} onSpeed={s => update({ speed: s })} />
        </section>

        {/* reference panels; on phones they follow the stage, on desktop they sit beside it */}
        <aside className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <Panel title="Pseudocode">
            <Pseudocode lines={algo.pseudocode} active={line} code={codeExamples[algoId]} />
          </Panel>
          <Panel title="Operations">
            <StatGrid>
              <Stat label="Comparisons" value={fmt(c.comparisons)} total={fmt(total.comparisons)} />
              <Stat label="Swaps" value={fmt(c.swaps)} total={fmt(total.swaps)} />
              <Stat label="Writes" value={fmt(c.writes)} total={fmt(total.writes)} hint="Element assignments; a swap counts as two" />
              <Stat label="Array reads" value={fmt(c.reads)} total={fmt(total.reads)} hint="Reads of the main array; aux-buffer reads are not counted" />
            </StatGrid>
            <div className="mt-4">
              <ComplexityTable
                rows={[
                  ['Best', algo.complexity.best],
                  ['Average', algo.complexity.average],
                  ['Worst', algo.complexity.worst],
                  ['Extra space', algo.complexity.space],
                ]}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Growth model {algo.growthLabel} at n = {n}: <span className="font-mono text-foreground">{fmt(Math.round(algo.growth(n)))}</span>.
              This run: <span className="font-mono text-foreground">{fmt(total.comparisons)}</span> comparisons,{' '}
              <span className="font-mono text-foreground">{fmt(total.writes)}</span> writes over{' '}
              <span className="font-mono text-foreground">{fmt(trace.events.length)}</span> events.
            </p>
          </Panel>
        </aside>

        <Panel title="Input" className="lg:col-start-1 lg:row-start-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-baseline justify-between">
                <span id="n-label" className="text-sm">
                  Elements
                </span>
                <span className="font-mono text-sm tabular">
                  n = {n}
                  {n > CANVAS_THRESHOLD && <span className="ml-2 text-xs text-muted-foreground">canvas renderer</span>}
                </span>
              </div>
              <Slider
                aria-labelledby="n-label"
                value={[n]}
                min={MIN_N}
                max={MAX_N}
                step={1}
                onValueChange={([v]) => update({ n: v })}
                className="h-10"
              />
            </div>
            <label className="flex flex-col gap-2 text-sm">
              Distribution
              <select
                value={kind}
                onChange={e => update({ input: e.target.value })}
                className="h-10 rounded-md border border-input bg-background px-3"
              >
                {INPUT_KINDS.map(k => (
                  <option key={k} value={k}>
                    {INPUT_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <SeedField seed={seed} onSeed={s => update({ seed: s })} onShuffle={shuffle} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <ShareButton />
            <ShortcutHint extra={[['R', 'new input']]} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SeedField({ seed, onSeed, onShuffle }: { seed: number; onSeed: (s: number) => void; onShuffle: () => void }) {
  const [text, setText] = useState(String(seed));
  useEffect(() => setText(String(seed)), [seed]);
  const commit = () => {
    const v = parseInt10(text.trim(), 1, 999_999);
    if (v === null) setText(String(seed));
    else if (v !== seed) onSeed(v);
  };
  return (
    <div className="flex flex-col gap-2 text-sm">
      <label htmlFor="seed">Seed</label>
      <div className="flex gap-2">
        <input
          id="seed"
          inputMode="numeric"
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && commit()}
          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono tabular"
          aria-describedby="seed-help"
        />
        <Button variant="outline" onClick={onShuffle} title="New random input (R)">
          <Shuffle /> New
        </Button>
      </div>
      <span id="seed-help" className="text-xs text-muted-foreground">
        Same seed, same input.
      </span>
    </div>
  );
}

function ShareButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 2000);
    return () => clearTimeout(t);
  }, [state]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState('copied');
    } catch {
      setState('failed');
    }
  };
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={copy}>
        {state === 'copied' ? <Check /> : <Link2 />}
        {state === 'copied' ? 'Link copied' : 'Copy link to this run'}
      </Button>
      {state === 'failed' && (
        <span role="status" className="text-xs text-muted-foreground">
          Copy blocked: use the address bar.
        </span>
      )}
    </div>
  );
}
