import { zipSync } from 'fflate';
import { exportPdf } from './exportPdf';
import { renderImages } from './pdf';
import type { Doc, PageEntry, Source } from './types';

type Sources = Map<string, Source>;

interface DirectoryPicker {
	showDirectoryPicker(options: { mode: 'readwrite' }): Promise<FileSystemDirectoryHandle>;
}

export const canSaveToFolder = 'showDirectoryPicker' in window;

export const pageDoc = (doc: Doc, page: PageEntry): Doc => ({
	...doc,
	pages: [page],
	items: doc.items.filter((i) => i.pageId === page.id),
});

function saveBlob(blob: Blob, name: string) {
	const url = URL.createObjectURL(blob);
	Object.assign(document.createElement('a'), { href: url, download: name }).click();
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function namedImages(doc: Doc, sources: Sources, base: string) {
	const images = await renderImages(await exportPdf(doc, sources));
	const digits = String(images.length).length;
	return images.map((image, i) => ({ image, name: `${base}-${String(i + 1).padStart(digits, '0')}.png` }));
}

export async function downloadPdf(doc: Doc, sources: Sources, name: string) {
	saveBlob(new Blob([(await exportPdf(doc, sources)) as BlobPart], { type: 'application/pdf' }), name);
}

export async function downloadImage(doc: Doc, sources: Sources, name: string) {
	const [image] = await renderImages(await exportPdf(doc, sources));
	saveBlob(image, name);
}

export async function downloadZip(doc: Doc, sources: Sources, base: string) {
	const files = await namedImages(doc, sources, base);
	const entries = await Promise.all(files.map(async ({ image, name }) => [name, new Uint8Array(await image.arrayBuffer())] as const));
	saveBlob(new Blob([zipSync(Object.fromEntries(entries), { level: 0 }) as BlobPart], { type: 'application/zip' }), `${base}.zip`);
}

export async function downloadImages(doc: Doc, sources: Sources, base: string) {
	for (const { image, name } of await namedImages(doc, sources, base)) {
		saveBlob(image, name);
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
}

export async function saveImagesToFolder(doc: Doc, sources: Sources, base: string) {
	const folder = await (window as unknown as DirectoryPicker).showDirectoryPicker({ mode: 'readwrite' });
	for (const { image, name } of await namedImages(doc, sources, base)) {
		const writable = await (await folder.getFileHandle(name, { create: true })).createWritable();
		await writable.write(image);
		await writable.close();
	}
}
