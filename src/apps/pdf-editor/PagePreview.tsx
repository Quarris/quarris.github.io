import { useEditor } from './context';
import { usePageCanvas } from './usePageCanvas';
import type { PageEntry } from './types';

export function PagePreview({ page, width }: { page: PageEntry; width: number }) {
	const { sources } = useEditor();
	const canvasRef = usePageCanvas(sources.get(page.sourceId)!.pages[page.index], width / page.width);
	return (
		<div className="preview" style={{ aspectRatio: `${page.width} / ${page.height}` }}>
			<div className="canvas" ref={canvasRef} />
		</div>
	);
}
