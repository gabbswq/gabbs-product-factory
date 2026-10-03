import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(dir, 'dist');
fs.mkdirSync(output, { recursive: true });
await build({ entryPoints: [path.join(dir, 'web', 'app.js')], outfile: path.join(output, 'app.js'),
  bundle: true, minify: true, format: 'esm', target: ['es2022'], sourcemap: false });
for (const name of ['index.html', 'style.css']) fs.copyFileSync(path.join(dir, 'web', name), path.join(output, name));
const size = fs.statSync(path.join(output, 'app.js')).size;
if (size > 60000) throw new Error(`Bundle acima do limite: ${size} bytes.`);
console.log(`Tela compilada. JavaScript: ${size} bytes.`);
