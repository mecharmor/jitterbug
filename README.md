# jitterbug

Jitterbug is a lightweight library for building reliable retry behavior in distributed systems and API clients.

![Build Status](https://github.com/mecharmor/jitterbug/actions/workflows/build.yml/badge.svg?branch=main)
![Tests](https://img.shields.io/github/actions/workflow/status/mecharmor/jitterbug/build.yml?branch=main&label=tests)
![Version](https://img.shields.io/npm/v/jitterbug?label=version)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

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
  backoff: 'exponential', // 'exponential', 'linear', or 'fixed'
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

## API

### `retry<T>(fn: T, options?: RetryOptions): T`

Creates a retry wrapper function.

**Parameters:**
- `fn`: The async function to retry
- `options`: Configuration object (optional)
  - `maxAttempts` (number, default: 3): Maximum number of retry attempts
  - `delay` (number, default: 1000): Base delay in milliseconds
  - `backoff` ('exponential' | 'linear' | 'fixed', default: 'exponential'): Backoff strategy
  - `onRetry` ((error: Error, attempt: number, waitTime: number) => void, optional): Callback called before each retry

**Returns:** A function that wraps the original function with retry logic

**TypeScript Types:**
```typescript
import type { RetryOptions, BackoffStrategy } from 'jitterbug';
```

## Test Coverage

![Coverage](https://img.shields.io/badge/coverage-100.00%25-brightgreen)

| Metric | Coverage |
|--------|----------|
| Statements | 100.00% |
| Branches | 95.00% |
| Functions | 100.00% |
| Lines | 100.00% |


## License

MIT
