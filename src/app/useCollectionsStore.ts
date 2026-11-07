// Extraído do App.tsx (mesma ordem de antes: os efeitos rodam na mesma sequência)
import { useEffect, useState } from 'react';
import { Collection, resolveGenreList } from '../data/catalog';
import { loadAuthorsFromJson, loadBooksFromJson, loadCollectionsFromJson, safeLocalGet } from '../data/libraryData';
import { readAppData } from '../data/appDataStore';
import type { Audiobook, Author } from '../data/catalog';

export function useCollectionsStore({ isLibraryDataHydrated, persistLibraryData, setAuthors, setBooks, setIsLibraryDataHydrated }: { isLibraryDataHydrated: boolean; persistLibraryData: (key: string, value: unknown) => void; setAuthors: React.Dispatch<React.SetStateAction<Author[]>>; setBooks: React.Dispatch<React.SetStateAction<Audiobook[]>>; setIsLibraryDataHydrated: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [collections, setCollections] = useState<Collection[]>(() => loadCollectionsFromJson(safeLocalGet('app_custom_collections')));

  // Biblioteca já importada: reorganiza gêneros e subgêneros pela classificação atual
  useEffect(() => {
    if (!isLibraryDataHydrated) return;
    setBooks(prev => {
      let changed = false;
      const next = prev.map(b => {
        const r = resolveGenreList(b.category, b.subgenre);
        if (r.category === b.category && r.subgenre === b.subgenre) return b;
        changed = true;
        return { ...b, category: r.category, subgenre: r.subgenre };
      });
      return changed ? next : prev;
    });
  }, [isLibraryDataHydrated]);

  useEffect(() => {
    if (!isLibraryDataHydrated) return;
    persistLibraryData('app_custom_collections', collections);
  }, [collections, isLibraryDataHydrated, persistLibraryData]);

  // Abertura: o app aparece com a cópia rápida do localStorage e, em seguida, carrega os dados completos
  // do IndexedDB (só atualiza o estado se forem diferentes, para não piscar)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [savedBooks, savedAuthors, savedCollections] = await Promise.all([
          readAppData('app_books'),
          readAppData('app_authors'),
          readAppData('app_custom_collections'),
        ]);
        if (cancelled) return;
        if (savedBooks !== null && savedBooks !== safeLocalGet('app_books')) setBooks(loadBooksFromJson(savedBooks));
        if (savedAuthors !== null && savedAuthors !== safeLocalGet('app_authors')) setAuthors(loadAuthorsFromJson(savedAuthors));
        if (savedCollections !== null && savedCollections !== safeLocalGet('app_custom_collections')) setCollections(loadCollectionsFromJson(savedCollections));
      } catch {}
      if (!cancelled) setIsLibraryDataHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);
  return { collections, setCollections };
}
