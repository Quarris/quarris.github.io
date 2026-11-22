import { createContext, useContext, type Dispatch } from 'react';
import type { Action } from './history';
import type { Doc, InkItem, Source, TextItem, Tool } from './types';

export type TextStyle = Pick<TextItem, 'size' | 'color'>;
export type InkStyle = Pick<InkItem, 'width' | 'color'>;

export interface Editing {
	item: TextItem;
	isNew: boolean;
}

export interface EditorApi {
	doc: Doc;
	dispatch: Dispatch<Action>;
	sources: Map<string, Source>;
	tool: Tool;
	zoom: number;
	selectedId: string | null;
	select(id: string | null): void;
	editing: Editing | null;
	startEditing(item: TextItem, isNew: boolean): void;
	setEditingText(text: string): void;
	commitEditing(): void;
	textStyle: TextStyle;
	inkStyle: InkStyle;
	activeInkId: string | null;
	setActiveInkId(id: string | null): void;
}

export const EditorContext = createContext<EditorApi | null>(null);

export const useEditor = () => useContext(EditorContext)!;

export const scrollToPage = (id: string) =>
	document.getElementById(`page-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
