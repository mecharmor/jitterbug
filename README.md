# jitterbug

Jitterbug is a lightweight library for building reliable retry behavior in distributed systems and API clients.

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

## Development

### Building

```bash
# Build the project
npm run build

# Build in watch mode
npm run dev

# Type check without building
npm run typecheck
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Project Structure

```
jitterbug/
├── src/              # TypeScript source code
│   ├── retry.ts      # Core retry implementation
│   └── index.ts      # Main entry point
├── dist/             # Built output (ESM + CJS + types)
├── test/             # Test files
│   └── retry.test.js
├── tsconfig.json     # TypeScript configuration
├── tsup.config.ts    # Build configuration
└── package.json
```

## Test Coverage

![Coverage](https://img.shields.io/badge/coverage-37.31%25-red)

| Metric | Coverage |
|--------|----------|
| Statements | 37.31% |
| Branches | 82.35% |
| Functions | 66.67% |
| Lines | 37.31% |


## License

MIT
