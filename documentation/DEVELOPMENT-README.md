# jitterbug

Jitterbug is a lightweight library for building reliable retry behavior in distributed systems and API clients. This is documentation around development and how to get up and running

## Installation

```bash
npm install jitterbug
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

### Publishing

Publishing to npm is automated via GitHub Actions. To publish a new version:

```bash
# Choose one based on the type of change:
npm version patch  # Bug fixes: 0.1.0 -> 0.1.1
npm version minor  # New features: 0.1.0 -> 0.2.0
npm version major  # Breaking changes: 0.1.0 -> 1.0.0

# This automatically:
# - Updates package.json version
# - Builds the project (via version script)
# - Creates a git commit
# - Creates a git tag (v0.1.1, v0.2.0, etc.)

# Then push both the commit and tags:
git push && git push --tags
```

**Publishing alpha/beta versions:**

For pre-release versions (alpha, beta, rc):

```bash
# Create an alpha version
npm version prepatch --preid=alpha  # 0.1.0 -> 0.1.1-alpha.0
npm version preminor --preid=alpha  # 0.1.0 -> 0.2.0-alpha.0
npm version premajor --preid=alpha  # 0.1.0 -> 1.0.0-alpha.0

# Increment alpha version
npm version prerelease --preid=alpha  # 0.1.1-alpha.0 -> 0.1.1-alpha.1

# Push the commit and tag
git push && git push --tags
```

The CI/CD pipeline will automatically:
- Run all tests
- Build the project
- Verify version matches the tag
- Publish to npm (if tests pass)

**Note:** `NPM_TOKEN` secret needs to be setupas a GitHub secret with your npm access token.

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

## License

MIT
