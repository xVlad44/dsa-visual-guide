import { cn } from '@/lib/utils';

export type ArrayBarState = 'default' | 'comparing' | 'swapping' | 'sorted' | 'active';

interface ArrayBarProps {
  value: number;
  state: ArrayBarState;
  index: number;
  maxValue: number;
  showValue?: boolean;
}

const stateStyles: Record<ArrayBarState, string> = {
  default: 'bg-algo-default border-algo-default',
  comparing: 'bg-algo-comparing border-algo-comparing animate-bounce-subtle',
  swapping: 'bg-algo-swapping border-algo-swapping animate-pulse-glow',
  sorted: 'bg-algo-sorted border-algo-sorted',
  active: 'bg-algo-active border-algo-active shadow-glow'
};

export function ArrayBar({ value, state, index, maxValue, showValue = true }: ArrayBarProps) {
  const height = (value / maxValue) * 300; // Max height in pixels
  const width = Math.max(40, 300 / maxValue); // Responsive width

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={cn(
          "border-2 rounded-t-lg transition-all duration-300 flex items-end justify-center",
          stateStyles[state]
        )}
        style={{
          height: `${height}px`,
          width: `${width}px`,
          minHeight: '20px'
        }}
      >
        {showValue && (
          <span className="text-xs font-medium text-white mb-1 select-none">
            {value}
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground font-mono">
        {index}
      </span>
    </div>
  );
}