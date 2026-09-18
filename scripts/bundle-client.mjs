import { build } from 'esbuild';
import { resolve } from 'node:path';

await build({
  entryPoints: [resolve('src/client/index.tsx')],
  bundle: true,
  outfile: resolve('lib/stats.web.js'),
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  external: ['react', 'react-dom'],
  logLevel: 'info',
});
console.log('Client bundle written');
