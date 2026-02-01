# jitterbug

Jitterbug is a lightweight library for building reliable retry behavior in distributed systems and API clients.

## Installation

```bash
npm install jitterbug
```

## Usage

```javascript
import { retry } from 'jitterbug';

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

### `retry(fn, options)`

Creates a retry wrapper function.

**Parameters:**
- `fn`: The async function to retry
- `options`: Configuration object
  - `maxAttempts` (number, default: 3): Maximum number of retry attempts
  - `delay` (number, default: 1000): Base delay in milliseconds
  - `backoff` (string, default: 'exponential'): Backoff strategy ('exponential', 'linear', or 'fixed')
  - `onRetry` (function, optional): Callback called before each retry

**Returns:** A function that wraps the original function with retry logic

## Development

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
├── src/           # Source code
│   ├── retry.js   # Core retry implementation
│   └── index.js   # Main entry point
├── test/          # Test files
│   └── retry.test.js
├── index.js       # Package entry point
└── package.json
```

## License

MIT
