import { Minus, Plus } from 'lucide-react';
import { Menu } from './Menu';
import { ZOOM_STEPS, type useZoom } from './useZoom';

export function ZoomControl({ zoom, disabled }: { zoom: ReturnType<typeof useZoom>; disabled: boolean }) {
	return (
		<div className="zoom">
			<button className="icon" title="Zoom out" disabled={disabled} onClick={zoom.zoomOut}>
				<Minus size={16} />
			</button>
			<Menu
				label={`${Math.round(zoom.zoom * 100)}%`}
				align="right"
				disabled={disabled}
				items={[
					{ label: 'Fit width', checked: zoom.mode === 'width', onSelect: () => zoom.setMode('width') },
					{ label: 'Fit height', checked: zoom.mode === 'height', onSelect: () => zoom.setMode('height') },
					'separator',
					...ZOOM_STEPS.map((step) => ({ label: `${step * 100}%`, checked: zoom.mode === step, onSelect: () => zoom.zoomTo(step) })),
				]}
			/>
			<button className="icon" title="Zoom in" disabled={disabled} onClick={zoom.zoomIn}>
				<Plus size={16} />
			</button>
		</div>
	);
}
