import { cn } from '@/lib/utils';

export interface LegendItem {
  label: string;
  /** Tailwind background class */
  swatch: string;
  dim?: boolean;
}

export function Legend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground', className)} aria-label="Legend">
      {items.map(item => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span className={cn('h-2.5 w-2.5 rounded-[2px]', item.swatch, item.dim && 'opacity-30')} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function ShortcutHint({ extra }: { extra?: Array<[string, string]> }) {
  const keys: Array<[string, string]> = [
    ['Space', 'play / pause'],
    ['← →', 'step'],
    ['Shift ← →', '±10'],
    ['Home End', 'jump'],
    ...(extra ?? []),
  ];
  return (
    <p className="hidden flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground md:flex">
      {keys.map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          {k.split(' ').map(part => (
            <kbd key={part} className="kbd">
              {part}
            </kbd>
          ))}
          {v}
        </span>
      ))}
    </p>
  );
}
