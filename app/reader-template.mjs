import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Both the Next home and the Pages share route use the release's asset URLs.
const html = readFileSync(join(process.cwd(), 'social/reader-shell.html'), 'utf8');

export const tagManager = html.match(/<script id="exile-gtm-bootstrap">([\s\S]*?)<\/script>/)[1];
export const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
export const title = html.match(/<title>(.*?)<\/title>/)[1];
export const description = html.match(/name="description"\s+content="([^"]+)"/)[1];
export const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)]
  .map(match => match[1]);
export const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)]
  .map(match => match[1]);
export const icon = html.match(/<link rel="icon"[^>]* href="([^"]+)"/)[1];
