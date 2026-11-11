// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { AnimatePresence, motion } from 'motion/react';
import { RiBookOpenLine } from 'react-icons/ri';
import { IS_INSTALLED_APP } from '../../lib/desktopBridge';
import { ChevronRight, Languages, RefreshCw, Upload, X } from 'lucide-react';
import { FADE_IN } from '../../lib/motion';
import { AuthorCard, BookCard, CollectionCard } from '../../components/library/LibraryCards';
import { EmojiIcon } from '../../components/EmojiIcon';
import { getGenreEmoji } from '../../data/catalog';
import { getGenreName } from '../../i18n/genreTranslations';
import { getLanguageData, transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function LibraryScreen() {
  const { activeScreen, books, collectionMenu, collections, currentBook, favoriteAuthorIds, favoriteBookIds, fileInputRef, filteredBooks, handleAddToQueue, handleDeleteBook, handlePlayBookFromStart, handleSelectAuthor, handleSelectBookDetail, handleSyncLibraryNow, isBookCompleted, isBookStarted, isMobile, isPlaying, isSelectionMode, isSyncingLibrary, navigateTo, resolvedLanguage, selectedBooks, setCompletedChapters, setEditingBook, setSelectedBooks, setStartedChapters, setStatusFilter, showToast, sortBooks, sortedAuthors, sortedCollections, sortedGenres, sortedLanguages, statusFilter, t, toggleFavoriteAuthor, toggleFavoriteBook } = useScreenScope();
  return (
    books.length === 0 ? (
      <motion.div 
        key="library-empty" 
        variants={transicaoConteudo} 
        initial="escondido" 
        animate="visivel" 
        exit="saindo" 
      >
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
          {t('nav_library')}
        </h1>
        <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4">
          <div className="w-20 h-20 rounded-full bg-card/75 flex items-center justify-center text-winblue shadow-xl backdrop-blur-3xl mb-5">
            <RiBookOpenLine size={36} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text-main)] tracking-tight mb-2.5">
            {t('empty_home_title')}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mb-7">
            {t('empty_home_desc')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {IS_INSTALLED_APP && (<motion.button
              data-press="true"
              onClick={() => handleSyncLibraryNow()}
              className={`h-11 px-6 rounded-full backdrop-blur-3xl font-semibold text-sm transition-all flex items-center gap-2.5 cursor-pointer ${
                isSyncingLibrary
                  ? 'bg-winblue/20 text-winblue '
                  : 'bg-card/75 shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)]'
              }`}
            >
              <RefreshCw size={16} className={isSyncingLibrary ? "animate-spin text-winblue" : ""} />
              <span>{t('sync_now')}</span>
            </motion.button>)}
            <motion.button
              data-press="true"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 px-6 rounded-full bg-card/75 backdrop-blur-3xl shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] font-semibold text-sm transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Upload size={16} />
              <span>{t('add_audiobooks_button')}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    ) : (
      <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="space-y-12 [&>h1+*]:!mt-0">
      <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
        {t('nav_library')}
      </h1>

      {/* Active Filter Indicator Chip */}
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2 -mb-6">
          <span className="text-xs text-[var(--text-muted)] font-medium">{t('filter_active')}</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-winblue/15 text-xs font-semibold text-winblue shadow-sm">
            {statusFilter === 'in-progress' && t('filter_in_progress')}
            {statusFilter === 'completed' && t('filter_completed')}
            {statusFilter === 'unstarted' && t('filter_unstarted')}
            {statusFilter === 'favorites' && t('filter_favorites')}
            <button 
              onClick={() => { setStatusFilter('all'); showToast(t('filter_removed')); }}
              className="hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
              title={t('remove_filter')}
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {/* 1A. AUDIOBOOKS FAVORITOS */}
      <AnimatePresence>
        {books.some(b => favoriteBookIds.includes(b.id)) && (
          <motion.section
            key="lib-sec-fav-books"
            layout={isMobile ? false : "position"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={FADE_IN}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">{t('favorite_audiobooks')}</h2>
              {books.filter(b => favoriteBookIds.includes(b.id)).length > 6 && (
                <motion.button 
                  data-press="true"
                  onClick={() => navigateTo('library-audiobooks-favoritos')} 
                  className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all"
                >
                  <span>{t('see_all')}</span>
                  <ChevronRight size={15} className="-mr-0.5" />
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
              <AnimatePresence>
                {sortBooks(books.filter(b => favoriteBookIds.includes(b.id))).slice(0, 6).map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onSelect={() => handleSelectBookDetail(book)} 
                    onSelectAuthor={handleSelectAuthor}
                    onPlay={() => handlePlayBookFromStart(book)} 
                    onEdit={() => setEditingBook(book)} 
                    onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                    onDelete={() => {
                      handleDeleteBook(book.id);
                      showToast(t('toast_book_deleted', { title: book.title }));
                    }} 
                    isSelectionMode={isSelectionMode} 
                    isSelected={selectedBooks.includes(book.id)} 
                    onToggleSelect={() => { if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); else setSelectedBooks([...selectedBooks, book.id]); }}
                    isFavorite={favoriteBookIds.includes(book.id)}
                    onToggleFavorite={() => toggleFavoriteBook(book.id)}
                    isBookPlaying={currentBook.id === book.id && isPlaying}
                    isCompleted={isBookCompleted(book)}
                    isStarted={isBookStarted(book)}
                    onToggleCompleted={() => {
                      const isComp = isBookCompleted(book);
                      const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                      if (isComp) {
                        setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                        setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                        showToast(t('toast_book_marked_unstarted', { title: book.title }));
                      } else {
                        setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                        setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                        showToast(t('toast_book_marked_completed', { title: book.title }));
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 1B. AUTORES FAVORITOS */}
      <AnimatePresence>
        {sortedAuthors.some(a => favoriteAuthorIds.includes(a.id)) && (
          <motion.section
            key="lib-sec-fav-authors"
            layout={isMobile ? false : "position"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={FADE_IN}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">{t('favorite_authors')}</h2>
              {sortedAuthors.filter(a => favoriteAuthorIds.includes(a.id)).length > 6 && (
                <motion.button 
                  data-press="true"
                  onClick={() => navigateTo('library-autores-favoritos')} 
                  className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all"
                >
                  <span>{t('see_all')}</span>
                  <ChevronRight size={15} className="-mr-0.5" />
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
              <AnimatePresence>
                {sortedAuthors.filter(a => favoriteAuthorIds.includes(a.id)).slice(0, 6).map((author) => (
                  <AuthorCard 
                    key={author.id}
                    author={author}
                    onSelect={() => navigateTo('author-detail', author)}
                    isFavorite={favoriteAuthorIds.includes(author.id)}
                    onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 1C. COLEÇÕES PERSONALIZADAS (logo depois dos favoritos): em cards como idiomas e gêneros */}
      <AnimatePresence>
        {collections.length > 0 && (
          <motion.section
            key="lib-sec-collections"
            layout={isMobile ? false : "position"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={FADE_IN}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">{t('collections')}</h2>
              {collections.length > (isMobile ? 6 : 4) && (
                <motion.button 
                  data-press="true"
                  onClick={() => navigateTo('library-colecoes')} 
                  className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>{t('see_all')}</span>
                  <ChevronRight size={15} className="-mr-0.5" />
                </motion.button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-row">
              <AnimatePresence>
                {sortedCollections.slice(0, isMobile ? 6 : 4).map((col) => (
                  <CollectionCard
                    key={col.id}
                    col={col}
                    menu={collectionMenu(col)}
                    onClick={() => navigateTo('library-colecao-' + col.id, col)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 2. GÊNEROS */}
      <AnimatePresence>
        {sortedGenres.length > 0 && (
          <motion.section
            key="lib-sec-genres"
            layout={isMobile ? false : "position"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={FADE_IN}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">{t('genres')}</h2>
              {sortedGenres.length > (isMobile ? 6 : 4) && (
                <motion.button 
                  data-press="true"
                  onClick={() => navigateTo('library-gêneros')} 
                  className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all"
                >
                  <span>{t('see_all')}</span>
                  <ChevronRight size={15} className="-mr-0.5" />
                </motion.button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-row">
              <AnimatePresence>
                {sortedGenres.slice(0, isMobile ? 6 : 4).map((genreData) => {
                  return (
                    <motion.div 
                      key={genreData.id} 
                      layout="position"
                      initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                      transition={FADE_IN}
                      onClick={() => navigateTo('library-genre-' + genreData.id)}
                      className="relative isolate category-card aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg transition-[border-color,box-shadow] p-5 flex flex-col justify-end"
                    >
                      {/* Camada interna recortada com fundo e ícone com zoom */}
                      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                        <div className={`absolute inset-0 bg-gradient-to-br ${genreData.gradient}`} />
                        <div className="absolute inset-0 bg-black/15" />

                        <span className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 text-7xl sm:text-8xl select-none pointer-events-none card-tone-icon">
                          <EmojiIcon emoji={getGenreEmoji(genreData.id)} />
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md tracking-tight category-card-title origin-bottom-left rtl:origin-bottom-right transition-transform duration-500">{getGenreName(genreData.id, resolvedLanguage)}</h3>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 3. AUTORES */}
      <AnimatePresence>
        {sortedAuthors.length > 0 && (
          <motion.section
            key="lib-sec-authors"
            layout={isMobile ? false : "position"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={FADE_IN}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">{t('authors')}</h2>
              {sortedAuthors.length > 6 && (
                <motion.button 
                  data-press="true"
                  onClick={() => navigateTo('library-autores')} 
                  className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all"
                >
                  <span>{t('see_all')}</span>
                  <ChevronRight size={15} className="-mr-0.5" />
                </motion.button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
              <AnimatePresence>
                {sortedAuthors.slice(0, 6).map((author) => (
                  <AuthorCard 
                    key={author.id}
                    author={author}
                    onSelect={() => navigateTo('author-detail', author)}
                    isFavorite={favoriteAuthorIds.includes(author.id)}
                    onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 4. IDIOMAS: em cards como os de gêneros, mas com bandeiras */}
      <AnimatePresence>
        {sortedLanguages.length > 0 && (
          <motion.section
            key="lib-sec-languages"
            layout={isMobile ? false : "position"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={FADE_IN}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">{t('languages')}</h2>
              {/* Só quando há mais idiomas do que a seção mostra */}
              {sortedLanguages.length > (isMobile ? 6 : 4) && (
              <motion.button 
                data-press="true"
                onClick={() => navigateTo('library-idiomas')} 
                className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all"
              >
                <span>{t('see_all')}</span>
                <ChevronRight size={15} className="-mr-0.5" />
              </motion.button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-row">
              <AnimatePresence>
                {sortedLanguages.slice(0, isMobile ? 6 : 4).map((lang) => {
                  const langData = getLanguageData(lang, resolvedLanguage);
                  return (
                    <motion.div 
                      key={lang} 
                      layout="position"
                      initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                      transition={FADE_IN}
                      // Como os outros cards: empilha a partir da tela atual (voltar retorna para cá, não para "Idiomas")
                      onClick={() => navigateTo('library-idioma-' + lang.toLowerCase(), lang)}
                      className="relative isolate category-card aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg transition-[border-color,box-shadow] p-5 flex flex-col justify-end"
                    >
                      {/* Camada interna recortada com fundo e bandeira com zoom */}
                      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                        <div className={`absolute inset-0 bg-gradient-to-br ${langData.gradient}`} />
                        <div className="absolute inset-0 bg-black/15" />

                        <span className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 text-7xl sm:text-8xl select-none pointer-events-none card-tone-icon">
                          <Languages size="1em" strokeWidth={2} aria-hidden="true" className="inline-block align-[-0.125em]" />
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md tracking-tight category-card-title origin-bottom-left rtl:origin-bottom-right transition-transform duration-500">{langData.name}</h3>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>



      {/* 5. TODOS OS AUDIOBOOKS: seguindo a lógica da filtragem */}
      <motion.section layout="position">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t('all_audiobooks')}</h2>
          {filteredBooks.length > 6 && (
            <motion.button 
              data-press="true"
              onClick={() => navigateTo('library-títulos')} 
              className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all"
            >
              <span>{t('see_all')}</span>
              <ChevronRight size={15} className="-mr-0.5" />
            </motion.button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
          <AnimatePresence>
            {filteredBooks.slice(0, 6).map((book) => (
              <BookCard 
                key={book.id}
                book={book} 
                onSelect={() => handleSelectBookDetail(book)} 
                onSelectAuthor={handleSelectAuthor}
                onPlay={() => handlePlayBookFromStart(book)} 
                onEdit={() => setEditingBook(book)} 
                onAddToQueue={(pos) => handleAddToQueue(book, pos)}
                onDelete={() => {
                  handleDeleteBook(book.id);
                  showToast(t('toast_book_deleted', { title: book.title }));
                }} 
                isSelectionMode={isSelectionMode} 
                isSelected={selectedBooks.includes(book.id)} 
                onToggleSelect={() => { if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); else setSelectedBooks([...selectedBooks, book.id]); }}
                isFavorite={favoriteBookIds.includes(book.id)}
                onToggleFavorite={() => toggleFavoriteBook(book.id)}
                isBookPlaying={currentBook.id === book.id && isPlaying}
                isCompleted={isBookCompleted(book)}
                isStarted={isBookStarted(book)}
                onToggleCompleted={() => {
                  const isComp = isBookCompleted(book);
                  const chapIds = (book.chapters || []).map((c: any) => `${book.id}-${c.id}`);
                  if (isComp) {
                    setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                    setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                    showToast(t('toast_book_marked_unstarted', { title: book.title }));
                  } else {
                    setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                    setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                    showToast(t('toast_book_marked_completed', { title: book.title }));
                  }
                }}
              />
            ))}
          </AnimatePresence>
          {filteredBooks.length === 0 && (
            <p className="col-span-full text-xs text-[var(--text-muted)] py-4">{t('no_books_filtered')}</p>
          )}
        </div>
      </motion.section>

      </motion.div>
    )
  );
}
