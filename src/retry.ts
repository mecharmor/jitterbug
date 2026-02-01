/**
 * Core retry logic implementation
 */

export type BackoffStrategy = 'exponential' | 'linear' | 'fixed';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds (default: 1000) */
  delay?: number;
  /** Backoff strategy: 'exponential', 'linear', or 'fixed' (default: 'exponential') */
  backoff?: BackoffStrategy;
  /** Callback called before each retry (error, attempt, waitTime) */
  onRetry?: (error: Error, attempt: number, waitTime: number) => void;
}

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a retry wrapper function
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns A function that wraps the original function with retry logic
 */
export function retry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry = () => {}
  } = options;

  return (async function(...args: Parameters<T>): Promise<ReturnType<T>> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxAttempts) {
          const waitTime = calculateDelay(delay, attempt, backoff);
          onRetry(lastError, attempt, waitTime);
          await sleep(waitTime);
        }
      }
    }
    
    throw lastError!;
  }) as T;
}

export { calculateDelay, sleep };

