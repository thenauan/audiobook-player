// Extraído do App.tsx: lê do App, pelo contexto, só o que usa
import { MobileHeaderActions, type MobileHeaderAction } from './MobileHeaderActions';
import { ArrowUpDown, Bookmark, Code2, Edit3, FolderPlus, Info, ListPlus, Plus, Quote, RotateCcw, Share, Star, Trash2, Upload } from 'lucide-react';
import { Collection } from '../data/catalog';
import { useAppScope } from '../app/AppScope';
import { ImportRingIcon, useImportTitle } from './library/ImportProgress';

export function HeaderActions() {
  const { activeScreen, books, cleanupDeletedBooks, closeAllPopups, collections, favoriteAuthorIds, favoriteBookIds, fileInputRef, goBack, handleAddToQueue, handleDeleteCollection, handleExitDevMode, handleResetSettings, handleStartCreateCollection, handleStartEditAuthor, handleStartEditBook, handleStartEditCurrentCollection, isDevModeActive, navigateTo, openMobileSheet, openShareImage, openShareLyrics, renderSortOptions, selectedBook, setBooks, setIsSelectionMode, setSelectedCollectionIds, showToast, t, toggleFavoriteAuthor, toggleFavoriteBook } = useAppScope();
  const id = activeScreen.id;
  // Audiobooks sendo adicionados: o botão de enviar vira o progresso (abre a lista)
  const importTitle = useImportTitle();
  const sortAction: MobileHeaderAction = {
    id: 'sort', icon: <ArrowUpDown size={14} />, label: t('sort_by'),
    panelWidth: 228,
    panel: (
      <div className="flex flex-col p-1.5 pb-0 text-left rtl:text-right">
        <div className="px-3 pt-2 pb-1.5">
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('sort_by')}</h3>
        </div>
        {renderSortOptions(() => setTimeout(() => window.dispatchEvent(new Event('close-all-popups')), 250))}
        <div className="h-1.5" />
      </div>
    ),
  };
  if (id === 'book-detail') {
    const target = activeScreen.data || selectedBook;
    if (!target) return null;
    const isFav = favoriteBookIds.includes(target.id);
    return (
      <MobileHeaderActions
        quick={{ id: 'fav', icon: <Star size={15} className={isFav ? 'fill-yellow-400 text-yellow-400' : ''} />, label: isFav ? t('remove_from_favorites') : t('favorite'), onClick: () => toggleFavoriteBook(target.id) }}
        // Ordem do app (a 1ª opção da lista é a favoritar, o botão da esquerda da pílula): tocar a seguir e final da fila;
        // marcações; coleção; compartilhar; trecho; detalhes; editar; excluir
        menu={[
          { id: 'queue-next', icon: <ListPlus size={14} />, label: t('play_next'), onClick: () => handleAddToQueue(target, 'next') },
          { id: 'queue-last', icon: <ListPlus size={14} />, label: t('end_of_queue'), onClick: () => handleAddToQueue(target, 'last') },
          { id: 'all-bookmarks', icon: <Bookmark size={14} />, label: t('all_bookmarks'), onClick: () => openMobileSheet({ kind: 'book-bookmarks', bookId: target.id }) },
          { id: 'collection', icon: <FolderPlus size={14} />, label: t('add_to_collection'), onClick: () => openMobileSheet({ kind: 'collection-picker', itemType: 'book', itemId: target.id }) },
          { id: 'share', icon: <Share size={14} />, label: t('share_audiobook'), onClick: () => { openShareImage('book', books.find(b => b.id === target.id) || target); } },
          ...((books.find(b => b.id === target.id) || target).transcript?.length ? [{ id: 'share-lyrics', icon: <Quote size={14} />, label: t('share_excerpt'), onClick: () => openShareLyrics(books.find(b => b.id === target.id) || target) }] : []),
          { id: 'details', icon: <Info size={14} />, label: t('more_details'), onClick: () => { closeAllPopups(); navigateTo('book-info', target); } },
          { id: 'edit', icon: <Edit3 size={14} />, label: t('edit_audiobook'), onClick: () => handleStartEditBook() },
          {
            id: 'delete', icon: <Trash2 size={14} />, label: t('delete'), danger: true,
            confirm: {
              title: t('confirm_delete_single_book'),
              description: target.title,
              confirmLabel: t('delete'),
              onConfirm: () => {
                cleanupDeletedBooks([target.id]);
                setBooks(books.filter(b => b.id !== target.id));
                closeAllPopups();
                goBack();
                showToast(t('toast_book_deleted', { title: target.title }));
              },
            },
          },
        ]}
      />
    );
  }
  if (id === 'author-detail' && activeScreen.data?.id) {
    const authorId = activeScreen.data.id;
    const isFav = favoriteAuthorIds.includes(authorId);
    return (
      <MobileHeaderActions
        quick={{ id: 'fav', icon: <Star size={15} className={isFav ? 'fill-yellow-400 text-yellow-400' : ''} />, label: isFav ? t('remove_favorite_author') : t('favorite_author'), onClick: () => toggleFavoriteAuthor(authorId) }}
        menu={[
          { id: 'collection', icon: <FolderPlus size={14} />, label: t('add_to_collection'), onClick: () => openMobileSheet({ kind: 'collection-picker', itemType: 'author', itemId: authorId }) },
          { id: 'edit', icon: <Edit3 size={14} />, label: t('edit_author'), onClick: () => handleStartEditAuthor() },
          { id: 'delete-multiple', icon: <Trash2 size={14} />, label: t('delete_multiple'), danger: true, onClick: () => setIsSelectionMode(true) },
        ]}
      />
    );
  }
  if (id.startsWith('library-colecao-')) {
    const colId = id.replace('library-colecao-', '');
    const col = collections.find(c => c.id === colId) || (activeScreen.data as Collection | undefined);
    if (!col) return null;
    return (
      <MobileHeaderActions
        quick={{
          id: 'add-items', icon: <Plus size={15} />, label: t('add_to_collection'),
          onClick: () => openMobileSheet({ kind: 'collection-add-items', collectionId: col.id }),
        }}
        menu={[
          { id: 'edit', icon: <Edit3 size={14} />, label: t('edit_collection'), onClick: () => handleStartEditCurrentCollection(col) },
          sortAction,
          {
            id: 'delete', icon: <Trash2 size={14} />, label: t('delete_collection'), danger: true,
            confirm: {
              title: t('delete_collection'),
              description: t('delete_collections_confirm_desc'),
              confirmLabel: t('delete'),
              onConfirm: () => { closeAllPopups(); handleDeleteCollection(col.id); },
            },
          },
        ]}
      />
    );
  }
  if (id === 'library-colecoes') {
    return (
      <MobileHeaderActions
        quick={{ id: 'new', icon: <Plus size={15} />, label: t('add_collection'), onClick: () => handleStartCreateCollection() }}
        menu={[
          sortAction,
          ...(collections.length > 0 ? [{ id: 'delete', icon: <Trash2 size={14} />, label: t('delete_collections'), danger: true, onClick: () => { setIsSelectionMode(true); setSelectedCollectionIds([]); } }] : []),
        ]}
      />
    );
  }
  if (id === 'more' && isDevModeActive) {
    return (
      <MobileHeaderActions
        quick={{ id: 'exit-dev', icon: <Code2 size={18} className="text-amber-400" />, label: t('exit_dev_mode'), onClick: () => handleExitDevMode() }}
      />
    );
  }
  if (id.startsWith('settings') && id !== 'settings-option' && id !== 'settings-action') {
    return (
      <MobileHeaderActions
        quick={{
          id: 'reset', icon: <RotateCcw size={18} />, label: t('settings_reset'),
          confirm: {
            title: t('settings_reset_confirm_title'),
            description: t('settings_reset_confirm_desc'),
            confirmLabel: t('settings_reset_btn'),
            icon: <RotateCcw size={13} />,
            onConfirm: () => { handleResetSettings(); closeAllPopups(); },
          },
        }}
      />
    );
  }
  if ((id.startsWith('library') || id.startsWith('home-') || id === 'history') && (books.length > 0 || importTitle)) {
    const upload: MobileHeaderAction = { id: 'upload', icon: <Upload size={15} />, label: t('upload_audiobooks'), onClick: () => fileInputRef.current?.click() };
    if (importTitle) {
      return (
        <MobileHeaderActions
          quick={{ id: 'importing', icon: <ImportRingIcon />, menuIcon: <ImportRingIcon small />, label: importTitle, onClick: () => openMobileSheet({ kind: 'import-progress' }) }}
          menu={[
            { ...upload, icon: <Upload size={14} /> },
            sortAction,
            { id: 'delete-multiple', icon: <Trash2 size={14} />, label: t('delete_multiple'), danger: true, onClick: () => setIsSelectionMode(true) },
          ]}
        />
      );
    }
    return (
      <MobileHeaderActions
        // Botão da esquerda da pílula: enviar audiobooks (também é a primeira opção do pop-up)
        quick={{ id: 'upload', icon: <Upload size={15} />, label: t('upload_audiobooks'), onClick: () => fileInputRef.current?.click() }}
        menu={[
          sortAction,
          { id: 'delete-multiple', icon: <Trash2 size={14} />, label: t('delete_multiple'), danger: true, onClick: () => setIsSelectionMode(true) },
        ]}
      />
    );
  }
  return null;
}
