// The player's files for each terminal mission, kept in IndexedDB so a reload
// or a trip to another mission doesn't lose their work. Each entry is the
// home folder and /srv as a base64 .tar.gz, usually a few kilobytes. Storage can be
// unavailable (private windows, blocked site data); then work simply lasts
// until the page closes.
const DB = "outpost-relay";
const STORE = "workspaces";

interface Workspace {
  home: string;
  at: string;
}

let opening: Promise<IDBDatabase | null> | null = null;

function database(): Promise<IDBDatabase | null> {
  opening ??= new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return opening;
}

async function transact<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const db = await database();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const request = act(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

export async function loadWorkspace(missionId: string): Promise<string | null> {
  const entry = await transact<Workspace | undefined>("readonly", (store) => store.get(missionId));
  return entry?.home ?? null;
}

export async function saveWorkspace(missionId: string, home: string): Promise<void> {
  await transact("readwrite", (store) => store.put({ home, at: new Date().toISOString() } satisfies Workspace, missionId));
}

export async function clearWorkspace(missionId: string): Promise<void> {
  await transact("readwrite", (store) => store.delete(missionId));
}
