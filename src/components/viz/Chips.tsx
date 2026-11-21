import { cn } from '@/lib/utils';

interface ChipsProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

/**
 * Single-choice chips built on native radio inputs, so arrow keys move the
 * selection. Scrolls sideways on narrow screens instead of overflowing the page.
 */
export function Chips<T extends string>({ legend, name, value, options, onChange }: ChipsProps<T>) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap">
        {options.map(o => {
          const active = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                'relative inline-flex h-9 cursor-pointer select-none items-center whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
                active
                  ? 'border-primary bg-primary font-medium text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-ink hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
    </div>
  );
}
