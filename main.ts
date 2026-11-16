// makefun-frontend-01-entry-v5: copies app/ + screenshots/ to the output
// directory and writes dossier.json with the kit's buildDossier.
// Node 22 stdlib only. MAKEFUN_OUTPUT_DIR stands in for /output outside the grader.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16 * 1024 * 1024,
  app_path_max_bytes: 1000
};
function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyTree(join(root, 'app'), join(out, 'app'));
copyTree(join(root, 'screenshots'), join(out, 'screenshots'));
const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);
console.log('wrote ' + out + '/dossier.json (' + dossier.length + ' bytes)');
