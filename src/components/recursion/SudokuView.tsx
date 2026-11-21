import { useMemo, useRef, useState } from 'react';
import { Eraser, Pencil, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Legend, ShortcutHint } from '@/components/viz/Legend';
import { Panel } from '@/components/viz/Panel';
import { Pseudocode } from '@/components/viz/Pseudocode';
import { ComplexityTable, Stat, StatGrid } from '@/components/viz/Stat';
import { Transport } from '@/components/viz/Transport';
import { Stage, VizLayout } from '@/components/viz/VizLayout';
import { newSeed } from '@/engine/rng';
import {
  boxDims,
  cloneBoard,
  emptyBoard,
  findConflict,
  makePuzzle,
  recordSudoku,
  SUDOKU_PSEUDOCODE,
  SUDOKU_SIZES,
  sudokuFrame,
  type Board,
  type SudokuRun,
} from '@/engine/backtracking/sudoku';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/player/usePlayer';
import { usePlayerShortcuts } from '@/player/useShortcuts';

const fmt = (v: number) => v.toLocaleString('en-US');

interface SudokuViewProps {
  size: number;
  speed: number;
  onChange: (patch: Record<string, string | number | null>) => void;
}

export function SudokuView({ size, speed, onChange }: SudokuViewProps) {
  const [givens, setGivens] = useState<Board>(() => makePuzzle(size, newSeed()));
  const [run, setRun] = useState<SudokuRun | null>(null);
  const cells = useRef<Array<HTMLInputElement | null>>([]);

  // a new size starts from a fresh example of that size
  const [shownSize, setShownSize] = useState(size);
  if (shownSize !== size) {
    setShownSize(size);
    setGivens(makePuzzle(size, newSeed()));
    setRun(null);
  }

  const frameCount = run ? run.events.length + 1 + (run.truncated ? 1 : 0) : 1;
  const player = usePlayer(frameCount, speed, run);
  usePlayerShortcuts(player, {}, run !== null);

  const empty = givens.every(r => r.every(v => v === 0));
  const conflict = useMemo(() => findConflict(givens), [givens]);
  const frame = useMemo(() => {
    if (!run) return null;
    // the extra last frame of a truncated run shows the solver's final answer
    if (run.truncated && player.index === frameCount - 1) {
      return { ...sudokuFrame(run, run.events.length), board: run.result, cursor: null, event: null };
    }
    return sudokuFrame(run, player.index);
  }, [run, player.index, frameCount]);

  const board = frame?.board ?? givens;
  const { rows: br, cols: bc } = boxDims(size);
  const finished = run !== null && player.status === 'finished';

  const message = (() => {
    if (!run) {
      if (empty) return 'Enter some givens or load an example, then solve.';
      if (conflict) return `Row ${conflict.row + 1}, column ${conflict.col + 1} clashes with another given.`;
      return 'Edit the givens, then solve.';
    }
    const e = frame?.event;
    if (!e) return finished ? (run.solved ? 'Solved (final board from the full search).' : 'No solution.') : 'Ready. Press play or step forward.';
    switch (e.type) {
      case 'try':
        return `Try ${e.value} at row ${e.row + 1}, column ${e.col + 1}: ${e.ok ? 'allowed' : 'blocked'}`;
      case 'place':
        return `Place ${e.value} at row ${e.row + 1}, column ${e.col + 1}`;
      case 'clear':
        return `Backtrack: clear row ${e.row + 1}, column ${e.col + 1}`;
      case 'done':
        return e.solved ? 'Solved.' : run.limitReached ? 'Stopped: search limit reached.' : 'No solution: the search space is exhausted.';
    }
  })();

  const setCell = (r: number, c: number, raw: string) => {
    const v = Number(raw.slice(-1));
    const next = cloneBoard(givens);
    next[r][c] = Number.isInteger(v) && v >= 1 && v <= size ? v : 0;
    setGivens(next);
  };

  const moveFocus = (r: number, c: number, key: string) => {
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[key];
    if (!d) return false;
    const nr = (r + d[0] + size) % size;
    const nc = (c + d[1] + size) % size;
    cells.current[nr * size + nc]?.focus();
    return true;
  };

  const tryEvent = frame?.event?.type === 'try' ? frame.event : null;

  return (
    <VizLayout
      stage={
        <Stage
          label="Sudoku solver visualisation"
          status={run ? player.status : 'idle'}
          message={message}
          playing={player.playing}
          footer={
            <>
              <Legend
                className="border-t px-4 py-3"
                items={[
                  { label: 'Given', swatch: 'bg-foreground' },
                  { label: 'Placed by the solver', swatch: 'bg-ink' },
                  { label: 'Cell being filled', swatch: 'bg-algo-comparing' },
                  { label: 'Blocked try', swatch: 'bg-algo-swapping' },
                ]}
              />
              <Transport player={player} speed={speed} onSpeed={s => onChange({ speed: s })} disabled={!run} />
            </>
          }
        >
          <div className="stage-grid flex justify-center px-4 py-6">
            <div
              className="grid w-full max-w-[440px] overflow-hidden rounded-md border-2 border-foreground/70"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
              role="grid"
              aria-label={`${size} by ${size} Sudoku`}
            >
              {board.map((row, r) =>
                row.map((v, c) => {
                  const isGiven = givens[r][c] !== 0;
                  const isCursor = frame?.cursor?.row === r && frame?.cursor?.col === c;
                  const shadeBox = (Math.floor(r / br) + Math.floor(c / bc)) % 2 === 0;
                  const borders = cn(
                    'border-border',
                    c % bc === bc - 1 && c !== size - 1 ? 'border-r-2 border-r-foreground/60' : c !== size - 1 && 'border-r',
                    r % br === br - 1 && r !== size - 1 ? 'border-b-2 border-b-foreground/60' : r !== size - 1 && 'border-b',
                  );
                  const shown = tryEvent && isCursor ? tryEvent.value : v;
                  return (
                    <div key={`${r}-${c}`} role="gridcell" className={cn('relative aspect-square', borders, shadeBox ? 'bg-card' : 'bg-muted/60')}>
                      {run ? (
                        <div
                          className={cn(
                            'flex h-full w-full items-center justify-center font-mono tabular',
                            size === 9 ? 'text-sm sm:text-lg' : 'text-lg sm:text-2xl',
                            isGiven ? 'font-semibold text-foreground' : 'text-ink',
                            isCursor && 'bg-algo-comparing/25 ring-2 ring-inset ring-algo-comparing',
                            isCursor && tryEvent && !tryEvent.ok && 'bg-algo-swapping/20 text-algo-swapping ring-algo-swapping',
                          )}
                          aria-label={`row ${r + 1}, column ${c + 1}: ${shown || 'empty'}`}
                        >
                          {shown || ''}
                        </div>
                      ) : (
                        <input
                          ref={el => (cells.current[r * size + c] = el)}
                          inputMode="numeric"
                          autoComplete="off"
                          aria-label={`row ${r + 1}, column ${c + 1}`}
                          value={v || ''}
                          onChange={e => setCell(r, c, e.target.value)}
                          onKeyDown={e => {
                            if (moveFocus(r, c, e.key)) e.preventDefault();
                            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setCell(r, c, '');
                          }}
                          className={cn(
                            'h-full w-full bg-transparent text-center font-mono font-semibold tabular caret-transparent focus:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                            size === 9 ? 'text-sm sm:text-lg' : 'text-lg sm:text-2xl',
                            conflict?.row === r && conflict?.col === c && 'text-destructive',
                          )}
                        />
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
          {run?.truncated && (
            <p className="px-4 pb-3 text-center text-xs text-muted-foreground">
              The solver took {fmt(run.total)} steps; the first {fmt(run.events.length)} are replayable, and the last frame shows its final board.
            </p>
          )}
        </Stage>
      }
      aside={
        <>
          <Panel title="Pseudocode">
            <Pseudocode lines={SUDOKU_PSEUDOCODE} active={frame?.event?.line ?? null} />
          </Panel>
          <Panel title="Search">
            <StatGrid>
              <Stat label="Placements" value={fmt(frame?.placements ?? 0)} />
              <Stat label="Backtracks" value={fmt(frame?.backtracks ?? 0)} />
              <Stat label="Empty cells" value={givens.flat().filter(v => v === 0).length} />
              <Stat label="Solver steps" value={run ? fmt(run.total) : '–'} />
            </StatGrid>
            <div className="mt-4">
              <ComplexityTable
                rows={[
                  ['Technique', 'Backtracking'],
                  ['Time (worst)', 'O(Nᵐ), m empty cells'],
                  ['Space', 'O(m) recursion'],
                  ['Difficulty', 'Hard'],
                ]}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Fill the grid so every row, column and box holds each digit once. Cells are tried row by row, digits in ascending order.
            </p>
          </Panel>
        </>
      }
      below={
        <Panel title="Puzzle">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex flex-col gap-2 text-sm">
              Board size
              <select
                value={size}
                onChange={e => onChange({ size: Number(e.target.value) })}
                className="h-10 rounded-md border border-input bg-background px-3"
                disabled={run !== null}
              >
                {SUDOKU_SIZES.map(s => (
                  <option key={s} value={s}>
                    {s} × {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {run ? (
                <Button variant="outline" onClick={() => setRun(null)}>
                  <Pencil /> Edit puzzle
                </Button>
              ) : (
                <>
                  <Button onClick={() => setRun(recordSudoku(givens))} disabled={empty || conflict !== null}>
                    <Play /> Solve
                  </Button>
                  <Button variant="outline" onClick={() => setGivens(makePuzzle(size, newSeed()))}>
                    <Sparkles /> New example
                  </Button>
                  <Button variant="outline" onClick={() => setGivens(emptyBoard(size))} disabled={empty}>
                    <Eraser /> Clear
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {run
              ? 'The grid is read-only while a solve is loaded. Edit the puzzle to change givens.'
              : 'Type digits into the grid; arrow keys move between cells, Backspace clears. Examples are generated from a solved grid, so they always have a solution.'}
          </p>
          {run && (
            <div className="mt-4 hidden border-t pt-4 md:block">
              <ShortcutHint />
            </div>
          )}
        </Panel>
      }
    />
  );
}
