import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import {
  CollectionPickerPopupContent,
  CollectionsContext,
  useCollections,
} from '../App';
import { I18nContext, getTranslation } from '../translations';
import type { Collection } from '../data';

describe('Collections Interactivity & Popups', () => {
  const mockCollections: Collection[] = [
    {
      id: 'col-1',
      name: 'Ficção Clássica',
      description: 'Grandes obras atemporais',
      color: '#6366f1',
      gradient: 'from-indigo-600 to-purple-600',
      emoji: '📚',
      createdAt: 1000,
      bookIds: ['book-1'],
      authorIds: ['author-1'],
    },
    {
      id: 'col-2',
      name: 'Favoritos da Semana',
      description: 'Destaques recentes',
      color: '#ec4899',
      gradient: 'from-pink-600 to-rose-600',
      emoji: '⭐',
      createdAt: 2000,
      bookIds: [],
      authorIds: [],
    },
  ];

  const renderWithI18n = (ui: React.ReactNode) => {
    return renderToString(
      <I18nContext.Provider
        value={{
          language: 'pt',
          appLanguage: 'pt',
          setAppLanguage: vi.fn(),
          t: (k, params) => getTranslation('pt', k, params),
        }}
      >
        {ui}
      </I18nContext.Provider>
    );
  };

  it('renders collections with names, descriptions and appropriate action buttons', () => {
    const onToggle = vi.fn();
    const onClose = vi.fn();

    const html = renderWithI18n(
      <CollectionPickerPopupContent
        itemType="book"
        itemId="book-1"
        collections={mockCollections}
        onToggleItem={onToggle}
        onClose={onClose}
      />
    );

    expect(html).toContain('Ficção Clássica');
    expect(html).toContain('Grandes obras atemporais');
    expect(html).toContain('Favoritos da Semana');
    expect(html).toContain('Destaques recentes');
    // Book-1 is in col-1: row is highlighted (accent) with "remove" title
    expect(html).toContain('title="Remover da coleção"');
    expect(html).toContain('bg-winblue/15');
    // Book-1 is NOT in col-2: row offers adding, with Plus icon
    expect(html).toContain('title="Adicionar à coleção"');
    expect(html).toContain('lucide-plus');
  });

  it('renders back button only when onBack prop is provided (e.g. from sub-popup morph)', () => {
    const onToggle = vi.fn();
    const onClose = vi.fn();
    const onBack = vi.fn();

    const withBackHtml = renderWithI18n(
      <CollectionPickerPopupContent
        itemType="author"
        itemId="author-1"
        collections={mockCollections}
        onToggleItem={onToggle}
        onBack={onBack}
        onClose={onClose}
      />
    );

    const withoutBackHtml = renderWithI18n(
      <CollectionPickerPopupContent
        itemType="author"
        itemId="author-1"
        collections={mockCollections}
        onToggleItem={onToggle}
        onClose={onClose}
      />
    );

    // withBack has button with title "Mais opções" and ChevronLeft
    expect(withBackHtml).toContain('Mais opções');
    expect(withBackHtml).toContain('lucide-chevron-left');
    // withoutBack does not have the back button
    expect(withoutBackHtml).not.toContain('lucide-chevron-left');
  });

  it('correctly detects author membership in collections', () => {
    const onToggle = vi.fn();
    const onClose = vi.fn();

    // author-1 is in col-1, but not in col-2
    const htmlAuthor1 = renderWithI18n(
      <CollectionPickerPopupContent
        itemType="author"
        itemId="author-1"
        collections={mockCollections}
        onToggleItem={onToggle}
        onClose={onClose}
      />
    );
    expect(htmlAuthor1).toContain('title="Remover da coleção"');
    expect(htmlAuthor1).toContain('lucide-plus');

    // author-99 is not in any collection
    const htmlAuthor99 = renderWithI18n(
      <CollectionPickerPopupContent
        itemType="author"
        itemId="author-99"
        collections={mockCollections}
        onToggleItem={onToggle}
        onClose={onClose}
      />
    );
    expect(htmlAuthor99).not.toContain('title="Remover da coleção"');
  });

  it('renders empty state when no collections exist', () => {
    const onToggle = vi.fn();
    const onClose = vi.fn();

    const html = renderWithI18n(
      <CollectionPickerPopupContent
        itemType="book"
        itemId="book-1"
        collections={[]}
        onToggleItem={onToggle}
        onClose={onClose}
      />
    );

    expect(html).toContain('Nenhuma coleção criada ainda');
  });

  it('CollectionsContext provides collections and toggle handler to child consumers', () => {
    let contextValue: any = null;
    function Consumer() {
      contextValue = useCollections();
      return <div>{contextValue.collections.length}</div>;
    }

    const toggleHandler = vi.fn();

    const html = renderToString(
      <CollectionsContext.Provider
        value={{
          collections: mockCollections,
          onToggleItemInCollection: toggleHandler,
        }}
      >
        <Consumer />
      </CollectionsContext.Provider>
    );

    expect(html).toContain('2');
    expect(contextValue.collections).toHaveLength(2);
    expect(contextValue.onToggleItemInCollection).toBe(toggleHandler);
  });
});

