import type { ReactNode } from 'react';
import type { PlayerStatus } from '@/player/usePlayer';
import { StatusPill } from './Transport';

/** Stage on the left, reference panels on the right; on phones the panels follow the stage. */
export function VizLayout({ stage, aside, below }: { stage: ReactNode; aside: ReactNode; below?: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      {stage}
      <aside className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">{aside}</aside>
      {below && <div className="min-w-0 lg:col-start-1 lg:row-start-2">{below}</div>}
    </div>
  );
}

interface StageProps {
  label: string;
  status: PlayerStatus;
  message: string;
  playing: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function Stage({ label, status, message, playing, children, footer }: StageProps) {
  return (
    <section className="min-w-0 rounded-lg border bg-card" aria-label={label}>
      <div className="flex min-h-11 items-center gap-3 border-b px-4 py-2">
        <StatusPill status={status} />
        <p className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:text-[13px]" aria-live={playing ? 'off' : 'polite'}>
          {message}
        </p>
      </div>
      {children}
      {footer}
    </section>
  );
}
