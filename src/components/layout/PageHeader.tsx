import type { ReactNode } from 'react';

interface PageHeaderProps {
  index: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
  aside?: ReactNode;
}

/** Compact page head: the visualiser, not the title, is the focal point. */
export function PageHeader({ index, eyebrow, title, children, aside }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 pt-8 md:flex-row md:items-end md:justify-between md:pt-10">
      <div className="max-w-2xl">
        <p className="eyebrow">
          <span className="text-ink">{index}</span>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{title}</h1>
        {children && <p className="mt-2 text-muted-foreground">{children}</p>}
      </div>
      {aside}
    </div>
  );
}
