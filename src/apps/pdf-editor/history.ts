import type { Doc, FieldValue, InkItem, Item, PageEntry, TextItem } from './types';

export type Action =
	| { type: 'addPages'; pages: PageEntry[]; at?: number }
	| { type: 'movePage'; id: string; by: number }
	| { type: 'removePage'; id: string }
	| { type: 'addItem'; item: Item }
	| { type: 'updateItem'; id: string; patch: Partial<TextItem> | Partial<InkItem> }
	| { type: 'removeItem'; id: string }
	| { type: 'setField'; key: string; value: FieldValue }
	| { type: 'undo' }
	| { type: 'redo' }
	| { type: 'reset' }
	| { type: 'restore'; history: History };

export interface History {
	past: Doc[];
	present: Doc;
	future: Doc[];
}

export const initialHistory: History = { past: [], present: { pages: [], items: [], fields: {} }, future: [] };

function apply(doc: Doc, action: Action): Doc {
	switch (action.type) {
		case 'addPages': {
			const at = action.at ?? doc.pages.length;
			return { ...doc, pages: [...doc.pages.slice(0, at), ...action.pages, ...doc.pages.slice(at)] };
		}
		case 'movePage': {
			const from = doc.pages.findIndex((p) => p.id === action.id);
			const to = from + action.by;
			if (from < 0 || to < 0 || to >= doc.pages.length) return doc;
			const pages = [...doc.pages];
			pages.splice(to, 0, ...pages.splice(from, 1));
			return { ...doc, pages };
		}
		case 'removePage':
			return {
				...doc,
				pages: doc.pages.filter((p) => p.id !== action.id),
				items: doc.items.filter((i) => i.pageId !== action.id),
			};
		case 'addItem':
			return { ...doc, items: [...doc.items, action.item] };
		case 'updateItem':
			return { ...doc, items: doc.items.map((i) => (i.id === action.id ? ({ ...i, ...action.patch } as Item) : i)) };
		case 'removeItem':
			return { ...doc, items: doc.items.filter((i) => i.id !== action.id) };
		case 'setField':
			return { ...doc, fields: { ...doc.fields, [action.key]: action.value } };
		default:
			return doc;
	}
}

export function reducer(history: History, action: Action): History {
	const { past, present, future } = history;
	switch (action.type) {
		case 'undo':
			return past.length ? { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] } : history;
		case 'redo':
			return future.length ? { past: [...past, present], present: future[0], future: future.slice(1) } : history;
		case 'reset':
			return initialHistory;
		case 'restore':
			return action.history;
	}
	const next = apply(present, action);
	return next === present ? history : { past: [...past, present].slice(-200), present: next, future: [] };
}
