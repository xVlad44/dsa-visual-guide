import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { SECTIONS } from '@/components/layout/sections';
import { BarsView } from '@/components/viz/BarsView';
import { StatusPill } from '@/components/viz/Transport';
import { generateInput, newSeed } from '@/engine/rng';
import { SORT_ALGORITHMS } from '@/engine/sorting/algorithms';
import { recordSort } from '@/engine/sorting/trace';
import { usePlayer } from '@/player/usePlayer';

const DEMO_N = 36;
const DEMO_SPEED = 48;
const DEMO_ALGOS = ['quick', 'merge', 'heap', 'insertion'] as const;

const MODULES: Record<string, { items: string; detail: string }> = {
  '/sorting': {
    items: 'Bubble · Insertion · Selection · Merge · Quick · Heap · Radix · Bucket',
    detail: 'Seeded inputs up to 512 elements, live operation counters, and an operations-vs-n chart measured by running the engine.',
  },
  '/graph': {
    items: 'Breadth-first · Depth-first · Dijkstra',
    detail: 'Edit the graph as text or on the canvas; the queue, call stack or priority queue is shown at every step.',
  },
  '/recursion': {
    items: 'N-Queens · Sudoku · Tower of Hanoi',
    detail: 'Real backtracking searches: every try, conflict and undo is a step you can scrub to.',
  },
  '/data-structures': {
    items: 'Stack · Queue · Linked list · Binary search tree',
    detail: 'Operate on each structure directly; tree traversals replay on the same player.',
  },
};

const BUILT = [
  {
    title: 'Engine',
    body: 'Each algorithm is a plain TypeScript generator that yields a typed event per operation (compare, swap, write, visit, relax…), tagged with its pseudocode line. No React, no timers.',
  },
  {
    title: 'Replay',
    body: 'The UI only replays recorded traces. Sorting traces keep a state checkpoint every 256 events and prefix-summed counters, so scrubbing to any step is cheap and the counts are exact.',
  },
  {
    title: 'Tests',
    body: 'Vitest checks every algorithm against an independent reference on many seeded inputs, plus trace invariants: replaying the events reproduces the output and the counters match.',
  },
  {
    title: 'Rendering',
    body: 'A requestAnimationFrame clock drives playback from 1 to 512 steps per second. Up to 100 bars render as DOM elements; larger arrays switch to a canvas.',
  },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** A real engine trace on loop: a new seed and the next algorithm after each run. */
function LiveTrace() {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const [run, setRun] = useState(() => ({ k: 0, seed: newSeed() }));
  const [stopped, setStopped] = useState(reduced);
  const algo = SORT_ALGORITHMS[DEMO_ALGOS[run.k % DEMO_ALGOS.length]];
  const input = useMemo(() => generateInput('random', DEMO_N, run.seed), [run.seed]);
  const trace = useMemo(() => recordSort(algo, input), [algo, input]);
  const player = usePlayer(trace.length, DEMO_SPEED, trace);
  const frame = useMemo(() => trace.frame(player.index), [trace, player.index]);
  const maxValue = useMemo(() => Math.max(1, ...input), [input]);
  const { play } = player;

  // start each new trace unless the visitor paused or prefers reduced motion
  useEffect(() => {
    if (!stopped) play();
  }, [trace, stopped, play]);

  // hold the finished frame briefly, then load the next run
  useEffect(() => {
    if (stopped || player.status !== 'finished') return;
    const t = window.setTimeout(() => setRun(r => ({ k: r.k + 1, seed: newSeed() })), 1600);
    return () => window.clearTimeout(t);
  }, [player.status, stopped]);

  const c = frame.counters;
  const toggle = () => {
    if (player.playing) {
      setStopped(true);
      player.pause();
    } else {
      setStopped(false);
      player.play();
    }
  };

  return (
    <figure className="min-w-0 rounded-lg border bg-card">
      <div className="flex min-h-11 items-center gap-3 border-b px-4 py-2">
        <StatusPill status={player.status} />
        <figcaption className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
          {algo.name} · n = {DEMO_N} · seed {run.seed}
        </figcaption>
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={toggle} aria-label={player.playing ? 'Pause demo' : 'Play demo'}>
          {player.playing ? <Pause /> : <Play />}
        </Button>
      </div>
      <div className="stage-grid h-48 px-4 pb-3 pt-4 sm:h-56" aria-hidden>
        <BarsView frame={frame} maxValue={maxValue} animate={false} theme={theme} labels={false} />
      </div>
      <dl className="grid grid-cols-3 border-t font-mono text-xs">
        {[
          ['comparisons', c.comparisons],
          ['swaps', c.swaps],
          ['writes', c.writes],
        ].map(([label, v], i) => (
          <div key={label} className={i > 0 ? 'border-l px-4 py-2.5' : 'px-4 py-2.5'}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular mt-0.5 text-base text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

export default function HomePage() {
  return (
    <div className="container">
      <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 pb-14 pt-10 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:gap-14">
        <div className="max-w-xl">
          <p className="eyebrow">Data structures & algorithms</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] sm:text-5xl">Algorithms, recorded and replayed.</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Every visualiser runs a plain implementation that records what it does, one operation at a time. The page only replays that
            record, so each frame on screen is a step the algorithm really took.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/sorting">
                Open sorting <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-its-built">How it’s built</a>
            </Button>
          </div>
        </div>
        <LiveTrace />
      </section>

      <section aria-labelledby="modules" className="border-t pt-10">
        <h2 id="modules" className="eyebrow">
          Modules
        </h2>
        <ol className="mt-4 divide-y border-y">
          {SECTIONS.map(s => (
            <li key={s.href}>
              <Link
                to={s.href}
                className="group grid gap-x-6 gap-y-1 py-5 transition-colors hover:bg-muted/50 sm:grid-cols-[3rem_minmax(0,14rem)_minmax(0,1fr)_1.5rem] sm:items-baseline sm:px-2"
              >
                <span className="font-mono text-sm text-ink">{s.index}</span>
                <span className="text-lg font-medium">{s.title}</span>
                <span className="text-sm text-muted-foreground">
                  <span className="block font-mono text-xs text-foreground/80">{MODULES[s.href].items}</span>
                  <span className="mt-1 block">{MODULES[s.href].detail}</span>
                </span>
                <ArrowRight className="hidden h-4 w-4 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:block" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section id="how-its-built" aria-labelledby="built" className="scroll-mt-20 pt-14">
        <h2 id="built" className="eyebrow">
          How it’s built
        </h2>
        <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {BUILT.map(b => (
            <div key={b.title} className="border-t border-foreground/15 pt-4">
              <h3 className="font-medium">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Architecture, test strategy and design decisions are in the{' '}
          <a href="https://github.com/xVlad44/dsa-visual-guide#readme" className="text-foreground underline underline-offset-4 hover:text-ink">
            README
          </a>
          .
        </p>
      </section>
    </div>
  );
}
