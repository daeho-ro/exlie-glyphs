import { cp, mkdir, readdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(project, 'dist');
const destination = join(project, 'public/reader');
await mkdir(destination, { recursive: true });
for (const entry of await readdir(source)) {
  if (entry === 'index.html') continue;
  await cp(join(source, entry), join(destination, entry), { recursive: true });
}
// Next renders the only public entry page. Remove an old copied entry if present.
await unlink(join(destination, 'index.html')).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
