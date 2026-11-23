import { useRef, useState, type PointerEvent } from 'react';
import { useEditor } from './context';
import { fontFamily } from './fonts';
import { LINE_HEIGHT, type InkItem, type Item, type TextItem } from './types';

export const toPath = (s: number[]) => (s.length === 2 ? `M${s[0]} ${s[1]}h0` : `M${s[0]} ${s[1]}L${s.slice(2).join(' ')}`);

function useItemDrag(item: Item) {
	const { tool, zoom, select, dispatch, startEditing } = useEditor();
	const [offset, setOffset] = useState<[number, number]>([0, 0]);
	const start = useRef<[number, number] | null>(null);

	const handlers = {
		onPointerDown(e: PointerEvent<Element>) {
			e.stopPropagation();
			if (tool === 'text' && item.kind === 'text') {
				e.preventDefault();
				return startEditing(item, false);
			}
			select(item.id);
			start.current = [e.clientX, e.clientY];
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		onPointerMove(e: PointerEvent<Element>) {
			if (start.current) setOffset([(e.clientX - start.current[0]) / zoom, (e.clientY - start.current[1]) / zoom]);
		},
		onPointerUp() {
			if (!start.current) return;
			start.current = null;
			if (offset[0] || offset[1]) {
				dispatch({ type: 'updateItem', id: item.id, patch: { x: item.x + offset[0], y: item.y + offset[1] } });
			}
			setOffset([0, 0]);
		},
	};

	return { x: item.x + offset[0], y: item.y + offset[1], handlers };
}

export function TextItemView({ item }: { item: TextItem }) {
	const { zoom, selectedId, startEditing } = useEditor();
	const { x, y, handlers } = useItemDrag(item);
	return (
		<div
			className={`item text${selectedId === item.id ? ' selected' : ''}`}
			style={{ left: x * zoom, top: y * zoom, fontSize: item.size * zoom, fontFamily: fontFamily(item.font), color: item.color }}
			onDoubleClick={() => startEditing(item, false)}
			{...handlers}
		>
			{item.text}
		</div>
	);
}

export function InkItemView({ item }: { item: InkItem }) {
	const { selectedId } = useEditor();
	const { x, y, handlers } = useItemDrag(item);
	const d = item.strokes.map(toPath).join(' ');
	const xs = item.strokes.flatMap((s) => s.filter((_, i) => i % 2 === 0));
	const ys = item.strokes.flatMap((s) => s.filter((_, i) => i % 2 === 1));
	const pad = item.width / 2 + 3;
	return (
		<g transform={`translate(${x} ${y})`} {...handlers}>
			{selectedId === item.id && (
				<rect
					className="ink-box"
					x={Math.min(...xs) - pad}
					y={Math.min(...ys) - pad}
					width={Math.max(...xs) - Math.min(...xs) + pad * 2}
					height={Math.max(...ys) - Math.min(...ys) + pad * 2}
				/>
			)}
			<path className="ink-hit" d={d} strokeWidth={Math.max(item.width, 10)} />
			<path className="ink" d={d} stroke={item.color} strokeWidth={item.width} />
		</g>
	);
}

let measureContext: CanvasRenderingContext2D | null = null;

function measure(text: string, px: number, family: string) {
	measureContext ??= document.createElement('canvas').getContext('2d')!;
	measureContext.font = `${px}px ${family}`;
	measureContext.fontKerning = 'none';
	return measureContext.measureText(text).width;
}

export function TextEditor({ item }: { item: TextItem }) {
	const { zoom, setEditingText, commitEditing } = useEditor();
	const lines = item.text.split('\n');
	const px = item.size * zoom;
	const family = fontFamily(item.font);
	return (
		<textarea
			className="text-editor"
			autoFocus
			spellCheck={false}
			value={item.text}
			style={{
				left: item.x * zoom,
				top: item.y * zoom,
				fontSize: px,
				fontFamily: family,
				color: item.color,
				width: Math.max(...lines.map((l) => measure(l, px, family))) + px,
				height: lines.length * px * LINE_HEIGHT,
			}}
			onChange={(e) => setEditingText(e.target.value)}
			onBlur={commitEditing}
			onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
			onPointerDown={(e) => e.stopPropagation()}
		/>
	);
}
