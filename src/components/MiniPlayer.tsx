import React from 'react';
import { motion } from 'motion/react';
import { SkipBack, SkipForward } from 'lucide-react';
import { BsPlayFill, BsPauseFill, BsArrowCounterclockwise, BsArrowClockwise } from 'react-icons/bs';
import type { Audiobook, Chapter, Author } from '../data';
import { AUTHORS_DATABASE } from '../data';
import { getGenericBookCover, getAuthorAvatar } from '../audioUtils';
import type { QueueItem } from '../queueUtils';
import { useI18n } from '../translations';
import { useTabBarCollapsed, useMobileBarSplit, tabBarStore, miniPresenceStore, MOBILE_BAR, MOBILE_GLASS_SHADOW, MOBILE_SHRINK_SCALE } from './Sidebar';

export interface MiniPlayerProps {
  onPlayerPointerDownCapture?: (e: React.PointerEvent) => void;
  enterFromFullscreen?: boolean;
  currentBook: Audiobook;
  currentChapter: Chapter;
  currentChapterIndex: number;
  currentTime: number;
  totalDuration: number;
  chapterElapsed: number;
  chapterRemaining: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  handleSeek: (time: number) => void;
  handlePrevChapter?: () => void;
  handleNextChapter?: () => void;
  seekBackwardTime: number;
  seekForwardTime: number;
  playbackQueue: QueueItem[];
  setPlaybackQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  setCurrentBook: (b: Audiobook) => void;
  setSelectedBook: (b: Audiobook) => void;
  handleBookCoverError: (b: Audiobook, e: any) => void;
  closeAllPopups: () => void;
  setIsFullScreen: (full: boolean) => void;
  miniplayerAmbientStyle: React.CSSProperties;
  currentBookHighlight: { hex: string; rgb: string };
  formatTime: (secs: number) => string;
  handleSliderPointerDown: () => void;
  handleSliderPointerUp: (val: number) => void;
  sliderDragStartPointRef: React.MutableRefObject<any>;
  renderPlaybackReturnButton: (isFullScreen: boolean) => React.ReactNode;
  renderSecondaryControls: (isFullScreen: boolean) => React.ReactNode;
  pendingChapterScrollRef: React.MutableRefObject<boolean>;
  targetScrollChapterIdRef: React.MutableRefObject<string | null>;
  setShouldScrollToCurrentChapter: (time: number) => void;
  navigateTo: (screenId: string, data?: any) => void;
  authors: Author[];
}

// Ao expandir para a tela cheia o miniplayer apenas se dissolve dentro da expansão (custom = true);
// ao fechar o player ele desce e some
const miniPlayerVariants = {
  hidden: { y: 28, opacity: 0 },
  fromFullscreen: { y: 0, opacity: 1 },
  visible: { y: 0, opacity: 1 },
  exit: (toFullscreen: boolean) => toFullscreen
    ? { y: 0, opacity: 0, transition: { duration: 0.12, ease: "easeOut" as const } }
    : { y: 20, opacity: 0, transition: { duration: 0.14, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] } },
};

export default function MiniPlayer({
  onPlayerPointerDownCapture,
  enterFromFullscreen = false,
  currentBook,
  currentChapter,
  currentChapterIndex,
  currentTime,
  totalDuration,
  chapterElapsed,
  chapterRemaining,
  isPlaying,
  setIsPlaying,
  handleSeek,
  handlePrevChapter,
  handleNextChapter,
  seekBackwardTime,
  seekForwardTime,
  playbackQueue,
  setPlaybackQueue,
  setCurrentBook,
  setSelectedBook,
  handleBookCoverError,
  closeAllPopups,
  setIsFullScreen,
  miniplayerAmbientStyle,
  currentBookHighlight,
  formatTime,
  handleSliderPointerDown,
  handleSliderPointerUp,
  sliderDragStartPointRef,
  renderPlaybackReturnButton,
  renderSecondaryControls,
  pendingChapterScrollRef,
  targetScrollChapterIdRef,
  setShouldScrollToCurrentChapter,
  navigateTo,
  authors,
}: MiniPlayerProps) {
  const { t } = useI18n();

  return (
    <motion.div 
      key="mini-player"
      onPointerDownCapture={onPlayerPointerDownCapture}
      id="mini-player"
      variants={miniPlayerVariants}
      initial={enterFromFullscreen ? 'fromFullscreen' : 'hidden'}
      animate="visible"
      exit="exit"
      transition={{ type: "spring", stiffness: 540, damping: 38, mass: 0.5 }}
      className="desk-mini-safe fixed bottom-[88px] md:bottom-4 left-4 right-4 md:left-[296px] md:right-4 rtl:md:left-4 rtl:md:right-[296px] max-w-[848px] mx-auto z-[100] pointer-events-auto isolate flex items-center py-1.5"
      style={{
        gap: '22px',
        paddingLeft: '22px',
        paddingRight: '22px',
      }}
    >
      {/* Preenchimento do miniplayer (fundo, borda, blur e sombra): é a mesma camada que cresce até virar
          o fundo do player em tela cheia, e encolhe de volta ao minimizar */}
      <motion.div
        layoutId="player-shell"
        aria-hidden="true"
        transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }}
        className="absolute inset-0 -z-10 pointer-events-none backdrop-blur-3xl border shadow-2xl"
        style={{ ...miniplayerAmbientStyle, borderRadius: 28 }}
      />

      {/* Lado Esquerdo: Controles */}
      <div className="shrink-0 flex items-center gap-1.5">
        <motion.button
                    layoutId="player-prev"
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
          whileHover={{ scale: 1.12 }} 
          whileTap={{ scale: 0.92 }} 
          onClick={() => {
            if (handlePrevChapter) {
              handlePrevChapter();
            } else if (currentChapterIndex > 0) {
              handleSeek(currentBook.chapters[currentChapterIndex - 1].startTime);
            } else {
              handleSeek(currentChapter.startTime);
            }
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm hidden md:flex shrink-0"
          title={t('previous_chapter')}
        >
          <SkipBack size={13} />
        </motion.button>

        <motion.button
                    layoutId="player-seek-back"
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
          whileHover={{ scale: 1.12 }} 
          whileTap={{ scale: 0.92 }} 
          onClick={() => handleSeek(Math.max(0, currentTime - seekBackwardTime))}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm relative shrink-0"
          title={t('seek_backward', { sec: seekBackwardTime })}
        >
          <BsArrowCounterclockwise size={17} />
          <span className="absolute text-[7px] font-bold mt-[1px]">{seekBackwardTime}</span>
        </motion.button>

        <motion.button
                    layoutId="player-play"
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
          whileHover={{ scale: 1.12 }} 
          whileTap={{ scale: 0.92 }} 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:text-[var(--text-main)] dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/20 hover:border-black/20 dark:hover:border-white/40 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all shadow-sm shrink-0"
          title={isPlaying ? t('pause') : t('listen')}
        >
          {isPlaying ? <BsPauseFill size={22} /> : <BsPlayFill size={22} className="translate-x-[1px]" />}
        </motion.button>

        <motion.button
                    layoutId="player-seek-fwd"
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
          whileHover={{ scale: 1.12 }} 
          whileTap={{ scale: 0.92 }} 
          onClick={() => handleSeek(Math.min(totalDuration, currentTime + seekForwardTime))}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm relative shrink-0"
          title={t('seek_forward', { sec: seekForwardTime })}
        >
          <BsArrowClockwise size={17} />
          <span className="absolute text-[7px] font-bold mt-[1px]">{seekForwardTime}</span>
        </motion.button>

        <motion.button
                    layoutId="player-next"
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
          whileHover={{ scale: 1.12 }} 
          whileTap={{ scale: 0.92 }} 
          onClick={() => {
            if (handleNextChapter) {
              handleNextChapter();
            } else if (playbackQueue.length > 0) {
              const nextItem = playbackQueue[0];
              setPlaybackQueue(prev => prev.slice(1));
              setCurrentBook(nextItem.book);
              setSelectedBook(nextItem.book);
              handleSeek(nextItem.startTime);
              setIsPlaying(true);
            } else if (currentChapterIndex < currentBook.chapters.length - 1) {
              handleSeek(currentBook.chapters[currentChapterIndex + 1].startTime);
            }
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm hidden md:flex shrink-0"
          title={t('next_chapter')}
        >
          <SkipForward size={13} />
        </motion.button>
      </div>

      {/* Centro: Info e Progresso */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {/* Capa do Audiobook */}
        <motion.img 
          layoutId="player-cover"
          transition={{ type: "spring", stiffness: 680, damping: 52, mass: 0.5 }}
          style={{ borderRadius: 8 }}
          src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)} 
          onError={(e) => handleBookCoverError(currentBook, e)}
          alt={currentBook.title} 
          className="relative z-10 h-11 aspect-[1/1.6] object-cover shadow-md shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
          onClick={() => {
            closeAllPopups();
            setIsFullScreen(true);
          }}
          title={t('expand_player')}
        />

        <div 
          className="flex-1 min-w-0 w-full overflow-visible relative flex flex-col justify-center"
          style={{
            '--winblue': currentBookHighlight.hex,
            '--winblue-rgb': currentBookHighlight.rgb,
            '--color-winblue': currentBookHighlight.hex,
            '--book-accent': currentBookHighlight.hex,
            '--book-accent-rgb': currentBookHighlight.rgb,
          } as React.CSSProperties}
        >
          {/* Linha 1: Título do capítulo perfeitamente alinhado com o tempo corrido e nome do livro */}
          <div className="flex items-center gap-2 min-w-0 w-full">
            <motion.h4
              layoutId="player-chapter-title"
              layout="position"
              transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }}
              className="text-xs font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors" 
              title={`${t('view_chapter_in_book')} (${currentChapter.title})`}
              onClick={(e) => {
                e.stopPropagation();
                pendingChapterScrollRef.current = true;
                targetScrollChapterIdRef.current = `${currentBook.id}-${currentChapter.id}`;
                setSelectedBook(currentBook);
                setShouldScrollToCurrentChapter(Date.now());
                navigateTo('book-detail', currentBook);
              }}
            >
              {currentChapter.title}
            </motion.h4>
          </div>

          {/* Linha 2: Título do livro e nome do autor abaixo do capítulo */}
          <motion.div layoutId="player-book-line" layout="position" transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] truncate min-w-0 w-full mt-0.5">
            <span 
              className="truncate hover:text-winblue cursor-pointer transition-colors font-medium"
              title={currentBook.title}
              onClick={(e) => {
                e.stopPropagation();
                pendingChapterScrollRef.current = false;
                targetScrollChapterIdRef.current = null;
                navigateTo('book-detail', currentBook);
              }}
            >
              {currentBook.title}
            </span>
            <span className="shrink-0 text-[9px] opacity-60">•</span>
            <span 
              className="truncate hover:text-winblue cursor-pointer transition-colors"
              title={currentBook.author}
              onClick={(e) => {
                e.stopPropagation();
                const authorObj = authors.find(a => a.name.toLowerCase() === currentBook.author.toLowerCase()) || AUTHORS_DATABASE.find(a => a.name.toLowerCase() === currentBook.author.toLowerCase()) || { id: 'auth-temp', name: currentBook.author, picture: getAuthorAvatar(currentBook.author), bio: '', nationality: 'Desconhecido', totalBooks: 1 };
                navigateTo('author-detail', authorObj);
              }}
            >
              {currentBook.author}
            </span>
          </motion.div>

          {/* Linha 3: Faixa de progressão com minutos corridos alinhados com o título */}
          <motion.div layoutId="player-progress" transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} className="w-full flex items-center gap-2 group mt-1">
            <span className="text-[8px] text-[var(--text-muted)] shrink-0 whitespace-nowrap text-left">{formatTime(chapterElapsed)}</span>
            <div className="relative flex-1 flex items-center h-3.5">
              <input 
                type="range"
                min={0}
                max={currentChapter.duration || 1}
                value={chapterElapsed}
                onPointerDown={handleSliderPointerDown}
                onPointerUp={(e) => handleSliderPointerUp(Number(e.currentTarget.value))}
                onPointerCancel={(e) => handleSliderPointerUp(Number(e.currentTarget.value))}
                onKeyDown={(e) => {
                  if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                    if (!sliderDragStartPointRef.current) handleSliderPointerDown();
                  }
                }}
                onKeyUp={(e) => {
                  if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                    handleSliderPointerUp(Number(e.currentTarget.value));
                  }
                }}
                onChange={(e) => handleSeek(currentChapter.startTime + Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--slider-current-fill, var(--slider-fill)) ${(chapterElapsed / (currentChapter.duration || 1)) * 100}%, var(--slider-track) ${(chapterElapsed / (currentChapter.duration || 1)) * 100}%)`
                }}
                className="w-full apple-slider"
              />
              {renderPlaybackReturnButton(false)}
            </div>
            <span className="text-[8px] text-[var(--text-muted)] shrink-0 whitespace-nowrap text-right">-{formatTime(chapterRemaining)}</span>
          </motion.div>
        </div>
      </div>

      {/* Lado Direito: Controles Secundários */}
      <div className="shrink-0">
        {renderSecondaryControls(false)}
      </div>
    </motion.div>
  );
}


// ===== Mobile: miniplayer simplificado (estilo Apple Music / Audible no iOS) =====
// Capa, capítulo, "Audiobook • Autor" e play/pause. Fica acima da barra de abas e, quando a barra
// se recolhe, desliza para o espaço entre os dois botões redondos. Tocar abre o player em tela cheia.
const MORPH_LAYOUT = { layout: { type: 'spring' as const, stiffness: 680, damping: 52, mass: 0.5 } };

export interface MobileMiniPlayerProps {
  currentBook: Audiobook;
  currentChapter: Chapter;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  setIsFullScreen: (full: boolean) => void;
  closeAllPopups: () => void;
  handleBookCoverError: (b: Audiobook, e: any) => void;
  miniplayerAmbientStyle: React.CSSProperties;
  enterFromFullscreen?: boolean;
  onPlayerPointerDownCapture?: (e: React.PointerEvent) => void;
  // Layout com menu lateral (ex.: iPad mini deitado): fica centralizado na área de conteúdo
  docked?: boolean;
}

export function MobileMiniPlayer({
  currentBook,
  currentChapter,
  isPlaying,
  setIsPlaying,
  setIsFullScreen,
  closeAllPopups,
  handleBookCoverError,
  miniplayerAmbientStyle,
  enterFromFullscreen = false,
  onPlayerPointerDownCapture,
  docked = false,
}: MobileMiniPlayerProps) {
  const { t } = useI18n();
  // Expandida: acima da barra. Recolhida: entre os dois botões redondos, com o mesmo espaço dos dois lados.
  const barCollapsed = useTabBarCollapsed();
  const split = useMobileBarSplit();
  const { size, compact, gap } = MOBILE_BAR;
  // A barra de abas sabe que há miniplayer (muda o jeito de se recolher)
  React.useEffect(() => {
    if (docked) return;
    miniPresenceStore.set(true);
    return () => miniPresenceStore.set(false);
  }, [docked]);

  // Posição: em pé, acima da barra (ou entre os botões redondos quando recolhida);
  // lado a lado, à direita da barra, dividindo a largura (encolhe junto com ela ao rolar)
  const inset = 'var(--mobile-bar-inset)';
  const barBottom = 'var(--mobile-bar-bottom)';
  const halfW = `((100vw - 2 * ${inset} - ${gap}px) / 2)`;
  const shrinkLoss = 1 - MOBILE_SHRINK_SCALE;
  const height = split ? (barCollapsed ? Math.round(size * MOBILE_SHRINK_SCALE) : size) : compact;
  const placement: React.CSSProperties = split
    ? {
        left: barCollapsed ? `calc(50% + ${gap / 2}px + ${halfW} * ${shrinkLoss})` : `calc(50% + ${gap / 2}px)`,
        right: inset,
        bottom: barBottom,
      }
    : barCollapsed
      ? { left: `calc(${inset} + ${compact + gap}px)`, right: `calc(${inset} + ${compact + gap}px)`, bottom: barBottom }
      : { left: inset, right: inset, bottom: `calc(${barBottom} + ${size + gap}px)` };
  // Posição pelo topo, a partir da altura total da tela (no app instalado no iPhone, até a base de verdade)
  if (placement.bottom !== undefined) {
    placement.top = `calc(var(--screen-h) - ${placement.bottom} - ${height}px)`;
    delete placement.bottom;
  }
  const posTransition = 'left 0.32s cubic-bezier(0.22, 1, 0.36, 1), right 0.32s cubic-bezier(0.22, 1, 0.36, 1), top 0.32s cubic-bezier(0.22, 1, 0.36, 1), height 0.32s cubic-bezier(0.22, 1, 0.36, 1)';

  const openFullscreen = () => {
    // Encolhido: o toque funciona normalmente e o miniplayer volta ao tamanho padrão em seguida
    if (split && barCollapsed && !docked) tabBarStore.set(false);
    closeAllPopups();
    setIsFullScreen(true);
  };

  return (
    <motion.div
      key="mini-player"
      id="mini-player"
      onPointerDownCapture={onPlayerPointerDownCapture}
      variants={miniPlayerVariants}
      initial={enterFromFullscreen ? 'fromFullscreen' : 'hidden'}
      animate="visible"
      exit="exit"
      transition={{ type: "spring", stiffness: 540, damping: 38, mass: 0.5 }}
      className={docked
        ? "fixed z-[100] pointer-events-auto isolate left-[288px] right-4 rtl:left-4 rtl:right-[288px] mx-auto max-w-[520px]"
        : "fixed z-[96] pointer-events-auto isolate"}
      style={docked ? {
        bottom: 'max(16px, env(safe-area-inset-bottom))',
      } : {
        ...placement,
        transition: posTransition,
      }}
    >
      {/* Preenchimento compartilhado com o player em tela cheia (se expande até virar o fundo dele) */}
      <motion.div
        layoutId="player-shell"
        aria-hidden="true"
        transition={MORPH_LAYOUT}
        className="absolute inset-0 -z-10 pointer-events-none border"
        style={{ ...miniplayerAmbientStyle, boxShadow: MOBILE_GLASS_SHADOW, borderRadius: docked ? 28 : height / 2 }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={openFullscreen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFullscreen(); } }}
        aria-label={t('expand_player')}
        style={docked ? undefined : { height, borderRadius: height / 2, transition: 'height 0.32s cubic-bezier(0.22, 1, 0.36, 1)' }}
        className={`mobile-press flex items-center gap-3 pl-4 pr-2 cursor-pointer select-none ${docked ? 'h-14 rounded-[28px]' : ''}`}
      >
        <motion.img
          layoutId="player-cover"
          transition={{ type: "spring", stiffness: 680, damping: 52, mass: 0.5 }}
          style={{ borderRadius: 8 }}
          src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)}
          onError={(e) => handleBookCoverError(currentBook, e)}
          alt=""
          className="relative z-10 h-8 aspect-[1/1.6] object-cover shadow-md shrink-0"
        />
        <div className="flex-1 min-w-0">
          <motion.p
            layoutId="player-chapter-title"
            layout="position"
            transition={MORPH_LAYOUT}
            className="text-[13px] font-bold text-[var(--text-main)] truncate leading-tight"
          >
            {currentChapter.title}
          </motion.p>
          <motion.p
            layoutId="player-book-line"
            layout="position"
            transition={MORPH_LAYOUT}
            className="text-[11px] text-[var(--text-muted)] truncate leading-tight mt-0.5"
          >
            {currentBook.title} • {currentBook.author}
          </motion.p>
        </div>
        <motion.button
          layoutId="player-play"
          transition={MORPH_LAYOUT}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
            if (split && barCollapsed && !docked) tabBarStore.set(false);
          }}
          aria-label={isPlaying ? t('pause') : t('listen')}
          className="mobile-press w-10 h-10 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0"
        >
          {isPlaying ? <BsPauseFill size={18} /> : <BsPlayFill size={18} className="translate-x-[1px]" />}
        </motion.button>
      </div>
    </motion.div>
  );
}
