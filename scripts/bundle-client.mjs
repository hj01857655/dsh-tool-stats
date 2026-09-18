/**
 * Bundle the browser half into the loader's lazy-CJS factory artifact.
 *
 * dsh's client module system loads `./client` exports as CJS factory bundles: the
 * artifact calls `window.__ModuleLoader__.load({ id, factory })` and resolves
 * externals (react here — a platform module-table row) through the injected
 * `require`. A plain ESM bundle loads without ever registering, which the loader
 * reports as "loaded without registering 'dsh-tool-stats' via __ModuleLoader__.load".
 *
 * @module scripts/bundle-client
 */

import { build } from 'esbuild'

await build({
  entryPoints: ['src/client/index.tsx'],
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  // Not lib/client.js: that name is the compiled host module (src/client.ts).
  // The browser artifact lives beside it under its own name.
  outfile: 'lib/stats.web.js',
  sourcemap: true,
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  banner: {
    // The intro vars belong between banner and body; esbuild has no separate
    // intro slot, so they ride the banner like the official artifacts print them.
    js: 'window.__ModuleLoader__.load({ id: "dsh-tool-stats", factory: (require) => {'
      + '\nvar module = { exports: {} }; var exports = module.exports;',
  },
  footer: { js: 'return module.exports; } });' },
  logLevel: 'info',
})
