const DB_NAME = "dropbeat-cache";
const STORE = "lyrics";
const VERSION = 1;

export type LyricsCacheRecord = {
  id: string;
  plain: string;
  synced: string | null;
  updatedAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function getCachedLyrics(id: string): Promise<LyricsCacheRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as LyricsCacheRecord) ?? null);
  });
}

export async function setCachedLyrics(record: LyricsCacheRecord): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(STORE);
    store.put(record);
  });
}

export async function deleteCachedLyrics(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(STORE);
    store.delete(id);
  });
}
