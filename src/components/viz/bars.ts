import type { SortFrame } from '@/engine/sorting/trace';

export type BarState = 'default' | 'comparing' | 'swapping' | 'active' | 'sorted';

/** Above this many bars the canvas renderer takes over from DOM bars. */
export const CANVAS_THRESHOLD = 100;

/** Highlight for each index: the current event first, then the marker, then "final". */
export function barStates(frame: SortFrame): BarState[] {
  const n = frame.array.length;
  const out: BarState[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = frame.sorted[i] ? 'sorted' : 'default';
  if (frame.pivot !== null) out[frame.pivot] = 'active';
  const e = frame.event;
  if (e) {
    switch (e.type) {
      case 'compare':
        out[e.i] = 'comparing';
        out[e.j] = 'comparing';
        break;
      case 'compareKey':
      case 'read':
        out[e.i] = 'comparing';
        break;
      case 'swap':
        out[e.i] = 'swapping';
        out[e.j] = 'swapping';
        break;
      case 'write':
        out[e.i] = 'swapping';
        if (e.from !== undefined) out[e.from] = 'comparing';
        break;
    }
  }
  return out;
}
