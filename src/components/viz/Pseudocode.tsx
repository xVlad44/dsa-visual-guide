import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PseudocodeProps {
  lines: readonly string[];
  /** 1-based line of the current step */
  active: number | null;
  /** optional real implementations, shown in extra tabs */
  code?: Record<string, readonly string[]>;
}

const LANG_LABEL: Record<string, string> = { javascript: 'JavaScript', python: 'Python' };

/** Pseudocode with the current step's line highlighted, plus reference code tabs. */
export function Pseudocode({ lines, active, code }: PseudocodeProps) {
  const tabs = ['pseudocode', ...Object.keys(code ?? {})];
  const [tab, setTab] = useState('pseudocode');
  const current = tabs.includes(tab) ? tab : 'pseudocode';
  const shown = current === 'pseudocode' ? lines : code![current];

  return (
    <div>
      {tabs.length > 1 && (
        <div role="group" aria-label="Code view" className="-mt-1 mb-3 flex gap-1">
          {tabs.map(t => (
            <button
              key={t}
              type="button"
              aria-pressed={current === t}
              onClick={() => setTab(t)}
              className={cn(
                'h-8 rounded-md px-2.5 font-mono text-xs transition-colors',
                current === t ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'pseudocode' ? 'Pseudocode' : LANG_LABEL[t] ?? t}
            </button>
          ))}
        </div>
      )}
      <ol className="overflow-x-auto font-mono text-[12.5px] leading-6">
        {shown.map((line, i) => {
          const isActive = current === 'pseudocode' && active === i + 1;
          return (
            <li
              key={i}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'flex whitespace-pre rounded-sm border-l-2 pr-2',
                isActive ? 'border-primary bg-primary/15 text-foreground' : 'border-transparent text-muted-foreground',
              )}
            >
              <span className="w-8 shrink-0 select-none pr-2 text-right opacity-60" aria-hidden>
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          );
        })}
      </ol>
      {current !== 'pseudocode' && (
        <p className="mt-3 text-xs text-muted-foreground">Reference implementation. The highlight follows the pseudocode tab.</p>
      )}
    </div>
  );
}
