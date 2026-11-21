import { ChevronFirst, ChevronLast, Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';
import { SPEEDS } from '@/player/clock';
import type { Player } from '@/player/usePlayer';
import { cn } from '@/lib/utils';

interface TransportProps {
  player: Player;
  speed: number;
  onSpeed: (speed: number) => void;
  /** e.g. "step", "move" */
  unit?: string;
  disabled?: boolean;
  className?: string;
}

function IconButton({ label, shortcut, onClick, disabled, children, primary }: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-[18px] [&_svg]:w-[18px]',
        primary
          ? 'h-11 w-11 bg-primary text-primary-foreground hover:bg-primary/85'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/** Player controls: jump, step, play/pause, scrubber, speed. */
export function Transport({ player, speed, onSpeed, unit = 'step', disabled, className }: TransportProps) {
  const { index, last, playing, status } = player;
  const empty = disabled || last === 0;
  return (
    <div className={cn('flex flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4', className)}>
      <div className="flex items-center justify-center gap-1">
        <IconButton label="First step" shortcut="Home" onClick={() => player.seek(0)} disabled={empty || index === 0}>
          <ChevronFirst />
        </IconButton>
        <IconButton label="Step back" shortcut="←" onClick={() => player.step(-1)} disabled={empty || index === 0}>
          <StepBack />
        </IconButton>
        <IconButton
          primary
          label={playing ? 'Pause' : status === 'finished' ? 'Replay' : 'Play'}
          shortcut="Space"
          onClick={player.toggle}
          disabled={empty}
        >
          {playing ? <Pause /> : status === 'finished' ? <RotateCcw /> : <Play />}
        </IconButton>
        <IconButton label="Step forward" shortcut="→" onClick={() => player.step(1)} disabled={empty || index === last}>
          <StepForward />
        </IconButton>
        <IconButton label="Last step" shortcut="End" onClick={() => player.seek(last)} disabled={empty || index === last}>
          <ChevronLast />
        </IconButton>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <input
          type="range"
          min={0}
          max={Math.max(1, last)}
          value={index}
          disabled={empty}
          onChange={e => player.seek(Number(e.target.value))}
          aria-label={`Scrub through ${unit}s`}
          aria-valuetext={`${unit} ${index} of ${last}`}
          className="scrubber h-10 min-w-0 flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          style={{ '--fill': `${last > 0 ? (index / last) * 100 : 0}%` } as React.CSSProperties}
        />
        <span className="shrink-0 font-mono text-xs tabular text-muted-foreground" aria-hidden>
          <span className="text-foreground">{index}</span>/{last}
        </span>
        <label className="flex shrink-0 items-center gap-2">
          <span className="sr-only">Speed</span>
          <select
            value={speed}
            onChange={e => onSpeed(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-2 font-mono text-xs tabular"
            title="Playback speed"
          >
            {SPEEDS.map(s => (
              <option key={s} value={s}>
                {s} {unit}s/s
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<Player['status'], string> = {
  idle: 'Ready',
  running: 'Running',
  paused: 'Paused',
  finished: 'Finished',
};

export function StatusPill({ status }: { status: Player['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px] uppercase tracking-wider',
        status === 'running' && 'border-ink/50 text-ink',
        status === 'finished' && 'border-success/60 text-success',
        (status === 'idle' || status === 'paused') && 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'running' ? 'bg-ink' : status === 'finished' ? 'bg-success' : 'bg-muted-foreground',
        )}
        aria-hidden
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
