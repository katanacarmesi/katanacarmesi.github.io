// Copia los archivos de la PWA a ./www (la carpeta que Capacitor empaqueta).
// El service worker no se copia: dentro de la app nativa no hace falta y no corre en capacitor://.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const files = ['index.html', 'manifest.webmanifest'];
const dirs = ['icons'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of files) {
  if (!existsSync(join(root, f))) throw new Error('Falta ' + f);
  cpSync(join(root, f), join(out, f));
}
for (const d of dirs) cpSync(join(root, d), join(out, d), { recursive: true });
console.log('www/ listo:', [...files, ...dirs.map(d => d + '/')].join(', '));
