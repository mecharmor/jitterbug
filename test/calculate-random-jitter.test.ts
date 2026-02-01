import { describe, it, expect, vi } from 'vitest';
import { calculateRandomJitter } from '../src/jitter'; // adjust path as needed

describe('calculateRandomJitter', () => {
  it('returns baseDelayMs when Math.random() = 1 (max positive jitter)', () => {
    // Math.random() = 1 → (1 * 2 - 1) = 1 → jitter = +jitterFraction
    vi.spyOn(Math, 'random').mockReturnValue(1);

    const result = calculateRandomJitter(1000, 0.5);
    // jitterFraction = 0.5 → multiplier = 1 + 0.5 = 1.5
    expect(result).toBe(1500);

    vi.restoreAllMocks();
  });

  it('returns baseDelayMs * (1 - jitterFraction) when Math.random() = 0 (max negative jitter)', () => {
    // Math.random() = 0 → (0 * 2 - 1) = -1 → jitter = -jitterFraction
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = calculateRandomJitter(1000, 0.5);
    // multiplier = 1 - 0.5 = 0.5
    expect(result).toBe(500);

    vi.restoreAllMocks();
  });

  it('returns a mid‑range jittered value when Math.random() = 0.5', () => {
    // Math.random() = 0.5 → (0.5 * 2 - 1) = 0 → jitter = 0
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = calculateRandomJitter(1000, 0.5);
    expect(result).toBe(1000); // no jitter applied

    vi.restoreAllMocks();
  });

  it('never returns a negative number', () => {
    // Force extreme negative jitter
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = calculateRandomJitter(1000, 5); // huge jitterFraction
    expect(result).toBeGreaterThanOrEqual(0);

    vi.restoreAllMocks();
  });

  it('returns a value within the expected jitter range', () => {
    // Let Math.random behave normally
    const base = 800;
    const jitter = 0.25;

    const value = calculateRandomJitter(base, jitter);

    const min = base * (1 - jitter);
    const max = base * (1 + jitter);

    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  });
});
