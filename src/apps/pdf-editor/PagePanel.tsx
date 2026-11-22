import { FileDown, ImageDown } from 'lucide-react';
import { PagePreview } from './PagePreview';
import type { PageEntry } from './types';

interface Props {
	page: PageEntry;
	number: number;
	total: number;
	busy: boolean;
	onExportPdf(): void;
	onExportImage(): void;
}

export function PagePanel({ page, number, total, busy, onExportPdf, onExportImage }: Props) {
	return (
		<aside className="page-panel">
			<h2>
				Page {number} <span>of {total}</span>
			</h2>
			<PagePreview page={page} width={208} />
			<section>
				<h3>Export page</h3>
				<button className="button" disabled={busy} onClick={onExportPdf}>
					<FileDown size={16} />
					PDF
				</button>
				<button className="button" disabled={busy} onClick={onExportImage}>
					<ImageDown size={16} />
					Image
				</button>
			</section>
		</aside>
	);
}
