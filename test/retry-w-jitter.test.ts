import { applyJitter } from '../src/retry';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry } from '../src/retry.ts';

describe('retry with jitter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // -------------------------------------------------------
  // EQUAL JITTER
  // -------------------------------------------------------
  it('should apply equal jitter to retry delays', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // equal jitter = base/2 + 0.5*(base/2) = 75 for base=100
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
      const retriedFn = retry(fn, {
        maxAttempts: 2,
        delay: 100,
        jitterConfig: { type: 'equal' },
        onRetry
      });
      const promise = retriedFn();
      // total delay = 100 + 75 = 175
      await vi.advanceTimersByTimeAsync(175);
      await promise;
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 175);
      expect(fn).toHaveBeenCalledTimes(2);
    });

  // -------------------------------------------------------
  // FULL JITTER
  // -------------------------------------------------------
  it('should apply full jitter to retry delays', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    // full jitter = min + 0.25*(max-min) = 100 + 0.25*900 = 325

    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const retriedFn = retry(fn, {
      maxAttempts: 2,
      delay: 100,
      jitterConfig: { type: 'full', min: 100, max: 1000 },
      onRetry
    });

    const promise = retriedFn();

    await vi.advanceTimersByTimeAsync(425); // 100 + 325
    await promise;

    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 425);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------
  // FIXED JITTER
  // -------------------------------------------------------
  it('should apply fixed jitter to retry delays', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    // base = 200, jitter = -50 → 150
    const retriedFn = retry(fn, {
      maxAttempts: 2,
      delay: 200,
      jitterConfig: { type: 'fixed', amount: 50 },
      onRetry
    });

    const promise = retriedFn();

    await vi.advanceTimersByTimeAsync(350); // 200 + (200 - 50)
    await promise;

    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 350);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------
  // RANDOM JITTER
  // -------------------------------------------------------
  it('should apply random jitter to retry delays', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(1); 
    // random jitter = base * (1 + fraction) = 100 * 1.5 = 150

    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const retriedFn = retry(fn, {
      maxAttempts: 2,
      delay: 100,
      jitterConfig: { type: 'random', fraction: 0.5 },
      onRetry
    });

    const promise = retriedFn();

    await vi.advanceTimersByTimeAsync(250); // 100 + 150
    await promise;

    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 250);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------
  // DECORRELATED JITTER
  // -------------------------------------------------------
  it('should apply decorrelated jitter to retry delays', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // base = 100
    // prev = 0 → upper = 100
    // jitter = 100 + 0.5*(100-100) = 100
    // total = 200

    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const retriedFn = retry(fn, {
      maxAttempts: 2,
      delay: 100,
      jitterConfig: { type: 'decorrelated', maxDelay: 5000 },
      onRetry
    });

    const promise = retriedFn();

    await vi.advanceTimersByTimeAsync(200); // 100 + 100
    await promise;

    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------
  // NONE (explicit)
  // -------------------------------------------------------
  it('should apply no jitter when type is none', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const retriedFn = retry(fn, {
      maxAttempts: 2,
      delay: 100,
      jitterConfig: { type: 'none' },
      onRetry
    });

    const promise = retriedFn();

    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------
  // UNDEFINED (default)
  // -------------------------------------------------------
  it('should apply no jitter when jitterConfig is undefined', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const retriedFn = retry(fn, {
      maxAttempts: 2,
      delay: 100,
      onRetry
    });

    const promise = retriedFn();

    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 100);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});


describe('applyJitter', () => {

  it('returns 0 when jitter type is none or undefined', () => {
    expect(applyJitter(1000, undefined, 0)).toBe(0);
    expect(applyJitter(1000, { type: 'none' }, 0)).toBe(0);
  });

  // -----------------------------
  // EQUAL JITTER
  // -----------------------------
  it('applies equal jitter correctly', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // equal jitter = base/2 + random * (base/2)
    // base = 1000 → 500 + 0.5 * 500 = 750
    const result = applyJitter(1000, { type: 'equal' }, 0);
    expect(result).toBe(750);

    vi.restoreAllMocks();
  });

  // -----------------------------
  // FULL JITTER
  // -----------------------------
  it('applies full jitter within the expected range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);

    // full jitter = min + random * (max - min)
    // 100 + 0.25 * 900 = 325
    const result = applyJitter(0, { type: 'full', min: 100, max: 1000 }, 0);
    expect(result).toBe(325);

    vi.restoreAllMocks();
  });

  // -----------------------------
  // FIXED JITTER
  // -----------------------------
  it('applies fixed jitter by subtracting amount', () => {
    const result = applyJitter(500, { type: 'fixed', amount: 200 }, 0);
    expect(result).toBe(300);
  });

  it('fixed jitter never returns negative values', () => {
    const result = applyJitter(100, { type: 'fixed', amount: 500 }, 0);
    expect(result).toBe(0);
  });

  // -----------------------------
  // RANDOM JITTER
  // -----------------------------
  it('applies random jitter with symmetric variation', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1); // max positive jitter

    // jitterFraction = 0.2 → +20%
    // base = 1000 → 1200
    const result = applyJitter(1000, { type: 'random', fraction: 0.2 }, 0);
    expect(result).toBe(1200);

    vi.restoreAllMocks();
  });

  it('random jitter clamps at zero when negative', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // max negative jitter

    // jitterFraction = 0.5 → -50%
    // base = 1000 → 500
    const result = applyJitter(1000, { type: 'random', fraction: 0.5 }, 0);
    expect(result).toBe(500);

    vi.restoreAllMocks();
  });

  // -----------------------------
  // DECORRELATED JITTER
  // -----------------------------
  it('applies decorrelated jitter using AWS algorithm', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // upper = max(base, prev * 3)
    // base = 1000, prev = 400 → upper = 1200
    // jitter = base + 0.5 * (upper - base)
    // = 1000 + 0.5 * 200 = 1100
    const result = applyJitter(
      1000,
      { type: 'decorrelated', maxDelay: 5000 },
      400
    );

    expect(result).toBe(1100);

    vi.restoreAllMocks();
  });

  it('decorrelated jitter clamps to maxDelay', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    // upper = prev * 3 = 3000
    // but maxDelay = 1500 → clamp to 1500
    const result = applyJitter(
      1000,
      { type: 'decorrelated', maxDelay: 1500 },
      1000
    );

    expect(result).toBe(1500);

    vi.restoreAllMocks();
  });

});
