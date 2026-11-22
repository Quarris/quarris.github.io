import { AnnotationType, getDocument, GlobalWorkerOptions, type PageViewport } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { uid, type FieldValue, type FieldWidget, type PageEntry, type Source } from './types';

GlobalWorkerOptions.workerSrc = workerUrl;

export async function loadPdf(file: File): Promise<{ source: Source; pages: PageEntry[] }> {
	const source = await openSource(uid(), file.name, new Uint8Array(await file.arrayBuffer()));
	const pages = source.pages.map((page, index) => {
		const { width, height } = page.getViewport({ scale: 1 });
		return { id: uid(), sourceId: source.id, index, width, height };
	});
	return { source, pages };
}

const loadDocument = (bytes: Uint8Array) =>
	getDocument({
		data: bytes.slice(),
		cMapUrl: '/pdfjs/cmaps/',
		standardFontDataUrl: '/pdfjs/standard_fonts/',
		wasmUrl: '/pdfjs/wasm/',
		iccUrl: '/pdfjs/iccs/',
	}).promise;

export async function renderImages(bytes: Uint8Array, scale = 2) {
	const pdf = await loadDocument(bytes);
	const images: Blob[] = [];
	for (let number = 1; number <= pdf.numPages; number++) {
		const page = await pdf.getPage(number);
		const viewport = page.getViewport({ scale });
		const canvas = document.createElement('canvas');
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);
		await page.render({ canvas, viewport }).promise;
		images.push(await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image encoding failed'))))));
	}
	await pdf.loadingTask.destroy();
	return images;
}

export async function openSource(id: string, name: string, bytes: Uint8Array): Promise<Source> {
	const pdf = await loadDocument(bytes);
	const source: Source = { id, name, bytes, pdf, pages: [], fields: [] };
	for (let number = 1; number <= pdf.numPages; number++) {
		const page = await pdf.getPage(number);
		source.pages.push(page);
		source.fields.push(toWidgets(await page.getAnnotations(), page.getViewport({ scale: 1 }), id));
	}
	return source;
}

function toWidgets(annotations: any[], viewport: PageViewport, sourceId: string): FieldWidget[] {
	return annotations.flatMap((a): FieldWidget[] => {
		if (a.annotationType !== AnnotationType.WIDGET || a.hidden || !a.fieldName) return [];
		const kind =
			a.fieldType === 'Tx' ? 'text'
			: a.fieldType === 'Ch' ? 'choice'
			: a.checkBox ? 'checkbox'
			: a.radioButton ? 'radio'
			: null;
		if (!kind) return [];
		const [x1, y1] = viewport.convertToViewportPoint(a.rect[0], a.rect[1]);
		const [x2, y2] = viewport.convertToViewportPoint(a.rect[2], a.rect[3]);
		const height = Math.abs(y2 - y1);
		return [
			{
				key: `${sourceId}::${a.fieldName}`,
				name: a.fieldName,
				kind,
				x: Math.min(x1, x2),
				y: Math.min(y1, y2),
				width: Math.abs(x2 - x1),
				height,
				readOnly: !!a.readOnly,
				multiline: !!a.multiLine,
				fontSize: fieldFontSize(a.defaultAppearanceData?.fontSize, height, !!a.multiLine),
				maxLength: a.maxLen || undefined,
				onValue: a.checkBox ? a.exportValue : a.buttonValue,
				options: a.options?.map((o: any) => ({ value: o.exportValue, label: o.displayValue })),
				initial: initialValue(a, kind),
			},
		];
	});
}

// PDFs size fields for their own fonts. pdf-lib centres single-line text on its ascent only,
// so cap the size to leave room for our font's descenders below.
function fieldFontSize(requested: number | undefined, height: number, multiline: boolean) {
	return Math.max(4, Math.min(requested || 12, multiline ? 12 : (height - 4) / 1.7));
}

function initialValue(a: any, kind: FieldWidget['kind']): FieldValue {
	const value = Array.isArray(a.fieldValue) ? a.fieldValue[0] : a.fieldValue;
	if (kind === 'checkbox') return value != null && value !== 'Off' && value === a.exportValue;
	return value ?? (kind === 'radio' ? 'Off' : '');
}
