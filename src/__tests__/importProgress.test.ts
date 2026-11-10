import { describe, it, expect, vi } from 'vitest';
import { importStore, overallImportProgress, visibleImports, activeImports } from '../lib/importProgress';

const file = (name: string, size: number) => new File([new Uint8Array(size)], name);

describe('progresso ao adicionar audiobooks', () => {
  it('pesa o progresso geral pelo tamanho de cada arquivo', () => {
    const [a, b] = importStore.begin([file('Grande.m4b', 300), file('Pequeno.mp3', 100)]);
    importStore.update(a, { status: 'loading', progress: 0.5 });
    expect(overallImportProgress(importStore.get().items)).toBeCloseTo(150 / 400);
    importStore.update(b, { status: 'done', progress: 1 });
    expect(overallImportProgress(importStore.get().items)).toBeCloseTo(250 / 400);
    expect(visibleImports(importStore.get().items).map(i => i.name)).toEqual(['Grande', 'Pequeno']);
    importStore.cancelAll();
  });

  it('cancelar tira da lista e não volta com atualizações atrasadas', () => {
    const [a] = importStore.begin([file('Livro.mp3', 10)]);
    importStore.update(a, { status: 'loading', progress: 0.3 });
    importStore.cancel(a);
    expect(importStore.isCanceled(a)).toBe(true);
    importStore.update(a, { progress: 0.9 });
    expect(importStore.get().items.find(i => i.id === a)?.status).toBe('canceled');
    expect(visibleImports(importStore.get().items).some(i => i.id === a)).toBe(false);
  });

  it('a confirmação de cancelar todos só abre com algo carregando e fecha sozinha ao terminar', () => {
    vi.useFakeTimers();
    const ids = importStore.begin([file('Um.mp3', 10), file('Dois.mp3', 10)]);
    importStore.askCancelAll(true);
    expect(importStore.get().confirmCancelAll).toBe(true);
    ids.forEach(id => importStore.update(id, { status: 'done', progress: 1 }));
    expect(importStore.get().confirmCancelAll).toBe(false);
    importStore.askCancelAll(true);
    expect(importStore.get().confirmCancelAll).toBe(false);
    importStore.finish(ids);
    vi.advanceTimersByTime(1500);
    expect(activeImports(importStore.get().items)).toHaveLength(0);
    expect(importStore.get().items.some(i => ids.includes(i.id))).toBe(false);
    vi.useRealTimers();
  });
});
