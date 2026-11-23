import fontkit from '@pdf-lib/fontkit';
import {
	degrees,
	LineCapStyle,
	LineJoinStyle,
	lineTo,
	moveTo,
	PDFCheckBox,
	PDFDict,
	PDFDocument,
	PDFDropdown,
	PDFName,
	PDFObjectCopier,
	PDFOptionList,
	PDFRadioGroup,
	PDFRef,
	PDFTextField,
	popGraphicsState,
	pushGraphicsState,
	rgb,
	setLineCap,
	setLineJoin,
	setLineWidth,
	setStrokingColor,
	stroke,
	type PDFFont,
	type PDFForm,
	type PDFOperator,
	type PDFPage,
} from 'pdf-lib';
import type { PDFPageProxy } from 'pdfjs-dist';
import { fontOf, loadFont, verticalMetrics, type FontId } from './fonts';
import { LINE_HEIGHT, type Doc, type FieldValue, type InkItem, type Item, type Source, type TextItem } from './types';

type ToPdf = (x: number, y: number) => [number, number];
type EmbeddedFont = { font: PDFFont; ascent: number; descent: number };
type Fonts = Map<FontId, EmbeddedFont>;

const hasFields = (source: Source) => source.fields.some((f) => f.length > 0);

const toRgb = (hex: string) => rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);

// pdf-lib only writes widths for glyphs in the font's cmap, so substituted glyphs (ligatures, alternates) would get the
// 1000-unit default. Kerning is off too since drawText ignores it; the editor CSS matches both.
const embed = async (pdf: PDFDocument, id: FontId) =>
	pdf.embedFont(await loadFont(id), { features: { liga: false, clig: false, calt: false, kern: false } });

export async function exportPdf(doc: Doc, sources: Map<string, Source>) {
	const out = await PDFDocument.create();
	out.registerFontkit(fontkit);
	const fonts: Fonts = new Map();
	const fontIds = new Set(doc.items.flatMap((i) => (i.kind === 'text' ? [fontOf(i.font)] : [])));
	for (const id of fontIds) fonts.set(id, { font: await embed(out, id), ...(await verticalMetrics(id)) });

	const used = [...new Set(doc.pages.map((p) => p.sourceId))].map((id) => sources.get(id)!);
	const keepForms = used.filter(hasFields).length === 1;
	const copied = new Map<string, PDFPage>();
	let formDoc: PDFDocument | undefined;

	for (const source of used) {
		const src = await prepare(source, doc.fields, hasFields(source) && !keepForms);
		if (keepForms && hasFields(source)) formDoc = src;
		const entries = doc.pages.filter((p) => p.sourceId === source.id);
		const pages = await out.copyPages(src, entries.map((p) => p.index));
		pages.forEach((page, i) => copied.set(entries[i].id, page));
	}

	for (const entry of doc.pages) {
		const page = out.addPage(copied.get(entry.id)!);
		const items = doc.items.filter((i) => i.pageId === entry.id);
		if (items.length) drawItems(out, page, items, sources.get(entry.sourceId)!.pages[entry.index], fonts);
	}

	if (formDoc) registerFields(out, formDoc);
	return out.save({ updateFieldAppearances: false });
}

async function prepare(source: Source, values: Doc['fields'], flatten: boolean) {
	const pdf = await PDFDocument.load(source.bytes);
	const prefix = `${source.id}::`;
	const changed = Object.entries(values).filter(([key]) => key.startsWith(prefix));
	if (!changed.length && !flatten) return pdf;

	pdf.registerFontkit(fontkit);
	const form = pdf.getForm();
	for (const [key, value] of changed) setField(form, key.slice(prefix.length), value, source);
	form.updateFieldAppearances(await embed(pdf, 'sans'));
	if (flatten) form.flatten({ updateFieldAppearances: false });
	// Embedded fonts are only written out on save, so round-trip before copying pages that use one.
	return PDFDocument.load(await pdf.save({ updateFieldAppearances: false }));
}

function setField(form: PDFForm, name: string, value: FieldValue, source: Source) {
	const field = form.getFieldMaybe(name);
	const widget = source.fields.flat().find((w) => w.name === name);
	if (field instanceof PDFTextField) {
		if (widget) field.setFontSize(widget.fontSize);
		field.setText(String(value));
	} else if (field instanceof PDFCheckBox) value ? field.check() : field.uncheck();
	else if (field instanceof PDFRadioGroup) value === 'Off' ? field.clear() : field.select(String(value));
	else if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
		if (!value) return field.clear();
		field.select(widget?.options?.find((o) => o.value === value)?.label ?? String(value));
	}
}

function drawItems(out: PDFDocument, page: PDFPage, items: Item[], view: PDFPageProxy, fonts: Fonts) {
	const viewport = view.getViewport({ scale: 1 });
	const toPdf: ToPdf = (x, y) => viewport.convertToPdfPoint(x, y) as [number, number];
	const stream = (op: PDFOperator) => out.context.register(out.context.contentStream([op]));
	// Wrap the original content in q/Q so any graphics state it leaves behind can't distort our drawing.
	page.node.wrapContentStreams(stream(pushGraphicsState()), stream(popGraphicsState()));
	for (const item of items) {
		if (item.kind === 'text') drawText(page, item, fonts.get(fontOf(item.font))!, toPdf, viewport.rotation);
		else drawInk(page, item, toPdf);
	}
}

// Baseline from the browser's own metrics, so the text lands where the editor showed it.
function drawText(page: PDFPage, item: TextItem, { font, ascent, descent }: EmbeddedFont, toPdf: ToPdf, rotation: number) {
	const lineHeight = item.size * LINE_HEIGHT;
	const baseline = (lineHeight - (ascent + descent) * item.size) / 2 + ascent * item.size;
	item.text.split('\n').forEach((line, i) => {
		const [x, y] = toPdf(item.x, item.y + baseline + i * lineHeight);
		page.drawText(line, { x, y, size: item.size, font, color: toRgb(item.color), rotate: degrees(rotation) });
	});
}

function drawInk(page: PDFPage, item: InkItem, toPdf: ToPdf) {
	const path = item.strokes.flatMap((s) => {
		const points: [number, number][] = [];
		for (let i = 0; i < s.length; i += 2) points.push(toPdf(item.x + s[i], item.y + s[i + 1]));
		if (points.length === 1) points.push(points[0]);
		return points.map(([x, y], i) => (i ? lineTo(x, y) : moveTo(x, y)));
	});
	page.pushOperators(
		pushGraphicsState(),
		setStrokingColor(toRgb(item.color)),
		setLineWidth(item.width),
		setLineCap(LineCapStyle.Round),
		setLineJoin(LineJoinStyle.Round),
		...path,
		stroke(),
		popGraphicsState(),
	);
}

function registerFields(out: PDFDocument, src: PDFDocument) {
	const acroForm = out.catalog.getOrCreateAcroForm();
	const roots = new Set<PDFRef>();
	for (const page of out.getPages()) {
		const annots = page.node.Annots();
		if (!annots) continue;
		for (let i = 0; i < annots.size(); i++) {
			const annot = annots.get(i);
			const widget = out.context.lookup(annot);
			if (!(annot instanceof PDFRef) || !(widget instanceof PDFDict)) continue;
			if (widget.get(PDFName.of('Subtype')) !== PDFName.of('Widget')) continue;
			let ref = annot;
			let dict = widget;
			for (let parent = dict.get(PDFName.of('Parent')); parent instanceof PDFRef; parent = dict.get(PDFName.of('Parent'))) {
				ref = parent;
				dict = out.context.lookup(parent, PDFDict);
			}
			roots.add(ref);
		}
	}
	roots.forEach((ref) => acroForm.addField(ref));

	const copier = PDFObjectCopier.for(src.context, out.context);
	for (const key of ['DA', 'DR']) {
		const value = src.catalog.getAcroForm()?.dict.get(PDFName.of(key));
		if (value) acroForm.dict.set(PDFName.of(key), copier.copy(value));
	}
}
