import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  CheckCircle2,
  Headphones,
  Bookmark,
  MoreHorizontal,
  Pause,
  Play,
  Upload,
  Trash2,
  ListMusic,
  ListPlus,
  ChevronRight,
  Check,
} from 'lucide-react';
import { BsPlayFill, BsPauseFill } from 'react-icons/bs';
import {
  PopupMorphContainer,
  MenuOptionItem,
  PagedMenu,
  morphTriggerAnimate,
  checkChapterMenuShouldOpenUp,
} from '../components/Popovers';
import type {
  Audiobook,
  Chapter,
  TranscriptLine,
} from '../data';
import { resolveNarratorAndLanguage } from '../data';
import {
  getGenericBookCover,
  getGenericCoverColor,
  getBookHighlightTheme,
  GENERIC_COVER_COLORS,
} from '../audioUtils';
import { getGenreName, getSubgenreName } from '../genreTranslations';
import { getLanguageDisplayName, SupportedLanguage, useI18n } from '../translations';

const ImageCropperSquare = React.lazy(() => import('../ImageCropperSquare'));

export interface BookDetailViewProps {
  // Celular/tablet: marcações abrem como submenu em tela cheia
  onOpenBookmarks?: (book: Audiobook, chapter: Chapter) => void;
  activeBook: Audiobook;
  books: Audiobook[];
  currentBook: Audiobook;
  currentChapter: Chapter;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  favoriteBookIds: string[];
  favoriteChapters: string[];
  setFavoriteChapters: React.Dispatch<React.SetStateAction<string[]>>;
  completedChapters: string[];
  setCompletedChapters: React.Dispatch<React.SetStateAction<string[]>>;
  startedChapters: string[];
  setStartedChapters: React.Dispatch<React.SetStateAction<string[]>>;
  isBookCompleted: (b: Audiobook) => boolean;
  isBookStarted: (b: Audiobook) => boolean;
  isChapterCompleted: (bookId: string, chapId: any) => boolean;
  isChapterStarted: (bookId: string, chapId: any) => boolean;
  handleSelectAuthor: (authorId: string, authorName: string) => void;
  handlePlayBookFromStart: (b: Audiobook, idx?: number) => void;
  handleBookCoverError: (b: Audiobook, e: any) => void;
  handleAddToQueue: (b: Audiobook, pos: 'next' | 'last') => void;
  formatTime: (secs: number) => string;
  showToast: (msg: string) => void;
  navigateTo: (screenId: string, data?: any) => void;
  transicaoConteudo?: any;
  resolvedTheme: 'dark' | 'light';
  resolvedLanguage: SupportedLanguage;
  getCustomCoverColor?: (url?: string) => string | undefined;

  // Editing state
  isEditingBook: boolean;
  editBookCover: string;
  setEditBookCover: (cover: string) => void;
  bookCropImage: string | null;
  setBookCropImage: (img: string | null) => void;
  editCoverColor: string;
  setEditCoverColor: (col: string) => void;
  editBookTitle: string;
  setEditBookTitle: (title: string) => void;
  editBookAuthor: string;
  setEditBookAuthor: (author: string) => void;
  editBookCategory: string;
  setEditBookCategory: (cat: string) => void;
  editBookSubgenre: string;
  setEditBookSubgenre: (sub: string) => void;
  editBookDescription: string;
  setEditBookDescription: (desc: string) => void;
  editBookNarrator: string;
  setEditBookNarrator: (narr: string) => void;
  editBookLanguage: string;
  setEditBookLanguage: (lang: string) => void;
  editBookChapters: Chapter[];
  setEditBookChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  editBookTranscript?: TranscriptLine[];
  setEditBookTranscript: (t: TranscriptLine[]) => void;
  editBookTranscriptSource?: 'metadata' | 'upload';
  setEditBookTranscriptSource: (s?: 'metadata' | 'upload') => void;
  editBookTranscriptFileName?: string;
  setEditBookTranscriptFileName: (fn?: string) => void;
  editBookTextInputRef: React.RefObject<HTMLInputElement | null>;
  handleUploadTranscriptForEditBook: (file: File) => void;

  // Popups & chapter menus
  activeChapterMenuId: string | null;
  setActiveChapterMenuId: (id: string | null) => void;
  activeChapterMenuMode: 'options' | 'comments';
  setActiveChapterMenuMode: (mode: 'options' | 'comments') => void;
  chapterMenuOpenUp: boolean;
  setChapterMenuOpenUp: (openUp: boolean) => void;
  activeChapterCommentsPopupId: string | null;
  setActiveChapterCommentsPopupId: (id: string | null) => void;
  chapterCommentsPopupOpenUp: boolean;
  setChapterCommentsPopupOpenUp: (openUp: boolean) => void;
  closeAllPopups: () => void;
  renderCommentsContent: (book: Audiobook, chap: Chapter, isMiniplayer: boolean, showBackToOptions?: boolean) => React.ReactNode;
  getBackdropProps: (onClose: () => void) => any;
  toggleFavoriteChapter?: (bookId: string, chapterId: string | number) => void;
  handleAddChapterToQueue?: (book: Audiobook, chapter: any, chapterIndex: number, position: 'next' | 'last') => void;

  // Synopsis truncation
  isSynopsisTruncated: boolean;
  handleSynopsisRef: (node: HTMLParagraphElement | null) => void;
  synopsisFullTextRef: React.RefObject<HTMLParagraphElement | null>;
}

export default function BookDetailView({
  onOpenBookmarks,
  activeBook,
  currentBook,
  currentChapter,
  isPlaying,
  setIsPlaying,
  favoriteBookIds,
  favoriteChapters,
  setFavoriteChapters,
  completedChapters: _completedChapters,
  setCompletedChapters,
  startedChapters: _startedChapters,
  setStartedChapters,
  isBookCompleted,
  isBookStarted,
  isChapterCompleted,
  isChapterStarted,
  handleSelectAuthor,
  handlePlayBookFromStart,
  handleBookCoverError,
  handleAddToQueue,
  formatTime,
  showToast,
  navigateTo,
  transicaoConteudo,
  resolvedTheme,
  resolvedLanguage,
  getCustomCoverColor,
  isEditingBook,
  editBookCover,
  setEditBookCover,
  bookCropImage,
  setBookCropImage,
  editCoverColor,
  setEditCoverColor,
  editBookTitle,
  setEditBookTitle,
  editBookAuthor,
  setEditBookAuthor,
  editBookCategory,
  setEditBookCategory,
  editBookSubgenre,
  setEditBookSubgenre,
  editBookDescription,
  setEditBookDescription,
  editBookNarrator,
  setEditBookNarrator,
  editBookLanguage,
  setEditBookLanguage,
  editBookChapters,
  setEditBookChapters,
  editBookTranscript,
  setEditBookTranscript,
  editBookTranscriptSource,
  setEditBookTranscriptSource,
  editBookTranscriptFileName,
  setEditBookTranscriptFileName,
  editBookTextInputRef,
  handleUploadTranscriptForEditBook,
  activeChapterMenuId,
  setActiveChapterMenuId,
  activeChapterMenuMode,
  setActiveChapterMenuMode,
  chapterMenuOpenUp,
  setChapterMenuOpenUp,
  activeChapterCommentsPopupId,
  setActiveChapterCommentsPopupId,
  chapterCommentsPopupOpenUp,
  setChapterCommentsPopupOpenUp,
  closeAllPopups,
  renderCommentsContent,
  getBackdropProps,
  toggleFavoriteChapter,
  handleAddChapterToQueue,
  isSynopsisTruncated,
  handleSynopsisRef,
  synopsisFullTextRef,
}: BookDetailViewProps) {
  const { t } = useI18n();

  const isThisBookCurrent = currentBook.id === activeBook.id;
  const isBookPlaying = isThisBookCurrent && isPlaying;
  const effectiveCover = (isEditingBook && editBookCover) ? editBookCover : activeBook.cover;
  const hasCustomCover = Boolean(effectiveCover && !effectiveCover.startsWith('data:image/svg'));
  const rawCoverHex = (!effectiveCover || effectiveCover.startsWith('data:image/svg'))
    ? ((isEditingBook && editCoverColor) ? editCoverColor : getGenericCoverColor(effectiveCover, activeBook.title, activeBook.author))
    : ((getCustomCoverColor?.(effectiveCover)) || getGenericCoverColor(effectiveCover, activeBook.title, activeBook.author));
  const bookHighlight = getBookHighlightTheme(rawCoverHex, resolvedTheme === 'dark');

  const handleRemoveBookCover = () => {
    setEditBookCover(getGenericBookCover(editBookTitle || activeBook.title, editBookAuthor || activeBook.author, editCoverColor));
    setBookCropImage(null);
  };

  return (
    <motion.div
      key={`book-detail-${activeBook.id}`}
      variants={transicaoConteudo}
      initial="escondido"
      animate="visivel"
      exit="saindo"
      // Celular deitado: audiobook numa coluna à esquerda; sinopse e capítulos na coluna da direita
      className={`flex flex-col gap-8 mt-4 relative w-full ${isEditingBook ? '' : 'land:grid land:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] land:gap-x-8 land:gap-y-6 land:items-start land:mt-0'}`}
      style={({
        '--winblue': bookHighlight.hex,
        '--winblue-rgb': bookHighlight.rgb,
        '--color-winblue': bookHighlight.hex,
        '--book-accent': bookHighlight.hex,
        '--book-accent-rgb': bookHighlight.rgb,
      } as React.CSSProperties)}
    >
      {/* Mobile: capa de ponta a ponta (como as páginas de álbum do Apple Music), com desfoque no topo e na base;
          sobre a base, título, informações e os botões (concluído | ouvir | tocar a seguir) */}
      {!isEditingBook && (() => {
        const heroCover = activeBook.cover || getGenericBookCover(activeBook.title, activeBook.author);
        const heroMeta: string[] = [];
        if (activeBook.category && activeBook.category !== 'Desconhecido') heroMeta.push(getGenreName(activeBook.category, resolvedLanguage));
        if (activeBook.durationEst) heroMeta.push(activeBook.durationEst);
        if (activeBook.year) heroMeta.push(String(activeBook.year));
        const bookCompleted = isBookCompleted(activeBook);
        const toggleCompleted = () => {
          const chapIds = (activeBook.chapters || []).map((c: any) => `${activeBook.id}-${c.id}`);
          if (bookCompleted) {
            setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
            setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
            showToast(t('toast_book_marked_unstarted', { title: activeBook.title }));
          } else {
            setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
            setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
            showToast(t('toast_book_marked_completed', { title: activeBook.title }));
          }
        };
        const heroButtons = (
                <div className="mt-4 w-full flex items-center justify-center land:justify-start gap-5">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleCompleted}
                    aria-label={bookCompleted ? t('mark_as_unstarted') : t('mark_as_completed')}
                    title={bookCompleted ? t('mark_as_unstarted') : t('mark_as_completed')}
                    className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-3xl border shadow-sm ${bookCompleted ? 'bg-winblue/20 border-winblue/45 text-winblue' : 'bg-card/75 border-[var(--text-main)]/10 text-[var(--text-main)]'}`}
                  >
                    {bookCompleted ? <Headphones size={18} /> : <CheckCircle2 size={18} />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isThisBookCurrent) setIsPlaying(!isPlaying);
                      else handlePlayBookFromStart(activeBook);
                    }}
                    className="h-11 px-8 min-w-[132px] rounded-full bg-winblue/20 border border-winblue/45 shadow-sm backdrop-blur-3xl text-winblue text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {isBookPlaying ? <BsPauseFill size={18} /> : <BsPlayFill size={18} />}
                    <span>{isBookPlaying ? t('pause') : t('listen')}</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAddToQueue(activeBook, 'next')}
                    aria-label={t('next_in_queue')}
                    title={t('next_in_queue')}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] backdrop-blur-3xl shadow-sm"
                  >
                    <ListMusic size={18} />
                  </motion.button>
                </div>
        );
        return (
          <>
          {/* Celular deitado: capa à esquerda e, ao lado, título, autor, informações e botões (tudo visível sem cortes).
              Essa coluna fica parada; só a coluna da sinopse e dos capítulos rola */}
          <div className="hidden land:flex land:col-start-1 land:row-start-1 land:row-span-2 land:sticky land:top-0 land:self-start land:z-[1] flex-col w-full">
            {/* Capa e, ao lado, título/autor/dados; botões embaixo — tudo visível acima da barra de abas */}
            <div className="flex items-center gap-4 w-full">
              <img
                src={heroCover}
                onError={(e) => handleBookCoverError(activeBook, e)}
                alt={activeBook.title}
                className="h-[clamp(110px,calc(100dvh-var(--app-header-top)-230px),180px)] aspect-[1/1.6] rounded-2xl object-cover shadow-2xl shrink-0"
              />
              <div className="flex-1 min-w-0 flex flex-col items-start text-left rtl:text-right">
                <h2 data-screen-title="true" className="text-[19px] font-bold leading-tight tracking-tight line-clamp-3 text-[var(--text-main)]">{activeBook.title}</h2>
                <button
                  onClick={() => handleSelectAuthor(activeBook.authorId, activeBook.author)}
                  className="mobile-press text-[14px] font-semibold text-[var(--text-muted)] mt-1 text-left rtl:text-right"
                >
                  {activeBook.author}
                </button>
                {heroMeta.length > 0 && (
                  <p className="text-[11px] font-medium text-[var(--text-muted)] mt-1">{heroMeta.join(' • ')}</p>
                )}
              </div>
            </div>
            {heroButtons}
          </div>
          <div className="md:hidden land:hidden relative mobile-bleed -mt-[calc(var(--app-header-top)+76px)]">
            <div data-zoom-hero="true" className="relative w-full" style={{ height: 'min(150vw, 74dvh)' }}>
              {/* Camadas da capa: o esmaecimento continua ~72px abaixo do bloco, por trás do conteúdo,
                  com curva suave (sem degrau nem linha reta entre a capa e a tela) */}
              <div className="absolute inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none" style={{ height: 'calc(100% + 72px)' }}>
              <img
                src={heroCover}
                onError={(e) => handleBookCoverError(activeBook, e)}
                alt={activeBook.title}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,1.000) 46.0%, rgba(0,0,0,0.972) 51.4%, rgba(0,0,0,0.896) 56.8%, rgba(0,0,0,0.784) 62.2%, rgba(0,0,0,0.648) 67.6%, rgba(0,0,0,0.500) 73.0%, rgba(0,0,0,0.352) 78.4%, rgba(0,0,0,0.216) 83.8%, rgba(0,0,0,0.104) 89.2%, rgba(0,0,0,0.028) 94.6%, rgba(0,0,0,0.000) 100.0%)', maskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,1.000) 46.0%, rgba(0,0,0,0.972) 51.4%, rgba(0,0,0,0.896) 56.8%, rgba(0,0,0,0.784) 62.2%, rgba(0,0,0,0.648) 67.6%, rgba(0,0,0,0.500) 73.0%, rgba(0,0,0,0.352) 78.4%, rgba(0,0,0,0.216) 83.8%, rgba(0,0,0,0.104) 89.2%, rgba(0,0,0,0.028) 94.6%, rgba(0,0,0,0.000) 100.0%)' }}
              />
              {/* Desfoque e sombra no topo (cabeçalho legível sobre a capa) */}
              <img
                src={heroCover}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 pointer-events-none"
                style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 0px, black 20px, transparent 96px)', maskImage: 'linear-gradient(to bottom, black 0px, black 20px, transparent 96px)' }}
              />
              <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
              {/* Desfoque e sombra na base, onde ficam as informações e os botões */}
              {/* Base: cópia desfocada da capa que some por completo antes da borda (sem "backdrop-filter",
                  que tingia a área e deixava uma linha visível), fundindo a capa com a interface */}
              <img
                src={heroCover}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 pointer-events-none"
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 44.0%, rgba(0,0,0,0.028) 46.2%, rgba(0,0,0,0.104) 48.4%, rgba(0,0,0,0.216) 50.6%, rgba(0,0,0,0.352) 52.8%, rgba(0,0,0,0.500) 55.0%, rgba(0,0,0,0.648) 57.2%, rgba(0,0,0,0.784) 59.4%, rgba(0,0,0,0.896) 61.6%, rgba(0,0,0,0.972) 63.8%, rgba(0,0,0,1.000) 66.0%, rgba(0,0,0,1.000) 74.0%, rgba(0,0,0,0.972) 76.6%, rgba(0,0,0,0.896) 79.2%, rgba(0,0,0,0.784) 81.8%, rgba(0,0,0,0.648) 84.4%, rgba(0,0,0,0.500) 87.0%, rgba(0,0,0,0.352) 89.6%, rgba(0,0,0,0.216) 92.2%, rgba(0,0,0,0.104) 94.8%, rgba(0,0,0,0.028) 97.4%, rgba(0,0,0,0.000) 100.0%)',
                  maskImage: 'linear-gradient(to bottom, transparent 44.0%, rgba(0,0,0,0.028) 46.2%, rgba(0,0,0,0.104) 48.4%, rgba(0,0,0,0.216) 50.6%, rgba(0,0,0,0.352) 52.8%, rgba(0,0,0,0.500) 55.0%, rgba(0,0,0,0.648) 57.2%, rgba(0,0,0,0.784) 59.4%, rgba(0,0,0,0.896) 61.6%, rgba(0,0,0,0.972) 63.8%, rgba(0,0,0,1.000) 66.0%, rgba(0,0,0,1.000) 74.0%, rgba(0,0,0,0.972) 76.6%, rgba(0,0,0,0.896) 79.2%, rgba(0,0,0,0.784) 81.8%, rgba(0,0,0,0.648) 84.4%, rgba(0,0,0,0.500) 87.0%, rgba(0,0,0,0.352) 89.6%, rgba(0,0,0,0.216) 92.2%, rgba(0,0,0,0.104) 94.8%, rgba(0,0,0,0.028) 97.4%, rgba(0,0,0,0.000) 100.0%)',
                }}
              />
              </div>
              <div className="absolute inset-x-0 bottom-0 px-5 pb-4 flex flex-col items-center text-center text-[var(--text-main)]">
                <h2 data-screen-title="true" className="text-[24px] font-bold leading-tight tracking-tight line-clamp-2">{activeBook.title}</h2>
                <button
                  onClick={() => handleSelectAuthor(activeBook.authorId, activeBook.author)}
                  className="mobile-press text-[15px] font-semibold text-[var(--text-muted)] mt-1"
                >
                  {activeBook.author}
                </button>
                {heroMeta.length > 0 && (
                  <p className="text-[11px] font-medium text-[var(--text-muted)] mt-1">{heroMeta.join(' • ')}</p>
                )}
                {heroButtons}
              </div>
            </div>
          </div>
          </>
        );
      })()}

      <div className={`flex flex-col md:flex-row items-start ${isEditingBook ? 'md:items-start' : 'md:items-center max-md:hidden'} gap-8 w-full`}>
        {!isEditingBook ? (
          <>
            <div className="relative shrink-0">
              <img 
                src={activeBook.cover || getGenericBookCover(activeBook.title, activeBook.author)} 
                onError={(e) => handleBookCoverError(activeBook, e)}
                alt={activeBook.title} 
                className="w-[175px] h-[280px] max-md:w-[150px] max-md:h-[240px] rounded-3xl object-cover shadow-2xl shrink-0 aspect-[1/1.6]"
              />
              {favoriteBookIds.includes(activeBook.id) && (
                <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-yellow-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.4)] text-yellow-400 pointer-events-none">
                  <Star size={13} className="fill-yellow-400 text-yellow-400" />
                </div>
              )}
              {isBookCompleted(activeBook) ? (
                <div className="absolute top-3 left-3 z-10 h-7 px-3 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center gap-1.5 shadow-lg text-white pointer-events-none text-xs font-bold">
                  <CheckCircle2 size={13} />
                  <span>{t('completed')}</span>
                </div>
              ) : isBookStarted(activeBook) ? (
                <div className="absolute top-3 left-3 z-10 h-7 px-3 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center gap-1.5 shadow-lg text-white pointer-events-none text-xs font-bold">
                  <Headphones size={13} />
                  <span>{t('listening')}</span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col justify-center space-y-4 flex-1 min-w-0 max-md:w-full max-md:items-center">
              <div className="max-md:w-full">
                <div className="flex items-center gap-3 max-md:justify-center">
                  <h2 className="text-4xl md:text-5xl max-md:text-[26px] max-md:leading-tight font-semibold text-[var(--text-main)] tracking-tight">{activeBook.title}</h2>
                </div>
                <h3 
                  className="text-xl max-md:text-base font-semibold text-[var(--text-muted)] hover:text-winblue transition-colors mt-1 cursor-pointer"
                  onClick={() => handleSelectAuthor(activeBook.authorId, activeBook.author)}
                >
                  {activeBook.author}
                </h3>
                {(() => {
                  const genreParts: string[] = [];
                  if (activeBook.category && activeBook.category !== 'Desconhecido') {
                    genreParts.push(getGenreName(activeBook.category, resolvedLanguage));
                  }
                  if (
                    activeBook.subgenre && 
                    activeBook.subgenre !== 'Desconhecido' && 
                    (!activeBook.category || activeBook.subgenre.toLowerCase() !== activeBook.category.toLowerCase())
                  ) {
                    genreParts.push(getSubgenreName(activeBook.subgenre, resolvedLanguage));
                  }
                  const genreDisplay = genreParts.join(', ');

                  const { narrator, language } = resolveNarratorAndLanguage(activeBook);

                  const metaItems: { key: string; node: React.ReactNode }[] = [];

                  if (genreDisplay) {
                    metaItems.push({ key: 'genre', node: <span>{genreDisplay}</span> });
                  }
                  if (activeBook.durationEst) {
                    metaItems.push({ key: 'duration', node: <span>{activeBook.durationEst}</span> });
                  }
                  if (activeBook.year) {
                    metaItems.push({ key: 'year', node: <span>{activeBook.year}</span> });
                  }
                  if (narrator) {
                    metaItems.push({
                      key: 'narrator',
                      node: (
                        <span>
                          {t('narrated_by')}: <span className="font-semibold text-[var(--text-main)]">{narrator}</span>
                        </span>
                      )
                    });
                  }
                  if (language) {
                    metaItems.push({
                      key: 'language',
                      node: (
                        <span>
                          {t('language_label')}: <span className="font-semibold text-[var(--text-main)]">{getLanguageDisplayName(language, resolvedLanguage)}</span>
                        </span>
                      )
                    });
                  }

                  return (
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[var(--text-muted)] tracking-wide mt-2 max-md:justify-center">
                      {metaItems.map((item, idx) => (
                        <React.Fragment key={item.key}>
                          {idx > 0 && <span className="text-[var(--text-muted)]/60">•</span>}
                          {item.node}
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 max-md:flex-col max-md:w-full max-md:gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isThisBookCurrent) {
                      setIsPlaying(!isPlaying);
                    } else {
                      handlePlayBookFromStart(activeBook);
                    }
                  }}
                  className="h-10 px-5 max-md:h-12 max-md:w-full max-md:max-w-[280px] max-md:text-sm justify-center rounded-full bg-winblue/20 border border-winblue/45 shadow-xl backdrop-blur-3xl hover:bg-winblue/30 hover:border-winblue/75 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.25),0_0_22px_rgba(var(--winblue-rgb),0.45)] text-winblue text-xs font-bold transition-all flex items-center gap-2"
                >
                  {isBookPlaying ? <BsPauseFill size={18} /> : <BsPlayFill size={18} />}
                  <span>{isBookPlaying ? t('pause') : t('listen')}</span>
                </motion.button>

                <div className="flex flex-wrap items-center justify-center gap-2 md:contents">
                
                {!isThisBookCurrent && (
                  <>
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToQueue(activeBook, 'next')}
                      className="h-10 px-4 max-md:h-8 max-md:px-3 max-md:text-[11px] rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-xs font-semibold text-[var(--text-main)] transition-all flex items-center gap-2"
                    >
                      <ListMusic size={14} />
                      <span>{t('next_in_queue')}</span>
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToQueue(activeBook, 'last')}
                      className="h-10 px-4 max-md:h-8 max-md:px-3 max-md:text-[11px] rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-xs font-semibold text-[var(--text-main)] transition-all flex items-center gap-2"
                    >
                      <ListPlus size={14} />
                      <span>{t('end_of_queue')}</span>
                    </motion.button>
                  </>
                )}

                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const isCompleted = isBookCompleted(activeBook);
                    const chapIds = (activeBook.chapters || []).map((c: any) => `${activeBook.id}-${c.id}`);
                    if (isCompleted) {
                      setCompletedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                      setStartedChapters(prev => prev.filter(id => !chapIds.includes(id)));
                      showToast(t('toast_book_marked_unstarted', { title: activeBook.title }));
                    } else {
                      setCompletedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                      setStartedChapters(prev => Array.from(new Set([...prev, ...chapIds])));
                      showToast(t('toast_book_marked_completed', { title: activeBook.title }));
                    }
                  }}
                  className="h-10 px-4 max-md:h-8 max-md:px-3 max-md:text-[11px] rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-xl hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-xs font-semibold text-[var(--text-main)] transition-all flex items-center gap-2"
                >
                  {isBookCompleted(activeBook) ? (
                    <Headphones size={14} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>{isBookCompleted(activeBook) ? t('mark_as_unstarted') : t('mark_as_completed')}</span>
                </motion.button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center shrink-0 max-md:self-center">
              {bookCropImage ? (
                <Suspense fallback={
                  <div className="w-56 h-72 flex items-center justify-center rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
                  </div>
                }>
                  <ImageCropperSquare
                    imageSrc={bookCropImage}
                    isAuthor={false}
                    onSave={(cropped) => {
                      setEditBookCover(cropped);
                      setBookCropImage(null);
                    }}
                    onCancel={() => {
                      setBookCropImage(null);
                    }}
                  />
                </Suspense>
              ) : (
                <div className="relative shrink-0 rounded-3xl overflow-hidden shadow-2xl w-[175px] h-[280px] aspect-[1/1.6] group">
                  <img 
                    src={editBookCover || activeBook.cover || getGenericBookCover(editBookTitle || activeBook.title, editBookAuthor || activeBook.author, editCoverColor)} 
                    onError={(e) => {
                      const fallback = getGenericBookCover(editBookTitle || activeBook.title, editBookAuthor || activeBook.author, editCoverColor);
                      if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                      setEditBookCover(fallback);
                    }}
                    alt={editBookTitle || activeBook.title} 
                    className="w-full h-full object-cover rounded-3xl transition-all aspect-[1/1.6]"
                  />
                  <div className="absolute inset-0 bg-black/55 opacity-100 transition-opacity flex flex-col max-md:flex-row items-center justify-center gap-2.5 p-4 text-center backdrop-blur-xs">
                    {hasCustomCover && (
                      <motion.button 
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRemoveBookCover}
                        className="px-4 py-2 max-md:p-0 max-md:w-11 max-md:h-11 max-md:justify-center rounded-full bg-card/85 backdrop-blur-3xl border border-red-500/35 text-red-400 shadow-xl flex items-center gap-2 text-xs font-semibold hover:bg-red-500/20 hover:border-red-500/60 hover:text-red-300 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span className="max-md:hidden">{t('remove_cover')}</span>
                      </motion.button>
                    )}
                    <motion.label 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 max-md:p-0 max-md:w-11 max-md:h-11 max-md:justify-center rounded-full bg-card/85 backdrop-blur-3xl border border-white/20 shadow-xl flex items-center gap-2 text-xs font-semibold text-white hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer"
                      title={t('choose_cover_computer')}
                    >
                      <Upload size={14} />
                      <span className="max-md:hidden">{t('change_cover')}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (typeof event.target?.result === 'string') {
                                setBookCropImage(event.target.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </motion.label>
                  </div>
                </div>
              )}

              {!bookCropImage && !hasCustomCover && (
                <div className="mt-3.5 flex flex-col items-center gap-2 w-[175px]">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    {t('cover_color')}
                  </span>
                  <div className="grid grid-cols-6 gap-x-3 gap-y-3.5 justify-items-center px-2.5 py-3 rounded-2xl bg-card/60 backdrop-blur-md border border-[var(--text-main)]/10 shadow-sm w-full">
                    {GENERIC_COVER_COLORS.map((c: any) => {
                      const isSelected = !hasCustomCover && editCoverColor.toLowerCase() === c.hex.toLowerCase();
                      return (
                        <button
                          key={c.id}
                          type="button"
                          title={t('cover_color_' + c.id) || c.name}
                          onClick={() => {
                            setEditCoverColor(c.hex);
                            setEditBookCover(getGenericBookCover(editBookTitle || activeBook.title, editBookAuthor || activeBook.author, c.hex));
                          }}
                          style={{ backgroundColor: c.hex }}
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                            isSelected 
                              ? 'ring-2 ring-winblue ring-offset-[1.5px] ring-offset-black/50 shadow-[0_0_10px_rgba(var(--winblue-rgb),0.5)] hover:shadow-[0_0_14px_rgba(var(--winblue-rgb),0.75)]' 
                              : 'opacity-85 hover:opacity-100 hover:ring-2 hover:ring-white/90 hover:ring-offset-[1.5px] hover:ring-offset-black/40 hover:shadow-[0_0_12px_rgba(255,255,255,0.75)]'
                          }`}
                        >
                          {isSelected && (
                            <Check size={9} strokeWidth={3.5} className="text-winblue drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] shrink-0 pointer-events-none" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-4 flex-1 w-full">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                  {t('book_title_label')}
                </label>
                <input 
                  type="text"
                  value={editBookTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditBookTitle(val);
                    if (!hasCustomCover) {
                      setEditBookCover(getGenericBookCover(val, editBookAuthor || activeBook.author, editCoverColor));
                    }
                  }}
                  className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                  placeholder={t('book_title_label')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                  {t('author_label')}
                </label>
                <input 
                  type="text"
                  value={editBookAuthor}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditBookAuthor(val);
                    if (!hasCustomCover) {
                      setEditBookCover(getGenericBookCover(editBookTitle || activeBook.title, val, editCoverColor));
                    }
                  }}
                  className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                  placeholder={t('author_label')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                  {t('genre_category_label')}
                </label>
                <input 
                  type="text"
                  value={editBookCategory}
                  onChange={(e) => setEditBookCategory(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                  placeholder={t('genre_category_label')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                  {t('subgenre_label')}
                </label>
                <input 
                  type="text"
                  value={editBookSubgenre}
                  onChange={(e) => setEditBookSubgenre(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                  placeholder={t('subgenre_label')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                  {t('narrator_label')}
                </label>
                <input 
                  type="text"
                  value={editBookNarrator}
                  onChange={(e) => setEditBookNarrator(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                  placeholder={t('narrator_label')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                  {t('language_label')}
                </label>
                <input 
                  type="text"
                  value={editBookLanguage}
                  onChange={(e) => setEditBookLanguage(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all"
                  placeholder={t('language_label')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">
                  {t('audiobook_text_label')}
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div 
                    title={
                      editBookTranscript && editBookTranscript.length > 0
                        ? (editBookTranscriptSource === 'upload' && editBookTranscriptFileName ? editBookTranscriptFileName : t('text_in_metadata'))
                        : t('text_not_found')
                    }
                    className="h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-xs text-winblue flex items-center max-w-[240px] md:max-w-xs truncate select-all"
                  >
                    <span className="truncate">
                      {editBookTranscript && editBookTranscript.length > 0
                        ? (editBookTranscriptSource === 'upload' && editBookTranscriptFileName ? editBookTranscriptFileName : t('text_in_metadata'))
                        : t('text_not_found')}
                    </span>
                  </div>

                  <input
                    ref={editBookTextInputRef}
                    type="file"
                    accept=".epub,.json,.xml,.smil,.smi,.ts,.vtt,.srt,.lrc"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadTranscriptForEditBook(file);
                      }
                      e.target.value = '';
                    }}
                  />

                  {editBookTranscript && editBookTranscript.length > 0 ? (
                    <>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          setEditBookTranscript([]);
                          setEditBookTranscriptSource(undefined);
                          setEditBookTranscriptFileName(undefined);
                          showToast(t('toast_text_removed'));
                        }}
                        title={t('remove_text')}
                        aria-label={t('remove_text')}
                        className="h-8 px-4 max-md:w-11 max-md:h-11 max-md:px-0 max-md:justify-center rounded-full text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] font-semibold text-xs transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span className="max-md:hidden">{t('remove_text')}</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => editBookTextInputRef.current?.click()}
                        title={t('change_text')}
                        aria-label={t('change_text')}
                        className="h-8 px-4 max-md:w-11 max-md:h-11 max-md:px-0 max-md:justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Upload size={14} />
                        <span className="max-md:hidden">{t('change_text')}</span>
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => editBookTextInputRef.current?.click()}
                      className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>{t('upload_text')}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sinopse do Audiobook */}
      {isEditingBook ? (
        <div className="w-full">
          <label className="text-xl font-bold text-[var(--text-main)] block mb-4">
            {t('synopsis')}
          </label>
          <div className="relative w-full">
            <textarea 
              value={editBookDescription}
              onChange={(e) => setEditBookDescription(e.target.value.slice(0, 1500))}
              maxLength={1500}
              rows={8}
              className="w-full h-[232px] p-4 pb-7 rounded-2xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm leading-relaxed shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all resize-none custom-scrollbar"
              placeholder={t('synopsis')}
            />
            <span className="absolute bottom-2.5 right-3.5 text-[10px] text-[var(--text-muted)] pointer-events-none select-none">
              {editBookDescription.length}/1500
            </span>
          </div>
        </div>
      ) : (
        Boolean(activeBook.description && activeBook.description.trim().length > 0) && (
          <div className="w-full land:col-start-2 land:row-start-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">
                {t('synopsis')}
              </h2>
              {isSynopsisTruncated && (
                <motion.button 
                  whileHover={{ scale: 1.06 }} 
                  whileTap={{ scale: 0.94 }}
                  onClick={() => navigateTo('book-synopsis', activeBook)} 
                  className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ml-3"
                >
                  <span>{t('read_full_synopsis')}</span>
                  <ChevronRight size={15} className="-mr-0.5" />
                </motion.button>
              )}
            </div>
            <div className="relative w-full">
              <p 
                ref={handleSynopsisRef}
                className="text-[var(--text-main)]/90 text-sm leading-relaxed whitespace-pre-line line-clamp-6"
              >
                {activeBook.description}
              </p>
              <p
                ref={synopsisFullTextRef}
                aria-hidden="true"
                className="text-[var(--text-main)]/90 text-sm leading-relaxed whitespace-pre-line absolute inset-x-0 top-0 invisible pointer-events-none select-none -z-10"
              >
                {activeBook.description}
              </p>
            </div>
          </div>
        )
      )}

      <div className={isEditingBook ? '' : `land:col-start-2 ${activeBook.description?.trim() ? 'land:row-start-2' : 'land:row-start-1'}`}>
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">
          {isEditingBook ? t('edit_chapters') : t('chapters')}
        </h2>
        <div className="flex flex-col space-y-1">
          {activeBook.chapters.map((cap, i) => {
            if (isEditingBook) {
              const currentEditTitle = editBookChapters[i] ? editBookChapters[i].title : cap.title;
              return (
                <div 
                  key={cap.id}
                  className="flex items-center justify-between py-2 px-4 sm:px-5 rounded-full bg-card/40 border border-[var(--text-main)]/5 mb-1.5 transition-all"
                >
                  <div className="flex items-center gap-3.5 flex-1 w-full">
                    <span className="w-6 text-center text-xs text-[var(--text-muted)] shrink-0">
                      {i + 1}
                    </span>
                    <input 
                      type="text"
                      value={currentEditTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditBookChapters(prev => {
                          const base = prev.length ? [...prev] : activeBook.chapters.map(c => ({ ...c }));
                          if (base[i]) {
                            base[i] = { ...base[i], title: val };
                          }
                          return base;
                        });
                      }}
                      className="h-10 px-3.5 rounded-xl bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-medium shadow-sm backdrop-blur-3xl focus:outline-none focus:border-winblue/60 focus:ring-2 focus:ring-winblue/30 focus:shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)] transition-all flex-1"
                      placeholder={t('chapter_title_placeholder', { num: i + 1 })}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] ml-4 shrink-0">
                    {formatTime(cap.duration)}
                  </span>
                </div>
              );
            }
            const isCurrentChapter = currentBook.id === activeBook.id && currentChapter.id === cap.id;
            const isCurrentPlaying = isCurrentChapter && isPlaying;
            const chapIdKey = `${activeBook.id}-${cap.id}`;
            const isThisChapterMenuOpen = activeChapterMenuId === chapIdKey;
            const isThisChapterCommentsOpen = activeChapterCommentsPopupId === chapIdKey;
            return (
              <motion.div 
                key={cap.id} 
                id={isCurrentChapter ? "active-playing-chapter" : undefined}
                data-chapter-row={chapIdKey}
                onClick={() => {
                  if (isCurrentChapter) {
                    setIsPlaying(!isPlaying);
                  } else {
                    handlePlayBookFromStart(activeBook, i);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeAllPopups();
                  setChapterMenuOpenUp(checkChapterMenuShouldOpenUp(e.clientY));
                  setActiveChapterMenuId(chapIdKey);
                  setActiveChapterMenuMode('options');
                }}
                className={`group relative flex items-center justify-between py-2.5 pl-4 sm:pl-5 pr-2.5 rtl:pl-2.5 rtl:pr-4 rtl:sm:pr-5 rounded-full cursor-pointer transition-all ${
                  isThisChapterMenuOpen || isThisChapterCommentsOpen ? 'z-50' : 'z-10'
                } ${
                  isCurrentChapter 
                    ? 'bg-winblue/15 border border-winblue/30 shadow-[0_0_20px_rgba(var(--winblue-rgb),0.18)]' 
                    : 'hover:bg-[var(--button-secondary-bg)]/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-6 text-center text-xs flex items-center justify-center">
                    {isCurrentChapter ? (
                      <div className="flex items-end justify-center h-4 gap-[2.5px] w-6" title={isCurrentPlaying ? t('now_playing') : t('current_chapter')}>
                        <span className={`w-[2.5px] bg-winblue rounded-full ${isCurrentPlaying ? 'audio-bar-1' : 'h-3'}`} />
                        <span className={`w-[2.5px] bg-winblue rounded-full ${isCurrentPlaying ? 'audio-bar-2' : 'h-4'}`} />
                        <span className={`w-[2.5px] bg-winblue rounded-full ${isCurrentPlaying ? 'audio-bar-3' : 'h-2'}`} />
                        <span className={`w-[2.5px] bg-winblue rounded-full ${isCurrentPlaying ? 'audio-bar-4' : 'h-3.5'}`} />
                      </div>
                    ) : (
                      <>
                        <span className="text-[var(--text-muted)] group-hover:hidden">{i + 1}</span>
                        <div className="hidden group-hover:flex items-center justify-center relative">
                          <div className="absolute w-4 h-4 bg-slate-400/80 dark:bg-white/70 blur-[6px] rounded-full pointer-events-none" />
                          <BsPlayFill size={16} className="relative z-10 fill-black text-black dark:fill-white dark:text-white drop-shadow-[0_0_6px_rgba(100,116,139,0.85)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.95)] translate-x-[1px]" />
                        </div>
                      </>
                    )}
                  </div>
                  <span className={`text-sm ${isCurrentChapter ? 'text-winblue font-bold tracking-wide' : 'text-[var(--text-main)] font-medium'}`}>
                    {cap.title}
                  </span>
                </div>
                <div className="flex items-center gap-4 relative">
                  <div className="flex items-center gap-2">
                    {favoriteChapters.includes(chapIdKey) && (
                      <span 
                        title={t('favorite')} 
                        className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-md border border-yellow-400/40 flex items-center justify-center shadow-sm text-yellow-400 select-none shrink-0"
                      >
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                      </span>
                    )}
                    {(((cap.bookmarks && cap.bookmarks.length > 0) || (cap.comments && cap.comments.length > 0)) || isThisChapterCommentsOpen) && (
                      <div className={`relative flex items-center shrink-0 ${isThisChapterCommentsOpen ? 'z-50' : 'z-10'}`}>
                        <motion.button
                          type="button"
                          key="btn-chap-comments"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          animate={morphTriggerAnimate(isThisChapterCommentsOpen)}
                          title={t('bookmarks_count', { count: cap.bookmarks?.length || cap.comments?.length || 0 }) || t('comments_count', { count: cap.bookmarks?.length || cap.comments?.length || 0 })}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenBookmarks) { closeAllPopups(); onOpenBookmarks(activeBook, cap); return; }
                            const isAlreadyOpen = activeChapterCommentsPopupId === chapIdKey;
                            closeAllPopups();
                            if (!isAlreadyOpen) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setChapterCommentsPopupOpenUp(checkChapterMenuShouldOpenUp(rect.bottom, 380));
                              setActiveChapterCommentsPopupId(chapIdKey);
                            }
                          }}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 max-md:px-1 max-md:!bg-transparent max-md:!border-transparent max-md:!shadow-none rounded-full shadow-sm select-none cursor-pointer transition-all ${
                            isCurrentChapter
                              ? 'text-winblue bg-winblue/15 border border-winblue/35 hover:bg-winblue/25 hover:border-winblue/60 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.35)]'
                              : 'text-[var(--text-main)] bg-[var(--text-main)]/10 border border-[var(--text-main)]/25 hover:bg-white/20 hover:border-white/40 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                          }`}
                        >
                          <Bookmark size={10} className="fill-current" />
                          <span>{cap.bookmarks?.length || cap.comments?.length || 0}</span>
                        </motion.button>

                        <AnimatePresence>
                          {isThisChapterCommentsOpen && (
                            <>
                              <div 
                                className="fixed inset-0 z-40 cursor-default" 
                                {...getBackdropProps(() => setActiveChapterCommentsPopupId(null))} 
                              />
                              <PopupMorphContainer
                                key="chap-badge-comments-popup"
                                activeKey="chapter-badge-comments-view"
                                direction={1}
                                targetWidth={256}
                                targetRadius={24}
                                openUp={chapterCommentsPopupOpenUp}
                                style={{
                                  transformOrigin: `${chapterCommentsPopupOpenUp ? 'bottom' : 'top'} right`
                                }}
                                className={`absolute ${chapterCommentsPopupOpenUp ? 'bottom-0' : 'top-0'} right-0 z-50`}
                              >
                                {renderCommentsContent(activeBook, cap, false, false)}
                              </PopupMorphContainer>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    {isChapterCompleted(activeBook.id, cap.id) ? (
                      <span
                        title={t('completed')}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 max-md:p-0 max-md:w-6 max-md:h-6 max-md:justify-center max-md:!bg-transparent max-md:!border-transparent max-md:!shadow-none rounded-full shadow-sm pointer-events-none select-none ${
                          isCurrentChapter
                            ? 'text-winblue bg-winblue/15 border border-winblue/35'
                            : 'text-[var(--text-main)] bg-[var(--text-main)]/10 border border-[var(--text-main)]/25'
                        }`}
                      >
                        <CheckCircle2 size={11} />
                        <span className="max-md:hidden">{t('completed')}</span>
                      </span>
                    ) : isChapterStarted(activeBook.id, cap.id) ? (
                      <span
                        title={t('listening')}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 max-md:p-0 max-md:w-6 max-md:h-6 max-md:justify-center max-md:!bg-transparent max-md:!border-transparent max-md:!shadow-none rounded-full shadow-sm pointer-events-none select-none ${
                          isCurrentChapter
                            ? 'text-winblue bg-winblue/15 border border-winblue/35'
                            : 'text-[var(--text-main)] bg-[var(--text-main)]/10 border border-[var(--text-main)]/25'
                        }`}
                      >
                        <Headphones size={11} />
                        <span className="max-md:hidden">{t('listening')}</span>
                      </span>
                    ) : null}
                    <span className={`text-xs transition-colors ${
                      isCurrentChapter 
                        ? 'text-winblue font-semibold' 
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                    }`}>
                      {formatTime(cap.duration)}
                    </span>
                  </div>
                  <div className={`relative w-8 h-8 shrink-0 transition-opacity duration-200 ${
                    activeChapterMenuId === `${activeBook.id}-${cap.id}` 
                      ? 'opacity-100 z-50'
                      : 'opacity-0 group-hover:opacity-100 max-md:opacity-100'
                  }`}>
                    <motion.button
                      key="btn"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.92 }}
                      animate={activeChapterMenuId === `${activeBook.id}-${cap.id}` 
                        ? morphTriggerAnimate(true) 
                        : morphTriggerAnimate(false)
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        closeAllPopups();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setChapterMenuOpenUp(checkChapterMenuShouldOpenUp(rect.bottom));
                        setActiveChapterMenuId(`${activeBook.id}-${cap.id}`);
                        setActiveChapterMenuMode('options');
                      }}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                        isCurrentChapter
                          ? 'bg-winblue/20 border border-winblue/45 text-winblue shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)] hover:bg-winblue/30 hover:border-winblue/70 hover:shadow-[0_0_16px_rgba(var(--winblue-rgb),0.4)]'
                          : 'bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                      }`}
                      title={t('more_options_chapter')}
                    >
                      <MoreHorizontal size={16} />
                    </motion.button>
                    <AnimatePresence>
                      {activeChapterMenuId === `${activeBook.id}-${cap.id}` && (
                        <>
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            {...getBackdropProps(() => setActiveChapterMenuId(null))} 
                          />
                          <PopupMorphContainer
                            key="menu"
                            activeKey={activeChapterMenuMode === 'comments' ? 'chapter-comments-view' : 'chapter-options-view'}
                            direction={activeChapterMenuMode === 'comments' ? 1 : -1}
                            targetWidth={activeChapterMenuMode === 'comments' ? 256 : 180}
                            targetRadius={24}
                            openUp={chapterMenuOpenUp}
                            style={{
                              transformOrigin: `${chapterMenuOpenUp ? 'bottom' : 'top'} right`
                            }}
                            className={`absolute ${chapterMenuOpenUp ? 'bottom-0' : 'top-0'} right-0 z-50`}
                          >
                            {activeChapterMenuMode === 'comments' ? (
                              renderCommentsContent(activeBook, cap, false)
                            ) : (
                              <PagedMenu className="flex flex-col p-2">
                                <MenuOptionItem 
                                  icon={isCurrentPlaying ? <Pause size={14} /> : <Play size={14} />} 
                                  onClick={() => { handlePlayBookFromStart(activeBook, i); setActiveChapterMenuId(null); }}
                                >
                                  <span>{isCurrentPlaying ? t('pause') : t('listen_chapter')}</span>
                                </MenuOptionItem>
                                <MenuOptionItem 
                                  immediate
                                  icon={<Bookmark size={14} />} 
                                  onClick={() => {
                                    if (onOpenBookmarks) { setActiveChapterMenuId(null); onOpenBookmarks(activeBook, cap); return; }
                                    setActiveChapterMenuMode('comments');
                                  }}
                                >
                                  <span className="flex-1">{t('bookmarks') || t('comments')}</span>
                                  {((cap.bookmarks && cap.bookmarks.length > 0) || (cap.comments && cap.comments.length > 0)) && (
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--text-main)]/10 border border-[var(--text-main)]/20 text-[var(--text-main)] group-hover:bg-white/20 group-hover:border-white/35 group-hover:text-white font-bold transition-colors">
                                      {cap.bookmarks?.length || cap.comments?.length}
                                    </span>
                                  )}
                                </MenuOptionItem>
                                <MenuOptionItem 
                                   icon={isChapterCompleted(activeBook.id, cap.id) ? <Headphones size={14} /> : <CheckCircle2 size={14} />}
                                   onClick={() => {
                                     const chapId = `${activeBook.id}-${cap.id}`;
                                     if (isChapterCompleted(activeBook.id, cap.id)) {
                                       setCompletedChapters(prev => prev.filter(id => id !== chapId));
                                       setStartedChapters(prev => prev.filter(id => id !== chapId));
                                       showToast(t('toast_chapter_marked_unstarted', { title: cap.title }));
                                     } else {
                                       setCompletedChapters(prev => [...prev, chapId]);
                                       setStartedChapters(prev => Array.from(new Set([...prev, chapId])));
                                       showToast(t('toast_chapter_marked_completed', { title: cap.title }));
                                     }
                                     setActiveChapterMenuId(null);
                                   }}
                                 >
                                   <span>{isChapterCompleted(activeBook.id, cap.id) ? t('mark_as_unstarted') : t('mark_as_completed')}</span>
                                </MenuOptionItem>
                                <MenuOptionItem 
                                  icon={<Star size={14} className={favoriteChapters.includes(chapIdKey) ? 'fill-yellow-400 text-yellow-400' : ''} />} 
                                  onClick={() => {
                                    if (toggleFavoriteChapter) {
                                      toggleFavoriteChapter(activeBook.id, cap.id);
                                    } else if (favoriteChapters.includes(chapIdKey)) {
                                      setFavoriteChapters(prev => prev.filter(id => id !== chapIdKey));
                                      showToast(t('toast_chapter_removed_fav', { title: cap.title }));
                                    } else {
                                      setFavoriteChapters(prev => [...prev, chapIdKey]);
                                      showToast(t('toast_chapter_added_fav', { title: cap.title }));
                                    }
                                    setActiveChapterMenuId(null);
                                  }}
                                >
                                  <span>{favoriteChapters.includes(chapIdKey) ? t('remove_from_favorites') : t('favorite')}</span>
                                </MenuOptionItem>
                                <MenuOptionItem 
                                  icon={<ListPlus size={14} />} 
                                  onClick={() => {
                                    if (handleAddChapterToQueue) {
                                      handleAddChapterToQueue(activeBook, cap, i, 'next');
                                    } else {
                                      handleAddToQueue(activeBook, 'next');
                                      showToast(t('toast_chapter_queue_next', { title: cap.title }));
                                    }
                                    setActiveChapterMenuId(null);
                                  }}
                                >
                                  <span>{t('play_next')}</span>
                                </MenuOptionItem>
                                <MenuOptionItem 
                                  icon={<ListPlus size={14} />} 
                                  onClick={() => {
                                    if (handleAddChapterToQueue) {
                                      handleAddChapterToQueue(activeBook, cap, i, 'last');
                                    } else {
                                      handleAddToQueue(activeBook, 'last');
                                      showToast(t('toast_chapter_queue_last', { title: cap.title }));
                                    }
                                    setActiveChapterMenuId(null);
                                  }}
                                >
                                  <span>{t('add_to_queue_end')}</span>
                                </MenuOptionItem>
                              </PagedMenu>
                            )}
                          </PopupMorphContainer>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

