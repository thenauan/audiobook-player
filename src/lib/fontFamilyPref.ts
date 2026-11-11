import { useSyncExternalStore } from 'react';

// Fonte do app (Ajustes → Interface): a padrão do sistema ou uma serifada (a do próprio sistema: New York no
// iPhone e no Mac, Noto Serif no Android, Georgia no Windows). Fica marcada no <html> e o CSS troca a fonte.
export type FontFamilyPref = 'standard' | 'serif';
const KEY = 'app_font_family';
const listeners = new Set<() => void>();

function read(): FontFamilyPref {
  try { return localStorage.getItem(KEY) === 'serif' ? 'serif' : 'standard'; } catch { return 'standard'; }
}
let current: FontFamilyPref = read();

function apply() {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-font-family', current);
}
apply();

export const fontFamilyPref = {
  get: () => current,
  set(next: FontFamilyPref) {
    current = next;
    try { localStorage.setItem(KEY, next); } catch {}
    apply();
    listeners.forEach(l => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

export function useFontFamilyPref(): FontFamilyPref {
  return useSyncExternalStore(fontFamilyPref.subscribe, fontFamilyPref.get, fontFamilyPref.get);
}
