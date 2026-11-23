import { useEffect, useReducer, useRef, useState } from 'react';
import { EditorContext, type EditorApi, type Editing, type TextStyle } from './context';
import { canSaveToFolder, downloadImage, downloadImages, downloadPdf, downloadZip, pageDoc, saveImagesToFolder } from './download';
import { EditBar } from './EditBar';
import { registerFonts } from './fonts';
import { initialHistory, reducer } from './history';
import { Menu } from './Menu';
import { NameDialog } from './NameDialog';
import { PagePanel } from './PagePanel';
import { PagesPanel } from './PagesPanel';
import { PageView } from './PageView';
import { loadPdf, openSource } from './pdf';
import { clearSession, loadSession, saveSession, saveSource } from './session';
import type { Source, TextItem, Tool } from './types';
import { useZoom } from './useZoom';
import { ZoomControl } from './ZoomControl';
import './editor.css';

const TOOL_KEYS: Record<string, Tool> = { v: 'select', t: 'text', d: 'draw' };

type ExportKind = 'pdf' | 'zip' | 'individual';

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function PdfEditor() {
	const [history, dispatch] = useReducer(reducer, initialHistory);
	const doc = history.present;
	const sources = useRef(new Map<string, Source>()).current;
	const viewerRef = useRef<HTMLElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const pickTarget = useRef<number | 'replace' | undefined>(undefined);
	const editingRef = useRef<Editing | null>(null);
	const [tool, setTool] = useState<Tool>('select');
	const [selectedId, select] = useState<string | null>(null);
	const [editing, setEditing] = useState<Editing | null>(null);
	const [textStyle, setTextStyle] = useState<TextStyle>({ size: 14, color: '#111111', font: 'sans' });
	const [inkStyle, setInkStyle] = useState({ width: 2, color: '#1d4ed8' });
	const [activeInkId, setActiveInkId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fileName, setFileName] = useState('');
	const [pendingExport, setPendingExport] = useState<ExportKind | null>(null);
	const [restored, setRestored] = useState(false);
	const [currentPageId, setCurrentPageId] = useState<string | null>(null);
	const hasPages = doc.pages.length > 0;
	const zoom = useZoom(viewerRef, doc.pages);

	const updateEditing = (next: Editing | null) => {
		editingRef.current = next;
		setEditing(next);
	};

	const commitEditing = () => {
		const current = editingRef.current;
		if (!current) return;
		updateEditing(null);
		const { item, isNew } = current;
		const text = item.text.trimEnd();
		if (!text) {
			if (!isNew) dispatch({ type: 'removeItem', id: item.id });
			return select(null);
		}
		if (isNew) dispatch({ type: 'addItem', item: { ...item, text } });
		else if (text !== (doc.items.find((i) => i.id === item.id) as TextItem | undefined)?.text) dispatch({ type: 'updateItem', id: item.id, patch: { text } });
		select(item.id);
	};

	const startEditing = (item: TextItem, isNew: boolean) => {
		commitEditing();
		updateEditing({ item, isNew });
		select(isNew ? null : item.id);
	};

	const changeTool = (next: Tool) => {
		commitEditing();
		setActiveInkId(null);
		select(null);
		setTool(next);
	};


	useEffect(registerFonts, []);

	useEffect(() => {
		setBusy(true);
		loadSession()
			.then(async (saved) => {
				if (!saved) return;
				for (const s of saved.sources) sources.set(s.id, await openSource(s.id, s.name, s.bytes));
				dispatch({ type: 'restore', history: saved.session.history });
				setFileName(saved.session.fileName ?? '');
			})
			.catch(() => clearSession())
			.finally(() => {
				setBusy(false);
				setRestored(true);
			});
	}, []);

	useEffect(() => {
		if (!restored) return;
		const keep = history.past.length > 0 || hasPages;
		const timer = setTimeout(() => (keep ? saveSession({ history, fileName }) : clearSession()).catch(() => {}), 300);
		return () => clearTimeout(timer);
	}, [restored, history, fileName]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.target as Element).closest?.('textarea, select, input:not([type=checkbox]):not([type=radio])')) return;
			const key = e.key.toLowerCase();
			const selected = doc.items.find((i) => i.id === selectedId);
			const step = e.shiftKey ? 10 : 1;
			const nudge: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] };
			if (e.ctrlKey || e.metaKey) {
				if (key === 'z') dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
				else if (key === 'y') dispatch({ type: 'redo' });
				else return;
			} else if (selected && (key === 'delete' || key === 'backspace')) dispatch({ type: 'removeItem', id: selected.id });
			else if (selected && nudge[key]) {
				const [dx, dy] = nudge[key];
				dispatch({ type: 'updateItem', id: selected.id, patch: { x: selected.x + dx, y: selected.y + dy } });
			} else if (key === 'escape') {
				select(null);
				setActiveInkId(null);
			} else if (TOOL_KEYS[key]) changeTool(TOOL_KEYS[key]);
			else return;
			e.preventDefault();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	const open = async (files: File[], at?: number, fresh = !hasPages) => {
		setBusy(true);
		setError(null);
		let named = !fresh;
		for (const file of files) {
			try {
				const { source, pages } = await loadPdf(file);
				sources.set(source.id, source);
				saveSource(source).catch(() => {});
				dispatch({ type: 'addPages', pages, at });
				if (at !== undefined) at += pages.length;
				if (!named) setFileName(file.name.replace(/\.pdf$/i, ''));
				named = true;
			} catch (e) {
				setError(
					e instanceof Error && e.name === 'PasswordException'
						? `${file.name} is password-protected, which isn't supported.`
						: `Couldn't open ${file.name}: ${message(e)}`,
				);
			}
		}
		setBusy(false);
	};

	const reset = () => {
		if ((doc.items.length || Object.keys(doc.fields).length) && !confirm('Discard all pages and edits?')) return false;
		sources.forEach((s) => s.pdf.loadingTask.destroy());
		sources.clear();
		updateEditing(null);
		select(null);
		dispatch({ type: 'reset' });
		return true;
	};

	const pick = (target?: number | 'replace') => {
		pickTarget.current = target;
		fileInputRef.current!.click();
	};

	const onPicked = (files: File[]) => {
		const target = pickTarget.current;
		if (target !== 'replace') open(files, target);
		else if (!hasPages) open(files);
		else if (reset()) open(files, undefined, true);
	};

	const run = async (task: () => Promise<void>) => {
		setBusy(true);
		setError(null);
		try {
			await task();
		} catch (e) {
			if (!(e instanceof DOMException && e.name === 'AbortError')) setError(`Couldn't export: ${message(e)}`);
		}
		setBusy(false);
	};

	const exports: Record<ExportKind, { title: string; suffix: string; action: string; note?: string; save(name: string): Promise<void> }> = {
		pdf: { title: 'Download PDF', suffix: '.pdf', action: 'Download', save: (name) => downloadPdf(doc, sources, `${name}.pdf`) },
		zip: { title: 'Export images as zip', suffix: '.zip', action: 'Download', save: (name) => downloadZip(doc, sources, name) },
		individual: canSaveToFolder
			? {
					title: 'Export individual images',
					suffix: '-1.png …',
					action: 'Choose folder…',
					note: 'Files with the same names in that folder are replaced.',
					save: (name) => saveImagesToFolder(doc, sources, name),
				}
			: {
					title: 'Export individual images',
					suffix: '-1.png …',
					action: 'Download',
					note: `${doc.pages.length} images will be saved to your downloads folder.`,
					save: (name) => downloadImages(doc, sources, name),
				},
	};
	const pending = pendingExport && exports[pendingExport];

	const currentPage = doc.pages.find((p) => p.id === currentPageId) ?? doc.pages[0];
	const currentNumber = doc.pages.indexOf(currentPage) + 1;

	const onViewerScroll = () => {
		const viewer = viewerRef.current!;
		const middle = viewer.getBoundingClientRect().top + viewer.clientHeight / 2;
		const page = [...viewer.querySelectorAll<HTMLElement>('.page-wrap')].find((el) => el.getBoundingClientRect().bottom >= middle);
		if (page) setCurrentPageId(page.dataset.pageId!);
	};

	const api: EditorApi = {
		doc,
		dispatch,
		sources,
		tool,
		zoom: zoom.zoom,
		selectedId,
		select,
		editing,
		startEditing,
		setEditingText: (text) => updateEditing({ ...editingRef.current!, item: { ...editingRef.current!.item, text } }),
		commitEditing,
		textStyle,
		inkStyle,
		activeInkId,
		setActiveInkId,
	};

	return (
		<EditorContext value={api}>
			<div
				className="pdf-editor"
				onDragOver={(e) => e.preventDefault()}
				onDrop={(e) => {
					e.preventDefault();
					open([...e.dataTransfer.files]);
				}}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="application/pdf,.pdf"
					multiple
					hidden
					onChange={(e) => {
						onPicked([...(e.target.files ?? [])]);
						e.target.value = '';
					}}
				/>
				<header className="toolbar">
					<a className="home" href="/">
						Quarris
					</a>
					<Menu
						label="File"
						items={[
							{ label: 'New…', onSelect: () => pick('replace') },
							{ label: 'Add PDF…', disabled: !hasPages, onSelect: () => pick() },
							'separator',
							{ label: 'Download PDF…', disabled: !hasPages || busy, onSelect: () => setPendingExport('pdf') },
							{
								label: 'Export As Image',
								disabled: !hasPages || busy,
								items: [
									{ label: 'Zip…', onSelect: () => setPendingExport('zip') },
									{ label: 'Individual…', onSelect: () => setPendingExport('individual') },
								],
							},
						]}
					/>
					{pending && (
						<NameDialog
							{...pending}
							initialName={fileName}
							onClose={() => setPendingExport(null)}
							onConfirm={(name) => {
								setPendingExport(null);
								run(() => pending.save(name));
							}}
						/>
					)}
					<span className="divider" />
					<EditBar
						disabled={!hasPages}
						canUndo={history.past.length > 0}
						canRedo={history.future.length > 0}
						onTool={changeTool}
						setTextStyle={setTextStyle}
						setInkStyle={setInkStyle}
					/>
					<ZoomControl zoom={zoom} disabled={!hasPages} />
					{busy && <span className="status">Working…</span>}
				</header>

				{error && (
					<div className="error" role="alert">
						{error}
						<button onClick={() => setError(null)} aria-label="Dismiss">
							✕
						</button>
					</div>
				)}

				<div className="workspace">
					<PagesPanel currentId={currentPage?.id} onInsert={pick} onDropAt={open} />
					{hasPages ? (
						<>
							<main className="viewer" ref={viewerRef} onScroll={onViewerScroll}>
								{doc.pages.map((page, i) => (
									<PageView key={page.id} page={page} number={i + 1} />
								))}
							</main>
							<PagePanel
								page={currentPage}
								number={currentNumber}
								total={doc.pages.length}
								busy={busy}
								onExportPdf={() => run(() => downloadPdf(pageDoc(doc, currentPage), sources, `${fileName}-page-${currentNumber}.pdf`))}
								onExportImage={() => run(() => downloadImage(pageDoc(doc, currentPage), sources, `${fileName}-page-${currentNumber}.png`))}
							/>
						</>
					) : (
						restored && (
							<main className="empty">
								<h1>PDF Editor</h1>
								<button className="button primary" onClick={() => pick()}>
									Open PDF
								</button>
							</main>
						)
					)}
				</div>
			</div>
		</EditorContext>
	);
}
