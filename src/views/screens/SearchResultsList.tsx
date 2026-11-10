// Extraído do App.tsx: lê do App, pelo contexto, só o que usa
import { AnimatePresence, motion } from 'motion/react';
import { MenuOptionItem, PagedMenu, PopupMorphContainer, clearButtonCoverAnchorCache, getButtonCoverPopupStyle, morphTriggerAnimate } from '../../components/popups/Popovers';
import { getAuthorAvatar, getEffectiveAuthorAvatar, getGenericBookCover } from '../../lib/coverArt';
import { getGenreName, getSubgenreName } from '../../i18n/genreTranslations';
import { BookOpen, Bookmark, CheckCircle2, FolderOpen, FolderPlus, Headphones, ListMusic, ListPlus, MoreHorizontal, Play, Star, StarOff, Trash2, User, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getBackdropProps } from '../../components/popups/popupUtils';
import { CollectionPickerPopupContent } from '../../components/library/LibraryCards';
import { EmojiIcon } from '../../components/EmojiIcon';
import { getNationalityDisplayName } from '../../i18n/nationalityTranslations';
import { bookHasAuthor } from '../../lib/authorUtils';
import { useAppScope } from '../../app/AppScope';

export function SearchResultsList() {
  const { activeSearchMenuId, addToSearchHistory, books, closeAllPopups, collections, computedSearchResults, confirmDeleteSearchId, favoriteAuthorIds, favoriteBookIds, handleAddBookToQueue, handleBookCoverError, handleDeleteBook, handlePlayBookFromStart, handleSelectAuthor, handleSelectSearchItem, handleToggleItemInCollection, isBookCompleted, isBookStarted, isMobile, navigateTo, resolvedLanguage, searchCollectionTarget, searchLongPressProps, searchMenuAnchor, searchQuery, searchSelectedIndex, setActiveSearchMenuId, setConfirmDeleteSearchId, setMobileConfirm, setSearchCollectionTarget, setSearchMenuAnchor, setSearchQuery, setSearchSelectedIndex, showToast, t, toggleFavoriteAuthor, toggleFavoriteBook } = useAppScope();
  if (computedSearchResults.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <p className="text-xs text-[var(--text-muted)]">{t('search_no_results', { query: searchQuery })}</p>
      </div>
    );
  }
  return computedSearchResults.map((item, index) => {
    const isMenuOpen = activeSearchMenuId === item.id;
    const isSelected = searchSelectedIndex === index;

    // A. AUDIOBOOK
    if (item.type === 'book' && item.book) {
      const book = item.book;
      const isFav = favoriteBookIds.includes(book.id);
      return (
        <motion.div 
          key={item.id} 
          id={`search-result-item-${index}`}
          onMouseEnter={() => setSearchSelectedIndex(index)}
          data-popup-option="true"
          {...searchLongPressProps(item.id)}
          onClick={() => handleSelectSearchItem(item)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const btn = (e.currentTarget.querySelector('button') as HTMLElement) || e.currentTarget;
            closeAllPopups();
            clearButtonCoverAnchorCache(btn);
            setSearchMenuAnchor(btn);
            setActiveSearchMenuId(item.id);
          }}
          className={`group/searchitem relative flex items-center gap-3.5 py-2.5 pl-2.5 pr-[18px] rtl:pl-[18px] rtl:pr-2.5 rounded-3xl cursor-pointer transition-all ${
            isSelected 
              ? 'bg-[var(--button-secondary-bg)]/50 shadow-sm' 
              : ' hover:bg-[var(--button-secondary-bg)]/50'
          } ${
            isMenuOpen ? 'z-30' : 'z-10'
          }`}
        >
          <div 
            className="relative h-12 aspect-[1/1.6] shrink-0 rounded-[14px] max-md:rounded-lg overflow-hidden shadow-sm"
            onClick={() => { 
              addToSearchHistory(searchQuery);
              navigateTo('book-detail', book); 
              setSearchQuery(''); 
              setActiveSearchMenuId(null); 
            }}
          >
            <img
              src={book.cover || getGenericBookCover(book.title, book.author)}
              onError={(e) => handleBookCoverError(book, e)}
              alt={book.title}
              className="w-full h-full aspect-[1/1.6] object-cover"
            />
          </div>

          <div 
            className="flex-1 overflow-hidden" 
            onClick={() => { 
              addToSearchHistory(searchQuery);
              navigateTo('book-detail', book); 
              setSearchQuery(''); 
              setActiveSearchMenuId(null); 
            }}
          >
            <p className="text-sm font-bold text-[var(--text-main)] truncate">{book.title}</p>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
              Audiobook • {book.author} • {getGenreName(book.category, resolvedLanguage)}{book.subgenre && book.subgenre !== 'Desconhecido' && book.subgenre.toLowerCase() !== book.category.toLowerCase() ? `, ${getSubgenreName(book.subgenre, resolvedLanguage)}` : ''}
            </p>
          </div>

          {/* Estado do item (favorito, ouvindo, concluído): só ícones, à esquerda do botão de opções */}
          {(isFav || isBookStarted(book) || isBookCompleted(book)) && (
            <div className="flex items-center gap-1.5 shrink-0 text-[var(--text-muted)] pointer-events-none">
              {isFav && <Star size={13} className="fill-yellow-400 text-yellow-400" />}
              {isBookCompleted(book) ? <CheckCircle2 size={13} /> : isBookStarted(book) ? <Headphones size={13} /> : null}
            </div>
          )}
          <div className={`relative w-8 h-8 max-md:w-10 max-md:h-10 shrink-0 transition-opacity duration-200 ${
            isMenuOpen ? 'opacity-100 z-50' : isSelected ? 'opacity-100' : 'opacity-0 max-md:opacity-100 group-hover/searchitem:opacity-100'
          }`}>
            <motion.button 
              data-press="true"
              animate={morphTriggerAnimate(isMenuOpen)}
              onClick={(e) => { 
                e.stopPropagation(); 
                const btnEl = e.currentTarget;
                if (isMenuOpen) {
                  setActiveSearchMenuId(null);
                  clearButtonCoverAnchorCache(searchMenuAnchor);
                  setSearchMenuAnchor(null);
                  setConfirmDeleteSearchId(null);
  setSearchCollectionTarget(null);
                } else {
                  closeAllPopups();
                  clearButtonCoverAnchorCache(btnEl);
                  setSearchMenuAnchor(btnEl);
                  setActiveSearchMenuId(item.id); 
                }
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl transition-colors shrink-0 bg-card/75 text-[var(--text-main)] ${
                isMenuOpen
                  ? ''
                  : 'hover:bg-[var(--hover-fill)] '
              }`}
              title={t('more_options')}
            >
              <MoreHorizontal size={16} />
            </motion.button>

            {typeof document !== 'undefined' && createPortal(
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div 
                      data-popup-content="true"
                      className="fixed inset-0 z-[9998] cursor-default" 
                      {...getBackdropProps((e) => { 
                        setActiveSearchMenuId(null); 
                        clearButtonCoverAnchorCache(searchMenuAnchor);
                        setSearchMenuAnchor(null); 
                        setConfirmDeleteSearchId(null);
  setSearchCollectionTarget(null); 
                        if (e && typeof e.clientX === 'number' && typeof document !== 'undefined') {
                          const els = document.elementsFromPoint(e.clientX, e.clientY);
                          const insideSearch = els.some(el => el.hasAttribute?.('data-search-dropdown') || el.hasAttribute?.('data-search-bar'));
                          if (!insideSearch) {
                            setSearchQuery('');
                            setSearchSelectedIndex(-1);
                          }
                        }
                      })} 
                    />
                    <PopupMorphContainer
                      key="search-book-menu"
                      activeKey={
                        confirmDeleteSearchId === item.id 
                          ? "search-confirm-delete" 
                          : searchCollectionTarget?.id === item.id 
                            ? "search-collections" 
                            : "search-options-list"
                      }
                      direction={confirmDeleteSearchId === item.id || searchCollectionTarget?.id === item.id ? 1 : -1}
                      targetWidth={confirmDeleteSearchId === item.id || searchCollectionTarget?.id === item.id ? 260 : 180}
                      targetRadius={confirmDeleteSearchId === item.id || searchCollectionTarget?.id === item.id ? 24 : 20}
                      style={getButtonCoverPopupStyle(searchMenuAnchor, confirmDeleteSearchId === item.id || searchCollectionTarget?.id === item.id ? 260 : 180, 260, 'right')}
                      className="z-[9999]"
                    >
                      {searchCollectionTarget?.id === item.id ? (
                        <CollectionPickerPopupContent
                          itemType="book"
                          itemId={book.id}
                          collections={collections}
                          onToggleItem={handleToggleItemInCollection}
                          onBack={() => setSearchCollectionTarget(null)}
                          onClose={() => {
                            setActiveSearchMenuId(null);
                            clearButtonCoverAnchorCache(searchMenuAnchor);
                            setSearchMenuAnchor(null);
                            setSearchCollectionTarget(null);
                          }}
                        />
                      ) : confirmDeleteSearchId !== item.id ? (
                        <PagedMenu className="flex flex-col p-2 text-left rtl:text-right">
                          <MenuOptionItem 
                            icon={<Play size={14} />} 
                            onClick={() => { 
                              addToSearchHistory(searchQuery);
                              handlePlayBookFromStart(book); 
                              setActiveSearchMenuId(null); 
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                              setSearchQuery(''); 
                            }}
                          >
                            <span>{t('listen')}</span>
                          </MenuOptionItem>
                          <MenuOptionItem 
                            icon={<ListPlus size={14} />} 
                            onClick={() => { 
                              addToSearchHistory(searchQuery);
                              handleAddBookToQueue(book, 'next'); 
                              setActiveSearchMenuId(null); 
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                            }}
                          >
                            <span>{t('play_next')}</span>
                          </MenuOptionItem>
                          <MenuOptionItem 
                            icon={<ListPlus size={14} />} 
                            onClick={() => { 
                              addToSearchHistory(searchQuery);
                              handleAddBookToQueue(book, 'last'); 
                              setActiveSearchMenuId(null); 
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                            }}
                          >
                            <span>{t('add_to_queue_end')}</span>
                          </MenuOptionItem>

                          {/* Adicionar à coleção acima de favoritar */}
                          <MenuOptionItem 
                            icon={<FolderPlus size={14} />} 
                            onClick={() => { 
                              setSearchCollectionTarget({ type: 'book', id: book.id });
                            }}
                          >
                            <span>{t('add_to_collection')}</span>
                          </MenuOptionItem>

                          <MenuOptionItem 
                            icon={isFav ? <StarOff size={14} /> : <Star size={14} />} 
                            onClick={() => { 
                              toggleFavoriteBook(book.id); 
                              setActiveSearchMenuId(null); 
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                            }}
                          >
                            <span>{isFav ? t('remove_from_favorites') : t('favorite')}</span>
                          </MenuOptionItem>

                          <MenuOptionItem 
                            icon={<BookOpen size={14} />} 
                            onClick={() => { 
                              addToSearchHistory(searchQuery);
                              navigateTo('book-detail', book); 
                              setActiveSearchMenuId(null); 
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                              setSearchQuery(''); 
                            }}
                          >
                            <span>{t('go_to_audiobook')}</span>
                          </MenuOptionItem>
                          <MenuOptionItem 
                            icon={<User size={14} />} 
                            onClick={() => { 
                              addToSearchHistory(searchQuery);
                              handleSelectAuthor(book.authorId, book.author); 
                              setActiveSearchMenuId(null); 
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                              setSearchQuery(''); 
                            }}
                          >
                            <span>{t('go_to_author')}</span>
                          </MenuOptionItem>

                          {/* Excluir */}
                          <MenuOptionItem 
                            danger
                            immediate
                            icon={<Trash2 size={14} />} 
                            onClick={() => {
                              if (isMobile) {
                                setActiveSearchMenuId(null);
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                                setMobileConfirm({
                                  title: t('confirm_delete_single_book'),
                                  preview: (
                                    <div className="flex items-center gap-3 p-2 text-left rtl:text-right">
                                      <img src={book.cover || getGenericBookCover(book.title, book.author)} alt="" className="w-8 h-[51px] rounded-lg object-cover shrink-0 shadow-sm" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[var(--text-main)] truncate">{book.title}</p>
                                        <p className="text-xs text-[var(--text-muted)] truncate">{book.author}</p>
                                      </div>
                                    </div>
                                  ),
                                  confirmLabel: t('delete'),
                                  onConfirm: () => {
                                    handleDeleteBook(book.id);
                                    showToast(t('toast_book_deleted', { title: book.title }));
                                  },
                                });
                                return;
                              }
                              setConfirmDeleteSearchId(item.id);
                            }}
                          >
                            <span>{t('delete')}</span>
                          </MenuOptionItem>
                        </PagedMenu>
                      ) : (
                        <div className="flex flex-col p-4">
                          <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-3">
                            {t('confirm_delete_single_book')}
                          </h4>

                          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
                            <div className="flex items-center gap-3 p-2">
                              <img 
                                src={book.cover || getGenericBookCover(book.title, book.author)} 
                                onError={(e) => handleBookCoverError(book, e)}
                                alt={book.title} 
                                className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shrink-0 shadow-sm" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[var(--text-main)] truncate">{book.title}</p>
                                <p className="text-xs text-[var(--text-muted)] truncate">{book.author}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2.5 pt-1">
                            <motion.button
                              data-press="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBook(book.id);
                                showToast(t('toast_book_deleted', { title: book.title }));
                                setConfirmDeleteSearchId(null);
  setSearchCollectionTarget(null);
                                setActiveSearchMenuId(null);
                                clearButtonCoverAnchorCache(searchMenuAnchor);
                                setSearchMenuAnchor(null);
                              }}
                              className="h-8 px-4 rounded-full bg-card/75 shadow-md hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                            >
                              <Trash2 size={13} />
                              <span>{t('delete')}</span>
                            </motion.button>
                            <motion.button
                              data-press="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteSearchId(null);
  setSearchCollectionTarget(null);
                              }}
                              className="h-8 px-4 rounded-full bg-card/75 shadow-sm hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5"
                            >
                              <X size={13} />
                              <span>{t('cancel')}</span>
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </PopupMorphContainer>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>
        </motion.div>
      );
    }

    // C. CAPÍTULO, MARCAÇÃO E COLEÇÃO
    if (item.type === 'chapter' || item.type === 'bookmark' || item.type === 'collection') {
      const kindLabel = item.type === 'chapter' ? t('search_kind_chapter') : item.type === 'bookmark' ? t('search_kind_bookmark') : t('search_kind_collection');
      const subtitle = item.type === 'collection'
        ? kindLabel
        : `${kindLabel} • ${item.type === 'bookmark' ? `${item.chapter?.title || ''} • ` : ''}${item.book?.title || ''}`;
      const cover = item.book ? (item.book.cover || getGenericBookCover(item.book.title, item.book.author)) : '';
      return (
        <motion.div
          key={item.id}
          id={`search-result-item-${index}`}
          onMouseEnter={() => setSearchSelectedIndex(index)}
          data-popup-option="true"
          onClick={() => handleSelectSearchItem(item)}
          className={`group/searchitem relative flex items-center gap-3.5 py-2.5 pl-2.5 pr-[18px] rtl:pl-[18px] rtl:pr-2.5 rounded-3xl cursor-pointer transition-all ${
            isSelected ? 'bg-[var(--button-secondary-bg)]/50 shadow-sm' : ' hover:bg-[var(--button-secondary-bg)]/50'
          }`}
        >
          <div className={`relative w-12 h-12 shrink-0 rounded-[14px] overflow-hidden shadow-sm flex items-center justify-center ${item.type === 'collection' ? `bg-gradient-to-br ${item.collection?.gradient || 'from-slate-600 to-zinc-800'}` : 'bg-winblue/15 text-winblue'}`}>
            {item.type === 'collection' ? (
              <span className="text-3xl leading-none drop-shadow-sm">{item.collection?.emoji ? <EmojiIcon emoji={item.collection.emoji} /> : <FolderOpen size={20} className="text-white" />}</span>
            ) : (
              <>
                <img src={cover} alt="" draggable={false} className="w-full h-full object-cover" />
                <span className="absolute right-0.5 bottom-0.5 w-5 h-5 rounded-full bg-card/90 flex items-center justify-center text-[var(--text-main)]">
                  {item.type === 'bookmark' ? <Bookmark size={11} /> : <ListMusic size={11} />}
                </span>
              </>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-sm font-semibold text-[var(--text-main)] ${item.type === 'bookmark' ? 'line-clamp-2' : 'truncate'}`}>
              {item.type === 'bookmark' ? `“${item.title}”` : item.title}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{subtitle}</p>
          </div>
        </motion.div>
      );
    }

    // B. AUTHOR
    if (item.type === 'author' && item.author) {
      const author = item.author;
      const isFav = favoriteAuthorIds.includes(author.id);
      return (
        <motion.div 
          key={item.id} 
          id={`search-result-item-${index}`}
          onMouseEnter={() => setSearchSelectedIndex(index)}
          data-popup-option="true"
          {...searchLongPressProps(item.id)}
          onClick={() => handleSelectSearchItem(item)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const btn = (e.currentTarget.querySelector('button') as HTMLElement) || e.currentTarget;
            closeAllPopups();
            clearButtonCoverAnchorCache(btn);
            setSearchMenuAnchor(btn);
            setActiveSearchMenuId(item.id);
          }}
          className={`group/searchitem relative flex items-center gap-3.5 py-2.5 pl-2.5 pr-[18px] rtl:pl-[18px] rtl:pr-2.5 rounded-3xl cursor-pointer transition-all ${
            isSelected 
              ? 'bg-[var(--button-secondary-bg)]/50 shadow-sm' 
              : ' hover:bg-[var(--button-secondary-bg)]/50'
          } ${
            isMenuOpen ? 'z-30' : 'z-10'
          }`}
        >
          <div 
            className="relative w-12 h-12 aspect-square shrink-0 rounded-[14px] overflow-hidden shadow-sm"
            onClick={() => handleSelectSearchItem(item)}
          >
            <img
              src={getEffectiveAuthorAvatar(author.name, author.picture)}
              onError={(e) => { e.currentTarget.src = getAuthorAvatar(author.name); }}
              alt={author.name}
              className="w-full h-full aspect-square object-cover rounded-[14px]"
            />
          </div>

          <div 
            className="flex-1 overflow-hidden" 
            onClick={() => handleSelectSearchItem(item)}
          >
            <p className="text-sm font-bold text-[var(--text-main)] truncate">{author.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
              {t('author_label')} • {getNationalityDisplayName(author.nationality, resolvedLanguage)} • {books.filter(b => bookHasAuthor(b, author)).length} {books.filter(b => bookHasAuthor(b, author)).length === 1 ? t('audiobook_single') : t('audiobooks_plural')}
            </p>
          </div>

          {isFav && (
            <div className="flex items-center shrink-0 pointer-events-none">
              <Star size={13} className="fill-yellow-400 text-yellow-400" />
            </div>
          )}
          <div className={`relative w-8 h-8 max-md:w-10 max-md:h-10 shrink-0 transition-opacity duration-200 ${
            isMenuOpen ? 'opacity-100 z-50' : isSelected ? 'opacity-100' : 'opacity-0 max-md:opacity-100 group-hover/searchitem:opacity-100'
          }`}>
            <motion.button 
              data-press="true"
              animate={morphTriggerAnimate(isMenuOpen)}
              onClick={(e) => { 
                e.stopPropagation(); 
                const btnEl = e.currentTarget;
                if (isMenuOpen) {
                  setActiveSearchMenuId(null);
                  clearButtonCoverAnchorCache(searchMenuAnchor);
                  setSearchMenuAnchor(null);
                } else {
                  closeAllPopups();
                  clearButtonCoverAnchorCache(btnEl);
                  setSearchMenuAnchor(btnEl);
                  setActiveSearchMenuId(item.id); 
                }
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl transition-colors shrink-0 bg-card/75 text-[var(--text-main)] ${
                isMenuOpen
                  ? ''
                  : 'hover:bg-[var(--hover-fill)] '
              }`}
              title={t('more_options_author')}
            >
              <MoreHorizontal size={16} />
            </motion.button>

            {typeof document !== 'undefined' && createPortal(
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div 
                      data-popup-content="true"
                      className="fixed inset-0 z-[9998] cursor-default" 
                      {...getBackdropProps((e) => { 
                        setActiveSearchMenuId(null); 
                        clearButtonCoverAnchorCache(searchMenuAnchor);
                        setSearchMenuAnchor(null); 
                        if (e && typeof e.clientX === 'number' && typeof document !== 'undefined') {
                          const els = document.elementsFromPoint(e.clientX, e.clientY);
                          const insideSearch = els.some(el => el.hasAttribute?.('data-search-dropdown') || el.hasAttribute?.('data-search-bar'));
                          if (!insideSearch) {
                            setSearchQuery('');
                            setSearchSelectedIndex(-1);
                          }
                        }
                      })} 
                    />
                    <PopupMorphContainer
                      key="search-author-menu"
                      activeKey={searchCollectionTarget?.id === author.id ? "search-collections" : "search-options-list"}
                      direction={searchCollectionTarget?.id === author.id ? 1 : -1}
                      targetWidth={searchCollectionTarget?.id === author.id ? 260 : 180}
                      targetRadius={searchCollectionTarget?.id === author.id ? 24 : 20}
                      style={getButtonCoverPopupStyle(searchMenuAnchor, searchCollectionTarget?.id === author.id ? 260 : 180, 260, 'right')}
                      className="z-[9999]"
                    >
                      {searchCollectionTarget?.id === author.id ? (
                        <CollectionPickerPopupContent
                          itemType="author"
                          itemId={author.id}
                          collections={collections}
                          onToggleItem={handleToggleItemInCollection}
                          onBack={() => setSearchCollectionTarget(null)}
                          onClose={() => {
                            setActiveSearchMenuId(null);
                            clearButtonCoverAnchorCache(searchMenuAnchor);
                            setSearchMenuAnchor(null);
                            setSearchCollectionTarget(null);
                          }}
                        />
                      ) : (
                        <PagedMenu className="flex flex-col p-2 text-left rtl:text-right">

                          {/* Adicionar à coleção acima de favoritar */}
                          <MenuOptionItem 
                            icon={<FolderPlus size={14} />} 
                            onClick={() => { 
                              setSearchCollectionTarget({ type: 'author', id: author.id });
                            }}
                          >
                            <span>{t('add_to_collection')}</span>
                          </MenuOptionItem>

                          <MenuOptionItem 
                            icon={isFav ? <StarOff size={14} /> : <Star size={14} />} 
                            onClick={() => { 
                              toggleFavoriteAuthor(author.id); 
                              setActiveSearchMenuId(null); 
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                            }}
                          >
                            <span>{isFav ? t('remove_favorite_author') : t('favorite_author')}</span>
                          </MenuOptionItem>

                          <MenuOptionItem 
                            icon={<User size={14} />} 
                            onClick={() => { 
                              addToSearchHistory(searchQuery);
                              navigateTo('author-detail', author); 
                              setActiveSearchMenuId(null); 
                              clearButtonCoverAnchorCache(searchMenuAnchor);
                              setSearchMenuAnchor(null);
                              setSearchQuery(''); 
                            }}
                          >
                            <span>{t('go_to_author')}</span>
                          </MenuOptionItem>
                        </PagedMenu>
                      )}
                    </PopupMorphContainer>
                  </>
                )}
              </AnimatePresence>,
              document.body
            )}
          </div>
        </motion.div>
      );
    }

    return null;
  });
}
