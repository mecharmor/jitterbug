/**
 * Core retry logic implementation
 */

function calculateDelay(baseDelay, attempt, backoff) {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a retry wrapper function
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry configuration
 * @param {number} options.maxAttempts - Maximum number of retry attempts (default: 3)
 * @param {number} options.delay - Base delay in milliseconds (default: 1000)
 * @param {string} options.backoff - Backoff strategy: 'exponential', 'linear', or 'fixed' (default: 'exponential')
 * @param {Function} options.onRetry - Callback called before each retry (error, attempt, waitTime)
 * @returns {Function} A function that wraps the original function with retry logic
 */
export function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry = () => {}
  } = options;

  return async function(...args) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          const waitTime = calculateDelay(delay, attempt, backoff);
          onRetry(error, attempt, waitTime);
          await sleep(waitTime);
        }
      }
    }
    
    throw lastError;
  };
}

export { calculateDelay, sleep };

