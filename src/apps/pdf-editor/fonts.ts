import sans from '@expo-google-fonts/noto-sans/400Regular/NotoSans_400Regular.ttf?url';
import serif from '@expo-google-fonts/noto-serif/400Regular/NotoSerif_400Regular.ttf?url';
import mono from '@expo-google-fonts/noto-sans-mono/400Regular/NotoSansMono_400Regular.ttf?url';
import handwriting from '@expo-google-fonts/caveat/400Regular/Caveat_400Regular.ttf?url';
import signature from '@expo-google-fonts/great-vibes/400Regular/GreatVibes_400Regular.ttf?url';
import signaturePen from '@expo-google-fonts/sacramento/400Regular/Sacramento_400Regular.ttf?url';
import signatureScrawl from '@expo-google-fonts/homemade-apple/400Regular/HomemadeApple_400Regular.ttf?url';

export const FONTS = {
	sans: { label: 'Sans', url: sans },
	serif: { label: 'Serif', url: serif },
	mono: { label: 'Mono', url: mono },
	handwriting: { label: 'Handwriting', url: handwriting },
	signature: { label: 'Signature (Formal)', url: signature },
	signaturePen: { label: 'Signature (Pen)', url: signaturePen },
	signatureScrawl: { label: 'Signature (Scrawl)', url: signatureScrawl },
};

export type FontId = keyof typeof FONTS;

export const fontOf = (id: FontId | undefined): FontId => (id && id in FONTS ? id : 'sans');

export const fontFamily = (id: FontId | undefined) => `PdfFont-${fontOf(id)}, sans-serif`;

export function registerFonts() {
	for (const [id, { url }] of Object.entries(FONTS)) document.fonts.add(new FontFace(`PdfFont-${id}`, `url(${url})`));
}

export async function verticalMetrics(id: FontId) {
	const font = `100px PdfFont-${id}`;
	await document.fonts.load(font);
	const context = document.createElement('canvas').getContext('2d')!;
	context.font = font;
	const { fontBoundingBoxAscent, fontBoundingBoxDescent } = context.measureText('');
	return { ascent: fontBoundingBoxAscent / 100, descent: fontBoundingBoxDescent / 100 };
}

const bytes = new Map<FontId, Promise<ArrayBuffer>>();

export function loadFont(id: FontId) {
	if (!bytes.has(id)) bytes.set(id, fetch(FONTS[id].url).then((r) => r.arrayBuffer()));
	return bytes.get(id)!;
}
