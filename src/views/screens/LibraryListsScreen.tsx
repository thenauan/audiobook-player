// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Edit3, Languages, Plus, X } from 'lucide-react';
import React from 'react';
import { Audiobook, Collection, GENRE_HIERARCHY, getGenreEmoji, getSubgenreEmoji, getSubgenreGradient, isBookInGenre, isBookInSubgenre, resolveNarratorAndLanguage } from '../../data/catalog';
import { EmojiIcon } from '../../components/EmojiIcon';
import { getGenreName, getSubgenreName } from '../../i18n/genreTranslations';
import { getLanguageCardName, getLanguageDisplayName, normalizeAudiobookLanguage } from '../../i18n/translations';
import { AuthorCard, BookCard, CollectionCard } from '../../components/library/LibraryCards';
import { FADE_IN, SPRING } from '../../lib/motion';
import { getLanguageData, transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function LibraryListsScreen() {
  const { activeAllBooksNavId, activeScreen, allBooksNavGroups, alphaNavPressRef, books, collectionMenu, collections, currentBook, favoriteAuthorIds, favoriteBookIds, filteredBooks, getCollectionItems, getCollectionSubScreen, getCollectionSubScreenTitle, handleAddToQueue, handleDeleteBook, handlePlayBookFromStart, handleScrollToGroup, handleSelectAuthor, handleSelectBookDetail, handleStartEditCurrentCollection, isBookCompleted, isBookStarted, isMobile, isMobileAlphaNavOpen, isPlayerVisible, isPlaying, isSelectionMode, matchesBookSearch, navigateTo, recentlyAddedBooks, recentlyListenedBookIds, recentlyListenedBooks, renderCollectionAuthorCard, renderCollectionBookCard, resolvedLanguage, searchQuery, selectedAuthors, selectedBooks, selectedCollectionIds, selectedGenres, selectedLanguages, setCompletedChapters, setEditingBook, setIsMobileAlphaNavOpen, setSelectedAuthors, setSelectedBooks, setSelectedCollectionIds, setSelectedGenres, setSelectedLanguages, setStartedChapters, setStatusFilter, showToast, sortBooks, sortBy, sortedAuthors, sortedCollections, sortedGenres, sortedLanguages, statusFilter, t, toggleFavoriteAuthor, toggleFavoriteBook } = useScreenScope();
  // Índice de letras: arrastando o dedo, o destaque segue o dedo (e não a rolagem da tela)
  const [navDragId, setNavDragId] = React.useState<string | null>(null);
  return (
    <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="space-y-8">
      {/* Título e Barra de Navegação (Sticky em Todos os Audiobooks) */}
      {activeScreen.id === 'library-títulos' ? (
        <>
          <div className={`flex flex-col gap-3 mb-8 ${sortBy === 'name-asc' || sortBy === 'name-desc' ? 'pr-[60px]' : 'pr-[74px]'}`}>
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">
              {t('all_audiobooks')}
            </h1>

            {/* Active Filter Indicator Chip */}
            {statusFilter !== 'all' && (
              <div className="flex items-center gap-2">
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
          </div>

          {/* Pop up / Barra de Navegação e Filtro Vertical Fixa na Margem Direita */}
          {allBooksNavGroups.length > 0 && (() => {
            const isAlphabetMode = sortBy === 'name-asc' || sortBy === 'name-desc';
            const hasMoreThan12 = allBooksNavGroups.length > 12;
            // Exibir no máximo 12 elementos completos + pedaço do 13º para sinalizar rolagem:
            // Modo alfabético: 12 itens * 36px (32+4) + 14px do 13º + 12px de padding vertical = 458px
            // Modo década/duração: 12 itens * 34px (28+6) + 12px do 13º + 12px de padding vertical = 432px
            const navMaxHeight = hasMoreThan12 
              ? (isAlphabetMode ? '458px' : '432px') 
              : undefined;

            // Mobile: sempre visível no canto direito com todos os itens, bem pequena (só a letra atual
            // na cor de destaque); ao tocar, cresce para o tamanho normal. Arrastar o dedo navega pelos itens.
            const currentNavId = navDragId || activeAllBooksNavId || allBooksNavGroups[0]?.id;
            const isCompactNav = isMobile && !isMobileAlphaNavOpen;
            const navCount = allBooksNavGroups.length;
            const itemH = isCompactNav ? 17 : (isAlphabetMode ? 36 : 34);
            const mobileNavHeight = `min(${navCount * itemH + 8}px, calc(100dvh - 260px))`;
            const navItemAt = (clientY: number, navEl: HTMLElement) => {
              const r = navEl.getBoundingClientRect();
              const hit = document.elementFromPoint(r.left + r.width / 2, Math.max(r.top + 2, Math.min(r.bottom - 2, clientY)));
              return (hit?.closest('[data-nav-id]') as HTMLElement | null)?.dataset.navId || null;
            };
            const mobileNavHandlers = isMobile ? {
              onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
                alphaNavPressRef.current = { y: e.clientY, moved: false, lastId: null, opened: isCompactNav } as any;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                // Compacto: já abre no tamanho normal ao encostar o dedo (dá para arrastar em seguida)
                if (isCompactNav) setIsMobileAlphaNavOpen(true);
              },
              onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
                const press = alphaNavPressRef.current;
                if (!press) return;
                if (Math.abs(e.clientY - press.y) > 6) press.moved = true;
                if (!press.moved) return;
                const id = navItemAt(e.clientY, e.currentTarget);
                if (id && id !== press.lastId) {
                  press.lastId = id;
                  setNavDragId(id);
                  handleScrollToGroup(id, true);
                  try { navigator.vibrate?.(5); } catch {}
                }
              },
              onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
                const press = alphaNavPressRef.current;
                alphaNavPressRef.current = null;
                setNavDragId(null);
                if (!press) return;
                if (press.moved) { setIsMobileAlphaNavOpen(false); return; }
                // Só encostou no índice compacto: ele fica aberto para escolher
                if ((press as any).opened) return;
                const id = navItemAt(e.clientY, e.currentTarget);
                if (id) handleScrollToGroup(id);
                setIsMobileAlphaNavOpen(false);
              },
              onPointerCancel: () => { alphaNavPressRef.current = null; setNavDragId(null); },
            } : {};
            return (
              <>
                {isMobile && isMobileAlphaNavOpen && (
                  <div className="fixed inset-0 z-[29]" onClick={() => setIsMobileAlphaNavOpen(false)} />
                )}
                <aside
                  className={`fixed z-30 pointer-events-auto flex items-center justify-center transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] top-1/2 -translate-y-1/2 ${
                    isMobile ? 'right-1.5' : 'right-6'
                  } ${
                    isCompactNav
                      ? (isAlphabetMode ? 'w-6' : 'w-[42px]')
                      : (isAlphabetMode ? 'w-11' : 'w-[58px]')
                  }`}
                  style={{
                    maxHeight: isMobile ? 'calc(100dvh - 260px)' : (isPlayerVisible ? 'calc(100vh - 190px)' : 'calc(100vh - 120px)'),
                    // Celular deitado: fora do notch/Dynamic Island do lado direito
                    ...(isMobile ? { right: 'max(6px, calc(var(--safe-right) + 4px))' } : {}),
                  }}
                  aria-label={t('audiobooks_filter_aria')}
                >
                  <nav
                    {...mobileNavHandlers}
                    className={`w-full flex flex-col items-center no-scrollbar select-none transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isCompactNav
                        ? 'p-0.5 gap-0 rounded-full bg-card/55 backdrop-blur-xl shadow-md overflow-hidden'
                        : `p-1.5 bg-card/85 backdrop-blur-3xl shadow-2xl ${isMobile ? 'overflow-hidden' : 'overflow-y-auto'} ${isAlphabetMode ? 'rounded-full gap-1' : 'rounded-[18px] gap-1.5'}`
                    }`}
                    style={{
                      ...(isMobile ? { height: mobileNavHeight, touchAction: 'none' } : { maxHeight: navMaxHeight || '100%' }),
                    }}
                  >
                    {allBooksNavGroups.map(group => {
                      const isSelected = currentNavId === group.id;
                      return (
                        <button
                          key={group.id}
                          id={`nav-item-${group.id}`}
                          data-nav-id={group.id}
                          // No mobile o toque/arraste é tratado pela barra; aqui só teclado e desktop
                          onClick={(e) => { if (!isMobile || e.detail === 0) handleScrollToGroup(group.id); }}
                          className={`relative flex items-center justify-center font-bold transition-[font-size,height,max-height,width,color] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                            isMobile ? 'flex-1 min-h-0 w-full' : 'shrink-0'
                          } ${
                            isCompactNav
                              ? `rounded-full text-[8px] leading-none ${isSelected ? 'text-winblue' : 'text-[var(--text-muted)]'}`
                              : `${isAlphabetMode
                                  ? `${isMobile ? 'max-h-8' : 'aspect-square w-8 h-8'} rounded-full text-xs`
                                  : `${isMobile ? 'max-h-7' : 'w-full h-7'} px-1 rounded-[12px] text-[10px] tracking-tight`
                                } ${
                                  isSelected
                                    ? 'text-winblue '
                                    : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--hover-fill)] '
                                }`
                          }`}
                          title={group.title}
                        >
                          {/* Destaque como o da barra de abas: a mesma cor e uma pílula só, que desliza até a letra
                              (mais forte enquanto o dedo está apoiado) */}
                          {isSelected && !isCompactNav && (
                            <motion.span
                              layoutId="alpha-nav-pill"
                              transition={SPRING.snappy}
                              aria-hidden="true"
                              className={`absolute inset-0 ${isAlphabetMode ? 'rounded-full' : 'rounded-[12px]'} ${navDragId ? 'bg-[var(--ios-fill-strong)]' : 'bg-[var(--ios-fill)]'} transition-colors duration-200`}
                            />
                          )}
                          <span className="relative z-10 whitespace-nowrap select-none">
                            {group.navLabel}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </aside>
              </>
            );
          })()}
        </>
      ) : (
        <>
          {/* Coleção: o próprio card (degradê, ícone, nome e descrição) é o título da tela. No celular
              fica de ponta a ponta no topo, como a foto dos autores, mas sem desfoque */}
          {activeScreen.id.startsWith('library-colecao-') && (() => {
            const colId = activeScreen.id.replace('library-colecao-', '');
            const c = collections.find(item => item.id === colId) || (activeScreen.data as Collection);
            if (!c) return null;
            const desc = c.description?.trim();
            const fade = 'linear-gradient(to bottom, black 0%, black calc(100% - 120px), rgba(0,0,0,0.82) calc(100% - 96px), rgba(0,0,0,0.5) calc(100% - 64px), rgba(0,0,0,0.18) calc(100% - 32px), transparent 100%)';
            return (
              <>
                <div className="collection-hero relative mb-6 md:mb-10">
                  <div data-zoom-hero-collection="true" className="relative w-full h-[min(92vw,50dvh)] md:h-[min(52vh,440px)]">
                    {/* O degradê continua 120px abaixo do bloco, dissolvendo na tela */}
                    <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none" style={{ height: 'calc(100% + 120px)', WebkitMaskImage: fade, maskImage: fade }}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`} />
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/35 to-transparent" />
                    </div>
                    <span aria-hidden="true" className="absolute right-2 rtl:right-auto rtl:left-2 bottom-2 md:right-10 md:bottom-4 text-[150px] md:text-[220px] leading-none card-tone-icon select-none pointer-events-none"><EmojiIcon emoji={c.emoji} /></span>
                    <div className="absolute inset-x-0 bottom-0 px-5 pb-6 md:px-8 md:pb-10 flex flex-col items-start text-left rtl:items-end rtl:text-right text-white">
                      <h2 data-screen-title="true" className="text-[30px] md:text-5xl font-bold leading-tight tracking-tight line-clamp-2 drop-shadow-md">{c.name}</h2>
                      {desc && <p className="text-[14px] md:text-base font-medium text-white/85 mt-1 md:mt-2 line-clamp-2 max-w-2xl [text-shadow:0_1px_8px_rgba(0,0,0,0.25)]">{desc}</p>}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
          {/* Título grande fora do cabeçalho, no mesmo padrão dos menus principais */}
          <h1 className={`text-4xl md:text-5xl font-semibold text-[var(--text-main)] mb-8 tracking-tight ${activeScreen.id.startsWith('library-colecao-') ? 'hidden' : ''}`}>
            {(() => {
              if (activeScreen.id === 'home-continuar-ouvindo') return t('section_continue_listening');
              if (activeScreen.id === 'home-ouvidos-recentemente') return t('section_recently_listened');
              if (activeScreen.id === 'home-adicionados-recentemente') return t('section_recently_added');
              if (activeScreen.id === 'history') return t('history');
              if (activeScreen.id.startsWith('library-genre-')) {
                const genreId = activeScreen.id.replace('library-genre-', '');
                const genreData = Object.values(GENRE_HIERARCHY).find(g => g.id === genreId);
                return genreData ? getGenreName(genreData.id, resolvedLanguage) : t('genres');
              }
              if (activeScreen.id.startsWith('library-subgenre-')) {
                if (activeScreen.data?.subgenre) return getSubgenreName(activeScreen.data.subgenre, resolvedLanguage);
                if (typeof activeScreen.data === 'string') return getSubgenreName(activeScreen.data, resolvedLanguage);
                const after = activeScreen.id.replace('library-subgenre-', '');
                const matchedGenre = Object.values(GENRE_HIERARCHY)
                  .sort((a, b) => b.id.length - a.id.length)
                  .find(g => after.startsWith(g.id + '-'));
                const subName = matchedGenre ? after.substring(matchedGenre.id.length + 1) : after;
                return getSubgenreName(subName, resolvedLanguage) || t('subgenre');
              }
              const sub = activeScreen.id.replace('library-', '');
              if (activeScreen.id === 'library-ouvidos-recentemente' || activeScreen.id === 'history') return t('recently_listened');
              if (activeScreen.id === 'library-idiomas') return t('languages');
              if (activeScreen.id === 'library-colecoes') return t('collections');
              const h1ColSubTitle = getCollectionSubScreenTitle(activeScreen.id, activeScreen.data);
              if (h1ColSubTitle) return h1ColSubTitle;
              if (activeScreen.id.startsWith('library-colecao-')) {
                const colId = activeScreen.id.replace('library-colecao-', '');
                const c = collections.find(item => item.id === colId) || (activeScreen.data as Collection);
                return c?.name || t('collection');
              }
              if (activeScreen.id.startsWith('library-idioma-')) {
                const l = activeScreen.data || activeScreen.id.replace('library-idioma-', '');
                if (normalizeAudiobookLanguage(l) === 'Outro') {
                  return getLanguageCardName(l, resolvedLanguage);
                }
                return t('books_in_language', { lang: getLanguageDisplayName(l, resolvedLanguage) });
              }
              const subNames: Record<string, string> = {
                'favoritos': t('favorite_audiobooks'),
                'audiobooks-favoritos': t('favorite_audiobooks'),
                'autores-favoritos': t('favorite_authors'),
                'títulos': t('all_audiobooks'),
                'autores': t('authors'),
                'gêneros': t('genres'),
                'idiomas': t('languages'),
                'colecoes': t('collections'),
                'ouvidos-recentemente': t('recently_listened'),
              };
              if (subNames[sub]) return subNames[sub];
              const cat = books.find(b => b.category.toLowerCase() === sub.toLowerCase())?.category;
              if (cat) return cat;
              return sub.charAt(0).toUpperCase() + sub.slice(1);
            })()}
          </h1>


          {/* Active Filter Indicator Chip */}
          {statusFilter !== 'all' && activeScreen.id !== 'library-autores' && activeScreen.id !== 'library-autores-favoritos' && (
            <div className="flex items-center gap-2 -mt-4 mb-4">
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
        </>
      )}

      {/* Conteúdo específico de cada submenu */}
      {(activeScreen.id === 'library-audiobooks-favoritos' || activeScreen.id === 'library-favoritos') ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
          <AnimatePresence>
            {sortBooks(books.filter(b => {
              if (!favoriteBookIds.includes(b.id)) return false;
              if (statusFilter === 'in-progress') return isBookStarted(b) && !isBookCompleted(b);
              if (statusFilter === 'completed') return isBookCompleted(b);
              if (statusFilter === 'unstarted') return !isBookStarted(b) && !isBookCompleted(b);
              return true;
            })).map((book) => (
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
          {books.filter(b => {
            if (!favoriteBookIds.includes(b.id)) return false;
            if (statusFilter === 'in-progress') return isBookStarted(b) && !isBookCompleted(b);
            if (statusFilter === 'completed') return isBookCompleted(b);
            if (statusFilter === 'unstarted') return !isBookStarted(b) && !isBookCompleted(b);
            return true;
          }).length === 0 && (
            <div className="col-span-full py-16 text-center w-full">
              <p className="text-base text-[var(--text-muted)]">
                {statusFilter !== 'all' && statusFilter !== 'favorites' 
                  ? t('no_books_filtered')
                  : t('empty_favorites')}
              </p>
            </div>
          )}
        </div>
      ) : activeScreen.id === 'library-autores-favoritos' ? (
        sortedAuthors.filter(a => favoriteAuthorIds.includes(a.id)).length === 0 ? (
          <div className="col-span-full py-16 text-center w-full">
            <p className="text-base text-[var(--text-muted)]">{t('empty_favorites')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
            <AnimatePresence>
              {sortedAuthors.filter(a => favoriteAuthorIds.includes(a.id)).map((author) => {
                const isFav = favoriteAuthorIds.includes(author.id);
                const isSelected = selectedAuthors.includes(author.id);
                return (
                  <AuthorCard 
                    key={author.id}
                    author={author}
                    onSelect={() => navigateTo('author-detail', author)}
                    isFavorite={isFav}
                    onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
                    isSelectionMode={isSelectionMode}
                    isSelected={isSelected}
                    onToggleSelect={() => {
                      if (isSelected) {
                        setSelectedAuthors(selectedAuthors.filter(id => id !== author.id));
                      } else {
                        setSelectedAuthors([...selectedAuthors, author.id]);
                      }
                    }}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )
      ) : activeScreen.id === 'library-idiomas' ? (
        sortedLanguages.length === 0 ? (
          <div className="col-span-full py-16 text-center w-full">
            <p className="text-base text-[var(--text-muted)]">{t('no_languages_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-grid-2">
            <AnimatePresence>
              {sortedLanguages.map((lang) => {
                const langData = getLanguageData(lang, resolvedLanguage);
                const isSelected = selectedLanguages.includes(lang.toLowerCase());
                return (
                  <motion.div 
                    key={lang} 
                    layout="position"
                    initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                    transition={FADE_IN}
                    onClick={() => {
                      if (isSelectionMode) {
                        if (isSelected) {
                          setSelectedLanguages(selectedLanguages.filter(l => l !== lang.toLowerCase()));
                        } else {
                          setSelectedLanguages([...selectedLanguages, lang.toLowerCase()]);
                        }
                      } else {
                        navigateTo('library-idioma-' + lang.toLowerCase(), lang);
                      }
                    }}
                    className={`relative isolate category-card aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg transition-[border-color,box-shadow] p-5 flex flex-col justify-end ${
                      isSelectionMode && isSelected
                        ? ' '
                        : ' '
                    }`}
                  >
                    {/* Camada interna recortada com fundo e bandeira com zoom */}
                    <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                      <div className={`absolute inset-0 bg-gradient-to-br ${langData.gradient} ${isSelectionMode && isSelected ? 'opacity-70' : ''}`} />
                      <div className="absolute inset-0 bg-black/15" />

                      <span className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 text-7xl sm:text-8xl select-none pointer-events-none card-tone-icon">
                        <Languages size="1em" strokeWidth={2} aria-hidden="true" className="inline-block align-[-0.125em]" />
                      </span>
                    </div>

                    {isSelectionMode && (
                      <div className="absolute top-4 right-4 z-20">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-winblue text-white shadow-lg' : ' bg-black/30 text-transparent'
                        }`}>
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                    )}

                    <div className="relative z-10">
                      <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md tracking-tight category-card-title origin-bottom-left rtl:origin-bottom-right transition-transform duration-500">{langData.name}</h3>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      ) : activeScreen.id.startsWith('library-idioma-') ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
          {(() => {
            const selectedLang = (activeScreen.data || activeScreen.id.replace('library-idioma-', '')).toLowerCase();
            const langBooks = filteredBooks.filter(b => {
              const { language } = resolveNarratorAndLanguage(b);
              if (!language) return false;
              return language.toLowerCase() === selectedLang;
            });
            if (langBooks.length === 0) {
              return (
                <div className="col-span-full py-16 text-center w-full">
                  <p className="text-base text-[var(--text-muted)]">{t('no_books_in_language')}</p>
                </div>
              );
            }
            return (
              <AnimatePresence>
                {langBooks.map((book) => (
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
            );
          })()}
        </div>
      ) : activeScreen.id === 'library-ouvidos-recentemente' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
          <AnimatePresence>
            {(sortBy !== 'name-asc' ? sortBooks(recentlyListenedBooks) : recentlyListenedBooks).map((book) => (
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
      ) : activeScreen.id === 'library-colecoes' ? (
        // Sem coleções não há esta tela (o app volta sozinho)
        collections.length === 0 ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-grid-2">
            <AnimatePresence>
              {sortedCollections.map((col) => {
                const isSelected = selectedCollectionIds.includes(col.id);
                return (
                  <CollectionCard
                    key={col.id}
                    col={col}
                    selectionMode={isSelectionMode}
                    selected={isSelected}
                    menu={collectionMenu(col)}
                    onClick={() => {
                      if (isSelectionMode) {
                        setSelectedCollectionIds(isSelected
                          ? selectedCollectionIds.filter(id => id !== col.id)
                          : [...selectedCollectionIds, col.id]);
                      } else {
                        navigateTo('library-colecao-' + col.id, col);
                      }
                    }}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )
      ) : getCollectionSubScreen(activeScreen.id, activeScreen.data) ? (
        (() => {
          // Sub-página "Ver tudo" de uma coleção (ex.: Audiobooks em Clássicos)
          const info = getCollectionSubScreen(activeScreen.id, activeScreen.data)!;
          if (!info.collection) {
            return (
              <div className="py-16 text-center text-[var(--text-muted)] w-full">
                {t('no_collections_yet')}
              </div>
            );
          }
          const items = getCollectionItems(info.collection);
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
              <AnimatePresence>
                {info.kind === 'audiobooks'
                  ? items.books.map(book => renderCollectionBookCard(book, info.collection!.id))
                  : items.authors.map(author => renderCollectionAuthorCard(author, info.collection!.id))}
              </AnimatePresence>
            </div>
          );
        })()
      ) : activeScreen.id.startsWith('library-colecao-') ? (
        (() => {
          const colId = activeScreen.id.replace('library-colecao-', '');
          const currentCollection = collections.find(c => c.id === colId) || (activeScreen.data as Collection);
          if (!currentCollection) {
            return (
              <div className="py-16 text-center text-[var(--text-muted)] w-full">
                {t('no_collections_yet')}
              </div>
            );
          }

          const { books: colBooks, authors: colAuthors } = getCollectionItems(currentCollection);

          return (
            <div className="w-full flex flex-col">
              {/* Seção Autores na Coleção (até 6; o restante em "Ver tudo") */}
              {colAuthors.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-main)]">{t('authors')}</h2>
                    {colAuthors.length > 6 && (
                      <motion.button
                        data-press="true"
                        onClick={() => navigateTo('library-col-autores-' + currentCollection.id, currentCollection)}
                        className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all"
                      >
                        <span>{t('see_all')}</span>
                        <ChevronRight size={15} className="-mr-0.5 rtl:rotate-180" />
                      </motion.button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                    <AnimatePresence>
                      {colAuthors.slice(0, 6).map(author => renderCollectionAuthorCard(author, currentCollection.id))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Seção Audiobooks na Coleção (até 6; o restante em "Ver tudo") */}
              {colBooks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-main)]">{t('audiobooks_label')}</h2>
                    {colBooks.length > 6 && (
                      <motion.button
                        data-press="true"
                        onClick={() => navigateTo('library-col-audiobooks-' + currentCollection.id, currentCollection)}
                        className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all"
                      >
                        <span>{t('see_all')}</span>
                        <ChevronRight size={15} className="-mr-0.5 rtl:rotate-180" />
                      </motion.button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                    <AnimatePresence>
                      {colBooks.slice(0, 6).map(book => renderCollectionBookCard(book, currentCollection.id))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Estado Vazio se nenhum item na coleção */}
              {colBooks.length === 0 && colAuthors.length === 0 && (
                <div className="col-span-full py-16 text-center w-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-winblue/10 text-winblue flex items-center justify-center mb-4">
                    <Plus size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-1">{t('no_items_in_collection')}</h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{t('no_items_in_collection_sub')}</p>
                  <motion.button
                    data-press="true"
                    onClick={() => handleStartEditCurrentCollection(currentCollection)}
                    className="h-10 px-5 rounded-full bg-winblue text-white font-semibold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 size={15} />
                    <span>{t('edit_collection')}</span>
                  </motion.button>
                </div>
              )}
            </div>
          );
        })()
      ) : activeScreen.id === 'library-autores' ? (
        sortedAuthors.length === 0 ? (
          <div className="col-span-full py-16 text-center w-full">
            <p className="text-base text-[var(--text-muted)]">{t('no_authors_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
            <AnimatePresence>
              {sortedAuthors.map((author) => {
                const isFav = favoriteAuthorIds.includes(author.id);
                const isSelected = selectedAuthors.includes(author.id);
                return (
                  <AuthorCard 
                    key={author.id}
                    author={author}
                    onSelect={() => navigateTo('author-detail', author)}
                    isFavorite={isFav}
                    onToggleFavorite={() => toggleFavoriteAuthor(author.id)}
                    isSelectionMode={isSelectionMode}
                    isSelected={isSelected}
                    onToggleSelect={() => {
                      if (isSelected) {
                        setSelectedAuthors(selectedAuthors.filter(id => id !== author.id));
                      } else {
                        setSelectedAuthors([...selectedAuthors, author.id]);
                      }
                    }}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )
      ) : activeScreen.id === 'library-gêneros' ? (
        sortedGenres.length === 0 ? (
          <div className="col-span-full py-16 text-center w-full">
            <p className="text-base text-[var(--text-muted)]">{t('no_genres_found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-grid-2">
            <AnimatePresence>
              {sortedGenres.map((genreData) => {
                const isSelected = selectedGenres.includes(genreData.id);
                return (
                  <motion.div 
                    key={genreData.id} 
                    layout="position"
                    initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                    transition={FADE_IN}
                    onClick={() => {
                      if (isSelectionMode) {
                        if (isSelected) {
                          setSelectedGenres(selectedGenres.filter(id => id !== genreData.id));
                        } else {
                          setSelectedGenres([...selectedGenres, genreData.id]);
                        }
                      } else {
                        navigateTo('library-genre-' + genreData.id);
                      }
                    }}
                    className={`relative isolate category-card aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg transition-[border-color,box-shadow] p-5 flex flex-col justify-end ${
                      isSelectionMode && isSelected 
                        ? ' ' 
                        : ' '
                    }`}
                  >
                    {/* Camada interna recortada com fundo e ícone com zoom */}
                    <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                      <div className={`absolute inset-0 bg-gradient-to-br ${genreData.gradient} ${isSelectionMode && isSelected ? 'opacity-70' : ''}`} />
                      <div className="absolute inset-0 bg-black/15" />

                      <span className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 text-8xl sm:text-9xl select-none pointer-events-none card-tone-icon">
                        <EmojiIcon emoji={getGenreEmoji(genreData.id)} />
                      </span>
                    </div>

                    {isSelectionMode && (
                      <div className="absolute top-4 right-4 z-20">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-winblue text-white shadow-lg' : ' bg-black/30 text-transparent'
                        }`}>
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                    )}

                    {/* Nome do Gênero com texto maior */}
                    <div className="relative z-10">
                      <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md tracking-tight category-card-title origin-bottom-left rtl:origin-bottom-right transition-transform duration-500">{getGenreName(genreData.id, resolvedLanguage)}</h3>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      ) : (
        <div className="w-full flex flex-col space-y-10">
          {(() => {
            const renderBookCard = (book: Audiobook) => (
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
                onToggleSelect={() => { 
                  if (selectedBooks.includes(book.id)) {
                    setSelectedBooks(selectedBooks.filter(id => id !== book.id));
                  } else {
                    setSelectedBooks([...selectedBooks, book.id]);
                  }
                }}
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
            );

            const renderBookGrid = (subBooks: Audiobook[]) => {
              const isHomeSubmenu = activeScreen.id.startsWith('home-');
              let displayedBooks = subBooks.filter(b => {
                const matchesSearch = !searchQuery || matchesBookSearch(b, searchQuery);
                if (!matchesSearch) return false;

                if (!isHomeSubmenu) {
                  if (statusFilter === 'in-progress') return isBookStarted(b) && !isBookCompleted(b);
                  if (statusFilter === 'completed') return isBookCompleted(b);
                  if (statusFilter === 'unstarted') return !isBookStarted(b) && !isBookCompleted(b);
                }
                if (statusFilter === 'favorites') return favoriteBookIds.includes(b.id);
                return true;
              });

              const isPreservedOrderRoute = 
                activeScreen.id === 'home-continuar-ouvindo' || 
                activeScreen.id === 'home-ouvidos-recentemente' || 
                activeScreen.id === 'home-adicionados-recentemente';

              if (!isPreservedOrderRoute || sortBy !== 'name-asc') {
                displayedBooks = sortBooks(displayedBooks);
              }

              if (displayedBooks.length === 0) {
                return (
                  <div className="col-span-full py-16 text-center w-full">
                    <p className="text-base text-[var(--text-muted)]">{t('no_books_filtered')}</p>
                  </div>
                );
              }

              return (
                <AnimatePresence>
                  {displayedBooks.map((book) => renderBookCard(book))}
                </AnimatePresence>
              );
            };

            const renderGroupedBookSections = (_subBooks: Audiobook[]) => {
              if (allBooksNavGroups.length === 0) {
                return (
                  <div className="col-span-full py-16 text-center w-full">
                    <p className="text-base text-[var(--text-muted)]">{t('no_books_filtered')}</p>
                  </div>
                );
              }

              const isAlphabetMode = sortBy === 'name-asc' || sortBy === 'name-desc';
              const gridRightPadding = isMobile ? 'pr-6' : (isAlphabetMode ? 'pr-[60px]' : 'pr-[74px]');

              return (
                <div className={`space-y-12 ${gridRightPadding}`}>
                  <AnimatePresence>
                    {allBooksNavGroups.map(group => (
                      <motion.section
                        key={group.id}
                        layout="position"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={FADE_IN}
                        id={`group-section-${group.id}`}
                        className="space-y-4 scroll-mt-24"
                      >
                        <h2 className="text-xl font-bold text-[var(--text-main)]">
                          {group.title}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                          <AnimatePresence>
                            {group.books.map((book) => renderBookCard(book))}
                          </AnimatePresence>
                        </div>
                      </motion.section>
                    ))}
                  </AnimatePresence>
                </div>
              );
            };

            const isGenreRoute = activeScreen.id.startsWith('library-genre-');
            const isSubgenreRoute = activeScreen.id.startsWith('library-subgenre-');

            if (isGenreRoute) {
              const genreId = activeScreen.id.replace('library-genre-', '');
              const genreData = Object.values(GENRE_HIERARCHY).find(g => g.id === genreId);
              if (genreData) {
                return (
                  <>
                    {(() => {
                      const activeSubgenres = genreData.subgenres.filter(subgenre =>
                        books.some(b => isBookInSubgenre(b, genreData, subgenre))
                      );
                      if (activeSubgenres.length === 0) return null;
                      return (
                        <div className="mb-10">
                          <h2 className="text-xl font-bold text-[var(--text-main)]">{t('subgenres')}</h2>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mobile-grid-2">
                            <AnimatePresence>
                              {activeSubgenres.slice().sort((a, b) => {
                                if (a.toLowerCase() === 'outros' || a.toLowerCase() === 'outro') return 1;
                                if (b.toLowerCase() === 'outros' || b.toLowerCase() === 'outro') return -1;
                                return sortBy === 'name-desc' 
                                  ? b.localeCompare(a, resolvedLanguage, { sensitivity: 'base' }) 
                                  : a.localeCompare(b, resolvedLanguage, { sensitivity: 'base' });
                              }).map((subgenre) => {
                                const gradient = getSubgenreGradient(subgenre);
                                const subgenreBooks = books.filter(b => isBookInSubgenre(b, genreData, subgenre));
                                const isAllSelected = subgenreBooks.length > 0 && subgenreBooks.every(b => selectedBooks.includes(b.id));
                                return (
                                  <motion.div 
                                    key={subgenre} 
                                    layout="position"
                                    initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                                    transition={FADE_IN}
                                    onClick={() => {
                                      if (isSelectionMode) {
                                        if (isAllSelected) {
                                          setSelectedBooks(prev => prev.filter(id => !subgenreBooks.some(b => b.id === id)));
                                        } else {
                                          setSelectedBooks(prev => Array.from(new Set([...prev, ...subgenreBooks.map(b => b.id)])));
                                        }
                                      } else {
                                        navigateTo(`library-subgenre-${genreData.id}-${subgenre}`, { genre: genreData, subgenre });
                                      }
                                    }}
                                    className={`relative isolate category-card aspect-[16/9] rounded-3xl cursor-pointer group shadow-lg transition-[border-color,box-shadow] p-5 flex flex-col justify-end ${
                                      isSelectionMode && isAllSelected
                                        ? ' '
                                        : ' '
                                    }`}
                                  >
                                    {/* Camada interna recortada com fundo e ícone com zoom */}
                                    <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
                                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} ${isSelectionMode && isAllSelected ? 'opacity-70' : ''}`} />
                                      <div className="absolute inset-0 bg-black/15" />

                                      <span className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 text-7xl sm:text-8xl select-none pointer-events-none card-tone-icon">
                                        <EmojiIcon emoji={getSubgenreEmoji(subgenre)} />
                                      </span>
                                    </div>

                                    {isSelectionMode && (
                                      <div className="absolute top-3 right-3 z-20">
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                          isAllSelected ? 'bg-winblue text-white shadow-lg' : ' bg-black/30 text-transparent'
                                        }`}>
                                          <CheckCircle2 size={14} />
                                        </div>
                                      </div>
                                    )}

                                    {/* Nome do Subgênero com texto maior */}
                                    <div className="relative z-10">
                                      <h4 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md tracking-tight category-card-title origin-bottom-left rtl:origin-bottom-right transition-transform duration-500">{getSubgenreName(subgenre, resolvedLanguage)}</h4>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{t('all_books_of_genre', { genre: getGenreName(genreData.id, resolvedLanguage) })}</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                        {renderBookGrid(books.filter(b => isBookInGenre(b, genreData)))}
                      </div>
                    </div>
                  </>
                );
              }
            }

            if (isSubgenreRoute) {
              const routeData = activeScreen.id.replace('library-subgenre-', '');
              const matchedGenre = activeScreen.data?.genre || Object.values(GENRE_HIERARCHY)
                .sort((a, b) => b.id.length - a.id.length)
                .find(g => routeData.startsWith(g.id + '-'));
              const genreData = matchedGenre;
              const subgenreName = activeScreen.data?.subgenre || (matchedGenre ? routeData.substring(matchedGenre.id.length + 1) : routeData);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                  {renderBookGrid(books.filter(b => genreData ? isBookInSubgenre(b, genreData, subgenreName) : true))}
                </div>
              );
            }

            let subBooks = [...books];
            if (activeScreen.id.startsWith('library-')) {
              const sub = activeScreen.id.replace('library-', '').toLowerCase();
              if (sub === 'favoritos') {
                subBooks = books.filter(b => favoriteBookIds.includes(b.id));
              } else if (sub !== 'títulos') {
                subBooks = books.filter(b => b.category.toLowerCase() === sub);
              }
            } else if (activeScreen.id === 'home-continuar-ouvindo') {
              const inProgress = books.filter(b => isBookStarted(b) && !isBookCompleted(b));
              subBooks = [...inProgress].sort((a, b) => {
                const idxA = recentlyListenedBookIds.indexOf(a.id);
                const idxB = recentlyListenedBookIds.indexOf(b.id);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
              });
            } else if (activeScreen.id === 'home-ouvidos-recentemente') {
              subBooks = recentlyListenedBooks.slice(0, 20);
            } else if (activeScreen.id === 'home-adicionados-recentemente') {
              subBooks = recentlyAddedBooks;
            }

            if (activeScreen.id === 'library-títulos') {
              return renderGroupedBookSections(subBooks);
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-grid-3">
                {renderBookGrid(subBooks)}
              </div>
            );
          })()}
        </div>
      )}
    </motion.div>
  );
}
