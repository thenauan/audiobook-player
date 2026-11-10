import React from 'react';
// Conteúdo dos pop-ups do player, comum ao player em tela cheia ("fs") e ao miniplayer ("mini").
// Cada controle decide onde o pop-up abre; aqui fica só o que aparece dentro dele.
import { AnimatePresence, Reorder, motion } from 'motion/react';
import { PagedMenu, QueueItemRow, SmoothSubMorph } from '../popups/Popovers';
import { Bookmark, CheckCircle2, ChevronUp, Headphones, ListX, Maximize2, Minimize2, Star, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useSessionHistory } from '../../lib/sessionHistory';
import { SPRING } from '../../lib/motion';
import { BsCheck2 } from 'react-icons/bs';
import { getGenericBookCover } from '../../lib/coverArt';
import { Chapter } from '../../data/catalog';
import { IS_APPLE_TOUCH } from '../../lib/desktopBridge';
import { getSleepTimerIcon, getSpeedIcon } from '../../App';
import { useAppScope } from '../../app/AppScope';

type PopupVariant = 'fs' | 'mini';

export function SpeedMenuContent({ variant }: { variant: PopupVariant }) {
  const { handleSelectSpeed, playbackSpeed, t } = useAppScope();
  return (
    <>
    <div className="relative z-10 flex flex-col">
      <div className="px-3 py-2 mb-1 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--text-main)]">{t('playback_speed')}</span>
      </div>
      <PagedMenu className="flex flex-col">{[0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => {
        const isSelected = playbackSpeed === s;
        return (
          <button
            key={s}
            onClick={() => handleSelectSpeed(s)}
            className={`relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 group ${
              isSelected
                ? 'hover:bg-winblue/25 '
                : 'hover:bg-[var(--hover-fill)] '
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={`${variant}-speed-active-pill`}
                className="absolute inset-0 bg-winblue/15 rounded-2xl pointer-events-none z-0"
                transition={SPRING.snappy}
              />
            )}
            <div className="relative z-10 flex items-center gap-2.5">
              <span className={`${isSelected ? 'text-winblue' : 'text-[var(--text-main)] dark:group-hover:text-white'} transition-colors shrink-0`}>
                {getSpeedIcon(s)}
              </span>
              <span className={`transition-colors ${isSelected ? 'text-winblue font-bold' : 'text-[var(--text-main)] dark:group-hover:text-white'}`}>
                {s === 1 ? t('normal_speed_label') : `${s}x`}
              </span>
            </div>
            {isSelected && (
              <motion.div
                layoutId={`${variant}-speed-active-check`}
                className="relative z-10 text-winblue shrink-0"
                transition={SPRING.snappy}
              >
                <BsCheck2 size={16} />
              </motion.div>
            )}
          </button>
        );
      })}</PagedMenu>
    </div>
    </>
  );
}

export function SleepTimerContent({ variant }: { variant: PopupVariant }) {
  const { chapterElapsed, chapterRemaining, currentChapter, formatCountdown, formatTime, isSleepTimerPaused, setIsSleepTimerPaused, setShowSleepTimerMenu, setSleepTimerMode, setSleepTimerRemaining, showToast, sleepTimerMode, sleepTimerRemaining, t } = useAppScope();
  return (
    <>
    <div className="relative z-10 flex flex-col">
      <div className="px-3 py-2 mb-1 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--text-main)]">{t('sleep_timer')}</span>
      </div>

      <SmoothSubMorph
        activeKey={sleepTimerMode !== null ? `${variant}-sleep-active` : `${variant}-sleep-presets`}
        direction={sleepTimerMode !== null ? 1 : -1}
      >
        {sleepTimerMode !== null ? (
          /* MODO ATIVO: COUNTDOWN E DOIS BOTÕES (PAUSAR À ESQUERDA, CANCELAR À DIREITA) COM DESIGN PADRÃO */
          <div className="p-1 flex flex-col items-center">
            <div className="w-full py-3 px-2 flex flex-col items-center justify-center my-0.5">
              <span className={`text-3xl font-bold tracking-widest transition-opacity ${isSleepTimerPaused ? 'opacity-60 text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                {formatCountdown(
                  sleepTimerMode === 'end-of-chapter'
                    ? Math.max(0, currentChapter.duration - chapterElapsed)
                    : (sleepTimerRemaining || 0)
                )}
              </span>
              <span className="text-[13px] font-medium text-[var(--text-muted)] mt-1.5 text-center px-2">
                {isSleepTimerPaused
                  ? t('sleep_timer_paused')
                  : t('sleep_timer_auto_off')}
              </span>
            </div>

            <div className="w-full flex items-center gap-2 mt-2">
              {/* Pausar/Retomar à ESQUERDA com design dos botões da interface */}
              <motion.button
                data-press="true"
                onClick={() => {
                  setIsSleepTimerPaused(!isSleepTimerPaused);
                  showToast(!isSleepTimerPaused ? t('sleep_timer_paused') : t('sleep_timer_resume'));
                }}
                className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold bg-card/75 backdrop-blur-3xl shadow-md hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all flex items-center justify-center gap-1.5"
                title={isSleepTimerPaused ? t('sleep_timer_resume') : t('sleep_timer_pause')}
              >
                {isSleepTimerPaused ? <Play size={14} /> : <Pause size={14} />}
                <span>{isSleepTimerPaused ? t('sleep_timer_resume') : t('sleep_timer_pause')}</span>
              </motion.button>

              {/* Cancelar à DIREITA com design dos botões da interface */}
              <motion.button
                data-press="true"
                onClick={() => {
                  setSleepTimerRemaining(null);
                  setSleepTimerMode(null);
                  setIsSleepTimerPaused(false);
                  setShowSleepTimerMenu(false);
                  showToast(t('sleep_timer_canceled'));
                }}
                className="flex-1 py-2.5 px-3 rounded-full text-xs font-semibold bg-card/75 backdrop-blur-3xl shadow-md hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all flex items-center justify-center gap-1.5"
                title={t('cancel_timer')}
              >
                <X size={14} />
                <span>{t('cancel')}</span>
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setSleepTimerMode('end-of-chapter');
                setSleepTimerRemaining(Math.max(1, currentChapter.duration - chapterElapsed));
                setIsSleepTimerPaused(false);
                setShowSleepTimerMenu(false);
                showToast(t('sleep_timer_until_end'));
              }}
              className="relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 group hover:bg-[var(--hover-fill)] "
            >
              <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors shrink-0">
                  <Bookmark size={14} />
                </span>
                <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors truncate">
                  {t('sleep_timer_until_end')}
                </span>
              </div>
              <span className="relative z-10 text-[10px] text-[var(--text-muted)] dark:group-hover:text-white/80 shrink-0 ml-1 transition-colors">
                {formatTime(chapterRemaining)}
              </span>
            </button>

            {[15, 30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSleepTimerMode('duration');
                  setSleepTimerRemaining(mins * 60);
                  setIsSleepTimerPaused(false);
                  setShowSleepTimerMenu(false);
                  showToast(t('sleep_timer_mins', { mins }));
                }}
                className="relative w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl select-none transition-all duration-150 group hover:bg-[var(--hover-fill)] "
              >
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors shrink-0">
                    {getSleepTimerIcon(mins)}
                  </span>
                  <span className="text-[var(--text-main)] dark:group-hover:text-white transition-colors">
                    {t('sleep_timer_mins', { mins })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </SmoothSubMorph>
    </div>
    </>
  );
}

// Expandir a fila (celular): o próprio cartão cresce até a tela cheia e, ao diminuir, encolhe de volta ao
// tamanho que tinha (é o mesmo pop-up se transformando, não um fechando e outro abrindo)
const QUEUE_MORPH = 'var(--dur-sheet) var(--spring-sheet)';
const QUEUE_MORPH_MS = 600;
const MORPH_PROPS = ['transition', 'height', 'maxHeight', 'left', 'right', 'bottom', 'borderRadius'];
export function QueueContent({ variant }: { variant: PopupVariant }) {
  const { fsNowPlayingRef, fsQueueScrollRef, isMobile, miniNowPlayingRef, miniQueueScrollRef, playbackQueue, setMobileConfirm, setPlaybackQueue, showToast, t } = useAppScope();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  // Enquanto o cartão muda de tamanho, o ajuste automático de altura dos pop-ups fica parado
  const [morphing, setMorphing] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const savedHeight = React.useRef(0);
  const savedStyle = React.useRef<Record<string, string>>({});
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const card = () => rootRef.current?.closest('[data-player-sheet]') as HTMLElement | null;
  const wrappers = (c: HTMLElement) => [c.firstElementChild as HTMLElement | null, c.firstElementChild?.firstElementChild as HTMLElement | null];
  const expand = () => {
    const c = card();
    setMorphing(true);
    setExpanded(true);
    if (!c) return;
    savedHeight.current = c.getBoundingClientRect().height;
    // Valores do próprio cartão (posição e cantos), devolvidos ao terminar de diminuir
    savedStyle.current = Object.fromEntries(MORPH_PROPS.map(k => [k, (c.style as any)[k] as string]));
    c.style.transition = 'none';
    c.style.height = `${savedHeight.current}px`;
    c.style.maxHeight = 'none';
    void c.offsetHeight;
    c.style.transition = ['height', 'left', 'right', 'bottom', 'border-radius', 'background-color'].map(prop => `${prop} ${QUEUE_MORPH}`).join(', ');
    // Em tela cheia, quase opaco (como as folhas de tela cheia)
    c.dataset.queueExpanded = 'true';
    c.style.left = '0px';
    c.style.right = '0px';
    c.style.bottom = '0px';
    c.style.height = 'calc(var(--screen-h, 100dvh) - var(--safe-top) - 12px)';
    c.style.borderRadius = '38px 38px 0 0';
    wrappers(c).forEach(w => { if (w) { w.style.flex = '1 1 auto'; w.style.minHeight = '0'; } });
  };
  const collapse = () => {
    const c = card();
    if (!c) { setExpanded(false); setMorphing(false); return; }
    const o = savedStyle.current;
    delete c.dataset.queueExpanded;
    c.style.left = o.left || 'var(--mobile-bar-inset)';
    c.style.right = o.right || 'var(--mobile-bar-inset)';
    c.style.bottom = o.bottom || 'var(--mobile-bar-bottom)';
    c.style.height = `${savedHeight.current}px`;
    c.style.borderRadius = o.borderRadius || 'var(--bottom-card-radius)';
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Volta ao conteúdo do pop-up com a mesma altura que ele já tem na tela
      MORPH_PROPS.forEach(k => { (c.style as any)[k] = o[k] || ''; });
      wrappers(c).forEach(w => { if (w) { w.style.flex = ''; w.style.minHeight = ''; } });
      setExpanded(false);
      timer.current = setTimeout(() => setMorphing(false), 120);
    }, QUEUE_MORPH_MS);
  };
  const clearQueue = () => setMobileConfirm({
    title: t('queue_clear_confirm'),
    description: t('queue_clear_desc'),
    confirmLabel: t('clear_queue'),
    onConfirm: () => { setPlaybackQueue([]); showToast(t('queue_cleared')); },
  });
  const roundBtn = "w-9 h-9 rounded-full bg-card/75 flex items-center justify-center shrink-0";
  return (
    <>
    <div ref={rootRef} className={`relative z-10 flex flex-col min-h-0 ${expanded ? 'flex-1' : variant === 'fs' ? 'max-h-[392px]' : 'max-h-[310px]'} overflow-hidden`}>
      {morphing && <span data-paged-morphing="true" hidden />}
      {expanded ? (
        <div className="relative px-1 pt-1 pb-2 flex items-center justify-center min-h-11 shrink-0">
          <motion.button
            data-press="true"
            onClick={(e) => { e.stopPropagation(); collapse(); }}
            aria-label={t('queue_collapse')}
            title={t('queue_collapse')}
            className={`${roundBtn} absolute left-1 rtl:left-auto rtl:right-1 text-[var(--text-main)]`}
          >
            <Minimize2 size={16} />
          </motion.button>
          <span className="text-[17px] font-semibold text-[var(--text-main)] truncate px-12">{t('queue')}</span>
          <motion.button
            data-press="true"
            onClick={(e) => { e.stopPropagation(); clearQueue(); }}
            disabled={playbackQueue.length === 0}
            aria-label={t('clear_queue')}
            title={t('clear_queue')}
            className={`${roundBtn} absolute right-1 rtl:right-auto rtl:left-1 text-red-500 disabled:opacity-40`}
          >
            <ListX size={16} />
          </motion.button>
        </div>
      ) : (
        <div className="px-3 py-2 mb-1 flex items-center justify-between pb-2 shrink-0">
          <span className="text-sm font-bold text-[var(--text-main)]">{t('queue')}</span>
          {/* Celular: a fila inteira em tela cheia */}
          {isMobile && (
            <motion.button
              data-press="true"
              onClick={(e) => { e.stopPropagation(); expand(); }}
              aria-label={t('queue_expand')}
              title={t('queue_expand')}
              className="w-8 h-8 -my-1 rounded-full bg-card/75 flex items-center justify-center text-[var(--text-main)] shrink-0"
            >
              <Maximize2 size={14} />
            </motion.button>
          )}
        </div>
      )}
      {/* Aviso fora da lista: não fica atrás do esmaecimento do topo e, ao sumir, não deixa espaço a mais entre os
          capítulos anteriores e o que está tocando */}
      <AnimatePresence initial={false}>
        {hint && (
          <motion.p
            key="queue-hint"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: SPRING.snappy, opacity: { duration: 0.15 } }}
            className="shrink-0 overflow-hidden flex items-center justify-center gap-1 text-[11px] text-[var(--text-muted)] select-none"
          >
            <span className="flex items-center gap-1 pb-1.5"><ChevronUp size={12} /><span>{t('queue_history_hint')}</span></span>
          </motion.p>
        )}
      </AnimatePresence>

      <div
        ref={variant === 'fs' ? fsQueueScrollRef : miniQueueScrollRef}
        className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col px-1.5 mt-1"
      >
        <QueueList nowPlayingRef={variant === 'fs' ? fsNowPlayingRef : miniNowPlayingRef} onHintChange={setHint} />
      </div>
    </div>
    </>
  );
}

// Favorito e marcação do capítulo: só os ícones, como na página do audiobook
function ChapterBadges({ bookId, chapterId }: { bookId?: string; chapterId?: number | string }) {
  const { booksRef, favoriteChapters, t } = useAppScope();
  if (!bookId || chapterId === undefined) return null;
  const chapter = booksRef.current.find(b => b.id === bookId)?.chapters?.find((c: Chapter) => String(c.id) === String(chapterId)) as (Chapter & { bookmarks?: unknown[]; comments?: unknown[] }) | undefined;
  const fav = favoriteChapters.includes(`${bookId}-${chapterId}`);
  const marked = Boolean(chapter && ((chapter.bookmarks?.length || 0) > 0 || (chapter.comments?.length || 0) > 0));
  if (!fav && !marked) return null;
  return (
    <span className="flex items-center gap-1.5 shrink-0 mr-1.5 pointer-events-none">
      {fav && (
        <span title={t('favorite')} className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-yellow-400 select-none">
          <Star size={10} className="fill-yellow-400 text-yellow-400" />
        </span>
      )}
      {marked && <Bookmark size={11} className="fill-current text-[var(--text-muted)]" aria-label={t('bookmarks')} />}
    </span>
  );
}

// Lista da fila (pop-up e folha de tela cheia): capítulos já tocados nesta sessão (acima, tocam ao tocar),
// o que está tocando e os próximos
export function QueueList({ nowPlayingRef, onHintChange }: { nowPlayingRef?: React.Ref<HTMLDivElement>; onHintChange?: (visible: boolean) => void }) {
  const { beginBookSwitch, booksRef, chapterElapsed, currentBook, currentBookHighlight, currentChapter, formatTime, getChapterResumeElapsed, handleBookCoverError, handlePlayBookFromStart, isChapterCompleted, isChapterStarted, handleSeek, isMobile, isPlaying, isTouchDevice, navigateTo, pendingChapterScrollRef, playbackQueue, setCurrentBook, setIsFullScreen, setIsPlaying, setPlaybackQueue, setSelectedBook, setShouldScrollToCurrentChapter, setShowQueuePopup, t, targetScrollChapterIdRef } = useAppScope();
  const currentKey = `${currentBook?.id}-${currentChapter?.id}`;
  const history = useSessionHistory().filter(h => h.key !== currentKey);
  // Espaço no fim para o que está tocando sempre poder ficar no topo (os anteriores só aparecem rolando para cima)
  const tailRef = React.useRef<HTMLDivElement>(null);
  const [spacer, setSpacer] = React.useState(0);
  React.useLayoutEffect(() => {
    const tail = tailRef.current;
    const scroller = tail?.closest('.overflow-y-auto') as HTMLElement | null;
    if (!tail || !scroller || !history.length) { setSpacer(0); return; }
    const measure = () => setSpacer(Math.max(0, scroller.clientHeight - tail.offsetHeight - 8));
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(scroller); ro?.observe(tail);
    return () => ro?.disconnect();
  }, [history.length, playbackQueue.length]);
  // O aviso de "role para cima" (fora da lista) some enquanto os anteriores estão à vista e volta quando a lista
  // retorna ao que está tocando
  const hintCb = React.useRef(onHintChange);
  hintCb.current = onHintChange;
  React.useEffect(() => {
    const tail = tailRef.current;
    const scroller = tail?.closest('.overflow-y-auto') as HTMLElement | null;
    if (!tail || !scroller || !history.length) { hintCb.current?.(false); return; }
    const onScroll = () => hintCb.current?.(tail.getBoundingClientRect().top - scroller.getBoundingClientRect().top <= 12);
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [history.length]);
  const playPrevious = (bookId: string, chapterId: number) => {
    const book = booksRef.current.find(b => b.id === bookId);
    if (!book) return;
    const idx = (book.chapters || []).findIndex((c: Chapter) => String(c.id) === String(chapterId));
    if (idx < 0) return;
    handlePlayBookFromStart(book, idx);
  };
  return (
    <>
        {history.length > 0 && (
          <div className="flex flex-col shrink-0">
            {history.map(h => (
              <button
                key={h.key}
                type="button"
                onClick={(e) => { e.stopPropagation(); playPrevious(h.bookId, h.chapterId); }}
                className="w-full flex items-center gap-3 p-2 rounded-2xl text-left rtl:text-right opacity-70 hover:opacity-100 hover:bg-[var(--hover-fill)] transition-[opacity,background-color]"
                title={t('play')}
              >
                {/* Capa com o estado do capítulo no meio: concluído ou ouvindo (começado) */}
                <span className="relative shrink-0">
                  <img src={h.cover || getGenericBookCover(h.bookTitle, h.author)} alt="" className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover" />
                  {(isChapterCompleted(h.bookId, h.chapterId) || isChapterStarted(h.bookId, h.chapterId)) && (
                    <span className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center text-white">
                      {isChapterCompleted(h.bookId, h.chapterId) ? <CheckCircle2 size={14} /> : <Headphones size={14} />}
                    </span>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-[var(--text-main)] truncate">{h.chapterTitle}</span>
                  <span className="block text-xs text-[var(--text-muted)] truncate">{h.bookTitle}{h.author ? ` • ${h.author}` : ''}</span>
                </span>
                <ChapterBadges bookId={h.bookId} chapterId={h.chapterId} />
              </button>
            ))}
          </div>
        )}
        <div ref={tailRef} className="flex flex-col shrink-0">
        {/* TOCANDO AGORA */}
        <div ref={nowPlayingRef} className="shrink-0">
          <div 
            onClick={() => {
              setIsPlaying(true);
            }}
            className="group relative flex items-center gap-3 p-2 rounded-2xl bg-winblue/10 cursor-pointer hover:bg-winblue/15 transition-all shadow-sm"
            // Celular: o destaque do capítulo tocando tem a cor da capa do audiobook (o pop-up usa a cor do app)
            style={isMobile && currentBookHighlight ? ({
              '--winblue': currentBookHighlight.hex,
              '--winblue-rgb': currentBookHighlight.rgb,
              '--color-winblue': currentBookHighlight.hex,
            } as React.CSSProperties) : undefined}
            title={t('play') || 'Reproduzir'}
          >
            <div className="relative shrink-0">
              <img
                src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)}
                onError={(e) => handleBookCoverError(currentBook, e)}
                alt=""
                className="w-7 h-11 aspect-[1/1.6] rounded-lg object-cover shadow-sm"
              />
              <div className="absolute inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center rounded-lg">
                <div className="relative flex items-center justify-center">
                  {/* Brilho luminoso: cinza no modo claro, branco no modo escuro */}
                  <div className="absolute w-4 h-4 rounded-full bg-slate-400/80 dark:bg-white/60 blur-[5px] pointer-events-none" />
                  <div className="relative z-10 flex items-end justify-center h-3 gap-[2px] w-4">
                    <span className={`w-[2px] bg-black dark:bg-white rounded-full ${isPlaying ? 'audio-bar-1' : 'h-2'}`} />
                    <span className={`w-[2px] bg-black dark:bg-white rounded-full ${isPlaying ? 'audio-bar-2' : 'h-3'}`} />
                    <span className={`w-[2px] bg-black dark:bg-white rounded-full ${isPlaying ? 'audio-bar-3' : 'h-1.5'}`} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p 
                onClick={(e) => {
                  e.stopPropagation();
                  pendingChapterScrollRef.current = true;
                  targetScrollChapterIdRef.current = `${currentBook.id}-${currentChapter.id}`;
                  setSelectedBook(currentBook);
                  setShouldScrollToCurrentChapter(Date.now());
                  navigateTo('book-detail', currentBook);
                  setShowQueuePopup(false);
                  setIsFullScreen(false);
                }}
                className="text-xs font-bold text-winblue truncate w-fit max-w-full hover:underline cursor-pointer transition-colors"
                title={t('view_chapter_in_book')}
              >
                {currentChapter.title}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">{currentBook.title} • {currentBook.author}</p>
            </div>
            <ChapterBadges bookId={currentBook?.id} chapterId={currentChapter?.id} />
            <span className="text-[10px] text-winblue font-semibold mr-1 shrink-0 pointer-events-none">
              {formatTime(chapterElapsed)}
            </span>
          </div>
        </div>

        {/* PRÓXIMOS CAPÍTULOS */}
        <Reorder.Group axis="y" values={playbackQueue} onReorder={setPlaybackQueue} className="flex flex-col shrink-0">
          <AnimatePresence initial={false}>
            {playbackQueue.map((item) => (
              <QueueItemRow 
                key={item.id}
                item={item}
                formatTime={formatTime}
                onPlay={() => {
                  beginBookSwitch(item.book);
                  setCurrentBook(item.book);
                  setSelectedBook(item.book);
                  handleSeek(item.startTime + (getChapterResumeElapsed(item.bookId || item.book?.id, (item.book?.chapters || booksRef.current.find(b => b.id === (item.bookId || item.book?.id))?.chapters || []).find((c: Chapter) => c.id === item.chapterId)) || 0));
                  setIsPlaying(true);
                  setPlaybackQueue(prev => {
                    const curIdx = prev.findIndex(it => it.id === item.id);
                    return curIdx !== -1 ? prev.slice(curIdx + 1) : prev;
                  });
                  // A fila continua aberta: só atualiza o que está tocando
                  if (!isMobile && !isTouchDevice) setShowQueuePopup(false);
                }}
                onRemove={() => {
                  setPlaybackQueue(prev => prev.filter(it => it.id !== item.id));
                }}
                onViewBook={() => {
                  pendingChapterScrollRef.current = true;
                  targetScrollChapterIdRef.current = `${item.bookId || item.book?.id}-${item.chapterId}`;
                  setSelectedBook(item.book);
                  setShouldScrollToCurrentChapter(Date.now());
                  navigateTo('book-detail', item.book);
                  setShowQueuePopup(false);
                  setIsFullScreen(false);
                }}
                t={t}
                badges={<ChapterBadges bookId={item.bookId || item.book?.id} chapterId={item.chapterId} />}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
        </div>
        {spacer > 0 && <div aria-hidden="true" className="shrink-0" style={{ height: spacer }} />}
    </>
  );
}

export function VolumeContent({ variant }: { variant: PopupVariant }) {
  const { isMuted, setIsMuted, setVolume, setupWebAudioGraph, t, volume } = useAppScope();
  return (
    <>
    <div className={`relative z-10 flex flex-col ${variant === 'fs' ? 'gap-3' : 'gap-2.5'}`}>
      <div className="px-1 flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--text-main)]">{t('volume')}</span>
      </div>
      <div className={`flex items-center ${variant === 'fs' ? 'gap-3' : 'gap-2.5'} whitespace-nowrap px-1`}>
        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className="text-[var(--text-main)] hover:text-winblue dark:hover:text-white transition-colors shrink-0"
          title={isMuted ? t('unmute') : t('mute')}
        >
          {isMuted || volume === 0 ? <VolumeX size={variant === 'fs' ? 16 : 14} className="text-red-400" /> : <Volume2 size={variant === 'fs' ? 16 : 14} />}
        </button>
        <div className="relative flex-1 min-w-0 flex items-center group">
          <input 
            type="range" 
            min={0} 
            max={1} 
            step={0.01} 
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              if (IS_APPLE_TOUCH) setupWebAudioGraph(true);
              setVolume(Number(e.target.value));
              setIsMuted(false);
            }}
            style={{
              ['--slider-bg' as any]: `linear-gradient(to right, var(--slider-current-fill, var(--slider-fill)) ${(isMuted ? 0 : volume) * 100}%, var(--slider-track) ${(isMuted ? 0 : volume) * 100}%)`
            }}
            className="w-full apple-slider"
          />
        </div>
        <span className="text-xs font-semibold text-[var(--text-main)] w-8 text-left shrink-0">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>
    </div>
    </>
  );
}
