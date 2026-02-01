import { describe, it, expect, vi } from 'vitest';
import { calculateDecorrelatedJitter } from '../src/jitter'; // adjust path as needed

describe('calculateDecorrelatedJitter', () => {
  it('returns baseDelayMs when Math.random() = 0 and prevDelayMs = 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = calculateDecorrelatedJitter(1000, 5000, 0);
    expect(result).toBe(1000);

    vi.restoreAllMocks();
  });

  it('returns upperDelayMs (prevDelay * 3) when Math.random() = 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    // prevDelayMs * 3 = 6000
    const result = calculateDecorrelatedJitter(1000, 10000, 2000);
    expect(result).toBe(6000);

    vi.restoreAllMocks();
  });

  it('clamps to maxDelayMs when jitter exceeds maxDelayMs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    // upperDelay = prevDelay * 3 = 9000, but maxDelayMs = 3000
    const result = calculateDecorrelatedJitter(1000, 3000, 3000);
    expect(result).toBe(3000);

    vi.restoreAllMocks();
  });

  it('returns a mid‑range jittered value when Math.random() = 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // upperDelay = max(baseDelay, prevDelay*3) = max(1000, 1500) = 1500
    // jitter = base + 0.5 * (upper - base) = 1000 + 0.5 * 500 = 1250
    const result = calculateDecorrelatedJitter(1000, 5000, 500);
    expect(result).toBe(1250);

    vi.restoreAllMocks();
  });

  it('always returns a value between baseDelayMs and min(maxDelayMs, prevDelayMs*3)', () => {
    const base = 800;
    const max = 5000;
    const prev = 1200;

    const value = calculateDecorrelatedJitter(base, max, prev);

    const upper = Math.max(base, prev * 3);
    const clampedUpper = Math.min(max, upper);

    expect(value).toBeGreaterThanOrEqual(base);
    expect(value).toBeLessThanOrEqual(clampedUpper);
  });
});
