import type { History } from './history';
import type { Source } from './types';

export interface Session {
	history: History;
	fileName: string;
}

type StoredSource = Pick<Source, 'id' | 'name' | 'bytes'>;

let connection: Promise<IDBDatabase> | undefined;

function db() {
	connection ??= new Promise((resolve, reject) => {
		const request = indexedDB.open('pdf-editor', 1);
		request.onupgradeneeded = () => {
			request.result.createObjectStore('sources', { keyPath: 'id' });
			request.result.createObjectStore('session');
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	return connection;
}

async function run<T>(store: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
	const request = action((await db()).transaction(store, mode).objectStore(store));
	return new Promise<T>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export const saveSource = ({ id, name, bytes }: StoredSource) => run('sources', 'readwrite', (s) => s.put({ id, name, bytes }));

export const saveSession = (session: Session) => run('session', 'readwrite', (s) => s.put(session, 'current'));

export async function loadSession() {
	const session = await run<Session | undefined>('session', 'readonly', (s) => s.get('current'));
	return session ? { session, sources: await run<StoredSource[]>('sources', 'readonly', (s) => s.getAll()) } : null;
}

export async function clearSession() {
	const tx = (await db()).transaction(['sources', 'session'], 'readwrite');
	tx.objectStore('sources').clear();
	tx.objectStore('session').clear();
}
