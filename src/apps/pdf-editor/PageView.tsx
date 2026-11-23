import { useState, type PointerEvent } from 'react';
import { useEditor } from './context';
import { FieldLayer } from './Fields';
import { InkItemView, TextEditor, TextItemView, toPath } from './Items';
import { usePageCanvas } from './usePageCanvas';
import { LINE_HEIGHT, uid, type InkItem, type PageEntry } from './types';

export function PageView({ page, number }: { page: PageEntry; number: number }) {
	const editor = useEditor();
	const { doc, sources, zoom, tool, editing, inkStyle, activeInkId, dispatch, select } = editor;
	const source = sources.get(page.sourceId)!;
	const canvasRef = usePageCanvas(source.pages[page.index], zoom);
	const [live, setLive] = useState<number[] | null>(null);
	const items = doc.items.filter((i) => i.pageId === page.id);

	const point = (e: PointerEvent<HTMLElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		return [(e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom];
	};

	const onPointerDown = (e: PointerEvent<HTMLElement>) => {
		if (editing) {
			e.preventDefault();
			return editor.commitEditing();
		}
		if (tool === 'select') return select(null);
		const [x, y] = point(e);
		if (tool === 'text') {
			e.preventDefault();
			const { size } = editor.textStyle;
			const item = { id: uid(), kind: 'text' as const, pageId: page.id, x, y: y - (size * LINE_HEIGHT) / 2, text: '', ...editor.textStyle };
			return editor.startEditing(item, true);
		}
		e.currentTarget.setPointerCapture(e.pointerId);
		setLive([x, y]);
	};

	const onPointerMove = (e: PointerEvent<HTMLElement>) => {
		if (live) setLive([...live, ...point(e)]);
	};

	const onPointerUp = () => {
		if (!live) return;
		setLive(null);
		const ink = doc.items.find((i): i is InkItem => i.id === activeInkId && i.kind === 'ink' && i.pageId === page.id);
		if (ink) {
			const stroke = live.map((v, i) => v - (i % 2 ? ink.y : ink.x));
			return dispatch({ type: 'updateItem', id: ink.id, patch: { strokes: [...ink.strokes, stroke] } });
		}
		const id = uid();
		dispatch({ type: 'addItem', item: { id, kind: 'ink', pageId: page.id, x: 0, y: 0, strokes: [live], ...inkStyle } });
		editor.setActiveInkId(id);
		select(id);
	};

	return (
		<div className="page-wrap" id={`page-${page.id}`} data-page-id={page.id}>
			<div
				className={`page tool-${tool}`}
				style={{ width: page.width * zoom, height: page.height * zoom }}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
			>
				<div className="canvas" ref={canvasRef} />
				<FieldLayer widgets={source.fields[page.index]} />
				<svg className="ink-layer" viewBox={`0 0 ${page.width} ${page.height}`}>
					{items.map((i) => i.kind === 'ink' && <InkItemView key={i.id} item={i} />)}
					{live && <path className="ink" d={toPath(live)} stroke={inkStyle.color} strokeWidth={inkStyle.width} />}
				</svg>
				{items.map((i) => i.kind === 'text' && editing?.item.id !== i.id && <TextItemView key={i.id} item={i} />)}
				{editing?.item.pageId === page.id && <TextEditor item={editing.item} />}
			</div>
			<div className="page-number">{number}</div>
		</div>
	);
}
