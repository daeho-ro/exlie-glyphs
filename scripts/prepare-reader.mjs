import './build-share-codes.mjs';
import { cp, mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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
await mkdir(destination, { recursive: true });
for (const entry of await readdir(source)) {
  if (entry === 'index.html') continue;
  await cp(join(source, entry), join(destination, entry), { recursive: true });
}
// Next renders the only public entry page. Remove an old copied entry if present.
await unlink(join(destination, 'index.html')).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
