import { execSync } from 'child_process';
import { rollup } from 'rollup';
import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import { rimrafSync } from 'rimraf';
import { copyFileSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

// Clean the dist folder
rimrafSync('dist');
rimrafSync('dist/temp-src');

// Step 1: Copy runtime-relevant files from src/ to dist/temp-src and remove .ts extensions
const srcDir = join(process.cwd(), 'src');
const tempSrcDir = join(process.cwd(), 'dist/temp-src');
const runtimeDirs = ['generated', 'generated-unified'];
const runtimeFiles = ['index.ts', 'quickbaseClient.ts', 'tokenCache.ts'];

function copyAndRewriteTsExtensions(src, dest) {
  console.log(`Copying from ${src} to ${dest}`);
  mkdirSync(dest, { recursive: true });
  const files = readdirSync(src, { withFileTypes: true });
  for (const file of files) {
    const srcPath = join(src, file.name);
    const destPath = join(dest, file.name);
    if (file.isDirectory()) {
      if (runtimeDirs.includes(file.name) || runtimeDirs.some(dir => src.includes(dir))) {
        copyAndRewriteTsExtensions(srcPath, destPath);
      } else {
        console.log(`Skipping non-runtime directory ${srcPath}`);
      }
    } else if (file.name.endsWith('.ts')) {
      if (runtimeFiles.includes(file.name) || src.includes('generated') || src.includes('generated-unified')) {
        console.log(`Processing ${srcPath} -> ${destPath}`);
        let content = readFileSync(srcPath, 'utf8');
        content = content.replace(/(from\s+["']\.[\w\/-]+)\.ts(["'])/g, '$1$2');
        content = content.replace(/(export\s+\*\s+from\s+["']\.[\w\/-]+)\.ts(["'])/g, '$1$2');
        writeFileSync(destPath, content, 'utf8');
      } else {
        console.log(`Skipping non-runtime file ${srcPath}`);
      }
    } else {
      console.log(`Skipping non-.ts file ${srcPath}`);
    }
  }
}
copyAndRewriteTsExtensions(srcDir, tempSrcDir);

// Step 2: Compile TypeScript to JavaScript with tsc
console.log('Running tsc...');
const tsFiles = readdirSync(tempSrcDir, { recursive: true })
  .filter(file => file.endsWith('.ts'))
  .map(file => join(tempSrcDir, file));
const tscCommand = `npx tsc ${tsFiles.join(' ')} --outDir ${join(process.cwd(), 'dist/temp')} --module ESNext --target ESNext --sourceMap --moduleResolution bundler --baseUrl ${process.cwd()}`;
console.log(`Command: ${tscCommand}`);
execSync(tscCommand, { stdio: 'inherit' });

// Step 3: Rollup configuration
const isProd = process.env.NODE_ENV === 'production';
const external = [
  'node:http', 'node:https', 'node:zlib', 'node:stream', 'node:buffer',
  'node:util', 'node:url', 'node:net', 'node:fs', 'node:path', 'node-fetch',
];
const globals = { 'node-fetch': 'fetch' };

// Function to create Rollup bundle
async function createBundle(input, plugins, format, outputOptions) {
  const bundle = await rollup({
    input,
    external,
    plugins,
  });
  await bundle.write(outputOptions);
  await bundle.close();
}

// ESM Builds
console.log('Building ESM bundles...');
// Unminified ESM build (always generated)
await createBundle(
  'dist/temp/quickbaseClient.js',
  [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
  ],
  'esm',
  {
    dir: 'dist/esm',
    format: 'esm',
    sourcemap: true,
    entryFileNames: 'quickbase.js',
  }
);

// Minified ESM build (only in production)
if (isProd) {
  await createBundle(
    'dist/temp/quickbaseClient.js',
    [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      terser(),
    ],
    'esm',
    {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      entryFileNames: 'quickbase.min.js',
    }
  );
}

// UMD Builds
console.log('Building UMD bundles...');
// Unminified UMD build (always generated)
await createBundle(
  'dist/temp/quickbaseClient.js',
  [
    nodeResolve({ preferBuiltins: true, browser: true }),
    commonjs(),
  ],
  'umd',
  {
    file: join(process.cwd(), 'dist/umd', 'quickbase.umd.js'),
    format: 'umd',
    name: 'QuickbaseJS',
    sourcemap: true,
    globals,
  }
);

// Minified UMD build (only in production)
if (isProd) {
  await createBundle(
    'dist/temp/quickbaseClient.js',
    [
      nodeResolve({ preferBuiltins: true, browser: true }),
      commonjs(),
      terser(),
    ],
    'umd',
    {
      file: join(process.cwd(), 'dist/umd', 'quickbase.umd.min.js'),
      format: 'umd',
      name: 'QuickbaseJS',
      sourcemap: true,
      globals,
    }
  );
}

// Declarations
console.log('Generating declarations...');
const dtsBundle = await rollup({
  input: 'src/quickbaseClient.ts',
  plugins: [dts({ tsconfig: './tsconfig.json', respectExternal: true })],
});
await dtsBundle.write({ file: 'dist/esm/quickbase.d.ts', format: 'esm' });
await dtsBundle.write({ file: 'dist/umd/quickbase.umd.d.ts', format: 'umd' });
await dtsBundle.close();

// Clean up
rimrafSync('dist/temp');
rimrafSync('dist/temp-src');

// List generated files and their sizes
console.log('\nGenerated files:');
function listFilesWithSizes(dir, prefix = '') {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = join(dir, file.name);
    if (file.isDirectory()) {
      listFilesWithSizes(filePath, `${prefix}${file.name}/`);
    } else {
      const stats = statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`${prefix}${file.name} - ${sizeKB} KB`);
    }
  }
}
listFilesWithSizes(join(process.cwd(), 'dist'));

console.log('\nBuild completed successfully');