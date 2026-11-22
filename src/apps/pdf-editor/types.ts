import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export const LINE_HEIGHT = 1.2;

export const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

export type Tool = 'select' | 'text' | 'draw';
export type FieldValue = string | boolean;

export interface FieldWidget {
	key: string;
	name: string;
	kind: 'text' | 'checkbox' | 'radio' | 'choice';
	x: number;
	y: number;
	width: number;
	height: number;
	readOnly: boolean;
	multiline: boolean;
	fontSize: number;
	maxLength?: number;
	onValue?: string;
	options?: { value: string; label: string }[];
	initial: FieldValue;
}

export interface Source {
	id: string;
	name: string;
	bytes: Uint8Array;
	pdf: PDFDocumentProxy;
	pages: PDFPageProxy[];
	fields: FieldWidget[][];
}

export interface PageEntry {
	id: string;
	sourceId: string;
	index: number;
	width: number;
	height: number;
}

interface ItemBase {
	id: string;
	pageId: string;
	x: number;
	y: number;
	color: string;
}

export interface TextItem extends ItemBase {
	kind: 'text';
	text: string;
	size: number;
}

export interface InkItem extends ItemBase {
	kind: 'ink';
	strokes: number[][];
	width: number;
}

export type Item = TextItem | InkItem;

export interface Doc {
	pages: PageEntry[];
	items: Item[];
	fields: Record<string, FieldValue>;
}
