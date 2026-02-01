import { describe, it, expect } from 'vitest';
import { calculateFixedJitter } from '../src/jitter'; // adjust path as needed

describe('calculateFixedJitter', () => {
  it('subtracts jitterAmount from maxDelayMs', () => {
    const result = calculateFixedJitter(1000, 200);
    expect(result).toBe(800);
  });

  it('returns 0 when jitterAmount is greater than maxDelayMs', () => {
    const result = calculateFixedJitter(300, 500);
    expect(result).toBe(0);
  });

  it('returns 0 when jitterAmount equals maxDelayMs', () => {
    const result = calculateFixedJitter(400, 400);
    expect(result).toBe(0);
  });

  it('handles zero jitterAmount correctly', () => {
    const result = calculateFixedJitter(750, 0);
    expect(result).toBe(750);
  });

  it('never returns a negative number', () => {
    const result = calculateFixedJitter(100, 9999);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
