import { describe, it, expect, vi } from 'vitest';
import { calculateEqualJitter } from '../src/jitter'; // adjust path as needed

describe('calculateEqualJitter', () => {
  it('returns exactly halfDelay when Math.random() = 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = calculateEqualJitter(1000);
    expect(result).toBe(500); // halfDelay = 500

    vi.restoreAllMocks();
  });

  it('returns full baseDelay when Math.random() = 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    const result = calculateEqualJitter(1000);
    expect(result).toBe(1000); // 500 + 500

    vi.restoreAllMocks();
  });

  it('returns a value within the expected range', () => {
    // Use a predictable mid‑range value
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = calculateEqualJitter(1000);
    expect(result).toBe(750); // 500 + 250

    vi.restoreAllMocks();
  });

  it('always returns a value between baseDelay/2 and baseDelay', () => {
    // Let Math.random() behave normally
    const base = 800;
    const value = calculateEqualJitter(base);

    expect(value).toBeGreaterThanOrEqual(base / 2);
    expect(value).toBeLessThanOrEqual(base);
  });
});
