import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const from = `${root}node_modules/pdfjs-dist/`;
const to = `${root}public/pdfjs/`;

await rm(to, { recursive: true, force: true });
for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
	await cp(from + dir, to + dir, { recursive: true });
}
