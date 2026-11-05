// ===== Capítulos extras (Ajustes › Reprodução) =====
// Introdução, agradecimentos, créditos e afins podem ser ocultados da lista de capítulos. Ocultos, eles não
// contam para concluir o audiobook e não entram na fila ao adicionar o audiobook inteiro.
// Prólogo e epílogo fazem parte da história e continuam sendo capítulos.
import { useSyncExternalStore } from 'react';

const EXTRA_TITLE = new RegExp(
  '^(?:\\d+\\s*[-.:)]?\\s*)?(?:' + [
    'introducao', 'prefacio', 'apresentacao', 'prologo do (?:autor|tradutor|editor)', 'nota(?:s)? (?:d[oae]s? )?(?:autor|autora|tradutor|tradutora|editor|editora|edicao)',
    'agradecimentos?', 'dedicatoria', 'epigrafe', 'sumario', 'indice', 'creditos?', 'ficha (?:tecnica|catalografica)', 'direitos autorais',
    'sobre (?:o|a) (?:autor|autora|livro|obra|tradutor|tradutora|narrador|narradora)', 'bibliografia', 'referencias', 'glossario', 'apendices?', 'anexos?', 'posfacio',
    'introduction', 'foreword', 'preface', 'acknowledg?ments?', 'dedication', 'contents', 'table of contents', 'credits', 'copyright', 'about the (?:author|book|narrator)',
    'author.s note', 'translator.s note', 'bibliography', 'references', 'glossary', 'appendix', 'afterword',
    'introduccion', 'prologo del autor', 'agradecimientos', 'dedicatoria', 'indice', 'sobre el autor', 'nota del autor', 'apendice',
  ].join('|') + ')\\b',
  'i',
);

export function isExtraChapter(title?: string | null): boolean {
  const key = String(title || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return EXTRA_TITLE.test(key);
}

const KEY = 'app_show_extra_chapters';
let show = true;
try { show = localStorage.getItem(KEY) !== 'false'; } catch { /* sem armazenamento */ }
const listeners = new Set<() => void>();

export function setShowExtraChapters(value: boolean) {
  if (value === show) return;
  show = value;
  try { localStorage.setItem(KEY, String(value)); } catch { /* sem armazenamento */ }
  listeners.forEach(l => l());
}

export function useShowExtraChapters(): boolean {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => show,
    () => show,
  );
}

// Capítulos em exibição; um livro só com capítulos "extras" mostra todos
export function visibleChapters<T extends { title?: string }>(chapters: T[] | undefined, showExtras: boolean): T[] {
  const all = chapters || [];
  if (showExtras) return all;
  const kept = all.filter(c => !isExtraChapter(c.title));
  return kept.length > 0 ? kept : all;
}
