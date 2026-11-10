import { useSyncExternalStore } from 'react';

// Capítulos tocados nesta sessão (até fechar o app), do mais antigo ao mais recente.
// Fica fora do App: registrar um capítulo não redesenha o app inteiro, só a fila que mostra a lista.
export interface PlayedChapter {
  key: string;
  bookId: string;
  chapterId: number;
  chapterTitle: string;
  bookTitle: string;
  author: string;
  cover?: string;
}

const MAX = 60;
let played: PlayedChapter[] = [];
const listeners = new Set<() => void>();

export const sessionHistory = {
  get: () => played,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  // Registra o capítulo que começou a tocar (repetir o último não duplica)
  record(entry: PlayedChapter) {
    if (played.length && played[played.length - 1].key === entry.key) return;
    played = [...played.filter(p => p.key !== entry.key), entry].slice(-MAX);
    listeners.forEach(l => l());
  },
};

export function useSessionHistory(): PlayedChapter[] {
  return useSyncExternalStore(sessionHistory.subscribe, sessionHistory.get, sessionHistory.get);
}
