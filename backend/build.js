import { build } from 'esbuild';
build({
  entryPoints: ['src/index.ts', 'server.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outdir: 'dist',
  format: 'esm'
}).catch(() => process.exit(1));
