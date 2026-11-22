import './build-share-codes.mjs';
import { cp, mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(project, 'dist');
const destination = join(project, 'public/reader');
// The inline mark is also used when saving a card from a local HTML file.
const shell = await readFile(join(source, 'index.html'), 'utf8');
const mark = shell.match(/<svg id="brand-symbol"[^>]*>[\s\S]*?<\/svg>/)?.[0];
if (!mark) throw new Error('The reader header is missing its brand symbol.');
const indent = mark.split('\n').at(-1).match(/^[ \t]*/)[0];
const favicon = mark.split('\n').map(line => line.startsWith(indent) ? line.slice(indent.length) : line).join('\n') + '\n';
const iconPath = join(source, 'assets', 'inscription.svg');
await writeFile(iconPath, favicon);
// The interactive reader is a collection of classic scripts, including an
// interdependent link codec and app. Give each release fresh browser cache keys.
const hash = createHash('sha256');
const files = (await readdir(source, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => relative(source, join(entry.parentPath, entry.name)))
  .sort();
for (const file of files) {
  const data = await readFile(join(source, file));
  hash.update(JSON.stringify([file, data.length])).update(data);
}
const version = hash.digest('hex').slice(0, 16);
const hostedShell = shell.replace(/(<(?:script|img|link)\b[^>]*?\s(?:src|href)=")([^"]+)"/g,
  (tag, start, url) => /^(?:[a-z]+:|[/?#])/i.test(url) ? tag : start + '/reader/' + url + '?v=' + version + '"');
await writeFile(join(project, 'social/reader-shell.html'), hostedShell);
await mkdir(destination, { recursive: true });
for (const entry of await readdir(source)) {
  if (entry === 'index.html') continue;
  await cp(join(source, entry), join(destination, entry), { recursive: true });
}
// Next renders the only public entry page. Remove an old copied entry if present.
await unlink(join(destination, 'index.html')).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
