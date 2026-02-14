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

  function validateJitterResult(result: number, jitterType: string): void {
  if (typeof result !== 'number') {
    throw new Error(`Jitter calculation (${jitterType}) returned non-number: ${typeof result}`);
  }
  
  if (!isFinite(result)) {
    throw new Error(`Jitter calculation (${jitterType}) returned non-finite value: ${result}`);
  }
  
  if (result < 0) {
    throw new Error(`Jitter calculation (${jitterType}) returned negative value: ${result}`);
  }
  
  if (isNaN(result)) {
    throw new Error(`Jitter calculation (${jitterType}) returned NaN`);
  }
}

  function applyJitter(
  baseDelay: number,
  jitter: JitterConfig | undefined,
  prevDelay: number
): number {
  if (!jitter || jitter.type === 'none') return 0;

  // Validate baseDelay
  if (baseDelay < 0 || !isFinite(baseDelay)) {
    throw new Error(`Invalid baseDelay: ${baseDelay}. Must be a non-negative finite number.`);
  }

  // Validate prevDelay
  if (prevDelay < 0 || !isFinite(prevDelay)) {
    throw new Error(`Invalid prevDelay: ${prevDelay}. Must be a non-negative finite number.`);
  }

  let result: number;

  try {
    switch (jitter.type) {
      case 'equal':
        result = calculateEqualJitter(baseDelay);
        validateJitterResult(result, 'equal');
        return result;

      case 'full':
        if (jitter.min < 0 || !isFinite(jitter.min)) {
          throw new Error(`Invalid min delay: ${jitter.min}. Must be a non-negative finite number.`);
        }
        if (jitter.max < 0 || !isFinite(jitter.max)) {
          throw new Error(`Invalid max delay: ${jitter.max}. Must be a non-negative finite number.`);
        }
        if (jitter.min >= jitter.max) {
          throw new Error(`Invalid delay range: min (${jitter.min}) must be less than max (${jitter.max}).`);
        }
        result = calculateFullJitter(jitter.min, jitter.max);
        validateJitterResult(result, 'full');
        
        // Additional validation: result should be within expected range
        if (result < jitter.min || result > jitter.max) {
          throw new Error(`Full jitter result ${result} outside expected range [${jitter.min}, ${jitter.max}]`);
        }
        return result;

      case 'fixed':
        if (jitter.amount < 0 || !isFinite(jitter.amount)) {
          throw new Error(`Invalid jitter amount: ${jitter.amount}. Must be a non-negative finite number.`);
        }
        result = calculateFixedJitter(baseDelay, jitter.amount);
        validateJitterResult(result, 'fixed');
        
        // Fixed jitter should never exceed baseDelay
        if (result > baseDelay) {
          throw new Error(`Fixed jitter result ${result} exceeds baseDelay ${baseDelay}`);
        }
        return result;

      case 'random':
        if (jitter.fraction < 0 || jitter.fraction > 1 || !isFinite(jitter.fraction)) {
          throw new Error(`Invalid jitter fraction: ${jitter.fraction}. Must be between 0 and 1.`);
        }
        result = calculateRandomJitter(baseDelay, jitter.fraction);
        validateJitterResult(result, 'random');
        
        // Random jitter should be within reasonable bounds based on fraction
        const expectedMin = baseDelay * (1 - jitter.fraction);
        const expectedMax = baseDelay * (1 + jitter.fraction);
        if (result < expectedMin || result > expectedMax) {
          throw new Error(`Random jitter result ${result} outside expected range [${expectedMin}, ${expectedMax}]`);
        }
        return result;

      case 'decorrelated':
        if (jitter.maxDelay < 0 || !isFinite(jitter.maxDelay)) {
          throw new Error(`Invalid maxDelay: ${jitter.maxDelay}. Must be a non-negative finite number.`);
        }
        if (jitter.maxDelay < baseDelay) {
          throw new Error(`maxDelay (${jitter.maxDelay}) must be greater than or equal to baseDelay (${baseDelay}).`);
        }
        result = calculateDecorrelatedJitter(
          baseDelay,
          jitter.maxDelay,
          prevDelay
        );
        validateJitterResult(result, 'decorrelated');
        
        // Decorrelated should never exceed maxDelay
        if (result > jitter.maxDelay) {
          throw new Error(`Decorrelated jitter result ${result} exceeds maxDelay ${jitter.maxDelay}`);
        }
        return result;

      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = jitter;
        throw new Error(`Unknown jitter type: ${(_exhaustive as JitterConfig).type}`);
    }
  } catch (error) {
    // Re-throw with additional context if it's not already our error
    if (error instanceof Error && !error.message.includes('Invalid') && !error.message.includes('Jitter')) {
      throw new Error(`Error applying jitter (${jitter.type}): ${error.message}`);
    }
    throw error;
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

