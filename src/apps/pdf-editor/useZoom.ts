import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { PageEntry } from './types';

export type ZoomMode = 'width' | 'height' | number;

export const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

const PADDING = 48;
const clamp = (zoom: number) => Math.min(5, Math.max(0.1, zoom));

export function useZoom(viewerRef: RefObject<HTMLElement | null>, pages: PageEntry[]) {
	const [mode, setMode] = useState<ZoomMode>('width');
	const [fitted, setFitted] = useState(1);
	const anchor = useRef<{ x: number; y: number; from: number } | null>(null);
	const zoom = typeof mode === 'number' ? mode : fitted;
	const widest = Math.max(0, ...pages.map((p) => p.width));
	const tallest = Math.max(0, ...pages.map((p) => p.height));

	useLayoutEffect(() => {
		const viewer = viewerRef.current;
		if (!viewer || !widest || typeof mode === 'number') return;
		const fit = () =>
			setFitted(clamp(mode === 'width' ? (viewer.clientWidth - PADDING) / widest : (viewer.clientHeight - PADDING) / tallest));
		const observer = new ResizeObserver(fit);
		observer.observe(viewer);
		return () => observer.disconnect();
	}, [mode, widest, tallest]);

	useLayoutEffect(() => {
		const viewer = viewerRef.current;
		const from = anchor.current;
		if (!viewer || !from) return;
		anchor.current = null;
		const k = zoom / from.from;
		viewer.scrollLeft = (viewer.scrollLeft + from.x) * k - from.x;
		viewer.scrollTop = (viewer.scrollTop + from.y) * k - from.y;
	}, [zoom]);

	const zoomTo = (next: number, x?: number, y?: number) => {
		const viewer = viewerRef.current;
		if (viewer) anchor.current = { x: x ?? viewer.clientWidth / 2, y: y ?? viewer.clientHeight / 2, from: zoom };
		setMode(clamp(next));
	};

	useEffect(() => {
		const viewer = viewerRef.current;
		if (!viewer) return;
		const onWheel = (e: WheelEvent) => {
			if (!e.ctrlKey && !e.metaKey) return;
			e.preventDefault();
			const rect = viewer.getBoundingClientRect();
			zoomTo(zoom * Math.exp(-e.deltaY * 0.002), e.clientX - rect.left, e.clientY - rect.top);
		};
		viewer.addEventListener('wheel', onWheel, { passive: false });
		return () => viewer.removeEventListener('wheel', onWheel);
	});

	return {
		zoom,
		mode,
		setMode,
		zoomTo,
		zoomIn: () => zoomTo(ZOOM_STEPS.find((s) => s > zoom + 0.001) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1]),
		zoomOut: () => zoomTo(ZOOM_STEPS.findLast((s) => s < zoom - 0.001) ?? ZOOM_STEPS[0]),
	};
}
