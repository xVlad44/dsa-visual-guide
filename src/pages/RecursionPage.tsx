import { HanoiView } from '@/components/recursion/HanoiView';
import { QueensView } from '@/components/recursion/QueensView';
import { SudokuView } from '@/components/recursion/SudokuView';
import { PageHeader } from '@/components/layout/PageHeader';
import { Chips } from '@/components/viz/Chips';
import { SUDOKU_SIZES } from '@/engine/backtracking/sudoku';
import { DEFAULT_SPEED, nearestSpeed } from '@/player/clock';
import { parseEnum, parseInt10, useQueryState } from '@/player/urlState';

const PROBLEMS = ['nqueens', 'sudoku', 'hanoi'] as const;
type Problem = (typeof PROBLEMS)[number];

const OPTIONS = [
  { value: 'nqueens' as const, label: 'N-Queens' },
  { value: 'sudoku' as const, label: 'Sudoku' },
  { value: 'hanoi' as const, label: 'Tower of Hanoi' },
];

const SUMMARY: Record<Problem, string> = {
  nqueens: 'Backtracking search: place one queen per row, undo the last placement when a row has no safe column.',
  sudoku: 'Backtracking search over empty cells, row by row; a dead end clears the last placement and tries the next digit.',
  hanoi: 'Divide and conquer: move n − 1 disks out of the way, move the largest, move the n − 1 disks back on top.',
};

export default function RecursionPage() {
  const [params, update] = useQueryState();
  const problem = parseEnum<Problem>(params.get('p'), PROBLEMS, 'nqueens');
  const speed = nearestSpeed(parseInt10(params.get('speed'), 1, 100_000) ?? DEFAULT_SPEED);

  return (
    <div className="container">
      <PageHeader index="03" eyebrow="Recursion & backtracking" title="Backtracking search">
        Every try, placement and undo is an event in a recorded trace. Step through the search or let it play.
      </PageHeader>

      <div className="mb-4 flex flex-col gap-2">
        <Chips legend="Problem" name="problem" value={problem} options={OPTIONS} onChange={p => update({ p })} />
        <p className="text-sm text-muted-foreground">{SUMMARY[problem]}</p>
      </div>

      {problem === 'nqueens' && (
        <QueensView n={parseInt10(params.get('n'), 4, 10) ?? 6} all={params.get('all') === '1'} speed={speed} onChange={update} />
      )}
      {problem === 'sudoku' && (
        <SudokuView
          size={SUDOKU_SIZES.find(s => s === parseInt10(params.get('size'), 4, 9)) ?? 9}
          speed={speed}
          onChange={update}
        />
      )}
      {problem === 'hanoi' && <HanoiView disks={parseInt10(params.get('disks'), 2, 10) ?? 3} speed={speed} onChange={update} />}
    </div>
  );
}
