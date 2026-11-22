// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { AnimatePresence, motion } from 'motion/react';
import { RiBookOpenLine } from 'react-icons/ri';
import { ChevronRight, Upload } from 'lucide-react';
import { FADE_IN } from '../../lib/motion';
import { useEffect, useMemo, useState } from 'react';
import { BookCard, OnlineSuggestionCard } from '../../components/library/LibraryCards';
import { getSuggestions, useOnlineData, type Suggestions } from '../../lib/onlineCatalog';
import { normalizeAudiobookLanguage } from '../../i18n/translations';
import { splitGenreValues } from '../../data/genreData';
import { transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function HomeScreen() {
  const { activeScreen, authors, books, currentBook, favoriteAuthorIds, favoriteBookIds, fileInputRef, handleAddToQueue, handleDeleteBook, handlePlayBookFromStart, handleSelectAuthor, handleSelectBookDetail, homeSections, isBookCompleted, isBookStarted, isMobile, isPlaying, isSelectionMode, selectedBooks, setCompletedChapters, setEditingBook, setSelectedBooks, setStartedChapters, showToast, t, toggleFavoriteBook } = useScreenScope();
  // Sugestões gratuitas da internet (LibriVox e Project Gutenberg) pelos gostos da biblioteca: idiomas, gêneros,
  // autores e favoritos. Desligáveis em Ajustes → Biblioteca
  const onlineOn = useOnlineData();
  const profile = useMemo(() => {
    const rank = (values: string[]) => {
      const n = new Map<string, number>();
      values.filter(Boolean).forEach(v => n.set(v, (n.get(v) || 0) + 1));
      return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
    };
    const favBooks = books.filter(b => favoriteBookIds.includes(b.id));
    const weighted = [...books, ...favBooks, ...favBooks];
    const favAuthorNames = authors.filter(a => favoriteAuthorIds.includes(a.id)).map(a => a.name);
    return {
      languages: rank(weighted.map(b => normalizeAudiobookLanguage(b.language) || '').filter(l => l && l !== 'Outro')),
      genres: rank(weighted.flatMap(b => splitGenreValues(b.category)).filter(g => g && !/desconhecid/i.test(g))),
      authors: [...favAuthorNames, ...rank(weighted.map(b => b.author || ''))].filter((a, i, arr) => a && arr.indexOf(a) === i),
      owned: books.map(b => ({ title: b.title, author: b.author })),
    };
  }, [books, authors, favoriteBookIds, favoriteAuthorIds]);
  const profileKey = JSON.stringify([profile.languages.slice(0, 2), profile.genres.slice(0, 3), profile.authors.slice(0, 6), profile.owned.length]);
  const [suggestions, setSuggestions] = useState<Suggestions>({ audiobooks: [], ebooks: [] });
  useEffect(() => {
    if (!onlineOn || books.length === 0) { setSuggestions({ audiobooks: [], ebooks: [] }); return; }
    let alive = true;
    getSuggestions(profile, 12).then(items => { if (alive) setSuggestions(items); }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineOn, profileKey]);

  return (
    books.length === 0 ? (
      <motion.div 
        key="home-empty" 
        variants={transicaoConteudo} 
        initial="escondido" 
        animate="visivel" 
        exit="saindo" 
      >
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
          {t('nav_home')}
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
          <motion.button
            data-press="true"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 px-6 rounded-full bg-card/75 backdrop-blur-3xl shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] font-semibold text-sm transition-all flex items-center gap-2.5 cursor-pointer"
          >
            <Upload size={16} />
            <span>{t('add_audiobooks_button')}</span>
          </motion.button>
        </div>
      </motion.div>
    ) : (
      <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo">
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
          {t('nav_home')}
        </h1>
        <div className="space-y-12">
        <AnimatePresence>
          {homeSections.map((section) => (
            <motion.section
              key={section.id}
              layout={isMobile ? false : "position"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={FADE_IN}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--text-main)]">{section.title}</h2>
                {section.buttonLabel && section.onButtonClick && (
                  <motion.button 
                    data-press="true"
                    onClick={section.onButtonClick}
                    className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl shadow-sm text-[var(--text-main)] hover:bg-[var(--hover-fill)] flex items-center gap-1 text-xs font-semibold transition-all shrink-0 ml-3"
                  >
                    <span>{section.buttonLabel}</span>
                    <ChevronRight size={15} className="-mr-0.5" />
                  </motion.button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                <AnimatePresence>
                  {section.books.slice(0, 6).map((book) => (
                    <BookCard 
                      key={`home-${section.id}-${book.id}`} 
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
                        if(selectedBooks.includes(book.id)) setSelectedBooks(selectedBooks.filter(id => id !== book.id)); 
                        else setSelectedBooks([...selectedBooks, book.id]); 
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
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          ))}
          {([
            { id: 'online-audiobooks', title: t('section_online_suggestions'), items: suggestions.audiobooks },
            { id: 'online-ebooks', title: t('section_online_ebooks'), items: suggestions.ebooks },
          ]).filter(sec => sec.items.length > 0).map(sec => (
            <motion.section key={sec.id} layout={isMobile ? false : "position"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={FADE_IN}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--text-main)]">{sec.title}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 mobile-row">
                {sec.items.slice(0, 6).map(item => <OnlineSuggestionCard key={`online-${item.id}`} item={item} />)}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
        </div>
      </motion.div>
    )
  );
}
