import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};
const assets = {};
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + '/' + entry.name;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(path, name);
      continue;
    }
    const extension = extname(entry.name);
    if (!types[extension]) throw new Error('Unknown asset type ' + extension);
    const binary = ['.ttf', '.jpg', '.pdf'].includes(extension);
    assets[name] = [types[extension], binary, await readFile(path, binary ? 'base64' : 'utf8')];
  }
}
await collect('dist/client');
await mkdir('dist/server', { recursive: true });
const worker = (await readFile('worker/index.js', 'utf8')).split('\n').slice(2).join('\n');
const validation = (await readFile('server/validate.js', 'utf8')).replace('export function', 'function');
await writeFile('dist/server/index.js', 'const assets = ' + JSON.stringify(assets) + ';\n' + validation + '\n' + worker);