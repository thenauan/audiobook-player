import { describe, it, expect, beforeEach } from 'vitest';

// IndexedDB mínimo em memória (só o que o audioStorage usa): pedidos e transações terminam de forma assíncrona
function installFakeIndexedDB() {
  const data = new Map<string, unknown>();
  const later = (fn: () => void) => setTimeout(fn, 0);
  const request = <T,>(compute: () => T) => {
    const req: any = { result: undefined, error: null };
    later(() => { req.result = compute(); req.onsuccess?.(); });
    return req;
  };
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => {},
    transaction: () => {
      const tx: any = { error: null };
      let pending = 0;
      const track = <T,>(compute: () => T) => {
        pending++;
        const req = request(() => { const r = compute(); if (--pending === 0) later(() => tx.oncomplete?.()); return r; });
        return req;
      };
      tx.objectStore = () => ({
        put: (v: unknown, k: string) => track(() => { data.set(k, v); return k; }),
        get: (k: string) => track(() => data.get(k)),
        delete: (k: string) => track(() => { data.delete(k); }),
        getAllKeys: () => track(() => [...data.keys()]),
      });
      // Transação sem pedidos também termina
      later(() => { if (pending === 0) tx.oncomplete?.(); });
      return tx;
    },
  };
  (globalThis as any).indexedDB = { open: () => request(() => db) };
  return data;
}

describe('áudio gravado em pedaços', () => {
  let data: Map<string, unknown>;
  beforeEach(() => { data = installFakeIndexedDB(); });

  it('grava em pedaços com progresso e lê de volta igual ao original', async () => {
    const { storeAudioBlobChunked, getAudioBlob, getAllAudioBlobKeys } = await import('../audio/audioStorage');
    const bytes = new Uint8Array(9 * 1024 * 1024); for (let i = 0; i < bytes.length; i += 4096) bytes[i] = (i / 4096) % 251;
    const file = new File([bytes], 'livro.m4b', { type: 'audio/mp4' });
    const steps: number[] = [];
    await storeAudioBlobChunked('b1', file, f => steps.push(f));
    expect(steps).toEqual([1 / 3, 2 / 3, 1]);
    expect(await getAllAudioBlobKeys()).toEqual(['b1']);
    const back = await getAudioBlob('b1');
    expect(back?.size).toBe(file.size);
    expect(back?.type).toBe('audio/mp4');
    expect(Buffer.from(await back!.arrayBuffer()).equals(Buffer.from(bytes))).toBe(true);
  });

  it('cancelar no meio não deixa nada guardado', async () => {
    const { storeAudioBlobChunked, ImportCanceledError } = await import('../audio/audioStorage');
    const file = new File([new Uint8Array(9 * 1024 * 1024)], 'livro.mp3');
    let n = 0;
    await expect(storeAudioBlobChunked('b2', file, () => { n++; }, () => n >= 1)).rejects.toBeInstanceOf(ImportCanceledError);
    expect([...data.keys()]).toEqual([]);
  });

  it('apagar remove os pedaços; áudio antigo (um arquivo só) continua sendo lido', async () => {
    const { storeAudioBlobChunked, storeAudioBlob, getAudioBlob, deleteAudioBlob } = await import('../audio/audioStorage');
    await storeAudioBlobChunked('b3', new File([new Uint8Array(5 * 1024 * 1024)], 'a.mp3'));
    expect(data.size).toBe(3);
    await deleteAudioBlob('b3');
    expect(data.size).toBe(0);
    await storeAudioBlob('old', new Blob(['abc'], { type: 'audio/mpeg' }));
    expect(await (await getAudioBlob('old'))!.text()).toBe('abc');
  });

  it('juntar os pedaços deixa um arquivo único igual ao original e apaga os pedaços', async () => {
    const { storeAudioBlobChunked, consolidateAudioBlob, getAudioBlob } = await import('../audio/audioStorage');
    const bytes = new Uint8Array(9 * 1024 * 1024); for (let i = 0; i < bytes.length; i += 4096) bytes[i] = (i / 4096) % 251;
    await storeAudioBlobChunked('b4', new File([bytes], 'x.m4b', { type: 'audio/mp4' }));
    expect(data.size).toBe(4);
    expect(await consolidateAudioBlob('b4')).toBe(true);
    expect([...data.keys()]).toEqual(['b4']);
    expect(data.get('b4')).toBeInstanceOf(Blob);
    const back = await getAudioBlob('b4');
    expect(back?.type).toBe('audio/mp4');
    expect(Buffer.from(await back!.arrayBuffer()).equals(Buffer.from(bytes))).toBe(true);
  });
});
