import { useState, useEffect, useRef } from 'react';
import { isReducedMotion } from '../theme/motion';

/**
 * Smoothly animates a numeric value from start to target over durationMs
 * Uses StockSense cubic-bezier(0.22, 1, 0.36, 1) ease-out curve.
 */
export function useCountUp(target: number, durationMs: number = 600): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef(0);
  const targetRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isReducedMotion()) {
      setCurrent(target);
      return;
    }

    startRef.current = current;
    targetRef.current = target;
    startTimeRef.current = null;

    // Cubic bezier approx for cubic-bezier(0.22, 1, 0.36, 1) ease-out
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOut(progress);
      const nextValue = Math.round(startRef.current + (targetRef.current - startRef.current) * eased);
      setCurrent(nextValue);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [target, durationMs]);

  return current;
}
