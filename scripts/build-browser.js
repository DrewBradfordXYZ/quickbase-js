#!/usr/bin/env node
/**
 * Build browser bundle using esbuild
 *
 * Outputs:
 * - dist/quickbase.min.js (minified IIFE, exposes global `QuickBase`)
 * - dist/quickbase.esm.js (ES module for modern bundlers)
 */

import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const banner = `/**
 * QuickBase JS SDK v${pkg.version}
 * ${pkg.homepage}
 * @license MIT
 */`;

// Shared options
const shared = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  target: ['es2020'],
  banner: { js: banner },
};

async function build() {
  // IIFE bundle for browsers (exposes global QuickBase)
  await esbuild.build({
    ...shared,
    outfile: 'dist/quickbase.min.js',
    format: 'iife',
    globalName: 'QuickBase',
    minify: true,
    platform: 'browser',
  });

  // ESM bundle for modern bundlers/browsers
  await esbuild.build({
    ...shared,
    outfile: 'dist/quickbase.esm.js',
    format: 'esm',
    minify: true,
    platform: 'browser',
  });

  console.log('Browser bundles built:');
  console.log('  dist/quickbase.min.js (IIFE, global: QuickBase)');
  console.log('  dist/quickbase.esm.js (ESM)');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
