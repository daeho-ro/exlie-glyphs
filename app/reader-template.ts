import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Both the Next home and the Pages share route use the release's asset URLs.
const html = readFileSync(join(process.cwd(), 'social/reader-shell.html'), 'utf8');

function requiredPart(pattern: RegExp): string {
  const part = html.match(pattern)?.[1];
  if (!part) throw new Error('Missing reader shell content for ' + pattern.source);
  return part;
}

export const tagManager = requiredPart(/<script id="exile-gtm-bootstrap">([\s\S]*?)<\/script>/);
export const body = requiredPart(/<body>([\s\S]*?)<\/body>/);
export const title = requiredPart(/<title>(.*?)<\/title>/);
export const description = requiredPart(/name="description"\s+content="([^"]+)"/);
export const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)]
  .map(match => match[1]);
export const scripts = [...html.matchAll(/<script defer src="([^"]+)"/g)]
  .map(match => match[1]);
export const icon = requiredPart(/<link rel="icon"[^>]* href="([^"]+)"/);
