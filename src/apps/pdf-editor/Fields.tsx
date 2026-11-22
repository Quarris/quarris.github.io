import type { PointerEvent } from 'react';
import { useEditor } from './context';
import type { FieldValue, FieldWidget } from './types';

export function FieldLayer({ widgets }: { widgets: FieldWidget[] }) {
	return widgets.map((w, i) => <Field key={`${w.key}-${i}`} widget={w} />);
}

function Field({ widget: w }: { widget: FieldWidget }) {
	const { doc, dispatch, zoom } = useEditor();
	const value = doc.fields[w.key] ?? w.initial;
	const set = (next: FieldValue) => next !== value && dispatch({ type: 'setField', key: w.key, value: next });
	const common = {
		className: `field field-${w.kind}`,
		title: w.name,
		disabled: w.readOnly,
		style: {
			left: w.x * zoom,
			top: w.y * zoom,
			width: w.width * zoom,
			height: w.height * zoom,
			fontSize: w.fontSize * zoom,
		},
		onPointerDown: (e: PointerEvent) => e.stopPropagation(),
	};

	switch (w.kind) {
		case 'checkbox':
			return <input {...common} type="checkbox" checked={value === true} onChange={(e) => set(e.target.checked)} />;
		case 'radio':
			return <input {...common} type="radio" checked={value === w.onValue} onChange={() => set(w.onValue!)} />;
		case 'choice':
			return (
				<select {...common} value={String(value)} onChange={(e) => set(e.target.value)}>
					{!w.options?.some((o) => o.value === value) && <option value={String(value)}>{String(value)}</option>}
					{w.options?.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
			);
		default: {
			const Input = w.multiline ? 'textarea' : 'input';
			return (
				<Input
					{...common}
					key={String(value)}
					defaultValue={String(value)}
					maxLength={w.maxLength}
					onBlur={(e) => set(e.target.value)}
				/>
			);
		}
	}
}
