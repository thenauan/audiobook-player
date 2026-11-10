import { useSyncExternalStore } from 'react';

// Audiobooks sendo adicionados: fica fora do App para que cada pedaço copiado não redesenhe o app inteiro.
// "progress" vai de 0 a 1 (bytes já gravados no aparelho); "canceled" sai da lista na hora.
export type ImportStatus = 'waiting' | 'loading' | 'done' | 'canceled';
export interface ImportItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: ImportStatus;
  // Lidos do arquivo assim que os metadados são processados (antes, a lista mostra o nome do arquivo)
  title?: string;
  author?: string;
  cover?: string;
}
interface ImportState {
  items: ImportItem[];
  confirmCancelAll: boolean;
}

let state: ImportState = { items: [], confirmCancelAll: false };
const listeners = new Set<() => void>();
let seq = 0;

const isActive = (i: ImportItem) => i.status === 'waiting' || i.status === 'loading';

function set(next: Partial<ImportState>) {
  state = { ...state, ...next };
  // Nada mais carregando: a confirmação de "cancelar todos" não faz mais sentido
  if (state.confirmCancelAll && !state.items.some(isActive)) state = { ...state, confirmCancelAll: false };
  listeners.forEach(l => l());
}

export const importStore = {
  get: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  // Registra os arquivos escolhidos (na fila) e devolve um id para cada um, na mesma ordem
  begin(files: File[]): string[] {
    const added = files.map(f => ({
      id: `import_${Date.now()}_${seq++}`,
      name: f.name.replace(/\.[^/.]+$/, '') || f.name,
      size: f.size,
      progress: 0,
      status: 'waiting' as const,
    }));
    set({ items: [...state.items, ...added] });
    return added.map(a => a.id);
  },
  update(id: string, patch: Partial<Pick<ImportItem, 'progress' | 'status' | 'title' | 'author' | 'cover'>>) {
    const cur = state.items.find(i => i.id === id);
    if (!cur || cur.status === 'canceled') return;
    if (patch.progress !== undefined && Object.keys(patch).length === 1 && Math.abs(patch.progress - cur.progress) < 0.005) return;
    set({ items: state.items.map(i => (i.id === id ? { ...i, ...patch } : i)) });
  },
  // Some da lista sem contar como cancelado (já estava na biblioteca, arquivo ilegível)
  remove(id: string) {
    set({ items: state.items.filter(i => i.id !== id) });
  },
  cancel(id: string) {
    const cur = state.items.find(i => i.id === id);
    if (!cur || !isActive(cur)) return;
    set({ items: state.items.map(i => (i.id === id ? { ...i, status: 'canceled' as const } : i)) });
  },
  cancelAll() {
    set({ items: state.items.map(i => (isActive(i) ? { ...i, status: 'canceled' as const } : i)), confirmCancelAll: false });
  },
  isCanceled: (id: string) => state.items.find(i => i.id === id)?.status === 'canceled',
  askCancelAll(open: boolean) {
    set({ confirmCancelAll: open && state.items.some(isActive) });
  },
  // Lote terminado: mostra o "concluído" por um instante e limpa
  finish(ids: string[]) {
    const done = new Set(ids);
    set({ items: state.items.filter(i => !(done.has(i.id) && i.status === 'canceled')) });
    setTimeout(() => set({ items: state.items.filter(i => !done.has(i.id)) }), 1400);
  },
};

export function useImportState(): ImportState {
  return useSyncExternalStore(importStore.subscribe, importStore.get, importStore.get);
}

// O que aparece na lista (os cancelados já saíram)
export const visibleImports = (items: ImportItem[]) => items.filter(i => i.status !== 'canceled');
export const activeImports = (items: ImportItem[]) => items.filter(isActive);

// Progresso geral pelo tamanho de cada arquivo (um livro de 500 MB pesa mais que um de 20 MB)
export function overallImportProgress(items: ImportItem[]): number {
  const list = visibleImports(items);
  const total = list.reduce((n, i) => n + Math.max(1, i.size), 0);
  if (!total) return 0;
  return list.reduce((n, i) => n + Math.max(1, i.size) * (i.status === 'done' ? 1 : i.progress), 0) / total;
}
