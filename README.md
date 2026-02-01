![Jitterbug Logo](https://raw.githubusercontent.com/mecharmor/jitterbug/main/assets/logo.png)

![Build Status](https://github.com/mecharmor/jitterbug/actions/workflows/build.yml/badge.svg?branch=main)
![Tests](https://img.shields.io/github/actions/workflow/status/mecharmor/jitterbug/build.yml?branch=main&label=tests)
[![npm version](https://img.shields.io/npm/v/jitterbug.svg)](https://www.npmjs.com/package/jitterbug)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Coverage](https://img.shields.io/badge/coverage-100.00%25-brightgreen)


Jitterbug is a modern, type‑safe retry engine for Node.js  and browser environments. It provides predictable backoff behavior and a suite of configurable jitter strategies, all wrapped in a clean, minimal API. The library is intentionally lightweight and dependency‑free to keep integration simple and reduce risk for consumers.

Designed to be framework‑agnostic and easy to adopt, Jitterbug emphasizes clarity, reliability, and maintainability. Its implementation is backed by comprehensive automated testing to ensure consistent behavior and to support confident contributions from the community.



## Installation

```bash
npm install jitterbug
```

## Usage

### JavaScript/TypeScript

```typescript
import { retry, type RetryOptions } from 'jitterbug';

// Basic usage
const fetchWithRetry = retry(async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Request failed');
  return response.json();
});

// With options
const fetchWithRetry = retry(async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}, {
  maxAttempts: 5,
  delay: 1000,
  backoff: 'exponential',
  jitterConfig: { type: 'equal' }, // optional jitter
  onRetry: (error, attempt, waitTime) => {
    console.log(`Retry attempt ${attempt} after ${waitTime}ms`);
  }
});

// Use it
try {
  const data = await fetchWithRetry('https://api.example.com/data');
  console.log(data);
} catch (error) {
  console.error('All retry attempts failed:', error);
}
```

### Jitter Utility Functions

Jitterbug also exports its jitter calculation helpers directly.  
These functions are pure, deterministic (when `Math.random` is mocked), and can be used independently of the retry system.

---

#### **`calculateEqualJitter(baseDelayMs: number): number`**  
Produces a delay between **50% and 100%** of the base delay.  
Useful for predictable but desynchronized retry timing.

---

#### **`calculateFullJitter(minDelayMs: number, maxDelayMs: number): number`**  
Returns a completely random delay between `minDelayMs` (inclusive) and `maxDelayMs` (exclusive).  
Ideal for aggressively spreading retries under heavy load.

---

#### **`calculateFixedJitter(baseDelayMs: number, jitterAmount: number): number`**  
Subtracts a constant amount from the base delay, never below zero.  
Useful when you want consistent desynchronization without randomness.

---

#### **`calculateRandomJitter(baseDelayMs: number, jitterFraction: number): number`**  
Applies a symmetric ±fraction jitter around the base delay.  
Example: `fraction = 0.2` → delay may vary between 80% and 120% of the base.

---

#### **`calculateDecorrelatedJitter(baseDelayMs: number, maxDelayMs: number, prevDelayMs?: number): number`**  
Implements AWS‑style decorrelated jitter.  
Each retry picks a random delay between the base delay and **3× the previous delay**, capped at `maxDelayMs`.  
Excellent for large distributed systems where synchronized retries can overwhelm downstream services.


## API

### `retry<T>(fn: T, options?: RetryOptions): T`

Creates a retry wrapper function.

**Parameters:**
- `fn`: The async function to retry
- `options`: Configuration object (optional)
  - `maxAttempts` (number, default: 3): Maximum number of retry attempts
  - `delay` (number, default: 1000): Base delay in milliseconds
  - `backoff` ('exponential' | 'linear' | 'fixed', default: 'exponential'): Backoff strategy
  - `jitterConfig` (`JitterConfig` | `undefined`): Optional jitter strategy applied on top of the base dela
  - `onRetry` ((error: Error, attempt: number, waitTime: number) => void, optional): Callback called before each retry

**Returns:** A function that wraps the original function with retry logic

**TypeScript Types:**
```typescript
import type { RetryOptions, BackoffStrategy } from 'jitterbug';
```

### Jitter Configuration Options

- **`{ type: 'none' }`**  
  No jitter applied. Retries use the exact backoff delay.

- **`{ type: 'equal' }`**  
  Splits the delay into a fixed half and a random half. Produces predictable but desynchronized retry timing.

- **`{ type: 'full', min, max }`**  
  Picks a completely random delay between `min` and `max`. Best for aggressively spreading retries under heavy load.

- **`{ type: 'fixed', amount }`**  
  Subtracts a constant amount from the base delay (never below zero). Useful for consistent, predictable desynchronization.

- **`{ type: 'random', fraction }`**  
  Applies a symmetric ±fraction jitter around the base delay (e.g., `0.2` = ±20%). Light, centered randomness.

- **`{ type: 'decorrelated', maxDelay }`**  
  AWS‑style decorrelated jitter. Each retry picks a random delay between the base delay and 3× the previous jittered delay, capped at `maxDelay`.


## Test Coverage

![Coverage](https://img.shields.io/badge/coverage-91.15%25-brightgreen)

| Metric | Coverage |
|--------|----------|
| Statements | 91.15% |
| Branches | 93.55% |
| Functions | 90.91% |
| Lines | 91.15% |


## License

MIT

---

retry, retries, retry engine, retry logic, backoff, exponential backoff, linear backoff, fixed backoff, jitter, jitter strategies, decorrelated jitter, full jitter, equal jitter, random jitter, resilience, network utilities, API clients, distributed systems, TypeScript utilities

