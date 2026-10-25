// Extraído do App.tsx (conteúdo sem alterações)
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, ChevronLeft, Trash2, CheckCircle2, ExternalLink } from 'lucide-react';
import { 
  BsPlayFill, BsPauseFill, BsCheck2
} from 'react-icons/bs';
import { FaGithub } from 'react-icons/fa';
import { Audiobook, Author, Chapter, Collection } from '../data';
import { getGenericBookCover, getAuthorAvatar, getEffectiveAuthorAvatar } from '../audioUtils';
import { MenuOptionItem, PagedMenu, useCompactPopups, PopupMorphContainer, checkChapterMenuShouldOpenUp, checkIsLeftEdgeCard, MorphPopup, morphTriggerAnimate, emitZoomOrigin } from './Popovers';
import { getNationalityDisplayName } from '../nationalityTranslations';
import { useI18n } from '../translations';
import { Play, ListPlus, Info, MoreHorizontal, BookOpen, User, Headphones, Star, StarOff, FolderPlus, FolderMinus, Plus } from 'lucide-react';
import { getBackdropProps, useCloseOnOutsideScrollOrDrag } from './popupUtils';
import { MobileConfirmCard } from './MobileConfirm';
import { MobileContextMenu, useLongPress, isMobileViewport, useIsMobile } from './MobileContextMenu';

export function _FavoriteChapterCard({
  item,
  onPlay,
  onToggleFavorite,
  onSelectBook,
  onAddToQueue,
}: {
  item: { book: Audiobook; chapter: Chapter; chapterIndex: number };
  onPlay: () => void;
  onToggleFavorite: () => void;
  onSelectBook: () => void;
  onAddToQueue?: (pos: 'next' | 'last') => void;
}) {
  const { t } = useI18n();
  const [showOptions, setShowOptions] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);

  const handleClose = () => {
    setShowOptions(false);
  };

  useEffect(() => {
    if (!showOptions) return;
    const onCloseAll = () => setShowOptions(false);
    window.addEventListener('close-all-popups', onCloseAll);
    return () => window.removeEventListener('close-all-popups', onCloseAll);
  }, [showOptions]);

  useCloseOnOutsideScrollOrDrag(showOptions, handleClose);

  return (
    <div 
      className={`group/favchap relative flex flex-col transition-all ${showOptions ? 'z-50' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event('close-all-popups'));
        setOpenUp(checkChapterMenuShouldOpenUp(e.clientY, 220));
        setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
        setShowOptions(true);
      }}
    >
      <div 
        className="relative aspect-[1/1.6] w-full rounded-3xl overflow-hidden mb-2 cursor-pointer shadow-md group-hover/favchap:shadow-xl transition-shadow"
        onClick={onPlay}
      >
        <img 
          src={item.book.cover || getGenericBookCover(item.book.title, item.book.author)} 
          onError={(e) => {
            const fallback = getGenericBookCover(item.book.title, item.book.author);
            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
          }}
          alt={item.chapter.title} 
          className="w-full h-full aspect-[1/1.6] object-cover transition-transform duration-500 group-hover/favchap:scale-105" 
        />

        {/* Estrela de favorito */}
        <div 
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-yellow-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.4)] text-yellow-400 cursor-pointer hover:scale-110 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          title={t('remove_from_favorites')}
        >
          <Star size={13} className="fill-yellow-400 text-yellow-400" />
        </div>

        {/* Botão Reproduzir sobre o capítulo */}
        <div className="max-md:hidden absolute inset-0 bg-black/30 opacity-0 group-hover/favchap:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <motion.button 
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onPlay(); }} 
            className="w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 hover:border-white/75 shadow-2xl flex items-center justify-center text-white hover:text-white transition-all pointer-events-auto hover:shadow-[0_0_25px_rgba(255,255,255,0.65)]"
            title={t('listen_chapter')}
          >
            <BsPlayFill size={28} className="translate-x-[2px] transition-colors" />
          </motion.button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-1.5 mt-2 relative">
        <div className="flex-1 min-w-0 pr-1">
          <h4 
            className="text-sm font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors"
            title={item.chapter.title}
            onClick={onPlay}
          >
            {item.chapter.title}
          </h4>
          <p 
            className="text-xs text-[var(--text-muted)] truncate cursor-pointer hover:text-winblue transition-colors mt-0.5"
            title={`${item.book.title} • ${item.book.author}`}
            onClick={onSelectBook}
          >
            {item.book.title} • {item.book.author}
          </p>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
            {t('book_chapter')}
          </p>
        </div>

        {/* Três Pontinhos */}
        <div className={`relative w-8 h-8 shrink-0 transition-opacity duration-200 ${
          showOptions ? 'opacity-100 z-50' : 'opacity-0 group-hover/favchap:opacity-100'
        }`}>
          {showOptions && (
            <div 
              className="fixed inset-0 z-40 cursor-default" 
              {...getBackdropProps(handleClose)}
            />
          )}

          <motion.button 
            key="btn"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            animate={morphTriggerAnimate(showOptions)}
            onClick={(e) => { 
              e.stopPropagation(); 
              const next = !showOptions;
              window.dispatchEvent(new Event('close-all-popups'));
              if (next) {
                const rect = e.currentTarget.getBoundingClientRect();
                setOpenUp(checkChapterMenuShouldOpenUp(rect.bottom, 220));
                setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
                setShowOptions(true);
              } else {
                setShowOptions(false);
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
            title={t('more_options_chapter')}
          >
            <MoreHorizontal size={16} />
          </motion.button>

          <AnimatePresence>
            {showOptions && (
              <MorphPopup originWidth={32} originHeight={32} 
                key="menu"
                data-popup-content="true"
                style={{
                  transformOrigin: `${openUp ? 'bottom' : 'top'} ${alignLeft ? 'left' : 'right'}`
                }}
                onClick={(e) => e.stopPropagation()}
                className={`absolute ${openUp ? 'bottom-0' : 'top-0'} ${alignLeft ? 'left-0' : 'right-0'} bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-50 p-2 flex flex-col text-left overflow-hidden w-56`}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, filter: "blur(3px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.94, filter: "blur(3px)", transition: { duration: 0.12 } }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="relative z-10 flex flex-col"
                >
                  <MenuOptionItem 
                    variant="play"
                    icon={<Play size={14} />} 
                    onClick={() => { 
                      onPlay(); 
                      handleClose(); 
                    }} 
                  >
                    <span>{t('listen_chapter')}</span>
                  </MenuOptionItem>
                  {onAddToQueue && (
                    <>
                      <MenuOptionItem 
                        icon={<ListPlus size={14} />} 
                        onClick={() => { 
                          onAddToQueue('next'); 
                          handleClose(); 
                        }} 
                      >
                        <span>{t('play_next')}</span>
                      </MenuOptionItem>
                      <MenuOptionItem 
                        icon={<ListPlus size={14} />} 
                        onClick={() => { 
                          onAddToQueue('last'); 
                          handleClose(); 
                        }} 
                      >
                        <span>{t('add_to_queue_end')}</span>
                      </MenuOptionItem>
                    </>
                  )}
                  <MenuOptionItem 
                    icon={<BookOpen size={14} />} 
                    onClick={() => { 
                      onSelectBook(); 
                      handleClose(); 
                    }} 
                  >
                    <span>{t('view_audiobook')}</span>
                  </MenuOptionItem>
                  <MenuOptionItem 
                    icon={<StarOff size={14} />} 
                    onClick={() => { 
                      onToggleFavorite(); 
                      handleClose(); 
                    }} 
                  >
                    <span>{t('remove_from_favorites')}</span>
                  </MenuOptionItem>
                </motion.div>
              </MorphPopup>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export interface CollectionsContextType {
  collections: Collection[];
  onToggleItemInCollection: (collectionId: string, itemType: 'book' | 'author', itemId: string) => void;
}

export const CollectionsContext = React.createContext<CollectionsContextType>({
  collections: [],
  onToggleItemInCollection: () => {},
});

export const useCollections = () => React.useContext(CollectionsContext);

// Linha de opção selecionável no padrão dos pop-ups (igual ao menu de ordenar):
// destaque branco/cinza com brilho no hover e cor de destaque com check quando selecionada
export function PopupSelectableRow({
  selected,
  onClick,
  leading,
  title,
  subtitle,
  unselectedTrailing,
  rowTitle,
}: {
  selected: boolean;
  onClick: () => void;
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  unselectedTrailing?: React.ReactNode;
  rowTitle?: string;
}) {
  return (
    <button
      type="button"
      title={rowTitle}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`relative w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 text-xs font-semibold rounded-2xl select-none transition-all duration-150 border text-left rtl:text-right group ${
        selected
          ? 'bg-winblue/15 border-winblue shadow-[0_0_10px_rgba(var(--winblue-rgb),0.2)] hover:bg-winblue/25 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.3)]'
          : 'border-transparent hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {leading}
        <div className="min-w-0 flex-1">
          <p className={`truncate transition-colors ${selected ? 'text-winblue font-bold' : 'text-[var(--text-main)] group-hover:text-white'}`}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] font-medium text-[var(--text-muted)] truncate mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <span className={`shrink-0 flex items-center justify-center w-5 ${selected ? 'text-winblue' : 'text-[var(--text-muted)] group-hover:text-white transition-colors'}`}>
        {selected ? <BsCheck2 size={16} /> : unselectedTrailing}
      </span>
    </button>
  );
}

// Telas cheias do celular (submenus): opções num único destaque, como nas opções dos ajustes
export const SCREEN_GROUP_CLASS = "p-1.5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 space-y-0.5";

export function ScreenSelectableRow({
  selected,
  onClick,
  leading,
  title,
  subtitle,
  unselectedTrailing,
}: {
  selected: boolean;
  onClick: () => void;
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  unselectedTrailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full min-h-[52px] flex items-center gap-3.5 px-3 py-2 text-left rtl:text-right rounded-[26px] border transition-colors select-none ${
        selected ? 'bg-winblue/15 border-winblue/30' : 'border-transparent'
      }`}
    >
      {leading}
      <span className="flex-1 min-w-0 flex flex-col">
        <span className={`text-[15px] font-semibold truncate ${selected ? 'text-winblue' : 'text-[var(--text-main)]'}`}>{title}</span>
        {subtitle && <span className="text-xs text-[var(--text-muted)] truncate mt-0.5">{subtitle}</span>}
      </span>
      <span className={`shrink-0 w-6 flex items-center justify-center ${selected ? 'text-winblue' : 'text-[var(--text-muted)]'}`}>
        {selected ? <BsCheck2 size={18} /> : unselectedTrailing}
      </span>
    </button>
  );
}

// Barra de pesquisa dos pop-ups com o botão de X ao lado (mesmo comportamento da pesquisa do app)
export function PopupSearchField({
  value,
  onChange,
  placeholder,
  autoFocus = true,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2 px-1 pb-1">
      <div className="relative group/popsearch flex-1 min-w-0 h-9 max-md:h-11 flex items-center gap-2 px-3.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 focus-within:bg-white/15 focus-within:border-winblue/40 focus-within:shadow-[0_0_14px_rgba(var(--winblue-rgb),0.25)] text-[var(--text-main)] transition-all">
        <Search size={13} className="text-[var(--text-muted)] group-focus-within/popsearch:text-winblue transition-colors shrink-0" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && value) {
              e.preventDefault();
              e.stopPropagation();
              onChange('');
            }
          }}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] w-full font-medium"
        />
      </div>
      <AnimatePresence initial={false}>
        {value.length > 0 && (
          <motion.button
            key="popup-search-clear"
            type="button"
            initial={{ opacity: 0, scale: 0.55, width: 0, marginLeft: -8 }}
            animate={{ opacity: 1, scale: 1, width: 36, marginLeft: 0 }}
            exit={{ opacity: 0, scale: 0.55, width: 0, marginLeft: -8 }}
            transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.5 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              inputRef.current?.focus();
            }}
            className="h-9 shrink-0 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-colors cursor-pointer overflow-hidden"
            title={t('clear_search')}
          >
            <X size={13} className="shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Conteúdo do pop-up de adicionar autores/audiobooks a uma coleção
export function CollectionItemsPickerContent({
  mode,
  authors,
  books,
  selectedAuthorIds,
  selectedBookIds,
  onToggleAuthor,
  onToggleBook,
  asScreen = false,
}: {
  asScreen?: boolean;
  mode: 'authors' | 'books' | 'all';
  authors: Author[];
  books: Audiobook[];
  selectedAuthorIds: string[];
  selectedBookIds: string[];
  onToggleAuthor: (authorId: string) => void;
  onToggleBook: (bookId: string) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  // Itens que já estavam na coleção ao abrir (ficam no topo; a ordem não muda enquanto se toca)
  const initialSelectedRef = useRef<Set<string>>(new Set([
    ...selectedAuthorIds.map(id => `author-${id}`),
    ...selectedBookIds.map(id => `book-${id}`),
  ]));

  const showAuthors = mode === 'authors' || mode === 'all';
  const showBooks = mode === 'books' || mode === 'all';
  const filteredAuthors = showAuthors
    ? authors.filter(a => !q || a.name.toLowerCase().includes(q))
    : [];
  const filteredBooks = showBooks
    ? books.filter(b => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    : [];
  const placeholder = mode === 'authors'
    ? t('search_authors_placeholder')
    : mode === 'books'
      ? t('search_books_placeholder')
      : t('search_placeholder');

  // Lista única: autores e audiobooks misturados em ordem alfabética
  const mixedItems = [
    ...filteredAuthors.map(author => ({ kind: 'author' as const, id: author.id, name: author.name, author })),
    ...filteredBooks.map(book => ({ kind: 'book' as const, id: book.id, name: book.title, book })),
  ].sort((x, y) => x.name.localeCompare(y.name, undefined, { sensitivity: 'base' }));

  // Celular (folha): pesquisa no topo; sem pesquisa, os itens já adicionados primeiro e, abaixo, o restante;
  // com pesquisa, os resultados
  if (asScreen) {
    const renderRow = (item: typeof mixedItems[number]) => {
      if (item.kind === 'author') {
        const isAdded = selectedAuthorIds.includes(item.id);
        return (
          <ScreenSelectableRow
            key={`author-${item.id}`}
            selected={isAdded}
            onClick={() => onToggleAuthor(item.id)}
            leading={<img src={getEffectiveAuthorAvatar(item.author.name, item.author.picture)} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />}
            title={item.author.name}
            subtitle={t('author_label')}
            unselectedTrailing={<Plus size={16} />}
          />
        );
      }
      const book = item.book;
      const isAdded = selectedBookIds.includes(book.id);
      return (
        <ScreenSelectableRow
          key={`book-${book.id}`}
          selected={isAdded}
          onClick={() => onToggleBook(book.id)}
          leading={
            <img
              src={book.cover || getGenericBookCover(book.title, book.author)}
              onError={(e) => {
                const fallback = getGenericBookCover(book.title, book.author);
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
              alt=""
              className="w-[30px] h-12 rounded-lg object-cover shadow-sm shrink-0 mx-[5px]"
            />
          }
          title={book.title}
          subtitle={book.author}
          unselectedTrailing={<Plus size={16} />}
        />
      );
    };
    const initial = initialSelectedRef.current;
    const added = q ? [] : mixedItems.filter(item => initial.has(`${item.kind}-${item.id}`));
    const rest = q ? mixedItems : mixedItems.filter(item => !initial.has(`${item.kind}-${item.id}`));
    return (
      <div className="flex flex-col gap-4 w-full text-left rtl:text-right">
        <PopupSearchField value={query} onChange={setQuery} placeholder={placeholder} autoFocus={false} />
        {mixedItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)]">{t('no_results_found')}</div>
        ) : (
          <>
            {added.length > 0 && <div className={SCREEN_GROUP_CLASS}>{added.map(renderRow)}</div>}
            {rest.length > 0 && <div className={SCREEN_GROUP_CLASS}>{rest.map(renderRow)}</div>}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-1.5 w-full text-left rtl:text-right">
      <div className="px-3 pt-2 pb-2">
        <h3 className="text-sm font-bold text-[var(--text-main)]">{t('add_to_collection')}</h3>
      </div>

      <PopupSearchField value={query} onChange={setQuery} placeholder={placeholder} />

      <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-0.5 pt-1 pr-0.5">
        {mixedItems.map(item => {
          if (item.kind === 'author') {
            const isAdded = selectedAuthorIds.includes(item.id);
            return (
              <PopupSelectableRow
                key={`author-${item.id}`}
                selected={isAdded}
                onClick={() => onToggleAuthor(item.id)}
                rowTitle={isAdded ? t('remove') : t('add')}
                leading={
                  <img
                    src={getEffectiveAuthorAvatar(item.author.name, item.author.picture)}
                    alt={item.author.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                }
                title={item.author.name}
                subtitle={mode === 'all' ? t('author_label') : undefined}
                unselectedTrailing={<Plus size={13} />}
              />
            );
          }
          const book = item.book;
          const isAdded = selectedBookIds.includes(book.id);
          return (
            <PopupSelectableRow
              key={`book-${book.id}`}
              selected={isAdded}
              onClick={() => onToggleBook(book.id)}
              rowTitle={isAdded ? t('remove') : t('add')}
              leading={
                <img
                  src={book.cover || getGenericBookCover(book.title, book.author)}
                  onError={(e) => {
                    const fallback = getGenericBookCover(book.title, book.author);
                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                  }}
                  alt={book.title}
                  className="w-6 h-[38px] aspect-[1/1.6] rounded-md object-cover shadow-sm shrink-0"
                />
              }
              title={book.title}
              subtitle={book.author}
              unselectedTrailing={<Plus size={13} />}
            />
          );
        })}

        {filteredAuthors.length === 0 && filteredBooks.length === 0 && (
          <div className="py-5 text-center text-xs text-[var(--text-muted)]">
            {t('no_results_found')}
          </div>
        )}
      </div>
    </div>
  );
}

export function CollectionPickerPopupContent({
  itemType,
  itemId,
  collections,
  onToggleItem,
  onBack,
  onClose: _onClose,
  title,
}: {
  itemType: 'book' | 'author';
  itemId: string;
  collections: Collection[];
  onToggleItem: (collectionId: string, itemType: 'book' | 'author', itemId: string) => void;
  onBack?: () => void;
  onClose: () => void;
  title?: string;
}) {
  const { t } = useI18n();
  const compact = useCompactPopups();

  // Celular: sem botão de voltar; a lista mostra até 4 coleções por vez e "Mais opções" no fim
  // (passa para as seguintes e, na última página, volta para as opções do item)
  if (compact) {
    const rows = collections.map((col) => {
      const isInCol = itemType === 'book'
        ? col.bookIds.includes(itemId)
        : (col.authorIds || []).includes(itemId);
      return (
        <PopupSelectableRow
          key={col.id}
          selected={isInCol}
          onClick={() => onToggleItem(col.id, itemType, itemId)}
          rowTitle={isInCol ? t('remove_from_collection') : t('add_to_collection')}
          leading={
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${col.gradient} flex items-center justify-center text-sm shrink-0 shadow-sm select-none`}>
              {col.emoji}
            </div>
          }
          title={col.name}
          subtitle={col.description || undefined}
          unselectedTrailing={<Plus size={13} />}
        />
      );
    });
    return (
      <div className="flex flex-col p-1.5 w-full text-left rtl:text-right">
        <h3 className="px-3 pt-2 pb-1.5 text-sm font-bold text-[var(--text-main)] truncate">
          {title || t('add_to_collection')}
        </h3>
        {collections.length === 0 && (
          <div className="py-4 px-2 text-center text-xs text-[var(--text-muted)]">
            {t('no_collections_yet')}
          </div>
        )}
        <PagedMenu className="flex flex-col space-y-0.5" onBackToParent={onBack}>
          {rows}
        </PagedMenu>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-1.5 w-full text-left rtl:text-right">
      {/* Cabeçalho no padrão dos pop-ups: voltar para "Mais opções" + título */}
      <div className={`flex items-center gap-2.5 ${onBack ? 'px-1.5 pt-1.5 pb-2' : 'px-3 pt-2 pb-1.5'}`}>
        {onBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="h-7 px-2.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center gap-1.5 text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/25 transition-all shrink-0 cursor-pointer text-xs font-semibold"
            title={t('more_options')}
          >
            <ChevronLeft size={14} className="rtl:rotate-180" />
            <span>{t('more_options')}</span>
          </motion.button>
        )}
        <h3 className="text-sm font-bold text-[var(--text-main)] truncate">
          {title || t('add_to_collection')}
        </h3>
      </div>

      <div className="overflow-y-auto custom-scrollbar max-h-60 space-y-0.5 pr-0.5">
        {collections.length === 0 ? (
          <div className="py-5 px-2 text-center text-xs text-[var(--text-muted)]">
            {t('no_collections_yet')}
          </div>
        ) : (
          collections.map((col) => {
            const isInCol = itemType === 'book'
              ? col.bookIds.includes(itemId)
              : (col.authorIds || []).includes(itemId);
            return (
              <PopupSelectableRow
                key={col.id}
                selected={isInCol}
                onClick={() => onToggleItem(col.id, itemType, itemId)}
                rowTitle={isInCol ? t('remove_from_collection') : t('add_to_collection')}
                leading={
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${col.gradient} flex items-center justify-center text-sm shrink-0 shadow-sm select-none`}>
                    {col.emoji}
                  </div>
                }
                title={col.name}
                subtitle={col.description || undefined}
                unselectedTrailing={<Plus size={13} />}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export function AuthorCard({
  author,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
  onAddToCollection: _onAddToCollection,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  collections: collectionsProp,
  onToggleItemInCollection: onToggleItemInCollectionProp,
  currentCollectionId,
}: {
  author: Author;
  onSelect: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAddToCollection?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  collections?: Collection[];
  onToggleItemInCollection?: (collectionId: string, itemType: 'book' | 'author', itemId: string) => void;
  currentCollectionId?: string;
}) {
  const { t, language } = useI18n();
  // No celular, sem animação de layout (medir cada card a cada atualização deixa a rolagem pesada)
  const layoutAnim = useIsMobile() ? false : ('position' as const);
  const collectionsCtx = useCollections();
  const effectiveCollections = collectionsProp || collectionsCtx.collections || [];
  const handleToggleCol = onToggleItemInCollectionProp || collectionsCtx.onToggleItemInCollection;
  const authorPhotoRef = useRef<HTMLDivElement>(null);
  // Abre o autor com a animação de expansão a partir da foto
  const openAuthorWithZoom = () => {
    emitZoomOrigin(authorPhotoRef.current, getEffectiveAuthorAvatar(author.name, author.picture), 24, `author-${author.id}`);
    onSelect();
  };

  const [showOptions, setShowOptions] = useState(false);
  const [menuMode, setMenuMode] = useState<'options' | 'collections'>('options');
  const [openUp, setOpenUp] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);

  const handleClose = () => {
    setShowOptions(false);
    setMenuMode('options');
  };

  useEffect(() => {
    if (!showOptions) return;
    const onCloseAll = () => {
      setShowOptions(false);
      setMenuMode('options');
    };
    window.addEventListener('close-all-popups', onCloseAll);
    return () => window.removeEventListener('close-all-popups', onCloseAll);
  }, [showOptions]);

  useCloseOnOutsideScrollOrDrag(showOptions, handleClose);

  // Mobile: toque longo abre o menu de contexto (o item se destaca e o menu surge abaixo dele)
  const [contextRect, setContextRect] = React.useState<DOMRect | null>(null);
  const contextElRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!showOptions) setContextRect(null);
  }, [showOptions]);
  const openContextMenu = (el: HTMLElement) => {
    window.dispatchEvent(new Event('close-all-popups'));
    contextElRef.current = el;
    setContextRect(el.getBoundingClientRect());
    setMenuMode('options');
    setShowOptions(true);
  };
  const longPress = useLongPress(openContextMenu);
  const contextPreview = (
    <div className="flex flex-col">
      <img
        src={getEffectiveAuthorAvatar(author.name, author.picture)}
        alt=""
        className="w-full aspect-square rounded-3xl object-cover shadow-2xl"
      />
      <div className="mt-2 px-0.5">
        <p className="text-sm font-bold text-[var(--text-main)] truncate">{author.name}</p>
        {Boolean(author.nationality && author.nationality.trim()) && (
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{getNationalityDisplayName(author.nationality, language)}</p>
        )}
      </div>
    </div>
  );
  const menuBody = (
    <>

                  {menuMode === 'options' ? (
                    <PagedMenu className="flex flex-col p-1.5 text-left rtl:text-right">
                      <MenuOptionItem 
                        icon={<User size={14} />} 
                        onClick={() => { 
                          onSelect(); 
                          handleClose(); 
                        }} 
                      >
                        <span>{t('view_author')}</span>
                      </MenuOptionItem>

                      {/* Dentro de uma coleção: remover da coleção atual; fora dela: adicionar à coleção */}
                      {currentCollectionId ? (
                        <MenuOptionItem 
                          icon={<FolderMinus size={14} />} 
                          onClick={() => { 
                            handleToggleCol(currentCollectionId, 'author', author.id);
                            handleClose();
                          }} 
                        >
                          <span>{t('remove_from_current_collection')}</span>
                        </MenuOptionItem>
                      ) : (
                        <MenuOptionItem 
                          icon={<FolderPlus size={14} />} 
                          onClick={() => { 
                            setMenuMode('collections'); 
                          }} 
                        >
                          <span>{t('add_to_collection')}</span>
                        </MenuOptionItem>
                      )}

                      {onToggleFavorite && (
                        <MenuOptionItem 
                          icon={isFavorite ? <StarOff size={14} /> : <Star size={14} />} 
                          onClick={() => { 
                            onToggleFavorite(); 
                            handleClose(); 
                          }} 
                        >
                          <span>{isFavorite ? t('remove_favorite_author') : t('favorite_author')}</span>
                        </MenuOptionItem>
                      )}
                    </PagedMenu>
                  ) : (
                    <CollectionPickerPopupContent
                      itemType="author"
                      itemId={author.id}
                      collections={effectiveCollections}
                      onToggleItem={handleToggleCol}
                      onBack={() => setMenuMode('options')}
                      onClose={handleClose}
                    />
                  )}
                
    </>
  );

  return (
    <motion.div
      {...longPress}
      style={{ WebkitTouchCallout: 'none' }} 
      layout={layoutAnim}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className={`group group/author relative flex flex-col ${showOptions ? 'z-50' : ''}`} 
      onContextMenu={(e) => {
        if (isMobileViewport()) { e.preventDefault(); e.stopPropagation(); openContextMenu(e.currentTarget as HTMLElement); return; }
        if (isSelectionMode) return;
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event('close-all-popups'));
        setOpenUp(checkChapterMenuShouldOpenUp(e.clientY, 160));
        setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
        setMenuMode('options');
        setShowOptions(true);
      }}
    >
      {/* Foto do Autor: Quadrada (1:1) com cantos arredondados padrão rounded-3xl */}
      <div 
        ref={authorPhotoRef}
        data-zoom-key={`author-${author.id}`}
        className="relative aspect-square w-full rounded-3xl overflow-hidden mb-2 cursor-pointer shadow-md group-hover/author:shadow-xl transition-shadow"
        onClick={() => {
          if (showOptions) {
            handleClose();
            return;
          }
          if (isSelectionMode) {
            onToggleSelect?.();
          } else {
            openAuthorWithZoom();
          }
        }}
      >
        <div className={`relative w-full h-full rounded-3xl ring-2 transition-all ${
          isSelectionMode && isSelected 
            ? 'ring-winblue shadow-[0_0_20px_rgba(var(--winblue-rgb),0.35)]' 
            : 'ring-transparent group-hover/author:ring-winblue/40'
        }`}>
          <img 
            src={getEffectiveAuthorAvatar(author.name, author.picture)} 
            alt={author.name} 
            onError={(e) => { e.currentTarget.src = getAuthorAvatar(author.name); }} 
            className={`w-full h-full aspect-square object-cover transition-transform duration-500 ${
              isSelectionMode 
                ? (isSelected ? 'scale-95 opacity-50' : 'scale-100 opacity-80') 
                : 'group-hover/author:scale-105'
            }`} 
          />
        </div>

        {/* Modo de Seleção: Checkbox Badge */}
        {isSelectionMode && (
          <div className="absolute inset-0 rounded-3xl flex items-center justify-center bg-black/25 pointer-events-none">
            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-winblue border-winblue text-white shadow-lg' : 'border-white/70 bg-black/30 text-transparent'
            }`}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
        )}

        {/* Estrela de Favorito sobre a foto */}
        {!isSelectionMode && isFavorite && (
          <div 
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-yellow-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.4)] text-yellow-400 cursor-pointer hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            title={t('remove_favorite_author')}
          >
            <Star size={13} className="fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </div>

      {/* Linha de Nome, Nacionalidade e Botão de Três Pontinhos */}
      <div className="flex items-start justify-between gap-1.5 mt-2 relative w-full">
        <div className="flex-1 min-w-0 pr-1 text-left">
          <h4 
            className="text-sm font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors" 
            title={author.name}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelectionMode) {
                onToggleSelect?.();
              } else {
                openAuthorWithZoom();
              }
            }}
          >
            {author.name}
          </h4>

          {Boolean(author.nationality && author.nationality.trim()) && (
            <p 
              className="text-xs text-[var(--text-muted)] truncate mt-0.5 cursor-default" 
              title={getNationalityDisplayName(author.nationality, language)}
            >
              {getNationalityDisplayName(author.nationality, language)}
            </p>
          )}
        </div>

        {/* Botão de Três Pontinhos à direita */}
        {!isSelectionMode && (
          <div className={`relative w-8 h-8 shrink-0 transition-opacity duration-200 max-md:hidden ${
            showOptions ? 'opacity-100 z-50' : 'opacity-0 group-hover/author:opacity-100'
          }`}>
            {showOptions && (
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(handleClose)}
              />
            )}

            <motion.button
              key="btn"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              animate={morphTriggerAnimate(showOptions)}
              onClick={(e) => {
                e.stopPropagation();
                const next = !showOptions;
                window.dispatchEvent(new Event('close-all-popups'));
                if (next) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setOpenUp(checkChapterMenuShouldOpenUp(rect.bottom, menuMode === 'collections' ? 260 : 160));
                  setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
                  setMenuMode('options');
                  setShowOptions(true);
                } else {
                  handleClose();
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
              title={t('more_options_author')}
            >
              <MoreHorizontal size={16} />
            </motion.button>

            <AnimatePresence>
              {showOptions && (
                !contextRect ? (
<PopupMorphContainer
                  key="menu"
                  activeKey={menuMode === 'collections' ? "collections-list" : "options-list"}
                  direction={menuMode === 'collections' ? 1 : -1}
                  targetWidth={menuMode === 'collections' ? 260 : 180}
                  targetRadius={menuMode === 'collections' ? 24 : 20}
                  style={{
                    transformOrigin: `${openUp ? 'bottom' : 'top'} ${alignLeft ? 'left' : 'right'}`
                  }}
                  className={`absolute ${openUp ? 'bottom-0' : 'top-0'} ${alignLeft ? 'left-0' : 'right-0'} z-50`}
                >{menuBody}</PopupMorphContainer>
) : null
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      <MobileContextMenu
        open={showOptions && Boolean(contextRect)}
        rect={contextRect}
        sourceEl={contextElRef.current}
        preview={contextPreview}
        onClose={handleClose}
        activeKey={menuMode === 'collections' ? "collections-list" : "options-list"}
        direction={menuMode === 'collections' ? 1 : -1}
        targetWidth={menuMode === 'collections' ? 260 : 180}
        targetRadius={menuMode === 'collections' ? 24 : 20}
        estimatedMenuHeight={190}
      >
        {menuBody}
      </MobileContextMenu>
    </motion.div>
  );
}

export function OtherAppCard({
  app,
  onOpenUrl,
}: {
  app: {
    id: string;
    title: string;
    author: string;
    url: string;
    gradient: string;
    icon: React.ReactNode;
    watermark: React.ReactNode;
    whatItDoes: string;
    howItWorks: string;
  };
  onOpenUrl: (url: string) => void;
}) {
  const { t } = useI18n();
  // No celular, sem animação de layout (medir cada card a cada atualização deixa a rolagem pesada)
  const layoutAnim = useIsMobile() ? false : ('position' as const);
  const [showOptions, setShowOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const [customIconSrc, setCustomIconSrc] = useState<string | null>(`${import.meta.env.BASE_URL}icons/${app.id}.png`);
  // Ícone próprio do app (redondo): aparece sozinho, sem o cartão quadrado por trás
  const [iconLoaded, setIconLoaded] = useState(false);

  const handleClose = () => {
    setShowOptions(false);
    setShowDetails(false);
  };

  useEffect(() => {
    if (!showOptions) return;
    const onCloseAll = () => {
      setShowOptions(false);
      setShowDetails(false);
    };
    window.addEventListener('close-all-popups', onCloseAll);
    return () => window.removeEventListener('close-all-popups', onCloseAll);
  }, [showOptions]);

  useCloseOnOutsideScrollOrDrag(showOptions, handleClose);

  // Mobile: toque longo abre o menu de contexto (o item se destaca e o menu surge abaixo dele)
  const [contextRect, setContextRect] = React.useState<DOMRect | null>(null);
  const contextElRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!showOptions) setContextRect(null);
  }, [showOptions]);
  const openContextMenu = (el: HTMLElement) => {
    window.dispatchEvent(new Event('close-all-popups'));
    contextElRef.current = el;
    setContextRect(el.getBoundingClientRect());
    setShowDetails(false);
    setShowOptions(true);
  };
  const longPress = useLongPress(openContextMenu);
  const contextPreview = (
    <div className="flex flex-col">
      <div className={`w-full aspect-square overflow-hidden shadow-2xl flex items-center justify-center text-white ${iconLoaded ? 'rounded-full' : `rounded-3xl bg-gradient-to-br ${app.gradient}`}`}>
        {customIconSrc ? <img src={customIconSrc} alt="" className="w-full h-full object-cover" /> : app.icon}
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-bold text-[var(--text-main)] truncate">{app.title}</p>
        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 flex items-center gap-1">
          <FaGithub size={12} className="shrink-0" />
          <span>{app.author}</span>
        </p>
      </div>
    </div>
  );
  const menuBody = (
    <>

                {!showDetails ? (
                  <PagedMenu className="flex flex-col p-2">
                    <MenuOptionItem
                      icon={<ExternalLink size={14} />}
                      onClick={() => {
                        onOpenUrl(app.url);
                        handleClose();
                      }}
                    >
                      <span>{t('go_to_app')}</span>
                    </MenuOptionItem>
                    <MenuOptionItem
                      immediate
                      icon={<Info size={14} />}
                      onClick={() => {
                        // Celular: os detalhes abrem numa tela cheia (submenu), sem botão de voltar no pop-up
                        if (isMobileViewport()) {
                          handleClose();
                          window.dispatchEvent(new CustomEvent('open-app-info', { detail: { id: app.id, title: app.title, author: app.author, url: app.url, whatItDoes: app.whatItDoes, howItWorks: app.howItWorks } }));
                          return;
                        }
                        setShowDetails(true);
                      }}
                    >
                      <span>{t('details')}</span>
                    </MenuOptionItem>
                  </PagedMenu>
                ) : (
                  <div className="flex flex-col gap-3 p-4 text-left rtl:text-right">
                    <div className="flex items-center gap-2.5 pb-0.5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails(false);
                        }}
                        className="h-7 px-2.5 rounded-full bg-card/75 border border-[var(--text-main)]/10 flex items-center gap-1.5 text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/15 hover:border-black/10 dark:hover:border-white/25 transition-all shrink-0 cursor-pointer text-xs font-semibold"
                        title={t('more_options')}
                      >
                        <ChevronLeft size={14} className="rtl:rotate-180" />
                        <span>{t('more_options')}</span>
                      </motion.button>
                      <h4 className="text-sm font-bold text-[var(--text-main)] truncate">
                        {t('details')}
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-xs leading-relaxed">
                      <div>
                        <span className="font-bold text-[var(--text-main)] block mb-0.5">{t('what_it_does')}</span>
                        <p className="text-[var(--text-muted)] text-[11px] leading-snug">{app.whatItDoes}</p>
                      </div>
                      <div>
                        <span className="font-bold text-[var(--text-main)] block mb-0.5">{t('how_it_works')}</span>
                        <p className="text-[var(--text-muted)] text-[11px] leading-snug">{app.howItWorks}</p>
                      </div>
                    </div>
                  </div>
                )}
              
    </>
  );

  return (
    <motion.div
      {...longPress}
      style={{ WebkitTouchCallout: 'none' }}
      layout={layoutAnim}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={`group group/appcard relative flex flex-col ${showOptions ? 'z-50' : ''}`}
      onContextMenu={(e) => {
        if (isMobileViewport()) { e.preventDefault(); e.stopPropagation(); openContextMenu(e.currentTarget as HTMLElement); return; }
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event('close-all-popups'));
        setOpenUp(checkChapterMenuShouldOpenUp(e.clientY, 260));
        setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
        setShowDetails(false);
        setShowOptions(true);
      }}
    >
      {/* Ícone quadrado do App (1:1 com cantos arredondados padrão dos Autores) */}
      <div
        onClick={() => {
          if (showOptions) {
            handleClose();
            return;
          }
          onOpenUrl(app.url);
        }}
        className={`relative aspect-square w-full overflow-hidden mb-2 cursor-pointer shadow-md group-hover/appcard:shadow-xl transition-shadow ${iconLoaded ? 'rounded-full' : 'rounded-3xl'}`}
      >
        <div className={`relative w-full h-full ring-2 ring-transparent group-hover/appcard:ring-winblue/40 transition-all overflow-hidden ${iconLoaded ? 'rounded-full' : 'rounded-3xl'}`}>
          <div className={`w-full h-full flex items-center justify-center relative transition-transform duration-500 group-hover/appcard:scale-105 ${iconLoaded ? '' : `bg-gradient-to-br ${app.gradient}`}`}>
            {!iconLoaded && (
              <>
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                <div className="absolute -bottom-5 -right-4 opacity-15 pointer-events-none select-none transform rotate-[-8deg]">
                  {app.watermark}
                </div>
                <div className="relative z-10 w-24 h-24 rounded-[26px] bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl flex items-center justify-center">
                  {app.icon}
                </div>
              </>
            )}
            {customIconSrc && (
              <img
                src={customIconSrc}
                alt={app.title}
                onLoad={() => setIconLoaded(true)}
                onError={() => {
                  setIconLoaded(false);
                  if (customIconSrc.endsWith('.png')) {
                    setCustomIconSrc(`${import.meta.env.BASE_URL}icons/${app.id}.svg`);
                  } else {
                    setCustomIconSrc(null);
                  }
                }}
                className="absolute inset-0 z-15 w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Botão de Ir para o App na Web no centro ao passar o mouse (estilo Play dos audiobooks) */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/appcard:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-20">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenUrl(app.url);
            }}
            className="w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 hover:border-white/75 shadow-2xl flex items-center justify-center text-white hover:text-white transition-all pointer-events-auto hover:shadow-[0_0_25px_rgba(255,255,255,0.65)] cursor-pointer"
            title={t('go_to_app')}
          >
            <ExternalLink size={24} className="transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* Linha de Nome, GitHub (@thenauan no lugar da nacionalidade) e Botão de Três Pontinhos */}
      <div className="flex items-start justify-between gap-1.5 mt-2 relative w-full">
        <div className="flex-1 min-w-0 pr-1 text-left rtl:text-right">
          <h4
            onClick={() => onOpenUrl(app.url)}
            className="text-sm font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors"
            title={app.title}
          >
            {app.title}
          </h4>

          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenUrl('https://github.com/thenauan');
            }}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-winblue transition-colors mt-0.5 cursor-pointer w-fit max-w-full"
            title={`GitHub: ${app.author}`}
          >
            <FaGithub size={12} className="shrink-0" />
            <span className="truncate">{app.author}</span>
          </div>
        </div>

        {/* Botão de Três Pontinhos à direita */}
        <div className={`relative w-8 h-8 shrink-0 transition-opacity duration-200 max-md:hidden ${
          showOptions ? 'opacity-100 z-50' : 'opacity-0 group-hover/appcard:opacity-100'
        }`}>
          {showOptions && (
            <div
              className="fixed inset-0 z-40 cursor-default"
              {...getBackdropProps(handleClose)}
            />
          )}

          <motion.button
            key="btn"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            animate={morphTriggerAnimate(showOptions)}
            onClick={(e) => {
              e.stopPropagation();
              const next = !showOptions;
              window.dispatchEvent(new Event('close-all-popups'));
              if (next) {
                const rect = e.currentTarget.getBoundingClientRect();
                setOpenUp(checkChapterMenuShouldOpenUp(rect.bottom, 260));
                setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
                setShowDetails(false);
                setShowOptions(true);
              } else {
                handleClose();
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
            title={t('more_options')}
          >
            <MoreHorizontal size={16} />
          </motion.button>

          <AnimatePresence>
            {showOptions && (
              !contextRect ? (
<PopupMorphContainer
                key="menu"
                activeKey={showDetails ? "app-details" : "options-list"}
                direction={showDetails ? 1 : -1}
                targetWidth={showDetails ? 256 : 168}
                targetRadius={showDetails ? 26 : 24}
                openUp={openUp}
                style={{
                  transformOrigin: `${openUp ? 'bottom' : 'top'} ${alignLeft ? 'left' : 'right'}`
                }}
                className={`absolute ${openUp ? 'bottom-0' : 'top-0'} ${alignLeft ? 'left-0' : 'right-0'} z-50`}
              >{menuBody}</PopupMorphContainer>
) : null
            )}
          </AnimatePresence>
        </div>
      </div>
      <MobileContextMenu
        open={showOptions && Boolean(contextRect)}
        rect={contextRect}
        sourceEl={contextElRef.current}
        preview={contextPreview}
        onClose={handleClose}
        activeKey={showDetails ? "app-details" : "options-list"}
        direction={showDetails ? 1 : -1}
        targetWidth={showDetails ? 256 : 168}
        targetRadius={showDetails ? 26 : 24}
        estimatedMenuHeight={140}
      >
        {menuBody}
      </MobileContextMenu>
    </motion.div>
  );
}

export function _FavoriteAuthorCard({
  author,
  onSelect,
  onToggleFavorite,
}: {
  author: Author;
  onSelect: () => void;
  onToggleFavorite: () => void;
  isMenuOpen?: boolean;
  onOpenMenu?: (e: React.MouseEvent<HTMLElement>, anchorEl?: HTMLElement) => void;
}) {
  return (
    <AuthorCard 
      author={author} 
      onSelect={onSelect} 
      isFavorite={true} 
      onToggleFavorite={onToggleFavorite} 
    />
  );
}


export function BookCard({ 
  book, 
  onSelect, 
  onSelectAuthor,
  onPlay, 
  onEdit: _onEdit, 
  onAddToQueue, 
  onDelete,
  onAddToCollection: _onAddToCollection,
  isSelectionMode, 
  isSelected, 
  onToggleSelect,
  isFavorite,
  onToggleFavorite,
  isBookPlaying,
  isCompleted,
  isStarted,
  onToggleCompleted,
  typeLabel: _typeLabel,
  className,
  collections: collectionsProp,
  onToggleItemInCollection: onToggleItemInCollectionProp,
  currentCollectionId,
}: { 
  book: any, 
  onSelect: () => void, 
  onSelectAuthor?: (authorId?: string, authorName?: string) => void,
  onPlay: () => void, 
  onEdit?: () => void, 
  onAddToQueue: (pos: 'next' | 'last') => void, 
  onDelete?: () => void,
  onAddToCollection?: () => void,
  isSelectionMode?: boolean, 
  isSelected?: boolean, 
  onToggleSelect?: () => void,
  isFavorite?: boolean,
  onToggleFavorite?: () => void,
  isBookPlaying?: boolean,
  isCompleted?: boolean,
  isStarted?: boolean,
  onToggleCompleted?: () => void,
  typeLabel?: string,
  className?: string,
  collections?: Collection[],
  onToggleItemInCollection?: (collectionId: string, itemType: 'book' | 'author', itemId: string) => void,
  currentCollectionId?: string,
}) {
  const { t } = useI18n();
  // No celular, sem animação de layout (medir cada card a cada atualização deixa a rolagem pesada)
  const layoutAnim = useIsMobile() ? false : ('position' as const);
  const collectionsCtx = useCollections();
  const effectiveCollections = collectionsProp || collectionsCtx.collections || [];
  const handleToggleCol = onToggleItemInCollectionProp || collectionsCtx.onToggleItemInCollection;
  const bookCoverRef = useRef<HTMLDivElement>(null);
  // Abre o audiobook com a animação de expansão a partir da capa
  const openBookWithZoom = () => {
    emitZoomOrigin(bookCoverRef.current, book.cover || getGenericBookCover(book.title, book.author), 24, `book-${book.id}`);
    onSelect();
  };

  const [showOptions, setShowOptions] = React.useState(false);
  const [menuMode, setMenuMode] = React.useState<'options' | 'collections' | 'delete'>('options');
  const [mobileDeleteOpen, setMobileDeleteOpen] = React.useState(false);
  const [openUp, setOpenUp] = React.useState(false);
  const [alignLeft, setAlignLeft] = React.useState(false);

  const handleClose = () => {
    setShowOptions(false);
    setMenuMode('options');
  };

  React.useEffect(() => {
    if (!showOptions) return;
    const onCloseAll = () => {
      setShowOptions(false);
      setMenuMode('options');
    };
    window.addEventListener('close-all-popups', onCloseAll);
    return () => {
      window.removeEventListener('close-all-popups', onCloseAll);
    };
  }, [showOptions]);

  useCloseOnOutsideScrollOrDrag(showOptions, handleClose);

  // Mobile: toque longo abre o menu de contexto (o item se destaca e o menu surge abaixo dele)
  const [contextRect, setContextRect] = React.useState<DOMRect | null>(null);
  const contextElRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!showOptions) setContextRect(null);
  }, [showOptions]);
  const openContextMenu = (el: HTMLElement) => {
    window.dispatchEvent(new Event('close-all-popups'));
    contextElRef.current = el;
    setContextRect(el.getBoundingClientRect());
    setMenuMode('options');
    setShowOptions(true);
  };
  const longPress = useLongPress(openContextMenu);
  const contextPreview = (
    <div className="flex flex-col">
      <img
        src={book.cover || getGenericBookCover(book.title, book.author)}
        alt=""
        className="w-full aspect-[1/1.6] rounded-3xl object-cover shadow-2xl"
      />
      <div className="mt-2 px-0.5">
        <p className="text-sm font-bold text-[var(--text-main)] truncate">{book.title}</p>
        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{book.author}</p>
      </div>
    </div>
  );
  const menuBody = (
    <>

                {menuMode === 'options' && (
                  <PagedMenu className="flex flex-col p-2 text-left rtl:text-right">
                    <MenuOptionItem variant="play" icon={<Play size={14} />} onClick={() => { onPlay(); handleClose(); }}>
                      <span>{t('listen')}</span>
                    </MenuOptionItem>
                    <MenuOptionItem icon={<ListPlus size={14} />} onClick={() => { onAddToQueue('next'); handleClose(); }}>
                      <span>{t('play_next')}</span>
                    </MenuOptionItem>
                    <MenuOptionItem icon={<ListPlus size={14} />} onClick={() => { onAddToQueue('last'); handleClose(); }}>
                      <span>{t('add_to_queue_end')}</span>
                    </MenuOptionItem>

                    {/* Dentro de uma coleção: remover da coleção atual; fora dela: adicionar à coleção */}
                    {currentCollectionId ? (
                      <MenuOptionItem 
                        icon={<FolderMinus size={14} />} 
                        onClick={() => { 
                          handleToggleCol(currentCollectionId, 'book', book.id);
                          handleClose();
                        }}
                      >
                        <span>{t('remove_from_current_collection')}</span>
                      </MenuOptionItem>
                    ) : (
                      <MenuOptionItem 
                        icon={<FolderPlus size={14} />} 
                        onClick={() => { 
                          setMenuMode('collections'); 
                        }}
                      >
                        <span>{t('add_to_collection')}</span>
                      </MenuOptionItem>
                    )}

                    <MenuOptionItem 
                      icon={isFavorite ? <StarOff size={14} /> : <Star size={14} />} 
                      onClick={() => { onToggleFavorite?.(); handleClose(); }}
                    >
                      <span>{isFavorite ? t('remove_from_favorites') : t('favorite')}</span>
                    </MenuOptionItem>

                    {/* Marcar como concluido / nao ouvido */}
                    <MenuOptionItem 
                      icon={isCompleted ? <Headphones size={14} /> : <CheckCircle2 size={14} />} 
                      onClick={() => { 
                        onToggleCompleted?.(); 
                        handleClose(); 
                      }}
                    >
                      <span>{isCompleted ? t('mark_as_unstarted') : t('mark_as_completed')}</span>
                    </MenuOptionItem>

                    {/* Ir para audiobook */}
                    <MenuOptionItem icon={<BookOpen size={14} />} onClick={() => { onSelect(); handleClose(); }}>
                      <span>{t('go_to_audiobook')}</span>
                    </MenuOptionItem>

                    {/* Ir para o autor */}
                    <MenuOptionItem icon={<User size={14} />} onClick={() => { if (onSelectAuthor) onSelectAuthor(book.authorId, book.author); else onSelect(); handleClose(); }}>
                      <span>{t('go_to_author')}</span>
                    </MenuOptionItem>

                    {/* Excluir */}
                    <MenuOptionItem 
                      danger
                      immediate
                      icon={<Trash2 size={14} />} 
                      onClick={() => { 
                        // Celular: a confirmação aparece num cartão na base da tela
                        if (isMobileViewport()) {
                          handleClose();
                          setMobileDeleteOpen(true);
                          return;
                        }
                        setMenuMode('delete'); 
                      }}
                    >
                      <span>{t('delete')}</span>
                    </MenuOptionItem>
                  </PagedMenu>
                )}

                {menuMode === 'collections' && (
                  <CollectionPickerPopupContent
                    itemType="book"
                    itemId={book.id}
                    collections={effectiveCollections}
                    onToggleItem={handleToggleCol}
                    onBack={() => setMenuMode('options')}
                    onClose={handleClose}
                  />
                )}

                {menuMode === 'delete' && (
                  <div className="flex flex-col gap-3 p-4">
                    <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-3">
                      {t('confirm_delete_single_book')}
                    </h4>

                    <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
                      <div className="flex items-center gap-3 p-2">
                        <img 
                          src={book.cover || getGenericBookCover(book.title, book.author)} 
                          onError={(e) => {
                            const fallback = getGenericBookCover(book.title, book.author);
                            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                          }}
                          alt={book.title} 
                          className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shrink-0 shadow-sm" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--text-main)] truncate">{book.title}</p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{book.author}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClose();
                          onDelete?.();
                        }}
                        className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>{t('delete')}</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuMode('options');
                        }}
                        className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <X size={13} />
                        <span>{t('cancel')}</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              
    </>
  );

  return (
    <motion.div
      {...longPress}
      style={{ WebkitTouchCallout: 'none' }} 
      layout={layoutAnim}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={`group/bookcard relative flex flex-col ${showOptions ? 'z-50' : ''} ${className || ''}`}
      onContextMenu={(e) => {
        if (isMobileViewport()) { e.preventDefault(); e.stopPropagation(); openContextMenu(e.currentTarget as HTMLElement); return; }
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event('close-all-popups'));
        setOpenUp(checkChapterMenuShouldOpenUp(e.clientY, 280));
        setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
        setMenuMode('options');
        setShowOptions(true);
      }}
    >
      {/* Capa do Audiobook (sem borda ou contorno externo no card) */}
      <div 
        ref={bookCoverRef}
        data-zoom-key={`book-${book.id}`}
        className="relative aspect-[1/1.6] w-full rounded-3xl overflow-hidden mb-2 cursor-pointer shadow-md group-hover/bookcard:shadow-xl transition-shadow" 
        onClick={(e) => {
          if (isSelectionMode) {
            e.stopPropagation();
            onToggleSelect?.();
          } else {
            openBookWithZoom();
          }
        }}
      >
        <img 
          src={book.cover || getGenericBookCover(book.title, book.author)} 
          onError={(e) => { e.currentTarget.src = getGenericBookCover(book.title, book.author); }} 
          alt={book.title} 
          className={`w-full h-full aspect-[1/1.6] object-cover transition-transform duration-500 ${isSelectionMode ? (isSelected ? 'scale-95 opacity-50' : 'scale-100 opacity-80') : 'group-hover/bookcard:scale-105'}`} 
        />

        {/* Destaque de favorito com a mesma altura do badge de status (ouvindo/concluído) */}
        {isFavorite && (
          <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-yellow-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.4)] text-yellow-400 pointer-events-none">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
          </div>
        )}
        {isCompleted ? (
          <div className="absolute top-2.5 left-2.5 z-10 h-6 px-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center gap-1 shadow-lg text-white pointer-events-none text-[10px] font-bold">
            <CheckCircle2 size={11} />
            <span>{t('completed')}</span>
          </div>
        ) : isStarted ? (
          <div className="absolute top-2.5 left-2.5 z-10 h-6 px-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center gap-1 shadow-lg text-white pointer-events-none text-[10px] font-bold">
            <Headphones size={11} />
            <span>{t('listening')}</span>
          </div>
        ) : null}
        
        {isSelectionMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-winblue border-winblue text-white' : 'border-white/70 bg-black/30 text-transparent'}`}>
              <CheckCircle2 size={18} />
            </div>
          </div>
        )}

        {/* Botão Reproduzir sobre a capa: Efeito de Blur, destaque branco no modo escuro e preto no modo claro ao passar o mouse */}
        {!isSelectionMode && (
          <div className="max-md:hidden absolute inset-0 bg-black/30 opacity-0 group-hover/bookcard:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onPlay(); }} 
              className="w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 hover:border-white/75 shadow-2xl flex items-center justify-center text-white hover:text-white transition-all pointer-events-auto hover:shadow-[0_0_25px_rgba(255,255,255,0.65)]"
              title={isBookPlaying ? t('pause') : t('listen')}
            >
              {isBookPlaying ? (
                <BsPauseFill size={28} className="transition-colors" />
              ) : (
                <BsPlayFill size={28} className="translate-x-[2px] transition-colors" />
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Linha de Título, Autor e Três Pontinhos */}
      <div className="flex items-start justify-between gap-1.5 mt-2 relative">
        <div className="flex-1 min-w-0 pr-1">
          {/* Título clicável que leva à página do livro */}
          <h4 
            className="text-sm font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors" 
            title={book.title}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelectionMode) {
                onToggleSelect?.();
              } else {
                openBookWithZoom();
              }
            }}
          >
            {book.title}
          </h4>

          {/* Nome do Autor clicável que leva à página do autor */}
          <p 
            className="text-xs text-[var(--text-muted)] truncate cursor-pointer hover:text-winblue transition-colors mt-0.5" 
            title={book.author}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelectionMode) {
                onToggleSelect?.();
              } else {
                onSelectAuthor ? onSelectAuthor(book.authorId, book.author) : onSelect();
              }
            }}
          >
            {book.author}
          </p>
        </div>

        {/* Três Pontinhos invisível até o hover, surgindo suavemente ao passar o mouse */}
        <div className={`relative w-8 h-8 shrink-0 transition-opacity duration-200 max-md:hidden ${
          showOptions ? 'opacity-100 z-50' : 'opacity-0 group-hover/bookcard:opacity-100'
        }`}>
          {showOptions && (
            <div 
              className="fixed inset-0 z-40 cursor-default" 
              {...getBackdropProps(handleClose)}
            />
          )}

          <motion.button 
            key="btn"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            animate={morphTriggerAnimate(showOptions)}
            onClick={(e) => { 
              e.stopPropagation(); 
              const next = !showOptions;
              window.dispatchEvent(new Event('close-all-popups'));
              if (next) {
                const rect = e.currentTarget.getBoundingClientRect();
                setOpenUp(checkChapterMenuShouldOpenUp(rect.bottom, menuMode === 'delete' ? 320 : menuMode === 'collections' ? 260 : 280));
                setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
                setMenuMode('options'); 
                setShowOptions(true);
              } else {
                handleClose();
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
            title={t('more_options')}
          >
            <MoreHorizontal size={16} />
          </motion.button>

          <AnimatePresence>
            {showOptions && (
              !contextRect ? (
<PopupMorphContainer
                key="menu"
                activeKey={menuMode === 'delete' ? "confirm-delete" : menuMode === 'collections' ? "collections-list" : "options-list"}
                direction={menuMode === 'options' ? -1 : 1}
                targetWidth={menuMode === 'options' ? 180 : 260}
                targetRadius={menuMode === 'options' ? 20 : 24}
                style={{
                  transformOrigin: `${openUp ? 'bottom' : 'top'} ${alignLeft ? 'left' : 'right'}`
                }}
                className={`absolute ${openUp ? 'bottom-0' : 'top-0'} ${alignLeft ? 'left-0' : 'right-0'} z-50`}
              >{menuBody}</PopupMorphContainer>
) : null
            )}
          </AnimatePresence>
        </div>
      </div>
      <MobileContextMenu
        open={showOptions && Boolean(contextRect)}
        rect={contextRect}
        sourceEl={contextElRef.current}
        preview={contextPreview}
        onClose={handleClose}
        activeKey={menuMode === 'delete' ? "confirm-delete" : menuMode === 'collections' ? "collections-list" : "options-list"}
        direction={menuMode === 'options' ? -1 : 1}
        targetWidth={menuMode === 'options' ? 180 : 260}
        targetRadius={menuMode === 'options' ? 20 : 24}
        estimatedMenuHeight={380}
      >
        {menuBody}
      </MobileContextMenu>
      <AnimatePresence>
        {mobileDeleteOpen && (
          <MobileConfirmCard key="book-delete-confirm" onClose={() => setMobileDeleteOpen(false)}>
            <div className="flex flex-col gap-3 p-4">
                    <h4 className="text-sm font-bold text-[var(--text-main)] px-1 mb-3">
                      {t('confirm_delete_single_book')}
                    </h4>

                    <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1 mb-4">
                      <div className="flex items-center gap-3 p-2">
                        <img 
                          src={book.cover || getGenericBookCover(book.title, book.author)} 
                          onError={(e) => {
                            const fallback = getGenericBookCover(book.title, book.author);
                            if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                          }}
                          alt={book.title} 
                          className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shrink-0 shadow-sm" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--text-main)] truncate">{book.title}</p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{book.author}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileDeleteOpen(false);
                          onDelete?.();
                        }}
                        className="h-8 px-4 rounded-full bg-card/75 border border-red-500/20 shadow-md hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] text-red-500 transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>{t('delete')}</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileDeleteOpen(false);
                        }}
                        className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] text-[var(--text-main)] transition-all backdrop-blur-3xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <X size={13} />
                        <span>{t('cancel')}</span>
                      </motion.button>
                    </div>
                  </div>
          </MobileConfirmCard>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
