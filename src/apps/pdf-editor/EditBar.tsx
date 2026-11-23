import { MousePointer2, PenLine, Redo2, Trash, Type, Undo2, type LucideIcon } from 'lucide-react';
import { useEditor, type InkStyle, type TextStyle } from './context';
import { FONTS, fontFamily, fontOf, type FontId } from './fonts';
import type { Tool } from './types';

const TOOLS: { tool: Tool; label: string; key: string; Icon: LucideIcon }[] = [
	{ tool: 'select', label: 'Select', key: 'V', Icon: MousePointer2 },
	{ tool: 'text', label: 'Text', key: 'T', Icon: Type },
	{ tool: 'draw', label: 'Draw', key: 'D', Icon: PenLine },
];

interface Props {
	disabled: boolean;
	canUndo: boolean;
	canRedo: boolean;
	onTool(tool: Tool): void;
	setTextStyle(style: TextStyle): void;
	setInkStyle(style: InkStyle): void;
}

export function EditBar({ disabled, canUndo, canRedo, onTool, setTextStyle, setInkStyle }: Props) {
	const { doc, tool, selectedId, dispatch, textStyle, inkStyle } = useEditor();
	const selected = doc.items.find((i) => i.id === selectedId);
	const kind = selected?.kind ?? (tool === 'text' ? 'text' : tool === 'draw' ? 'ink' : null);
	const text = selected?.kind === 'text' ? selected : textStyle;
	const ink = selected?.kind === 'ink' ? selected : inkStyle;

	const updateText = (patch: Partial<TextStyle>) => {
		setTextStyle({ ...textStyle, ...patch });
		if (selected?.kind === 'text') dispatch({ type: 'updateItem', id: selected.id, patch });
	};
	const updateInk = (patch: Partial<InkStyle>) => {
		setInkStyle({ ...inkStyle, ...patch });
		if (selected?.kind === 'ink') dispatch({ type: 'updateItem', id: selected.id, patch });
	};

	return (
		<div className="edit-bar">
			<div className="segmented" role="group" aria-label="Tools">
				{TOOLS.map(({ tool: t, label, key, Icon }) => (
					<button
						key={t}
						className="tool"
						aria-pressed={tool === t}
						disabled={disabled}
						title={`${label} (${key})`}
						onClick={() => onTool(t)}
					>
						<Icon size={16} />
						{label}
					</button>
				))}
			</div>

			<span className="divider" />
			<button className="icon" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={() => dispatch({ type: 'undo' })}>
				<Undo2 size={16} />
			</button>
			<button className="icon" title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={() => dispatch({ type: 'redo' })}>
				<Redo2 size={16} />
			</button>

			{kind && (
				<>
					<span className="divider" />
					<label className="swatch" title="Colour" style={{ background: kind === 'text' ? text.color : ink.color }}>
						<input
							type="color"
							value={kind === 'text' ? text.color : ink.color}
							onChange={(e) => (kind === 'text' ? updateText : updateInk)({ color: e.target.value })}
						/>
					</label>
					{kind === 'text' ? (
						<>
							<select
								className="font-select"
								title="Font"
								value={fontOf(text.font)}
								style={{ fontFamily: fontFamily(text.font) }}
								onChange={(e) => updateText({ font: e.target.value as FontId })}
							>
								{Object.entries(FONTS).map(([id, { label }]) => (
									<option key={id} value={id} style={{ fontFamily: fontFamily(id as FontId) }}>
										{label}
									</option>
								))}
							</select>
							<label className="control" title="Font size">
								<input
									type="number"
									min={4}
									max={200}
									value={text.size}
									onChange={(e) => e.target.valueAsNumber > 0 && updateText({ size: e.target.valueAsNumber })}
								/>
								pt
							</label>
						</>
					) : (
						<label className="control" title="Line width">
							<input
								type="range"
								min={0.5}
								max={12}
								step={0.5}
								value={ink.width}
								onChange={(e) => updateInk({ width: e.target.valueAsNumber })}
							/>
							{ink.width} pt
						</label>
					)}
				</>
			)}

			{selected && (
				<>
					<span className="divider" />
					<button className="icon danger" title="Delete (Del)" onClick={() => dispatch({ type: 'removeItem', id: selected.id })}>
						<Trash size={16} />
					</button>
				</>
			)}
		</div>
	);
}
