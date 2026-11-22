import { Fragment, useState } from 'react';
import { scrollToPage, useEditor } from './context';
import { PagePreview } from './PagePreview';
import type { PageEntry } from './types';

const THUMB_WIDTH = 120;

interface SlotProps {
	onInsert(at: number): void;
	onDropAt(files: File[], at: number): void;
}

export function PagesPanel({ currentId, onInsert, onDropAt }: SlotProps & { currentId?: string }) {
	const { doc } = useEditor();
	if (!doc.pages.length) {
		return (
			<aside className="pages-panel">
				<p className="hint">No pages yet</p>
			</aside>
		);
	}
	const slot = (at: number) => <InsertSlot at={at} onInsert={onInsert} onDropAt={onDropAt} />;
	return (
		<aside className="pages-panel">
			{doc.pages.map((page, i) => (
				<Fragment key={page.id}>
					{slot(i)}
					<Thumb page={page} index={i} last={i === doc.pages.length - 1} current={page.id === currentId} />
				</Fragment>
			))}
			{slot(doc.pages.length)}
		</aside>
	);
}

function InsertSlot({ at, onInsert, onDropAt }: SlotProps & { at: number }) {
	const [over, setOver] = useState(false);
	return (
		<button
			className={`insert${over ? ' over' : ''}`}
			title="Insert PDF here"
			onClick={() => onInsert(at)}
			onDragOver={(e) => {
				e.preventDefault();
				setOver(true);
			}}
			onDragLeave={() => setOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setOver(false);
				onDropAt([...e.dataTransfer.files], at);
			}}
		>
			<svg viewBox="0 0 18 18" aria-hidden="true">
				<circle cx="9" cy="9" r="9" />
				<path d="M9 5v8M5 9h8" />
			</svg>
		</button>
	);
}

function Thumb({ page, index, last, current }: { page: PageEntry; index: number; last: boolean; current: boolean }) {
	const { sources, dispatch } = useEditor();
	return (
		<div className={`thumb${current ? ' current' : ''}`}>
			<button
				className="thumb-page"
				title={`${sources.get(page.sourceId)!.name} · page ${page.index + 1}`}
				onClick={() => scrollToPage(page.id)}
			>
				<PagePreview page={page} width={THUMB_WIDTH} />
			</button>
			<div className="thumb-bar">
				<span>{index + 1}</span>
				<button title="Move up" disabled={index === 0} onClick={() => dispatch({ type: 'movePage', id: page.id, by: -1 })}>
					↑
				</button>
				<button title="Move down" disabled={last} onClick={() => dispatch({ type: 'movePage', id: page.id, by: 1 })}>
					↓
				</button>
				<button title="Delete page" onClick={() => dispatch({ type: 'removePage', id: page.id })}>
					✕
				</button>
			</div>
		</div>
	);
}
