// ===== Destaque da letra (Ajustes › Reprodução) =====
// O que fica em destaque no player em tela cheia: a frase e a palavra lida, só a frase ou só a palavra.
// Letras sem tempo por palavra destacam a frase em qualquer opção.
import { useSyncExternalStore } from 'react';

export type LyricsHighlight = 'both' | 'phrase' | 'word';

const KEY = 'app_lyrics_highlight';
let value: LyricsHighlight = 'both';
try {
  const saved = localStorage.getItem(KEY);
  if (saved === 'phrase' || saved === 'word' || saved === 'both') value = saved;
} catch { /* sem armazenamento */ }
const listeners = new Set<() => void>();

export function setLyricsHighlight(next: LyricsHighlight) {
  if (next === value) return;
  value = next;
  try { localStorage.setItem(KEY, next); } catch { /* sem armazenamento */ }
  listeners.forEach(l => l());
}

export function useLyricsHighlight(): LyricsHighlight {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => value,
    () => value,
  );
}
