// Persistência dos dados da biblioteca (livros, autores, coleções) no IndexedDB.
// O localStorage tem limite de ~5 MB e capas/transcrições estouram esse limite em bibliotecas grandes;
// aqui não há esse limite prático. O localStorage fica apenas como cópia rápida para a abertura do app.

const DB_NAME = 'audiobook_player_data';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDataDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

export async function readAppData(key: string): Promise<string | null> {
  const db = await openDataDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
    req.onerror = () => reject(req.error);
  });
}

export async function writeAppData(key: string, value: string): Promise<void> {
  const db = await openDataDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Grava a cópia rápida no localStorage; se não couber, remove a cópia antiga para ela não ser
// carregada (desatualizada) na próxima abertura — o IndexedDB continua com os dados completos.
export function writeLocalMirror(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    try { localStorage.removeItem(key); } catch {}
    return false;
  }
}
