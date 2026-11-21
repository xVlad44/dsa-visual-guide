import { useEffect, useRef } from 'react';
import type { Player } from './usePlayer';

/** Controls that use arrow keys or typing themselves; shortcuts stay out of their way. */
const OWN_KEYS = 'input, textarea, select, [contenteditable="true"], [role="slider"], [role="tab"], [role="radio"], [role="option"], [role="combobox"]';
/** Controls that Space already activates. */
const ACTIVATES = 'button, a[href], summary, [role="button"], [role="switch"], [role="checkbox"]';

export interface ShortcutExtras {
  /** R: new random input */
  onShuffle?: () => void;
}

/**
 * Player shortcuts: Space/K play-pause, ←/→ (J/L) step, Shift+arrow ±10,
 * Home/End jump. Ignored while typing or when the focused control handles the key.
 */
export function usePlayerShortcuts(player: Player, extras: ShortcutExtras = {}, enabled = true) {
  const ref = useRef({ player, extras });
  ref.current = { player, extras };

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(OWN_KEYS)) return;
      const { player: p, extras: x } = ref.current;
      const big = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          if (e.key === ' ' && target?.closest?.(ACTIVATES)) return;
          e.preventDefault();
          p.toggle();
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          p.step(big);
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          p.step(-big);
          break;
        case 'Home':
          e.preventDefault();
          p.seek(0);
          break;
        case 'End':
          e.preventDefault();
          p.seek(p.last);
          break;
        case 'r':
        case 'R':
          if (x.onShuffle) {
            e.preventDefault();
            x.onShuffle();
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
