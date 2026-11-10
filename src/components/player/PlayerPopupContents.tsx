import type React from 'react';
// Conteúdo dos pop-ups do player, comum ao player em tela cheia ("fs") e ao miniplayer ("mini").
// Cada controle decide onde o pop-up abre; aqui fica só o que aparece dentro dele.
import { AnimatePresence, Reorder, motion } from 'motion/react';
import { PagedMenu, QueueItemRow, SmoothSubMorph } from '../popups/Popovers';
import { Bookmark, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
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

export function QueueContent({ variant }: { variant: PopupVariant }) {
  const { beginBookSwitch, booksRef, chapterElapsed, currentBook, currentBookHighlight, currentChapter, formatTime, fsNowPlayingRef, fsQueueScrollRef, getChapterResumeElapsed, handleBookCoverError, handleSeek, isMobile, isPlaying, isTouchDevice, miniNowPlayingRef, miniQueueScrollRef, navigateTo, pendingChapterScrollRef, playbackQueue, setCurrentBook, setIsFullScreen, setIsPlaying, setPlaybackQueue, setSelectedBook, setShouldScrollToCurrentChapter, setShowQueuePopup, t, targetScrollChapterIdRef } = useAppScope();
  return (
    <>
    <div className={`relative z-10 flex flex-col min-h-0 ${variant === 'fs' ? 'max-h-[392px]' : 'max-h-[310px]'} overflow-hidden`}>
      <div className="px-3 py-2 mb-1 flex items-center justify-between pb-2 shrink-0">
        <span className="text-sm font-bold text-[var(--text-main)]">{t('queue')}</span>
      </div>

      <div 
        ref={variant === 'fs' ? fsQueueScrollRef : miniQueueScrollRef}
        className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col px-1.5 mt-1"
      >
        {/* TOCANDO AGORA */}
        <div ref={variant === 'fs' ? fsNowPlayingRef : miniNowPlayingRef} className="shrink-0">
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
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    </div>
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
