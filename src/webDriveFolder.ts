// ===== Pasta do Google Drive no navegador do computador (Chrome/Edge) =====
// Com o Google Drive para computador instalado, o Drive vira uma pasta do sistema (ex.: G:\Meu Drive).
// No navegador, o usuário escolhe essa pasta uma vez (File System Access API); o acesso fica guardado no
// próprio navegador e, ao sincronizar, o app lê os áudios novos dela. O app instalado usa o Electron.

const DB_NAME = 'audiobook_player_web_folders';
const STORE = 'handles';
const KEY = 'gdrive-folder';
const AUDIO_EXT = /\.(mp3|m4a|m4b|mp4|aac|wav|flac|ogg|opus|wma|webm)$/i;

export const WEB_FOLDER_SUPPORTED = typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export async function getSavedWebFolder(): Promise<any | null> {
  try { return (await idb<any>('readonly', s => s.get(KEY))) || null; } catch { return null; }
}

// Escolhe a pasta (precisa ser chamado num clique) e guarda o acesso
export async function pickWebFolder(): Promise<any | null> {
  if (!WEB_FOLDER_SUPPORTED) return null;
  try {
    const handle = await (window as any).showDirectoryPicker({ id: 'gdrive-library', mode: 'read' });
    await idb('readwrite', s => s.put(handle, KEY));
    return handle;
  } catch {
    return null; // cancelado
  }
}

export async function forgetWebFolder(): Promise<void> {
  try { await idb('readwrite', s => s.delete(KEY)); } catch { /* nada guardado */ }
}

// Permissão de leitura (o navegador pede de novo a cada sessão; só pode perguntar dentro de um clique)
export async function ensureWebFolderPermission(handle: any, ask: boolean): Promise<boolean> {
  try {
    if ((await handle.queryPermission?.({ mode: 'read' })) === 'granted') return true;
    if (!ask) return false;
    return (await handle.requestPermission?.({ mode: 'read' })) === 'granted';
  } catch {
    return false;
  }
}

// Lista os áudios da pasta (com subpastas, até 4 níveis); os arquivos só são lidos quando pedidos
export async function listWebFolderAudio(handle: any): Promise<{ name: string; getFile: () => Promise<File> }[]> {
  const out: { name: string; getFile: () => Promise<File> }[] = [];
  const walk = async (dir: any, depth: number) => {
    for await (const entry of dir.values()) {
      if (entry.kind === 'directory') { if (depth < 4) await walk(entry, depth + 1); }
      else if (AUDIO_EXT.test(entry.name)) out.push({ name: entry.name, getFile: () => entry.getFile() });
    }
  };
  await walk(handle, 0);
  return out;
}
