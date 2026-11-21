import { useCallback, useEffect, useRef, useState } from 'react';
import { advance } from './clock';

export type PlayerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface Player {
  index: number;
  last: number;
  playing: boolean;
  status: PlayerStatus;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  step: (delta: number) => void;
  seek: (index: number) => void;
}

/**
 * Replays frame indices 0..length-1 with a requestAnimationFrame loop.
 * `speed` is steps per second (it can exceed the frame rate). The player
 * rewinds to frame 0 whenever `resetKey` changes, i.e. when a new trace loads.
 */
export function usePlayer(length: number, speed: number, resetKey: unknown): Player {
  const last = Math.max(0, length - 1);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const indexRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const set = useCallback((i: number) => {
    indexRef.current = i;
    setIndex(i);
  }, []);

  useEffect(() => {
    set(0);
    setPlaying(false);
  }, [resetKey, set]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let prev = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      const t = advance(indexRef.current, carry, now - prev, speedRef.current, last);
      prev = now;
      carry = t.carry;
      if (t.index !== indexRef.current) set(t.index);
      if (t.ended) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, last, set]);

  const play = useCallback(() => {
    if (last === 0) return;
    if (indexRef.current >= last) set(0); // replay from the start
    setPlaying(true);
  }, [last, set]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const seek = useCallback(
    (i: number) => {
      setPlaying(false);
      set(Math.max(0, Math.min(last, Math.round(i))));
    },
    [last, set],
  );
  const step = useCallback((delta: number) => seek(indexRef.current + delta), [seek]);

  const status: PlayerStatus = playing ? 'running' : index >= last && last > 0 ? 'finished' : index === 0 ? 'idle' : 'paused';

  return { index: Math.min(index, last), last, playing, status, play, pause, toggle, step, seek };
}
