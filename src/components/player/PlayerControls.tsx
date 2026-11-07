// Extraído do App.tsx: lê do App, pelo contexto, só o que usa
import { AnimatePresence, motion } from 'motion/react';
import { clearButtonCoverAnchorCache, getButtonCoverPopupStyle, morphTriggerAnimate } from '../popups/Popovers';
import { Bookmark, FilePlus2, Gauge, ListMusic, Maximize2, Moon, Text, Upload, Volume2, VolumeX } from 'lucide-react';
import { getBackdropProps } from '../popups/popupUtils';
import { PlayerPopup } from './PlayerPopup';
import { SPRING } from '../../lib/motion';
import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../App';
import { useAppScope } from '../../app/AppScope';
import { SpeedMenuContent, SleepTimerContent, QueueContent, VolumeContent } from './PlayerPopupContents';

export function FullscreenPlayerControls({ group = 'all' }: { group?: 'all' | 'header' | 'row' }) {
  const { addTextInputRef, chapterElapsed, closeAllPopups, currentBook, currentBookHighlight, currentChapter, formatCountdown, fsRowPopupProps, handleUploadTranscriptForPlayerBook, hasTranscript, isMuted, isQueuePulse, openMobileSheet, playbackSpeed, queueAddedAnim, renderCommentsContent, setIsMuted, setShowAddTextPopup, setShowCommentsPopover, setShowQueuePopup, setShowSleepTimerMenu, setShowSpeedMenu, setShowTranscript, setShowVolumePopup, showAddTextPopup, showCommentsPopover, showQueuePopup, showSleepTimerMenu, showSpeedMenu, showTranscript, showVolumePopup, sleepTimerMode, sleepTimerRemaining, t, useFullScreenSheets, volume } = useAppScope();
  return (
    <div
      className={cn("flex items-center gap-2.5 pointer-events-auto", group === 'row' && "justify-center")}
      {...(group === 'row' ? { 'data-fs-ctrl-row': 'true' } : {})}
    >
      {group !== 'header' && (<>
      {/* 1. MARCAÇÕES */}
      <div data-fs-ctrl="comments" className={`relative w-9 h-9 shrink-0 ${showCommentsPopover ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-comments"
          data-press="true"
          animate={morphTriggerAnimate(showCommentsPopover)}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (useFullScreenSheets) {
              // Marcações exigem digitação: abrem num submenu em tela cheia (adaptado ao teclado)
              openMobileSheet({ kind: 'bookmarks', bookId: currentBook.id, chapterId: currentChapter.id });
              return;
            }
            const p = showCommentsPopover; 
            closeAllPopups(); 
            setShowCommentsPopover(!p); 
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all relative"
          title={t('chapter_bookmarks') || t('chapter_comments') || t('comments')}
        >
          <Bookmark size={14} />
          {((currentChapter.bookmarks && currentChapter.bookmarks.length > 0) || (currentChapter.comments && currentChapter.comments.length > 0)) && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--text-main)] text-[9px] font-bold text-[var(--bg-card)] flex items-center justify-center shadow-md">
              {currentChapter.bookmarks?.length || currentChapter.comments?.length}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {showCommentsPopover && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowCommentsPopover(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-comments"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl p-3 z-50 flex flex-col text-[var(--text-main)] max-h-[460px] overflow-hidden"

                {...fsRowPopupProps('comments')}
              >
                <div className="relative z-10 flex flex-col min-h-0 overflow-hidden">
                  {renderCommentsContent(currentBook, currentChapter, true)}
                </div>
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 2. VELOCIDADE DE REPRODUÇÃO */}
      <div data-fs-ctrl="speed" className={`relative w-9 h-9 shrink-0 ${showSpeedMenu ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-speed"
          data-press="true"
          animate={morphTriggerAnimate(showSpeedMenu)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showSpeedMenu; 
            closeAllPopups(); 
            setShowSpeedMenu(!p); 
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all"
          title={`${t('speed')} (${playbackSpeed}x)`}
        >
          <Gauge size={14} />
        </motion.button>

        <AnimatePresence>
          {showSpeedMenu && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowSpeedMenu(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-speed"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-56 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl p-2 z-50 flex flex-col text-[var(--text-main)] overflow-hidden"

                {...fsRowPopupProps('speed')}
              >
                <SpeedMenuContent variant="fs" />
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 2. TIMER DE SONO */}
      <div data-fs-ctrl="sleep" className={`relative w-9 h-9 shrink-0 ${showSleepTimerMenu ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-sleep"
          data-press="true"
          animate={morphTriggerAnimate(showSleepTimerMenu)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showSleepTimerMenu; 
            closeAllPopups(); 
            setShowSleepTimerMenu(!p); 
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-xl backdrop-blur-3xl bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)] relative"
          title={sleepTimerMode ? t('sleep_timer_active', { time: formatCountdown(sleepTimerMode === 'end-of-chapter' ? Math.max(0, currentChapter.duration - chapterElapsed) : (sleepTimerRemaining || 0)) }) : t('sleep_timer')}
        >
          <Moon size={14} />
          {sleepTimerMode !== null && (
            <motion.span
              animate={{ scale: [1, 0.6, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 w-[16px] h-[16px] rounded-full bg-[var(--text-main)] shadow-md"
            />
          )}
        </motion.button>

        <AnimatePresence>
          {showSleepTimerMenu && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowSleepTimerMenu(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-sleep"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-64 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl p-2 overflow-hidden z-50 flex flex-col text-[var(--text-main)]"

                {...fsRowPopupProps('sleep')}
              >
                <SleepTimerContent variant="fs" />
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 3. FILA DE REPRODUÇÃO */}
      <div data-fs-ctrl="queue" className={`relative w-9 h-9 shrink-0 ${showQueuePopup ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-queue"
          data-press="true"
          animate={showQueuePopup 
            ? morphTriggerAnimate(true) 
            : (isQueuePulse 
              ? { scale: [1, 1.14, 1] } 
              : morphTriggerAnimate(false)
            )
          }
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showQueuePopup; 
            closeAllPopups(); 
            setShowQueuePopup(!p); 
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl shadow-xl hover:bg-[var(--hover-fill)] text-[var(--text-main)] transition-all overflow-hidden relative"
          title={t('queue')}
        >
          <AnimatePresence mode="wait" initial={false}>
            {queueAddedAnim ? (
              <motion.div
                key={`fs-q-cov-${queueAddedAnim.key}`}
                initial={{ scale: 0.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={SPRING.snappy}
                className="pointer-events-none flex items-center justify-center w-[14px] h-[22px] relative shrink-0"
              >
                {queueAddedAnim.isBook ? (
                  <div className="relative w-[14px] h-[22px] pointer-events-none">
                    <img
                      src={queueAddedAnim.cover}
                      alt=""
                      className="absolute top-0 right-0 w-[14.5px] h-[22.5px] aspect-[1/1.6] rounded-[3px] object-cover opacity-80 brightness-75 shadow-sm translate-x-[1px] -translate-y-[0.5px] rotate-[6deg]"
                    />
                    <img
                      src={queueAddedAnim.cover}
                      alt=""
                      className="absolute bottom-0 left-0 w-[14.5px] h-[22.5px] aspect-[1/1.6] rounded-[3px] object-cover shadow-md"
                    />
                  </div>
                ) : (
                  <img
                    src={queueAddedAnim.cover}
                    alt=""
                    className="w-[14px] h-[22px] aspect-[1/1.6] rounded-[4px] object-cover shadow-md pointer-events-none"
                  />
                )}
              </motion.div>
            ) : (
              <motion.span
                key="fs-q-icon"
                initial={{ scale: 0.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.25, opacity: 0 }}
                transition={SPRING.snappy}
                className="pointer-events-none flex items-center justify-center"
              >
                <ListMusic size={14} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {showQueuePopup && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowQueuePopup(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-queue"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl p-3.5 z-50 flex flex-col max-h-[420px] text-[var(--text-main)] overflow-hidden"

                {...fsRowPopupProps('queue')}
              >
                <QueueContent variant="fs" />
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>



      {/* 5. VOLUME */}
      <div data-fs-ctrl="volume" className={`relative w-9 h-9 shrink-0 ${showVolumePopup ? 'z-50' : 'z-10'}`}>
        <motion.button 
          key="btn-fs-vol"
          data-press="true"
          animate={morphTriggerAnimate(showVolumePopup)}
          onClick={(e) => {
            e.stopPropagation();
            const p = showVolumePopup;
            closeAllPopups();
            setShowVolumePopup(!p);
          }} 
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-xl backdrop-blur-3xl ${
            isMuted || volume === 0
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 '
              : 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)] '
          }`}
          title={isMuted || volume === 0 ? t('mute_click_to_open') : t('volume')}
        >
          {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </motion.button>

        <AnimatePresence>
          {showVolumePopup && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowVolumePopup(false))}
              />
              <PlayerPopup originWidth={36} originHeight={36} 
                key="menu-fs-vol"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-64 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl p-3.5 z-50 flex flex-col gap-3 text-[var(--text-main)] overflow-hidden"

                {...fsRowPopupProps('volume')}
              >
                <VolumeContent variant="fs" />
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>

      </>)}
      {group !== 'row' && (<>
      {/* 6. BOTÃO DE TEXTO / ADICIONAR TEXTO (MAIS À DIREITA) */}
      <div
        className={`relative w-9 h-9 shrink-0 ${showAddTextPopup ? 'z-50' : 'z-10'}`}
        style={{
          '--winblue': currentBookHighlight.hex,
          '--winblue-rgb': currentBookHighlight.rgb,
          '--color-winblue': currentBookHighlight.hex,
          '--book-accent': currentBookHighlight.hex,
          '--book-accent-rgb': currentBookHighlight.rgb,
        } as React.CSSProperties}
      >
        <input
          ref={addTextInputRef}
          type="file"
          accept=".epub,.json,.xml,.smil,.smi,.ts,.vtt,.srt,.lrc"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleUploadTranscriptForPlayerBook(file);
            }
            e.target.value = '';
          }}
        />
        <AnimatePresence mode="wait" initial={false}>
          {hasTranscript ? (
            <motion.button 
              key="btn-fs-text"
              data-press="true"
              onClick={() => setShowTranscript(prev => !prev)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-xl backdrop-blur-3xl ${
                showTranscript 
                  ? 'bg-winblue/20 text-winblue hover:bg-winblue/30 ' 
                  : 'bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)] '
              }`}
              title={showTranscript ? t('hide_text') : t('show_text')}
            >
              <Text size={14} />
            </motion.button>
          ) : (
            <motion.button 
              key="btn-fs-add-text"
              data-press="true"
              animate={morphTriggerAnimate(showAddTextPopup)}
              onClick={(e) => {
                e.stopPropagation();
                const p = showAddTextPopup;
                closeAllPopups();
                setShowAddTextPopup(!p);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl text-[var(--text-main)] hover:bg-[var(--hover-fill)] transition-all shadow-xl cursor-pointer"
              title={t('add_text')}
            >
              <FilePlus2 size={14} />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAddTextPopup && !hasTranscript && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                {...getBackdropProps(() => setShowAddTextPopup(false))}
              />
              <PlayerPopup inPlace originWidth={36} originHeight={36} 
                key="menu-fs-add-text"
                data-popup-content="true"
                style={{ transformOrigin: "top right" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl p-3.5 z-50 flex flex-col gap-2 text-[var(--text-main)] overflow-hidden"
              >
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="px-2 pt-1 pb-0.5 flex flex-col">
                    <span className="text-sm font-bold text-[var(--text-main)]">{t('upload_synced_text_title')}</span>
                  </div>

                  {/* Uma única opção: aceita todos os formatos de texto suportados */}
                  <div className="flex flex-col gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (addTextInputRef.current) {
                          addTextInputRef.current.accept = '.epub,.json,.xml,.smil,.smi,.ts,.vtt,.srt,.lrc';
                          addTextInputRef.current.click();
                        }
                      }}
                      className="relative w-full flex items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold rounded-2xl select-none transition-all duration-150 group hover:bg-[var(--hover-fill)] text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[var(--text-main)] group-hover:text-white shrink-0">
                          <Upload size={15} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[var(--text-main)] group-hover:text-white transition-colors">
                            {t('upload_text_file')}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] group-hover:text-white/75 font-normal leading-snug mt-0.5">
                            EPUB, JSON, XML/SMIL, TS, VTT, SRT, LRC
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </PlayerPopup>
            </>
          )}
        </AnimatePresence>
      </div>
      </>)}
    </div>
  );
}

export function MiniPlayerControls({ isFullScreenMode }: { isFullScreenMode: boolean }) {
  const { chapterElapsed, closeAllPopups, currentBook, currentChapter, formatCountdown, isMuted, isQueuePulse, miniCommentsBtnAnchor, miniCommentsBtnRef, miniQueueBtnAnchor, miniQueueBtnRef, miniSleepBtnAnchor, miniSleepBtnRef, miniSpeedBtnAnchor, miniSpeedBtnRef, miniVolumeBtnAnchor, miniVolumeBtnRef, openMobileSheet, playbackSpeed, queueAddedAnim, renderCommentsContent, setIsFullScreen, setIsMuted, setMiniCommentsBtnAnchor, setMiniQueueBtnAnchor, setMiniSleepBtnAnchor, setMiniSpeedBtnAnchor, setMiniVolumeBtnAnchor, setShowCommentsPopover, setShowQueuePopup, setShowSleepTimerMenu, setShowSpeedMenu, setShowVolumePopup, showCommentsPopover, showQueuePopup, showSleepTimerMenu, showSpeedMenu, showVolumePopup, sleepTimerMode, sleepTimerRemaining, t, useFullScreenSheets, volume } = useAppScope();
  return (
    <div className={isFullScreenMode ? "flex items-center justify-center gap-8 mt-10 w-full relative" : "shrink-0 flex items-center gap-1.5"}>
      {/* 0. BOTAO DE MARCACOES NO MINIPLAYER */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 ${showCommentsPopover ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniCommentsBtnRef}
          key="btn-mini-comments"
          data-press="true"
          animate={morphTriggerAnimate(showCommentsPopover)}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (useFullScreenSheets) {
              // Marcações exigem digitação: abrem num submenu em tela cheia (adaptado ao teclado)
              openMobileSheet({ kind: 'bookmarks', bookId: currentBook.id, chapterId: currentChapter.id });
              return;
            }
            const p = showCommentsPopover; 
            closeAllPopups(); 
            if (!p) {
              setMiniCommentsBtnAnchor(e.currentTarget);
              setShowCommentsPopover(true);
            }
          }} 
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl text-[var(--text-main)] hover:bg-[var(--hover-fill)] transition-all shadow-sm relative shrink-0`}
          title={t('chapter_bookmarks') || t('chapter_comments')}
        >
          <Bookmark size={isFullScreenMode ? 16 : 13} />
          {((currentChapter.bookmarks && currentChapter.bookmarks.length > 0) || (currentChapter.comments && currentChapter.comments.length > 0)) && (
            <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] px-0.5 rounded-full bg-[var(--text-main)] text-[7.5px] font-bold text-[var(--bg-card)] flex items-center justify-center shadow-md">
              {currentChapter.bookmarks?.length || currentChapter.comments?.length}
            </span>
          )}
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showCommentsPopover && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowCommentsPopover(false);
                    clearButtonCoverAnchorCache(miniCommentsBtnAnchor);
                    setMiniCommentsBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniCommentsBtnAnchor || miniCommentsBtnRef.current} 
                  key="menu-mini-comments"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(
                    miniCommentsBtnAnchor || miniCommentsBtnRef.current,
                    Math.min(typeof window !== 'undefined' && window.innerWidth < 640 ? 256 : 307, typeof window !== 'undefined' ? window.innerWidth - 32 : 307),
                    368,
                    'right'
                  )}
                  onClick={(e) => e.stopPropagation()}
                  className="w-64 sm:w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl z-[9999] p-2.5 flex flex-col text-[var(--text-main)] max-h-[368px] overflow-hidden text-left"
                >
                  <div className="relative z-10 flex flex-col min-h-0 overflow-hidden">
                    {renderCommentsContent(currentBook, currentChapter, true)}
                  </div>
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* 1. VELOCIDADE DE REPRODUÇÃO */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 ${showSpeedMenu ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniSpeedBtnRef}
          key="btn-mini-speed"
          data-press="true"
          animate={morphTriggerAnimate(showSpeedMenu)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showSpeedMenu; 
            closeAllPopups(); 
            if (!p) {
              setMiniSpeedBtnAnchor(e.currentTarget);
              setShowSpeedMenu(true);
            }
          }} 
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl text-[var(--text-main)] hover:bg-[var(--hover-fill)] transition-all shadow-sm shrink-0`}
          title={t('playback_speed_title', { speed: playbackSpeed })}
        >
          <Gauge size={isFullScreenMode ? 16 : 13} />
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showSpeedMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowSpeedMenu(false);
                    clearButtonCoverAnchorCache(miniSpeedBtnAnchor);
                    setMiniSpeedBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniSpeedBtnAnchor || miniSpeedBtnRef.current} 
                  key="menu-mini-speed"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(miniSpeedBtnAnchor || miniSpeedBtnRef.current, 224, 224, 'right')}
                  onClick={(e) => e.stopPropagation()}
                  className="w-56 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl z-[9999] p-2 flex flex-col text-left overflow-hidden text-[var(--text-main)]"
                >
                  <SpeedMenuContent variant="mini" />
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* 2. TIMER DE SONO */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 ${showSleepTimerMenu ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniSleepBtnRef}
          key="btn-mini-sleep"
          data-press="true"
          animate={morphTriggerAnimate(showSleepTimerMenu)}
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showSleepTimerMenu; 
            closeAllPopups(); 
            if (!p) {
              setMiniSleepBtnAnchor(e.currentTarget);
              setShowSleepTimerMenu(true);
            }
          }} 
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full transition-all shadow-sm shrink-0 relative bg-card/75 backdrop-blur-3xl text-[var(--text-main)] hover:bg-[var(--hover-fill)] `}
          title={sleepTimerMode ? t('sleep_timer_active', { time: formatCountdown(sleepTimerMode === 'end-of-chapter' ? Math.max(0, currentChapter.duration - chapterElapsed) : (sleepTimerRemaining || 0)) }) : t('sleep_timer')}
        >
          <Moon size={isFullScreenMode ? 16 : 13} />
          {sleepTimerMode !== null && (
            <motion.span
              animate={{ scale: [1, 0.6, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 w-[11px] h-[11px] rounded-full bg-[var(--text-main)] shadow-md"
            />
          )}
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showSleepTimerMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowSleepTimerMenu(false);
                    clearButtonCoverAnchorCache(miniSleepBtnAnchor);
                    setMiniSleepBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniSleepBtnAnchor || miniSleepBtnRef.current} 
                  key="menu-mini-sleep"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(miniSleepBtnAnchor || miniSleepBtnRef.current, 205, 256, 'right')}
                  onClick={(e) => e.stopPropagation()}
                  className="w-52 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl z-[9999] p-2 overflow-hidden flex flex-col text-left text-[var(--text-main)]"
                >
                  <SleepTimerContent variant="mini" />
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* 3. FILA DE REPRODUÇÃO */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 ${showQueuePopup ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniQueueBtnRef}
          key="btn-mini-queue"
          data-press="true"
          animate={showQueuePopup 
            ? morphTriggerAnimate(true) 
            : (isQueuePulse 
              ? { scale: [1, 1.14, 1] } 
              : morphTriggerAnimate(false)
            )
          }
          onClick={(e) => { 
            e.stopPropagation(); 
            const p = showQueuePopup; 
            closeAllPopups(); 
            if (!p) {
              setMiniQueueBtnAnchor(e.currentTarget);
              setShowQueuePopup(true);
            }
          }} 
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl text-[var(--text-main)] hover:bg-[var(--hover-fill)] transition-all shadow-sm relative shrink-0 overflow-hidden`}
          title={t('queue')}
        >
          <AnimatePresence mode="wait" initial={false}>
            {queueAddedAnim ? (
              <motion.div
                key={`mini-q-cov-${queueAddedAnim.key}`}
                initial={{ scale: 0.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={SPRING.snappy}
                className="pointer-events-none flex items-center justify-center w-[15px] h-[23px] relative shrink-0"
              >
                {queueAddedAnim.isBook ? (
                  <div className="relative w-[15px] h-[23px] pointer-events-none">
                    <img
                      src={queueAddedAnim.cover}
                      alt=""
                      className="absolute top-0 right-0 w-[12px] h-[19px] aspect-[1/1.6] rounded-[2.5px] object-cover opacity-80 brightness-75 shadow-sm translate-x-[1px] -translate-y-[0.5px] rotate-[6deg]"
                    />
                    <img
                      src={queueAddedAnim.cover}
                      alt=""
                      className="absolute bottom-0 left-0 w-[12px] h-[19px] aspect-[1/1.6] rounded-[2.5px] object-cover shadow-md"
                    />
                  </div>
                ) : (
                  <img
                    src={queueAddedAnim.cover}
                    alt=""
                    className="w-[15px] h-[23px] aspect-[1/1.6] rounded-[3.5px] object-cover shadow-md pointer-events-none"
                  />
                )}
              </motion.div>
            ) : (
              <motion.span
                key="mini-q-icon"
                initial={{ scale: 0.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.25, opacity: 0 }}
                transition={SPRING.snappy}
                className="pointer-events-none flex items-center justify-center"
              >
                <ListMusic size={isFullScreenMode ? 16 : 13} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showQueuePopup && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowQueuePopup(false);
                    clearButtonCoverAnchorCache(miniQueueBtnAnchor);
                    setMiniQueueBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniQueueBtnAnchor || miniQueueBtnRef.current} 
                  key="menu-mini-queue"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(
                    miniQueueBtnAnchor || miniQueueBtnRef.current,
                    Math.min(typeof window !== 'undefined' && window.innerWidth < 640 ? 256 : 307, typeof window !== 'undefined' ? window.innerWidth - 32 : 307),
                    336,
                    'right'
                  )}
                  onClick={(e) => e.stopPropagation()}
                  className="w-64 sm:w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl z-[9999] p-3 flex flex-col max-h-[336px] text-[var(--text-main)] overflow-hidden text-left"
                >
                  <QueueContent variant="mini" />
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>


      {/* 4. VOLUME */}
      <div className={`relative ${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} shrink-0 hidden md:flex ${showVolumePopup ? 'z-50' : 'z-10'}`}>
        <motion.button 
          ref={miniVolumeBtnRef}
          key="btn-mini-volume"
          data-press="true"
          animate={morphTriggerAnimate(showVolumePopup)}
          onClick={(e) => {
            e.stopPropagation();
            const p = showVolumePopup;
            closeAllPopups();
            if (!p) {
              setMiniVolumeBtnAnchor(e.currentTarget);
              setShowVolumePopup(true);
            }
          }} 
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className={`${isFullScreenMode ? 'w-9 h-9' : 'w-7 h-7'} flex items-center justify-center rounded-full transition-all shadow-sm shrink-0 ${
            isMuted || volume === 0
              ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 '
              : 'bg-card/75 backdrop-blur-3xl text-[var(--text-main)] hover:bg-[var(--hover-fill)] '
          }`}
          title={isMuted || volume === 0 ? t('mute_click_to_open') : t('volume')}
        >
          {isMuted || volume === 0 ? <VolumeX size={isFullScreenMode ? 16 : 13} /> : <Volume2 size={isFullScreenMode ? 16 : 13} />}
        </motion.button>

        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {showVolumePopup && (
              <>
                <div 
                  className="fixed inset-0 z-[9998] cursor-default" 
                  {...getBackdropProps(() => {
                    setShowVolumePopup(false);
                    clearButtonCoverAnchorCache(miniVolumeBtnAnchor);
                    setMiniVolumeBtnAnchor(null);
                  })}
                />
                <PlayerPopup anchor={miniVolumeBtnAnchor || miniVolumeBtnRef.current} 
                  key="menu-mini-volume"
                  data-popup-content="true"
                  style={getButtonCoverPopupStyle(miniVolumeBtnAnchor || miniVolumeBtnRef.current, 205, 100, 'right')}
                  onClick={(e) => e.stopPropagation()}
                  className="w-52 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl rounded-[24px] shadow-2xl z-[9999] p-2.5 flex flex-col gap-2.5 text-[var(--text-main)] overflow-hidden text-left"
                >
                  <VolumeContent variant="mini" />
                </PlayerPopup>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* 5. EXPANDIR PLAYER */}
      {!isFullScreenMode && (
        <motion.button 
          data-press="true"
          onClick={() => {
            closeAllPopups();
            setIsFullScreen(true);
          }}
          className="hover-grow w-7 h-7 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl text-[var(--text-main)] hover:bg-[var(--hover-fill)] transition-all shadow-sm shrink-0"
          title={t('expand_player')}
        >
          <Maximize2 size={13} />
        </motion.button>
      )}
    </div>
  );
}
