import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  // tsconfig keeps JSX as 'preserve' for Next; tests that render a page to
  // markup (lib/server/purchasePageRender.test.ts) need it compiled.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    // tests/** holds the SEO Stage 1a leak guards (test-only; see tests/README.md).
    include: ['lib/**/*.test.ts', 'content/**/*.test.ts', 'tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Vite's own built-in-module externalization list is generated from
    // Node's `module.builtinModules`, which does not yet include
    // `node:sqlite` (still experimental as of Node 22 — see
    // lib/server/db.ts). Without this, Vite tries to resolve "sqlite" as
    // an npm package and fails; this tells it to leave the import alone
    // and let Node's own runtime resolve it, exactly as it already does
    // for every other `node:`-prefixed import.
    server: {
      deps: {
        external: [/^(node:)?sqlite$/],
      },
    },
  },
});
