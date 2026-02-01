/**
 * Core retry logic implementation
 */

import { calculateDecorrelatedJitter, calculateEqualJitter, calculateFixedJitter, calculateFullJitter, calculateRandomJitter } from "./jitter";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type BackoffStrategy = 'exponential' | 'linear' | 'fixed';
function calculateDelay(baseDelay: number, attempt: number, backoff: BackoffStrategy): number {
  switch (backoff) {
    case 'exponential':
      return baseDelay * Math.pow(2, attempt - 1);
    case 'linear':
      return baseDelay * attempt;
    case 'fixed':
    default:
      return baseDelay;
  }
}

export type JitterConfig =
  | { type: 'none' }
  | { type: 'equal' }
  | { type: 'full', min: number, max: number }
  | { type: 'fixed', amount: number }
  | { type: 'random', fraction: number }
  | { type: 'decorrelated', maxDelay: number };

  function applyJitter(
    baseDelay: number,
    jitter: JitterConfig | undefined,
    prevDelay: number
  ): number {
    if (!jitter || jitter.type === 'none') return 0;
  
    switch (jitter.type) {
      case 'equal':
        return calculateEqualJitter(baseDelay);
  
      case 'full':
        return calculateFullJitter(jitter.min, jitter.max);
  
      case 'fixed':
        return calculateFixedJitter(baseDelay, jitter.amount);
  
      case 'random':
        return calculateRandomJitter(baseDelay, jitter.fraction);
  
      case 'decorrelated':
        return calculateDecorrelatedJitter(
          baseDelay,
          jitter.maxDelay,
          prevDelay
        );
    }
  }
  


export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds (default: 1000) */
  delay?: number;
  /** Backoff strategy: 'exponential', 'linear', or 'fixed' (default: 'exponential') */
  backoff?: BackoffStrategy;
  /** Callback called before each retry (error, attempt, waitTime) */
  onRetry?: (error: Error, attempt: number, waitTime: number) => void;
  /** Jitter settings */
  jitterConfig?: JitterConfig
}

/**
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns A function that wraps the original function with retry logic
 */
// @typescript-eslint/no-explicit-any
export function retry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: RetryOptions = {}
): T {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    jitterConfig,
    onRetry = () => {}
  } = options;

  return (async function(...args: Parameters<T>): Promise<ReturnType<T>> {
    let lastError: Error;
    
    let prevJitterDelay = 0;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args) as ReturnType<T>;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxAttempts) {
          const waitTime = calculateDelay(delay, attempt, backoff);
          const jitterMs = applyJitter(waitTime, jitterConfig, prevJitterDelay)
          prevJitterDelay = jitterMs;
          const delayTimeMs = waitTime + jitterMs;
          onRetry(lastError, attempt, delayTimeMs);
          await sleep(delayTimeMs);
        }
      }
    }
    
    throw lastError!;
  }) as T;
}

export { calculateDelay, sleep, applyJitter };

