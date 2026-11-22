import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The downloadable reader and the exported Next page share one HTML shell.
// Only local asset paths differ in the hosted build.
const html = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8');

export const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
  .replace(/\bsrc="([^":]+)"/g, 'src="./reader/$1"');
export const title = html.match(/<title>(.*?)<\/title>/)[1];
export const description = html.match(/name="description"\s+content="([^"]+)"/)[1];
export const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)]
  .map(match => './reader/' + match[1]);
export const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)]
  .map(match => './reader/' + match[1]);
