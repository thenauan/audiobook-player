import { IS_APPLE_TOUCH } from '../lib/desktopBridge';
// IndexedDB storage for local audiobook audio files
// Allows persisting user-loaded audio files across browser sessions without hitting localStorage size limits.

const DB_NAME = 'audiobook_player_storage';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
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
}

// Áudio grande é gravado em pedaços ("livro::part:0", "livro::part:1"...) com um índice na chave do livro.
// Assim dá para mostrar quanto já foi copiado e cancelar no meio. Áudios antigos (um Blob só) continuam valendo.
const PART = '::part:';
const CHUNK = 4 * 1024 * 1024;
interface ChunkIndex { __chunks: number; type: string; size: number }
const isChunkIndex = (v: unknown): v is ChunkIndex => !!v && typeof v === 'object' && !(v instanceof Blob) && typeof (v as ChunkIndex).__chunks === 'number';
const partKeys = (bookId: string, n: number) => Array.from({ length: n }, (_, i) => `${bookId}${PART}${i}`);

export class ImportCanceledError extends Error {
  constructor() { super('import canceled'); this.name = 'ImportCanceledError'; }
}

function runTx(db: IDBDatabase, mode: IDBTransactionMode, work: (store: IDBObjectStore) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    work(tx.objectStore(STORE_NAME));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function readKey(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Apaga a chave do livro e, se ela era um índice, os pedaços também
async function removeEntry(db: IDBDatabase, bookId: string, extraParts = 0) {
  const current = await readKey(db, bookId).catch(() => null);
  const n = Math.max(extraParts, isChunkIndex(current) ? current.__chunks : 0);
  await runTx(db, 'readwrite', store => { store.delete(bookId); partKeys(bookId, n).forEach(k => store.delete(k)); });
}

export async function storeAudioBlob(bookId: string, blob: Blob | File): Promise<void> {
  try {
    const db = await openAudioDB();
    const current = await readKey(db, bookId).catch(() => null);
    await runTx(db, 'readwrite', store => {
      if (isChunkIndex(current)) partKeys(bookId, current.__chunks).forEach(k => store.delete(k));
      store.put(blob, bookId);
    });
  } catch (err) {
    console.warn('Could not save audio blob to IndexedDB:', err);
  }
}

// Grava medindo: onProgress recebe de 0 a 1 a cada pedaço; isCanceled interrompe entre pedaços (e apaga o que já foi)
export async function storeAudioBlobChunked(
  bookId: string,
  file: Blob,
  onProgress?: (fraction: number) => void,
  isCanceled?: () => boolean,
): Promise<void> {
  if (file.size <= CHUNK) {
    if (isCanceled?.()) throw new ImportCanceledError();
    await storeAudioBlob(bookId, file);
    onProgress?.(1);
    return;
  }
  let db: IDBDatabase;
  try { db = await openAudioDB(); } catch (err) { console.warn('Could not save audio blob to IndexedDB:', err); return; }
  const n = Math.ceil(file.size / CHUNK);
  try {
    await removeEntry(db, bookId);
    for (let i = 0; i < n; i++) {
      if (isCanceled?.()) throw new ImportCanceledError();
      const part = file.slice(i * CHUNK, Math.min(file.size, (i + 1) * CHUNK), file.type);
      await runTx(db, 'readwrite', store => { store.put(part, `${bookId}${PART}${i}`); });
      onProgress?.((i + 1) / n);
    }
    if (isCanceled?.()) throw new ImportCanceledError();
    const index: ChunkIndex = { __chunks: n, type: file.type, size: file.size };
    await runTx(db, 'readwrite', store => { store.put(index, bookId); });
  } catch (err) {
    await removeEntry(db, bookId, n).catch(() => {});
    if (err instanceof ImportCanceledError) throw err;
    console.warn('Could not save audio blob to IndexedDB:', err);
  }
}

// Junta os pedaços num arquivo único guardado na chave do livro (e só depois apaga os pedaços). No iPhone/iPad o
// Safari pode não tocar um áudio montado de várias partes guardadas no aparelho: lá, o áudio sempre fica inteiro.
export async function consolidateAudioBlob(bookId: string): Promise<boolean> {
  try {
    const db = await openAudioDB();
    const value = await readKey(db, bookId);
    if (!isChunkIndex(value)) return false;
    const parts = await Promise.all(partKeys(bookId, value.__chunks).map(k => readKey(db, k)));
    if (parts.some(p => !(p instanceof Blob))) return false;
    const whole = new Blob(parts as Blob[], { type: value.type });
    await runTx(db, 'readwrite', store => { store.put(whole, bookId); });
    await runTx(db, 'readwrite', store => { partKeys(bookId, value.__chunks).forEach(k => store.delete(k)); });
    return true;
  } catch (err) {
    console.warn('Could not consolidate audio blob:', err);
    return false;
  }
}

export async function getAudioBlob(bookId: string): Promise<Blob | null> {
  try {
    const db = await openAudioDB();
    let value = await readKey(db, bookId);
    // iPhone/iPad: áudio gravado em pedaços vira um arquivo único antes de tocar
    if (isChunkIndex(value) && IS_APPLE_TOUCH && await consolidateAudioBlob(bookId)) value = await readKey(db, bookId);
    if (!isChunkIndex(value)) return (value as Blob) || null;
    // Gravado em pedaços: junta de novo (sem copiar os bytes, o Blob só aponta para eles)
    const parts = await new Promise<unknown[]>((resolve, reject) => {
      const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
      const out: unknown[] = [];
      let pending = value.__chunks;
      partKeys(bookId, value.__chunks).forEach((k, i) => {
        const req = store.get(k);
        req.onsuccess = () => { out[i] = req.result; if (--pending === 0) resolve(out); };
        req.onerror = () => reject(req.error);
      });
    });
    if (parts.some(p => !(p instanceof Blob))) return null;
    return new Blob(parts as Blob[], { type: value.type });
  } catch (err) {
    console.warn('Could not read audio blob from IndexedDB:', err);
    return null;
  }
}

export async function deleteAudioBlob(bookId: string): Promise<void> {
  try {
    const db = await openAudioDB();
    await removeEntry(db, bookId);
  } catch (err) {
    console.warn('Could not delete audio blob from IndexedDB:', err);
  }
}

export async function getAllAudioBlobKeys(): Promise<string[]> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(((req.result as string[]) || []).filter(k => !String(k).includes(PART)));
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

