import * as esbuild from 'esbuild';
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import path from 'path';

// Ensure dist directory exists
if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true });
}

// Copy static files like .env.example
if (existsSync('./.env.example')) {
  copyFileSync('./.env.example', './dist/.env.example');
}

// Copy any static HTML files or other assets
const staticFiles = readdirSync('./src', { withFileTypes: true })
  .filter(dirent => !dirent.isDirectory() && dirent.name.endsWith('.html'))
  .map(dirent => dirent.name);

for (const file of staticFiles) {
  copyFileSync(`./src/${file}`, `./dist/${file}`);
}

// Build with esbuild
await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node16',
  outdir: './dist',
  format: 'esm', // Change back to ESM
  sourcemap: true,
  // Make sure all problematic packages are external
  external: [
    // List external packages that shouldn't be bundled
    'express',
    'node-telegram-bot-api',
    'firebase-admin',
    'dotenv',
    'puppeteer',
    'axios',
    'winston',
    'winston-transport',
    // Add any packages that use dynamic require
    'chartjs-node-canvas',
    'chart.js',
    'canvas',
    'chartjs-plugin-datalabels',
    // Node built-ins
    'path',
    'fs',
    'os',
    'stream',
    'url',
    'util',
  ],
  // Add Node.js compatibility mode
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  resolveExtensions: ['.ts', '.js'],
  loader: {
    '.ts': 'ts'
  }
});

console.log('⚡ Build complete! ⚡');