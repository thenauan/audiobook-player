import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minimize2, ChevronDown, SkipBack, SkipForward, Bookmark, Play, Copy, Share } from 'lucide-react';
import { BsPlayFill, BsPauseFill, BsArrowCounterclockwise, BsArrowClockwise } from 'react-icons/bs';
import type { Audiobook, Chapter, Author, TranscriptLine } from '../data';
import { AUTHORS_DATABASE } from '../data';
import { getGenericBookCover, getAuthorAvatar } from '../audioUtils';
import type { QueueItem } from '../queueUtils';
import { useI18n } from '../translations';
import { useIsMobile, useIsLandscapePhone, MobileContextMenu } from './MobileContextMenu';
import { MenuOptionItem, PagedMenu } from './Popovers';

export interface FullscreenPlayerProps {
  miniplayerAmbientStyle?: React.CSSProperties;
  onPlayerPointerDownCapture?: (e: React.PointerEvent) => void;
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
  currentBookHighlight: { hex: string; rgb: string };
  formatTime: (secs: number) => string;
  handleSliderPointerDown: () => void;
  handleSliderPointerUp: (val: number) => void;
  sliderDragStartPointRef: React.MutableRefObject<any>;
  renderPlaybackReturnButton: (isFullScreen: boolean) => React.ReactNode;
  renderFullScreenHeaderControls: (group?: 'all' | 'header' | 'row') => React.ReactNode;
  onCloseTranscript?: () => void;
  pendingChapterScrollRef: React.MutableRefObject<boolean>;
  targetScrollChapterIdRef: React.MutableRefObject<string | null>;
  setShouldScrollToCurrentChapter: (time: number) => void;
  navigateTo: (screenId: string, data?: any) => void;
  authors: Author[];
  fullscreenAmbientColors: {
    isDark: boolean;
    tonePrimary: string;
    toneLight: string;
    toneDeep: string;
    toneMedium: string;
    toneVeryLight: string;
    tonePastel: string;
    toneVeryDark: string;
    toneWhiteTint: string;
  };
  showTranscript: boolean;
  hasTranscript: boolean;
  fsTranscriptScrollRef: React.RefObject<HTMLDivElement | null>;
  activeTranscriptIndex: number;
  // Adiciona a frase da letra como marcação do capítulo em que ela está
  onAddLineBookmark?: (line: TranscriptLine) => void;
  // Gera a imagem (formato de story) com a frase
  onShareLine?: (line: TranscriptLine) => void;
  showToast?: (msg: string) => void;
}

// Dobráveis abertos: tela quase quadrada (ou dividida pela dobra)
const FOLD_QUERY = '(min-width: 600px) and (max-width: 1023px) and (min-aspect-ratio: 4/5) and (max-aspect-ratio: 5/4), (max-width: 1023px) and (horizontal-viewport-segments: 2), (max-width: 1023px) and (vertical-viewport-segments: 2)';
function useMediaFlag(query: string): boolean {
  const get = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const [flag, setFlag] = useState(get);
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const onChange = () => setFlag(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [query]);
  return flag;
}

// Retângulo do miniplayer usado como ponto de partida/chegada da animação de expansão
function getMiniPlayerClip(): string {
  if (typeof window === 'undefined') return 'inset(0px 0px 0px 0px round 0px)';
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const el = document.getElementById('mini-player');
  const rect = el?.getBoundingClientRect();
  if (rect && rect.width > 0 && rect.height > 0) {
    return `inset(${Math.round(rect.top)}px ${Math.round(vw - rect.right)}px ${Math.round(vh - rect.bottom)}px ${Math.round(rect.left)}px round ${Math.round(rect.height / 2)}px)`;
  }
  return `inset(${vh - 72}px 16px 16px 16px round 28px)`;
}

const FULLSCREEN_CLIP = 'inset(0px 0px 0px 0px round 0px)';

export default function FullscreenPlayer({
  miniplayerAmbientStyle,
  onPlayerPointerDownCapture,
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
  currentBookHighlight,
  formatTime,
  handleSliderPointerDown,
  handleSliderPointerUp,
  sliderDragStartPointRef,
  renderPlaybackReturnButton,
  renderFullScreenHeaderControls,
  onCloseTranscript,
  pendingChapterScrollRef,
  targetScrollChapterIdRef,
  setShouldScrollToCurrentChapter,
  navigateTo,
  authors,
  fullscreenAmbientColors,
  showTranscript,
  hasTranscript,
  fsTranscriptScrollRef,
  activeTranscriptIndex,
  onAddLineBookmark,
  onShareLine,
  showToast,
}: FullscreenPlayerProps) {
  const { t } = useI18n();
  // Capturado na montagem, enquanto o miniplayer ainda está no DOM (saindo)
  const [miniClip] = useState(getMiniPlayerClip);
  // Os botões do cabeçalho só aparecem quando a expansão do miniplayer termina
  const [isIntroDone, setIsIntroDone] = useState(false);
  // Garantia: o cabeçalho aparece mesmo se o fim da animação de abertura não for avisado
  // (ex.: "Reduzir movimento"/animações desligadas no sistema, ou abertura interrompida)
  React.useEffect(() => {
    const timer = setTimeout(() => setIsIntroDone(true), 650);
    return () => clearTimeout(timer);
  }, []);
  // Mobile: só Minimizar e Letra no cabeçalho; demais controles abaixo dos botões do player
  const isMobileFs = useIsMobile();
  // Celular deitado: capa de um lado e o player do outro; com a letra aberta, o mini player embaixo ganha mais botões
  const isLandFs = useIsLandscapePhone();
  // Dobráveis abertos (tela quase quadrada): capa, título e autor na metade de cima; controles na de baixo.
  // Com a letra aberta, ela fica só na metade de cima e o resto se ajusta na de baixo.
  const isFoldFs = useMediaFlag(FOLD_QUERY);
  const foldLyrics = isMobileFs && isFoldFs && showTranscript && hasTranscript;
  // Mobile com letra aberta: a letra ocupa a tela e o audiobook vira um mini player embaixo
  const mobileLyrics = isMobileFs && showTranscript && hasTranscript && !isFoldFs;

  // Frases da letra: segurar (toque) ou botão direito (mouse) destaca a frase e abre as opções
  const [lineMenu, setLineMenu] = useState<{ line: TranscriptLine; rect: DOMRect; el: HTMLElement } | null>(null);
  const linePressRef = React.useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> | null; fired: boolean } | null>(null);
  const openLineMenu = (el: HTMLElement) => {
    const idx = Number(el.getAttribute('data-transcript-idx'));
    const line = currentBook.transcript?.[idx];
    if (!line) return;
    closeAllPopups();
    const r = el.getBoundingClientRect();
    // Deitado: a frase em destaque fica mais estreita para o menu caber ao lado dela, sem cobri-la
    const rect = isLandFs
      ? new DOMRect(r.left, r.top, Math.min(r.width, Math.max(220, window.innerWidth - 250 - 72)), r.height)
      : r;
    setLineMenu({ line, rect, el });
  };
  const onLinesPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    const el = (e.target as HTMLElement).closest('[data-transcript-idx]') as HTMLElement | null;
    if (!el) return;
    const press = { x: e.clientX, y: e.clientY, timer: null as ReturnType<typeof setTimeout> | null, fired: false };
    press.timer = setTimeout(() => {
      press.fired = true;
      try { navigator.vibrate?.(10); } catch {}
      openLineMenu(el);
    }, 450);
    linePressRef.current = press;
  };
  const cancelLinePress = (e?: React.PointerEvent) => {
    const press = linePressRef.current;
    if (!press) return;
    if (e && e.type === 'pointermove' && Math.abs(e.clientX - press.x) < 8 && Math.abs(e.clientY - press.y) < 8) return;
    if (press.timer) clearTimeout(press.timer);
    if (e?.type === 'pointermove') linePressRef.current = null;
  };
  const onLinesClickCapture = (e: React.MouseEvent) => {
    // O toque longo não deve também pular o áudio para a frase
    if (linePressRef.current?.fired) {
      e.preventDefault();
      e.stopPropagation();
    }
    linePressRef.current = null;
  };
  const onLinesContextMenu = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-transcript-idx]') as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    if (linePressRef.current?.timer) clearTimeout(linePressRef.current.timer);
    if (!lineMenu) openLineMenu(el);
  };
  const lineText = (line: TranscriptLine) => (line.words && line.words.length > 0 ? line.words.map(w => w.text).join(' ') : line.text);

  // Celular: deslizar para baixo (fora de botões, barras e da letra) minimiza o player, como no iOS
  const swipeRef = React.useRef<{ y: number; x: number; active: boolean; el: HTMLElement | null } | null>(null);
  const onSwipeStart = (e: React.TouchEvent) => {
    if (!isMobileFs || e.touches.length !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, [role="button"], .fullscreen-transcript, [data-popup-content="true"]')) return;
    swipeRef.current = { y: e.touches[0].clientY, x: e.touches[0].clientX, active: false, el: e.currentTarget as HTMLElement };
  };
  const onSwipeMove = (e: React.TouchEvent) => {
    const st = swipeRef.current;
    if (!st) return;
    const dy = e.touches[0].clientY - st.y;
    const dx = e.touches[0].clientX - st.x;
    if (!st.active) {
      if (Math.abs(dx) > Math.abs(dy) || dy < 10) { if (dy < -10 || Math.abs(dx) > 12) swipeRef.current = null; return; }
      st.active = true;
    }
    if (st.el) st.el.style.translate = `0 ${Math.max(0, dy) * 0.9}px`;
  };
  const onSwipeEnd = (e: React.TouchEvent) => {
    const st = swipeRef.current;
    swipeRef.current = null;
    if (!st || !st.el) return;
    const dy = (e.changedTouches[0]?.clientY ?? st.y) - st.y;
    const el = st.el;
    if (st.active && dy > 120) {
      el.style.translate = '';
      closeAllPopups();
      setIsFullScreen(false);
      return;
    }
    el.style.transition = 'translate 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.translate = '';
    setTimeout(() => { el.style.transition = ''; }, 300);
  };

  return (
    <motion.div 
      key="fullscreen-player"
      data-fullscreen-player="true"
      onTouchStart={onSwipeStart}
      onTouchMove={onSwipeMove}
      onTouchEnd={onSwipeEnd}
      onTouchCancel={onSwipeEnd}
      onPointerDownCapture={onPlayerPointerDownCapture}
      initial={{ clipPath: miniClip, opacity: 1 }}
      animate={{ clipPath: FULLSCREEN_CLIP, opacity: 1 }}
      exit={{ clipPath: miniClip, opacity: 0, transition: { clipPath: { type: "spring", stiffness: 520, damping: 46, mass: 0.6 }, opacity: { duration: 0.14, delay: 0.14 } } }}
      transition={{ clipPath: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 }, opacity: { duration: 0.12, ease: "easeOut" } }}
      style={{ willChange: 'clip-path, opacity' }}
      onAnimationComplete={() => setIsIntroDone(true)}
      className="fixed inset-x-0 top-0 h-[var(--screen-h)] z-[200] px-4 sm:px-8 md:px-10 pt-[max(24px,calc(var(--safe-top)+8px))] pb-[max(24px,env(safe-area-inset-bottom))] max-md:pt-[var(--app-header-top)] max-md:pb-[max(16px,env(safe-area-inset-bottom))] fs-safe flex flex-col justify-between overflow-hidden text-[var(--text-main)] transform-gpu"
    >
      {/* Fundo Animado com Blur dinâmico se movendo e mudando de cores (tons da capa + luz e escuridão no escuro / fusão com branco no claro) */}
      <motion.div
        layoutId="player-shell"
        transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }}
        style={{ borderRadius: 0 }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden transform-gpu bg-white dark:bg-[#03060c]"
      >
        {/* Cor do miniplayer que se dissolve na cor do player enquanto ele se expande (e volta ao minimizar) */}
        {miniplayerAmbientStyle?.background && (
          <motion.div
            className="absolute inset-0 z-10"
            style={{ background: miniplayerAmbientStyle.background }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1, transition: { duration: 0.22, ease: 'easeIn' } }}
            transition={{ duration: 0.34, delay: 0.04, ease: 'easeOut' }}
          />
        )}
        {/* Orbe 1: Tom principal e variações ricas da capa (mesma cor da capa) */}
        <motion.div
          animate={{
            x: ['-14%', '24%', '-10%', '-14%'],
            y: ['-12%', '20%', '-16%', '-12%'],
            scale: [1, 1.3, 0.94, 1],
            backgroundColor: fullscreenAmbientColors.isDark ? [
              fullscreenAmbientColors.tonePrimary,
              fullscreenAmbientColors.toneLight,
              fullscreenAmbientColors.toneDeep,
              fullscreenAmbientColors.tonePrimary,
            ] : [
              fullscreenAmbientColors.tonePrimary,
              fullscreenAmbientColors.toneMedium,
              fullscreenAmbientColors.toneLight,
              fullscreenAmbientColors.tonePrimary,
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[18%] -left-[12%] w-[68vw] h-[68vw] max-w-[820px] max-h-[820px] rounded-full opacity-75 dark:opacity-75 blur-[120px] transform-gpu"
        />

        {/* Orbe 2: Luz & Tons suaves da capa */}
        <motion.div
          animate={{
            x: ['18%', '-22%', '14%', '18%'],
            y: ['12%', '-18%', '16%', '12%'],
            scale: [1.12, 0.88, 1.24, 1.12],
            backgroundColor: fullscreenAmbientColors.isDark ? [
              fullscreenAmbientColors.toneVeryLight,
              '#ffffff',
              fullscreenAmbientColors.toneLight,
              fullscreenAmbientColors.toneVeryLight,
            ] : [
              fullscreenAmbientColors.toneLight,
              fullscreenAmbientColors.tonePastel,
              fullscreenAmbientColors.tonePrimary,
              fullscreenAmbientColors.toneLight,
            ],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[8%] -right-[14%] w-[60vw] h-[60vw] max-w-[740px] max-h-[740px] rounded-full opacity-75 dark:opacity-25 blur-[130px] transform-gpu"
        />

        {/* Orbe 3: No escuro: Escuridão & Preto profundo. No claro: Tons médios e primários da capa */}
        <motion.div
          animate={{
            x: ['-10%', '20%', '-18%', '-10%'],
            y: ['18%', '-14%', '12%', '18%'],
            scale: [0.95, 1.25, 1.05, 0.95],
            backgroundColor: fullscreenAmbientColors.isDark ? [
              '#000000',
              fullscreenAmbientColors.toneVeryDark,
              fullscreenAmbientColors.toneDeep,
              '#000000',
            ] : [
              fullscreenAmbientColors.toneMedium,
              fullscreenAmbientColors.tonePrimary,
              fullscreenAmbientColors.tonePastel,
              fullscreenAmbientColors.toneMedium,
            ],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[16%] left-[12%] w-[66vw] h-[66vw] max-w-[800px] max-h-[800px] rounded-full opacity-80 dark:opacity-85 blur-[115px] transform-gpu"
        />

        {/* Orbe 4: No escuro: Tons escuros da capa. No claro: Tons médios e suaves da capa */}
        <motion.div
          animate={{
            x: ['14%', '-16%', '10%', '14%'],
            y: ['-14%', '18%', '-10%', '-14%'],
            scale: [1.06, 0.92, 1.2, 1.06],
            backgroundColor: fullscreenAmbientColors.isDark ? [
              fullscreenAmbientColors.toneDeep,
              fullscreenAmbientColors.tonePrimary,
              fullscreenAmbientColors.toneVeryDark,
              fullscreenAmbientColors.toneDeep,
            ] : [
              fullscreenAmbientColors.toneLight,
              fullscreenAmbientColors.tonePrimary,
              fullscreenAmbientColors.toneMedium,
              fullscreenAmbientColors.toneLight,
            ],
          }}
          transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[10%] -right-[12%] w-[62vw] h-[62vw] max-w-[760px] max-h-[760px] rounded-full opacity-70 dark:opacity-70 blur-[125px] transform-gpu"
        />

        {/* Orbe 5: Feixe central de luz suave e contraste fluido */}
        <motion.div
          animate={{
            x: ['-18%', '16%', '-8%', '-18%'],
            y: ['14%', '-18%', '12%', '14%'],
            scale: [0.92, 1.18, 0.88, 0.92],
            backgroundColor: fullscreenAmbientColors.isDark ? [
              'rgba(255, 255, 255, 0.75)',
              fullscreenAmbientColors.toneVeryLight,
              'rgba(0, 0, 0, 0.65)',
              'rgba(255, 255, 255, 0.75)',
            ] : [
              fullscreenAmbientColors.tonePastel,
              fullscreenAmbientColors.toneVeryLight,
              fullscreenAmbientColors.toneWhiteTint,
              fullscreenAmbientColors.tonePastel,
            ],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[28%] left-[22%] w-[48vw] h-[48vw] max-w-[580px] max-h-[580px] rounded-full opacity-65 dark:opacity-20 blur-[135px] transform-gpu"
        />

        {/* Camada sutil da textura da capa com mix-blend suave */}
        <img 
          src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)} 
          onError={(e) => handleBookCoverError(currentBook, e)}
          alt="blur bg" 
          className="w-full h-full object-cover blur-[90px] opacity-20 dark:opacity-15 dark:mix-blend-overlay scale-110 transform-gpu" 
        />

        {/* Camada de vidro com blur e equilíbrio de contraste: branco no claro, escuro no escuro */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/55 backdrop-blur-3xl" />
      </motion.div>


      {/* Cabeçalho do Player em Tela Cheia (distância superior = pt-6 = 24px) */}
      <motion.div
        data-app-header="true"
        className="flex items-center justify-between z-20 relative shrink-0 h-9 max-md:h-11"
        initial={{ opacity: 0 }}
        animate={{ opacity: isIntroDone ? 1 : 0 }}
        exit={{ opacity: 0, transition: { duration: 0 } }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        style={{ pointerEvents: isIntroDone ? 'auto' : 'none' }}
      >
        {/* Botão Minimizar à esquerda (mesma posição do voltar de outras telas com ícone Minimize2) */}
        {isMobileFs ? (
          // Celular: botão redondo no mesmo padrão e alinhamento dos botões do cabeçalho do app
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              closeAllPopups();
              setIsFullScreen(false);
            }}
            aria-label={t('minimize_fullscreen')}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl text-[var(--text-main)] backdrop-blur-3xl"
          >
            <ChevronDown size={22} />
          </motion.button>
        ) : (
        <motion.button 
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            closeAllPopups();
            setIsFullScreen(false);
          }}
          className="h-9 flex items-center justify-center gap-1.5 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
          title={t('minimize_fullscreen')}
        >
          <Minimize2 size={14} className="text-[var(--text-main)]" />
          <span className="text-xs font-medium text-[var(--text-main)]">{t('minimize')}</span>
        </motion.button>
        )}

        {/* Botões de função do miniplayer no cabeçalho à direita */}
        {renderFullScreenHeaderControls(isMobileFs ? 'header' : 'all')}
      </motion.div>

      {/* Corpo: Centralizado (com capa aumentada e simetria de espaçamento) ou duas colunas com texto */}
      <div className={`fs-main flex-1 flex flex-col md:flex-row items-center justify-center overflow-visible z-10 max-md:z-30 relative min-h-0 mt-6 [@media(max-height:520px)]:mt-3 ${foldLyrics ? 'fs-fold-lyrics' : ''}`}>
        
        {/* Coluna / Área do Player: Capa, Título, Livro/Autor, Barra de Progresso, Controles (mesmo tamanho com ou sem texto) */}
{!mobileLyrics && (
        <motion.div
          layout="position"
          transition={{ type: "spring", stiffness: 440, damping: 38, mass: 0.5 }}
          className="fs-column w-full max-w-sm sm:max-w-md [@media(max-height:520px)]:max-w-3xl flex flex-col items-center text-center justify-between h-full min-h-0 shrink-0 transform-gpu pb-3"
        >
          <div className="fs-body flex flex-col items-center justify-between h-full min-h-0 w-full">
            <div className="fs-top md:contents">
            {/* Capa do Audiobook com tamanho ampliado e proporções refinadas */}
            <div className="fs-cover-box md:contents">
              <motion.img 
              layoutId="player-cover"
              transition={{ type: "spring", stiffness: 460, damping: 44, mass: 0.6 }}
              style={{ borderRadius: 24 }}
              src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)} 
              onError={(e) => handleBookCoverError(currentBook, e)}
              alt={currentBook.title} 
              onClick={() => {
                pendingChapterScrollRef.current = false;
                targetScrollChapterIdRef.current = null;
                setIsFullScreen(false);
                navigateTo('book-detail', currentBook);
              }}
              className="fs-cover shadow-2xl object-cover ring-1 ring-black/10 dark:ring-white/20 shrink-0 z-10 cursor-pointer hover:opacity-90 transition-opacity aspect-[1/1.6] h-[calc(100dvh-310px)] max-h-[52dvh] min-h-[160px] [@media(max-height:520px)]:h-[calc(100dvh-120px)] [@media(max-height:520px)]:max-h-none [@media(max-height:520px)]:min-h-0 transform-gpu"
            />
            </div>
            
              {/* Informações da Faixa: Capítulo, Livro e Autor */}
              <div 
                className="fs-info w-full flex flex-col items-center mb-3.5 md:mt-auto md:pt-4"
                style={{
                  '--winblue': currentBookHighlight.hex,
                  '--winblue-rgb': currentBookHighlight.rgb,
                  '--color-winblue': currentBookHighlight.hex,
                  '--book-accent': currentBookHighlight.hex,
                  '--book-accent-rgb': currentBookHighlight.rgb,
                } as React.CSSProperties}
              >
                <motion.h2
                  layoutId="player-chapter-title"
                  layout="position"
                  transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }}
                  className="fs-title text-lg sm:text-xl font-bold text-black dark:text-white hover:text-winblue transition-colors cursor-pointer text-center max-w-full truncate px-4 mb-1 dark:drop-shadow-md"
                  title={`${t('view_chapter_in_book')} (${currentChapter.title})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    pendingChapterScrollRef.current = true;
                    targetScrollChapterIdRef.current = `${currentBook.id}-${currentChapter.id}`;
                    setIsFullScreen(false);
                    setSelectedBook(currentBook);
                    setShouldScrollToCurrentChapter(Date.now());
                    navigateTo('book-detail', currentBook);
                  }}
                >
                  {currentChapter.title}
                </motion.h2>

                <motion.div layoutId="player-book-line" layout="position" transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }} className="fs-bookline flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-800 dark:text-[var(--text-muted)] max-w-full px-4 truncate font-medium">
                  <span 
                    className="truncate text-slate-800 dark:text-[var(--text-muted)] hover:text-winblue cursor-pointer transition-colors font-semibold dark:drop-shadow-sm"
                    title={currentBook.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      pendingChapterScrollRef.current = false;
                      targetScrollChapterIdRef.current = null;
                      setIsFullScreen(false);
                      navigateTo('book-detail', currentBook);
                    }}
                  >
                    {currentBook.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-600 dark:text-[var(--text-muted)] opacity-70">•</span>
                  <span 
                    className="truncate text-slate-800 dark:text-[var(--text-muted)] hover:text-winblue cursor-pointer transition-colors font-semibold dark:drop-shadow-sm"
                    title={currentBook.author}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullScreen(false);
                      const authorObj = authors.find(a => a.name.toLowerCase() === currentBook.author.toLowerCase()) || AUTHORS_DATABASE.find(a => a.name.toLowerCase() === currentBook.author.toLowerCase()) || { id: 'auth-temp', name: currentBook.author, picture: getAuthorAvatar(currentBook.author), bio: '', nationality: 'Desconhecido', totalBooks: 1 };
                      navigateTo('author-detail', authorObj);
                    }}
                  >
                    {currentBook.author}
                  </span>
                </motion.div>
              </div>
            </div>

            <div className="fs-controls w-full flex flex-col items-center shrink-0">
              {/* Controles Principais */}
              <div className="w-full shrink-0 max-w-sm sm:max-w-md">
                {/* Barra de Progresso com grupo para hover da bolinha */}
                <motion.div layoutId="player-progress" transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }} className="w-full flex items-center gap-2.5 group mb-3.5">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-[var(--text-muted)] w-9 text-right shrink-0">{formatTime(chapterElapsed)}</span>
                  <div className="relative flex-1 flex items-center h-5 [@media(pointer:coarse)]:h-7">
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
                    {/* Toque: tocar ou arrastar em qualquer ponto da barra pula para aquele momento
                        (no iPhone, a barra nativa só se move arrastando exatamente a bolinha) */}
                    <div
                      aria-hidden="true"
                      data-seek-overlay="true"
                      className="absolute inset-x-0 -top-2 -bottom-2 z-[5] touch-none [@media(pointer:fine)]:hidden"
                      onPointerDown={(e) => {
                        const el = e.currentTarget;
                        el.setPointerCapture?.(e.pointerId);
                        handleSliderPointerDown();
                        const r = el.getBoundingClientRect();
                        const v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (currentChapter.duration || 0);
                        (el as any)._seekValue = v;
                        handleSeek(currentChapter.startTime + v);
                      }}
                      onPointerMove={(e) => {
                        const el = e.currentTarget;
                        if (!el.hasPointerCapture?.(e.pointerId)) return;
                        const r = el.getBoundingClientRect();
                        const v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (currentChapter.duration || 0);
                        (el as any)._seekValue = v;
                        handleSeek(currentChapter.startTime + v);
                      }}
                      onPointerUp={(e) => {
                        const el = e.currentTarget;
                        el.releasePointerCapture?.(e.pointerId);
                        handleSliderPointerUp(Number((el as any)._seekValue ?? chapterElapsed));
                      }}
                      onPointerCancel={(e) => {
                        const el = e.currentTarget;
                        handleSliderPointerUp(Number((el as any)._seekValue ?? chapterElapsed));
                      }}
                    />
                    {renderPlaybackReturnButton(true)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-[var(--text-muted)] w-9 shrink-0">-{formatTime(chapterRemaining)}</span>
                </motion.div>

                {/* Botões de Reprodução: Anterior, -30s, Play/Pause Maior, +15s, Próximo */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 py-3">
                  {/* Capítulo anterior */}
                  <motion.button
                    layoutId="player-prev"
                    transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }} 
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
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm shrink-0"
                    title={t('previous_chapter')}
                  >
                    <SkipBack size={17} />
                  </motion.button>

                  {/* Voltar */}
                  <motion.button
                    layoutId="player-seek-back"
                    transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }} 
                    whileHover={{ scale: 1.12 }} 
                    whileTap={{ scale: 0.92 }} 
                    onClick={() => handleSeek(Math.max(0, currentTime - seekBackwardTime))}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm relative shrink-0"
                    title={t('seek_backward', { sec: seekBackwardTime })}
                  >
                    <BsArrowCounterclockwise size={22} />
                    <span className="absolute text-[8px] font-bold mt-[1px]">{seekBackwardTime}</span>
                  </motion.button>

                  {/* Play/Pause MAIOR que os demais (destaque visual como no miniplayer) */}
                  <motion.button
                    layoutId="player-play"
                    transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }} 
                    whileHover={{ scale: 1.08 }} 
                    whileTap={{ scale: 0.94 }} 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:text-[var(--text-main)] dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/20 hover:border-black/20 dark:hover:border-white/40 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all shadow-lg shrink-0"
                    title={isPlaying ? t('pause') : t('listen')}
                  >
                    {isPlaying ? (
                      <BsPauseFill className="w-9 h-9 sm:w-11 sm:h-11" />
                    ) : (
                      <BsPlayFill className="w-9 h-9 sm:w-11 sm:h-11 translate-x-[2px]" />
                    )}
                  </motion.button>

                  {/* Avançar */}
                  <motion.button
                    layoutId="player-seek-fwd"
                    transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }} 
                    whileHover={{ scale: 1.12 }} 
                    whileTap={{ scale: 0.92 }} 
                    onClick={() => handleSeek(Math.min(totalDuration, currentTime + seekForwardTime))}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm relative shrink-0"
                    title={t('seek_forward', { sec: seekForwardTime })}
                  >
                    <BsArrowClockwise size={22} />
                    <span className="absolute text-[8px] font-bold mt-[1px]">{seekForwardTime}</span>
                  </motion.button>

                  {/* Próximo capítulo */}
                  <motion.button
                    layoutId="player-next"
                    transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }} 
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
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm shrink-0"
                    title={t('next_chapter')}
                  >
                    <SkipForward size={17} />
                  </motion.button>
                </div>
              </div>
              {isMobileFs && (
                <div className="w-full shrink-0 flex justify-center pt-1">
                  {renderFullScreenHeaderControls('row')}
                </div>
              )}
            </div>
          </div>
        </motion.div>
        )}

        {/* Coluna da Direita: Transcrição / Texto (quando ativada e com texto) */}
        <AnimatePresence initial={false}>
          {showTranscript && hasTranscript && (
            <motion.div 
              key="fullscreen-transcript-col"
              initial={isMobileFs ? { opacity: 0, y: 24 } : { opacity: 0, width: 0, x: 28, scale: 0.98 }}
              animate={isMobileFs ? { opacity: 1, y: 0 } : { opacity: 1, width: 'auto', x: 0, scale: 1 }}
              exit={isMobileFs ? { opacity: 0, y: 24 } : { opacity: 0, width: 0, x: 28, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 440, damping: 38, mass: 0.5 }}
              style={{ willChange: 'transform, opacity, width' }}
              className="fs-transcript flex max-md:flex-1 max-md:w-full max-md:min-h-0 md:max-w-2xl lg:max-w-3xl h-full flex-col min-w-0 overflow-hidden transform-gpu md:shrink-0"
            >
              <div 
                ref={fsTranscriptScrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar pl-8 md:pl-12 pr-6 md:pr-10 py-8 max-md:px-2 max-md:py-4 flex flex-col fullscreen-transcript w-full md:w-[min(48vw,680px)] md:shrink-0"
              >
                <div
                  className="my-auto space-y-6 select-none"
                  style={{ WebkitTouchCallout: 'none' }}
                  onPointerDown={onLinesPointerDown}
                  onPointerMove={cancelLinePress}
                  onPointerUp={(e) => cancelLinePress(e)}
                  onPointerCancel={(e) => cancelLinePress(e)}
                  onClickCapture={onLinesClickCapture}
                  onContextMenu={onLinesContextMenu}
                >
                  {(() => {
                    const transcript = currentBook.transcript;
                    const totalLines = transcript.length;
                    const isLarge = totalLines > 50;
                    
                    // Janela virtualizada centralizada na linha ativa para performance de 60fps
                    const activeIdx = activeTranscriptIndex >= 0 ? activeTranscriptIndex : 0;
                    const startIdx = isLarge ? Math.max(0, activeIdx - 15) : 0;
                    const endIdx = isLarge ? Math.min(totalLines, activeIdx + 25) : totalLines;
                    const visibleLines = transcript.slice(startIdx, endIdx);
                    
                    const ESTIMATED_ROW_HEIGHT = 56;
                    const topSpacerHeight = startIdx * ESTIMATED_ROW_HEIGHT;
                    const bottomSpacerHeight = (totalLines - endIdx) * ESTIMATED_ROW_HEIGHT;

                    return (
                      <>
                        {isLarge && topSpacerHeight > 0 && (
                          <div style={{ height: `${topSpacerHeight}px` }} aria-hidden="true" />
                        )}
                        {visibleLines.map((line, relativeIdx) => {
                          const idx = startIdx + relativeIdx;
                          const isActive = currentTime >= line.start && currentTime <= line.end;
                          const isPast = currentTime > line.end;
                          const hasWords = Boolean(line.words && line.words.length > 0);
                          return (
                            <p 
                              key={idx}
                              data-transcript-idx={idx}
                              className={`text-xl sm:text-2xl font-bold cursor-pointer transition-colors duration-150 origin-left px-4 py-2 rounded-2xl transform-gpu ${
                                isActive 
                                  ? 'opacity-100 scale-[1.03] text-black dark:text-white dark:drop-shadow-[0_2px_12px_rgba(255,255,255,0.25)]' 
                                  : isPast
                                  ? 'opacity-75 dark:opacity-40 scale-100 text-slate-700 dark:text-[var(--text-muted)] hover:text-black dark:hover:text-white'
                                  : 'opacity-85 dark:opacity-60 scale-100 text-slate-800 dark:text-[var(--text-muted)] hover:text-black dark:hover:text-white'
                              }`}
                              onClick={() => handleSeek(line.start)}
                            >
                              {hasWords ? (
                                line.words!.map((w, wIdx) => {
                                  const isWordActive = currentTime >= w.start && currentTime <= w.end;
                                  const isWordPast = currentTime > w.end;
                                  return (
                                    <span
                                      key={wIdx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSeek(w.start);
                                      }}
                                      className={`inline-block rounded-lg px-1 -mx-0.5 transition-colors duration-150 ${
                                        isWordActive
                                          ? 'text-black dark:text-winblue bg-black/10 dark:bg-winblue/20 shadow-[0_0_12px_rgba(0,0,0,0.15)] dark:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.35)] scale-105 font-black'
                                          : isActive
                                          ? (isWordPast ? 'text-black dark:text-white/95' : 'text-slate-700 dark:text-white/65 hover:text-black dark:hover:text-white')
                                          : ''
                                      }`}
                                    >
                                      {w.text}{' '}
                                    </span>
                                  );
                                })
                              ) : (
                                line.text
                              )}
                            </p>
                          );
                        })}
                        {isLarge && bottomSpacerHeight > 0 && (
                          <div style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true" />
                        )}
                      </>
                    );
                  })()}
                  <div className="h-[25vh] shrink-0" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile com letra aberta: audiobook como no miniplayer (capa, dados e play/pause); tocar fecha a letra */}
        {mobileLyrics && (
          <motion.div
            key="fs-lyrics-mini"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 460, damping: 40, mass: 0.6 }}
            role="button"
            tabIndex={0}
            onClick={() => onCloseTranscript?.()}
            onKeyDown={(e) => { if (e.key === 'Enter') onCloseTranscript?.(); }}
            className="mobile-press w-full shrink-0 mt-3 flex items-center gap-3 py-2 cursor-pointer select-none"
          >
            <motion.img
              layoutId="player-cover"
              transition={{ type: "spring", stiffness: 460, damping: 44, mass: 0.6 }}
              style={{ borderRadius: 10 }}
              src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)}
              onError={(e) => handleBookCoverError(currentBook, e)}
              alt=""
              className="h-14 aspect-[1/1.6] object-cover shadow-md shrink-0"
            />
            <div className="flex-1 min-w-0 text-left">
              <motion.p
                layoutId="player-chapter-title"
                layout="position"
                transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }}
                className="text-sm font-bold text-[var(--text-main)] truncate"
              >
                {currentChapter.title}
              </motion.p>
              <motion.p
                layoutId="player-book-line"
                layout="position"
                transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }}
                className="text-xs text-[var(--text-muted)] truncate mt-0.5"
              >
                {currentBook.title} • {currentBook.author}
              </motion.p>
            </div>
            {/* Deitado há espaço: os controles principais aparecem junto do play/pause */}
            {isLandFs && (
              <>
                <motion.button layoutId="player-prev" whileTap={{ scale: 0.9 }} title={t('previous_chapter')}
                  onClick={(e) => { e.stopPropagation(); if (handlePrevChapter) handlePrevChapter(); else handleSeek(currentChapter.startTime); }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0 relative">
                  <SkipBack size={17} />
                </motion.button>
                <motion.button layoutId="player-seek-back" whileTap={{ scale: 0.9 }} title={t('seek_backward', { sec: seekBackwardTime })}
                  onClick={(e) => { e.stopPropagation(); handleSeek(Math.max(0, currentTime - seekBackwardTime)); }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0 relative">
                  <BsArrowCounterclockwise size={20} />
                  <span className="absolute text-[7px] font-bold mt-[1px]">{seekBackwardTime}</span>
                </motion.button>
              </>
            )}
            <motion.button
              layoutId="player-play"
              transition={{ layout: { type: "spring", stiffness: 460, damping: 44, mass: 0.6 } }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
              aria-label={isPlaying ? t('pause') : t('listen')}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0"
            >
              {isPlaying ? <BsPauseFill size={20} /> : <BsPlayFill size={20} className="translate-x-[1px]" />}
            </motion.button>
            {isLandFs && (
              <>
                <motion.button layoutId="player-seek-fwd" whileTap={{ scale: 0.9 }} title={t('seek_forward', { sec: seekForwardTime })}
                  onClick={(e) => { e.stopPropagation(); handleSeek(Math.min(totalDuration, currentTime + seekForwardTime)); }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0 relative">
                  <BsArrowClockwise size={20} />
                  <span className="absolute text-[7px] font-bold mt-[1px]">{seekForwardTime}</span>
                </motion.button>
                <motion.button layoutId="player-next" whileTap={{ scale: 0.9 }} title={t('next_chapter')}
                  onClick={(e) => { e.stopPropagation(); handleNextChapter?.(); }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0 relative">
                  <SkipForward size={17} />
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </div>
      <MobileContextMenu
        open={Boolean(lineMenu)}
        rect={lineMenu?.rect || null}
        sourceEl={lineMenu?.el || null}
        onClose={() => setLineMenu(null)}
        activeKey="line-options"
        direction={1}
        targetWidth={250}
        targetRadius={20}
        estimatedMenuHeight={160}
        preview={lineMenu ? (
          <div className="px-4 py-3 rounded-3xl bg-card/95 border border-[var(--text-main)]/10 shadow-2xl text-xl sm:text-2xl font-bold text-[var(--text-main)] leading-snug">
            {lineText(lineMenu.line)}
          </div>
        ) : null}
      >
        <PagedMenu className="flex flex-col p-1.5 text-left rtl:text-right">
          <MenuOptionItem
            icon={<Bookmark size={14} />}
            onClick={() => {
              if (lineMenu) onAddLineBookmark?.(lineMenu.line);
              setLineMenu(null);
            }}
          >
            <span>{t('add_line_as_bookmark')}</span>
          </MenuOptionItem>
          <MenuOptionItem
            icon={<Play size={14} />}
            onClick={() => {
              if (lineMenu) { handleSeek(lineMenu.line.start); setIsPlaying(true); }
              setLineMenu(null);
            }}
          >
            <span>{t('play_from_here')}</span>
          </MenuOptionItem>
          <MenuOptionItem
            icon={<Share size={14} />}
            onClick={() => {
              const line = lineMenu?.line;
              setLineMenu(null);
              if (line) onShareLine?.(line);
            }}
          >
            <span>{t('share_excerpt')}</span>
          </MenuOptionItem>
          <MenuOptionItem
            icon={<Copy size={14} />}
            onClick={() => {
              if (lineMenu) {
                const text = lineText(lineMenu.line);
                navigator.clipboard?.writeText(text).then(() => showToast?.(t('toast_text_copied'))).catch(() => {});
              }
              setLineMenu(null);
            }}
          >
            <span>{t('copy_text')}</span>
          </MenuOptionItem>
        </PagedMenu>
      </MobileContextMenu>
    </motion.div>
  );
}
