import { AnnotationMode, type PDFPageProxy } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';

export function usePageCanvas(page: PDFPageProxy, scale: number) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '600px' });
		observer.observe(ref.current!);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const host = ref.current!;
		if (!visible) {
			host.replaceChildren();
			return;
		}
		const viewport = page.getViewport({ scale: scale * Math.min(devicePixelRatio, 2) });
		const canvas = document.createElement('canvas');
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);
		const task = page.render({ canvas, viewport, annotationMode: AnnotationMode.ENABLE_FORMS });
		task.promise.then(() => host.replaceChildren(canvas), () => {});
		return () => task.cancel();
	}, [page, scale, visible]);

	return ref;
}
