/**
 * Pure stepping math for the requestAnimationFrame player. Speed is in steps
 * per second and may exceed the frame rate: several steps are then applied in
 * one frame. The fractional remainder is carried, so playback speed does not
 * depend on the display's refresh rate.
 */
export interface Tick {
  index: number;
  carry: number;
  ended: boolean;
}

/** Longest frame gap honoured; a backgrounded tab must not jump to the end on return. */
export const MAX_FRAME_MS = 250;

export function advance(index: number, carry: number, dtMs: number, stepsPerSecond: number, lastIndex: number): Tick {
  if (index >= lastIndex) return { index: lastIndex, carry: 0, ended: true };
  const dt = Math.min(Math.max(dtMs, 0), MAX_FRAME_MS);
  const total = carry + (dt * stepsPerSecond) / 1000;
  const steps = Math.floor(total);
  const next = Math.min(lastIndex, index + steps);
  const ended = next >= lastIndex;
  return { index: next, carry: ended ? 0 : total - steps, ended };
}

/** Speed presets in steps per second, used by every visualiser. */
export const SPEEDS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512] as const;
export const DEFAULT_SPEED = 8;

export function nearestSpeed(value: number): number {
  let best: number = SPEEDS[0];
  for (const s of SPEEDS) if (Math.abs(s - value) < Math.abs(best - value)) best = s;
  return best;
}
