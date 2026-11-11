import { useSyncExternalStore } from 'react';

// Conteúdo explícito: o audiobook marcado como explícito (campo "explicit", guardado no próprio audiobook e no
// backup) e o ajuste "Bloquear conteúdo explícito" (Ajustes → Reprodução). Bloqueado, o audiobook explícito fica
// apagado nas listas e não toca.
const KEY = 'app_block_explicit';
const listeners = new Set<() => void>();
let blocked = (() => { try { return localStorage.getItem(KEY) === 'true'; } catch { return false; } })();

export const explicitBlock = {
  get: () => blocked,
  set(next: boolean) {
    blocked = next;
    try { localStorage.setItem(KEY, String(next)); } catch {}
    listeners.forEach(l => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

export function useExplicitBlocked(): boolean {
  return useSyncExternalStore(explicitBlock.subscribe, explicitBlock.get, explicitBlock.get);
}

export const isExplicit = (book: { explicit?: boolean } | null | undefined) => Boolean(book?.explicit);
// Este audiobook está bloqueado agora?
export const isExplicitBlocked = (book: { explicit?: boolean } | null | undefined) => blocked && isExplicit(book);

// Valor da chave "Conteúdo explícito" no editor de metadados, até salvar (cancelar descarta)
const editListeners = new Set<() => void>();
let editValue = false;
export const explicitEdit = {
  get: () => editValue,
  set(next: boolean) { editValue = next; editListeners.forEach(l => l()); },
  subscribe(listener: () => void) {
    editListeners.add(listener);
    return () => { editListeners.delete(listener); };
  },
};
export function useExplicitEdit(): boolean {
  return useSyncExternalStore(explicitEdit.subscribe, explicitEdit.get, explicitEdit.get);
}
