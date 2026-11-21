import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({ title, action, children, className, bodyClassName }: PanelProps) {
  return (
    <section className={cn('rounded-lg border bg-card', className)} aria-label={title}>
      <header className="flex min-h-11 items-center justify-between gap-3 border-b px-4 py-2">
        <h2 className="eyebrow">{title}</h2>
        {action}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}
