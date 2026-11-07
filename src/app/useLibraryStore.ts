// Extraído do App.tsx (mesma ordem de antes: os efeitos rodam na mesma sequência)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audiobook, Author, registerDiscoveredGenres } from '../data/catalog';
import { loadAuthorsFromJson, loadBooksFromJson, safeLocalGet } from '../data/libraryData';
import { useShowExtraChapters } from '../audio/chapterPrefs';
import { writeAppData, writeLocalMirror } from '../data/appDataStore';

export function useLibraryStore() {
  const [books, setBooks] = useState<Audiobook[]>(() => loadBooksFromJson(safeLocalGet('app_books')));
  // Gêneros e subgêneros dos audiobooks que a lista não tem passam a existir (antes de desenhar as telas)
  useMemo(() => registerDiscoveredGenres(books), [books]);
  const showExtraChapters = useShowExtraChapters();
  const booksRef = useRef<Audiobook[]>(books);
  booksRef.current = books;
  const [authors, setAuthors] = useState<Author[]>(() => loadAuthorsFromJson(safeLocalGet('app_authors')));

  // Dados da biblioteca: o IndexedDB é a fonte de verdade; nada é gravado nele antes de ser lido
  // (senão uma cópia antiga do localStorage poderia sobrescrever os dados completos)
  const [isLibraryDataHydrated, setIsLibraryDataHydrated] = useState(false);
  const storageErrorShownRef = useRef(false);
  // Gravações agrupadas e adiadas: transformar a biblioteca/fila em texto e gravar no aparelho é pesado;
  // feito na hora (a cada mudança) travava a página por instantes e, no iPhone, chegava a cortar o áudio.
  // Cada chave guarda só o último valor e é gravada ~0,5 s depois, quando o aparelho estiver livre
  // (e na hora, se o app for fechado ou ficar em segundo plano).
  const pendingWritesRef = useRef(new Map<string, () => void>());
  const pendingTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const flushPendingWrites = useCallback(() => {
    pendingTimersRef.current.forEach(timer => clearTimeout(timer));
    pendingTimersRef.current.clear();
    const writes = Array.from(pendingWritesRef.current.values());
    pendingWritesRef.current.clear();
    writes.forEach(write => { try { write(); } catch {} });
  }, []);
  const scheduleWrite = useCallback((key: string, write: () => void) => {
    pendingWritesRef.current.set(key, write);
    const prev = pendingTimersRef.current.get(key);
    if (prev) clearTimeout(prev);
    pendingTimersRef.current.set(key, setTimeout(() => {
      pendingTimersRef.current.delete(key);
      const run = () => {
        const fn = pendingWritesRef.current.get(key);
        pendingWritesRef.current.delete(key);
        try { fn?.(); } catch {}
      };
      const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined;
      if (ric) ric(run, { timeout: 1500 }); else run();
    }, 500));
  }, []);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushPendingWrites(); };
    window.addEventListener('pagehide', flushPendingWrites);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flushPendingWrites);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flushPendingWrites]);

  const persistLibraryData = useCallback((key: string, value: unknown) => {
    scheduleWrite(key, () => {
      const json = JSON.stringify(value);
      writeLocalMirror(key, json);
      writeAppData(key, json).catch(() => {
        if (storageErrorShownRef.current) return;
        storageErrorShownRef.current = true;
        window.dispatchEvent(new CustomEvent('app-storage-error'));
      });
    });
  }, [scheduleWrite]);

  useEffect(() => {
    if (!isLibraryDataHydrated) return;
    persistLibraryData('app_books', books);
  }, [books, isLibraryDataHydrated, persistLibraryData]);

  useEffect(() => {
    if (!isLibraryDataHydrated) return;
    persistLibraryData('app_authors', authors);
  }, [authors, isLibraryDataHydrated, persistLibraryData]);
  return { authors, books, booksRef, isLibraryDataHydrated, persistLibraryData, scheduleWrite, setAuthors, setBooks, setIsLibraryDataHydrated, showExtraChapters };
}
