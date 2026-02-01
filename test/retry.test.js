import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry, calculateDelay, sleep } from '../src/retry.ts';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('basic retry behavior', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const retriedFn = retry(fn);

      const result = await retriedFn();
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const retriedFn = retry(fn, { maxAttempts: 3, delay: 10 });

      const promise = retriedFn();
      await vi.advanceTimersByTimeAsync(30);
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after all attempts fail', async () => {
      const error = new Error('persistent failure');
      const fn = vi.fn().mockRejectedValue(error);
      const retriedFn = retry(fn, { maxAttempts: 3, delay: 10 });

      const promise = retriedFn();
      // Add catch handler to prevent unhandled rejection warning
      promise.catch(() => {});
      
      await vi.advanceTimersByTimeAsync(50);
      await vi.runAllTimersAsync();
      
      // Ensure promise is settled
      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.message).toBe('persistent failure');
      }
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('backoff strategies', () => {
    it('should use exponential backoff by default', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const retriedFn = retry(fn, { 
        maxAttempts: 3, 
        delay: 100,
        onRetry 
      });

      const promise = retriedFn();
      await vi.runAllTimersAsync();
      await promise;
      
      // Verify backoff delays: first retry = 100ms (100 * 2^0), second = 200ms (100 * 2^1)
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 100);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 200);
    });

    it('should use linear backoff when specified', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const retriedFn = retry(fn, { 
        maxAttempts: 3, 
        delay: 50,
        backoff: 'linear',
        onRetry 
      });

      const promise = retriedFn();
      
      // First retry: 50 * 1 = 50ms
      await vi.advanceTimersByTimeAsync(50);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 50);
      
      // Second retry: 50 * 2 = 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 100);
      
      await promise;
    });

    it('should use fixed backoff when specified', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const retriedFn = retry(fn, { 
        maxAttempts: 3, 
        delay: 75,
        backoff: 'fixed',
        onRetry 
      });

      const promise = retriedFn();
      
      // Both retries should wait 75ms
      await vi.advanceTimersByTimeAsync(75);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 75);
      
      await vi.advanceTimersByTimeAsync(75);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 75);
      
      await promise;
    });
  });

  describe('options', () => {
    it('should respect maxAttempts option', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const retriedFn = retry(fn, { maxAttempts: 5, delay: 10 });

      const promise = retriedFn();
      // Add catch handler to prevent unhandled rejection warning
      promise.catch(() => {});
      
      // Advance enough time for all retries: 10 + 20 + 40 + 80 = 150ms (exponential)
      await vi.advanceTimersByTimeAsync(200);
      await vi.runAllTimersAsync();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(fn).toHaveBeenCalledTimes(5);
    });

    it('should call onRetry callback with correct parameters', async () => {
      const onRetry = vi.fn();
      const error = new Error('test error');
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const retriedFn = retry(fn, { 
        maxAttempts: 2, 
        delay: 100,
        onRetry 
      });

      const promise = retriedFn();
      await vi.advanceTimersByTimeAsync(100);
      await promise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(error, 1, 100);
    });

    it('should pass arguments to the wrapped function', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const retriedFn = retry(fn);

      await retriedFn('arg1', 'arg2', 'arg3');

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });

  describe('edge cases', () => {
    it('should handle maxAttempts of 1', async () => {
      const error = new Error('fail');
      const fn = vi.fn().mockRejectedValue(error);
      const retriedFn = retry(fn, { maxAttempts: 1, delay: 10 });

      const promise = retriedFn();
      await expect(promise).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle zero delay', async () => {
      vi.useRealTimers();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const retriedFn = retry(fn, { maxAttempts: 2, delay: 0 });
      const result = await retriedFn();

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      vi.useFakeTimers();
    });

    it('should handle functions that throw synchronously', async () => {
      const error = new Error('sync error');
      const fn = vi.fn(() => {
        throw error;
      });

      const retriedFn = retry(fn, { maxAttempts: 2, delay: 10 });
      const promise = retriedFn();
      // Add catch handler to prevent unhandled rejection warning
      promise.catch(() => {});
      
      await vi.advanceTimersByTimeAsync(20);
      await vi.runAllTimersAsync();

      try {
        await promise;
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.message).toBe('sync error');
      }
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

describe('calculateDelay', () => {
  it('should calculate exponential backoff correctly', () => {
    expect(calculateDelay(100, 1, 'exponential')).toBe(100); // 100 * 2^0
    expect(calculateDelay(100, 2, 'exponential')).toBe(200); // 100 * 2^1
    expect(calculateDelay(100, 3, 'exponential')).toBe(400); // 100 * 2^2
  });

  it('should calculate linear backoff correctly', () => {
    expect(calculateDelay(100, 1, 'linear')).toBe(100); // 100 * 1
    expect(calculateDelay(100, 2, 'linear')).toBe(200); // 100 * 2
    expect(calculateDelay(100, 3, 'linear')).toBe(300); // 100 * 3
  });

  it('should calculate fixed backoff correctly', () => {
    expect(calculateDelay(100, 1, 'fixed')).toBe(100);
    expect(calculateDelay(100, 2, 'fixed')).toBe(100);
    expect(calculateDelay(100, 3, 'fixed')).toBe(100);
  });

  it('should default to fixed backoff for unknown strategy', () => {
    expect(calculateDelay(100, 1, 'unknown')).toBe(100);
    expect(calculateDelay(100, 2, 'unknown')).toBe(100);
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after the specified delay', async () => {
    const sleepPromise = sleep(100);
    
    await vi.advanceTimersByTimeAsync(100);
    await sleepPromise;
    
    // If we get here, the promise resolved correctly
    expect(true).toBe(true);
  });
});

