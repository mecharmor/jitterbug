import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // TypeScript support is built-in via esbuild
    // Vitest automatically transpiles .ts files on-the-fly
    // Tests can import from .ts source files directly
    typecheck: {
      tsconfig: './tsconfig.json',
      enabled: false // Set to true if you want to type-check test files themselves
    },
    // Only include test files, not source files
    include: ['test/**/*.{js,ts}'],
    exclude: ['node_modules', 'dist', 'src', 'scripts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '*.config.js',
        '*.config.ts',
        'dist/',
        'scripts/',
        'examples/',
        'documentation/',
        'src/**/index.ts'
      ]
    }
  }
});

