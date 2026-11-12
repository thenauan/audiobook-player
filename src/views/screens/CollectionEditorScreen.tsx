// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { AnimatePresence, motion } from 'motion/react';
import { COLLECTION_AVAILABLE_EMOJIS, COLLECTION_AVAILABLE_PALETTES } from '../../data/catalog';
import { Check, Plus, X } from 'lucide-react';
import { EmojiIcon } from '../../components/EmojiIcon';
import { MorphPopup, morphTriggerAnimate } from '../../components/popups/Popovers';
import { getBackdropProps } from '../../components/popups/popupUtils';
import { CollectionItemsPickerContent } from '../../components/library/LibraryCards';
import { getEffectiveAuthorAvatar, getGenericBookCover } from '../../lib/coverArt';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function CollectionEditorScreen() {
  const { activeScreen, authors, books, colFormDesc, colFormEmoji, colFormName, colFormPalette, colPickerAnchor, colSelectedAuthorIds, colSelectedBookIds, findAuthorIdForBook, handleBookCoverError, openMobileSheet, setColFormDesc, setColFormEmoji, setColFormName, setColFormPalette, setColPickerAnchor, setColSelectedAuthorIds, setColSelectedBookIds, setShowAddAuthorPopup, setShowAddBookPopup, showAddAuthorPopup, showAddBookPopup, t, useFullScreenSheets , sortBooks } = useScreenScope();
  const editInputClass = "w-full h-11 px-4 rounded-2xl bg-card/75 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:bg-winblue/15 focus:ring-2 focus:ring-winblue/30 transition-all";
  const addButtonClass = "h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer";
  const pickerPopupClass = "absolute right-0 top-0 w-80 max-w-[calc(100vw-32px)] rounded-[24px] bg-card/95 backdrop-blur-3xl shadow-2xl z-50 flex flex-col overflow-hidden";
  const listRowClass = "group flex items-center justify-between py-2 pl-4 sm:pl-5 pr-2.5 rtl:pl-2.5 rtl:pr-4 rtl:sm:pr-5 rounded-full bg-card/40 hover:bg-[var(--button-secondary-bg)]/50 mb-1.5 transition-all";
  const removeButtonClass = "w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl text-[var(--text-main)] hover:bg-[var(--hover-fill)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer";
  return (
  <motion.div
    key={activeScreen.id}
    variants={transicaoConteudo}
    initial="escondido"
    animate="visivel"
    exit="saindo"
    className="flex flex-col gap-8 mt-4 relative w-full pb-16"
  >
    <div className="flex flex-col md:flex-row items-start gap-8 w-full">
      {/* Prévia do card (no lugar da capa/foto) + seletor de cor; no celular, centralizada */}
      <div className="flex flex-col items-center shrink-0 max-md:self-center">
        <div className="relative isolate shrink-0 rounded-3xl overflow-hidden shadow-2xl w-56 aspect-[16/9] p-4 flex flex-col justify-end">
          <div className={`absolute inset-0 bg-gradient-to-br ${colFormPalette.gradient}`} />
          <div className="absolute inset-0 bg-black/20" />
          {/* O mesmo ícone (e tom) que a coleção tem no resto do app */}
          <span className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 text-7xl select-none pointer-events-none card-tone-icon">
            <EmojiIcon emoji={colFormEmoji} />
          </span>
          <div className="relative z-10 min-w-0">
            <h3 className="text-xl font-bold text-white drop-shadow-md tracking-tight truncate">
              {colFormName.trim() || t('collection_name_placeholder')}
            </h3>
            {colFormDesc.trim() && (
              <p className="text-xs font-medium text-white/80 mt-0.5 line-clamp-2">
                {colFormDesc.trim()}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3.5 flex flex-col items-center gap-2 w-56">
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            {t('select_color')}
          </span>
          <div className="grid grid-cols-6 gap-x-3 gap-y-3.5 justify-items-center px-3 py-3 rounded-2xl bg-card/60 backdrop-blur-md shadow-sm w-full">
            {COLLECTION_AVAILABLE_PALETTES.map((pal) => {
              const isSelected = colFormPalette.id === pal.id;
              return (
                <button
                  key={pal.id}
                  type="button"
                  title={pal.name}
                  onClick={() => setColFormPalette(pal)}
                  style={{ backgroundColor: pal.hex }}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-winblue ring-offset-[1.5px] ring-offset-black/50 '
                      : 'opacity-85 hover:opacity-100 hover:ring-2 hover:ring-white/90 hover:ring-offset-[1.5px] hover:ring-offset-black/40 '
                  }`}
                >
                  {isSelected && (
                    <Check size={9} strokeWidth={3.5} className="text-winblue drop-shadow-[0_0_2px_rgba(0,0,0,0.85)] shrink-0 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Campos */}
      <div className="flex flex-col space-y-4 flex-1 w-full min-w-0">
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
            {t('collection_name_placeholder')}
          </label>
          <input
            type="text"
            value={colFormName}
            onChange={(e) => setColFormName(e.target.value)}
            placeholder={t('collection_name_placeholder')}
            className={editInputClass}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
            {t('collection_desc_placeholder')}
          </label>
          <div className="relative w-full">
            <input
              type="text"
              maxLength={60}
              value={colFormDesc}
              onChange={(e) => setColFormDesc(e.target.value.slice(0, 60))}
              placeholder={t('collection_desc_placeholder')}
              className={`${editInputClass} pr-14 rtl:pr-4 rtl:pl-14`}
            />
            <span className="absolute top-1/2 -translate-y-1/2 right-3.5 rtl:right-auto rtl:left-3.5 text-[10px] text-[var(--text-muted)] pointer-events-none select-none">
              {colFormDesc.length}/60
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
            {t('select_icon_or_emoji')}
          </label>
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-2 rounded-2xl bg-card/75 shadow-sm backdrop-blur-3xl">
            {COLLECTION_AVAILABLE_EMOJIS.map((emoji) => {
              const isSelected = colFormEmoji === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setColFormEmoji(emoji)}
                  className={`h-9 rounded-xl flex items-center justify-center text-lg transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-winblue/15 '
                      : ' hover:bg-[var(--hover-fill)] '
                  }`}
                >
                  <EmojiIcon emoji={emoji} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* Seção Autores */}
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--text-main)]">
          {t('authors')}
        </h2>
        <div className={`relative shrink-0 ${showAddAuthorPopup ? 'z-50' : 'z-10'}`}>
          <motion.button
            data-press="true"
            animate={morphTriggerAnimate(showAddAuthorPopup)}
            onClick={(e) => {
              e.stopPropagation();
              // Celular/tablet: a lista abre numa folha em tela cheia (não num pop-up pequeno)
              if (useFullScreenSheets) { openMobileSheet({ kind: 'collection-form-items', mode: 'authors' }); return; }
              setShowAddBookPopup(false);
              setColPickerAnchor(e.currentTarget);
              setShowAddAuthorPopup(!showAddAuthorPopup);
            }}
            className={addButtonClass}
          >
            <span>{t('add')}</span>
            <Plus size={14} />
          </motion.button>

          <AnimatePresence>
            {showAddAuthorPopup && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  {...getBackdropProps(() => setShowAddAuthorPopup(false))}
                />
                <MorphPopup
                  anchor={colPickerAnchor}
                  data-popup-content="true"
                  onClick={(e) => e.stopPropagation()}
                  style={{ transformOrigin: 'top right' }}
                  className={pickerPopupClass}
                >
                  <CollectionItemsPickerContent
              orderBooks={sortBooks}
                    mode="authors"
                    authors={authors}
                    books={books}
                    selectedAuthorIds={colSelectedAuthorIds}
                    selectedBookIds={colSelectedBookIds}
                    onToggleAuthor={(id) => setColSelectedAuthorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    onToggleBook={(id) => {
                      const adding = !colSelectedBookIds.includes(id);
                      setColSelectedBookIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                      if (adding) {
                        const authorId = findAuthorIdForBook(id);
                        if (authorId) setColSelectedAuthorIds(prev => prev.includes(authorId) ? prev : [...prev, authorId]);
                      }
                    }}
                  />
                </MorphPopup>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        {colSelectedAuthorIds.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-3">
            {t('no_authors_in_collection')}
          </p>
        ) : (
          colSelectedAuthorIds.map((authorId, i) => {
            const author = authors.find(a => a.id === authorId);
            if (!author) return null;
            return (
              <div key={author.id} className={listRowClass}>
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="w-6 text-center text-xs text-[var(--text-muted)] shrink-0">
                    {i + 1}
                  </span>
                  <img
                    src={getEffectiveAuthorAvatar(author.name, author.picture)}
                    alt={author.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <span className="text-sm font-medium text-[var(--text-main)] truncate">
                    {author.name}
                  </span>
                </div>
                <motion.button
                  data-press="true"
                  onClick={() => setColSelectedAuthorIds(prev => prev.filter(id => id !== author.id))}
                  className={removeButtonClass}
                  title={t('remove')}
                >
                  <X size={14} />
                </motion.button>
              </div>
            );
          })
        )}
      </div>
    </div>

    {/* Seção Audiobooks */}
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--text-main)]">
          {t('audiobooks_label')}
        </h2>
        <div className={`relative shrink-0 ${showAddBookPopup ? 'z-50' : 'z-10'}`}>
          <motion.button
            data-press="true"
            animate={morphTriggerAnimate(showAddBookPopup)}
            onClick={(e) => {
              e.stopPropagation();
              if (useFullScreenSheets) { openMobileSheet({ kind: 'collection-form-items', mode: 'books' }); return; }
              setShowAddAuthorPopup(false);
              setColPickerAnchor(e.currentTarget);
              setShowAddBookPopup(!showAddBookPopup);
            }}
            className={addButtonClass}
          >
            <span>{t('add')}</span>
            <Plus size={14} />
          </motion.button>

          <AnimatePresence>
            {showAddBookPopup && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  {...getBackdropProps(() => setShowAddBookPopup(false))}
                />
                <MorphPopup
                  anchor={colPickerAnchor}
                  data-popup-content="true"
                  onClick={(e) => e.stopPropagation()}
                  style={{ transformOrigin: 'top right' }}
                  className={pickerPopupClass}
                >
                  <CollectionItemsPickerContent
              orderBooks={sortBooks}
                    mode="books"
                    authors={authors}
                    books={books}
                    selectedAuthorIds={colSelectedAuthorIds}
                    selectedBookIds={colSelectedBookIds}
                    onToggleAuthor={(id) => setColSelectedAuthorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    onToggleBook={(id) => {
                      const adding = !colSelectedBookIds.includes(id);
                      setColSelectedBookIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                      if (adding) {
                        const authorId = findAuthorIdForBook(id);
                        if (authorId) setColSelectedAuthorIds(prev => prev.includes(authorId) ? prev : [...prev, authorId]);
                      }
                    }}
                  />
                </MorphPopup>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col space-y-1">
        {colSelectedBookIds.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-3">
            {t('no_books_in_collection')}
          </p>
        ) : (
          colSelectedBookIds.map((bookId, i) => {
            const book = books.find(b => b.id === bookId);
            if (!book) return null;
            return (
              <div key={book.id} className={listRowClass}>
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="w-6 text-center text-xs text-[var(--text-muted)] shrink-0">
                    {i + 1}
                  </span>
                  <img
                    src={book.cover || getGenericBookCover(book.title, book.author)}
                    onError={(e) => handleBookCoverError(book, e)}
                    alt={book.title}
                    className="w-6 h-[38px] aspect-[1/1.6] rounded-md object-cover shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-main)] truncate">
                      {book.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {book.author}
                    </p>
                  </div>
                </div>
                <motion.button
                  data-press="true"
                  onClick={() => setColSelectedBookIds(prev => prev.filter(id => id !== book.id))}
                  className={removeButtonClass}
                  title={t('remove')}
                >
                  <X size={14} />
                </motion.button>
              </div>
            );
          })
        )}
      </div>
    </div>
  </motion.div>
  );
}
