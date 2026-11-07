// Extraído do App.tsx: lê do App, pelo contexto, só o que usa
import { AnimatePresence, motion } from 'motion/react';
import { FADE_OUT, SPRING } from '../../lib/motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppScope } from '../../app/AppScope';

export function PlaybackReturnButton(_props: { _isFullScreenMode: boolean }) {
  const { books, currentBook, currentChapter, currentChapterIndex, formatTime, handleReturnToPreviousPoint, playbackReturnPoint, t } = useAppScope();
  const isExpired = playbackReturnPoint ? (Date.now() - (playbackReturnPoint.createdAt || 0) >= 30000) : true;
  const isVisible = Boolean(
    playbackReturnPoint &&
    !isExpired &&
    currentBook &&
    currentChapter
  );
  if (!isVisible || !playbackReturnPoint || !currentBook || !currentChapter) {
    return null;
  }
  const isSameBook = playbackReturnPoint.bookId === currentBook.id;
  const isSameChapter = isSameBook && playbackReturnPoint.chapterId === currentChapter.id;
  let returnLabel = '';
  let returnTooltip = '';
  let isReturnAnterior = true;
  let buttonStyle: Record<string, string | number> = {};
  if (!isSameBook) {
    // Caso 1: Voltar para um capítulo de OUTRO audiobook -> indicar o NOME DO AUDIOBOOK
    const targetBook = books.find(b => b.id === playbackReturnPoint.bookId);
    const bookTitle = targetBook?.title || t('audiobook_label');
    returnLabel = bookTitle;
    returnTooltip = t('return_to_book', { title: bookTitle }) || `Voltar para "${bookTitle}"`;
    isReturnAnterior = true;
    buttonStyle = {
      left: '0%',
      x: '0%',
    };
  } else if (!isSameChapter) {
    // Caso 2: Voltar para outro capítulo do MESMO audiobook -> indicar o NÚMERO DO CAPÍTULO e NÃO o tempo
    const targetChapIdx = (currentBook.chapters || []).findIndex(c => c.id === playbackReturnPoint.chapterId);
    const chapNum = targetChapIdx >= 0 ? targetChapIdx + 1 : (playbackReturnPoint.chapterIndex + 1);
    returnLabel = t('chapter_short', { num: chapNum }) || `Cap. ${chapNum}`;
    returnTooltip = t('return_to_chapter', { num: chapNum }) || `Voltar para o Capítulo ${chapNum}`;

    const currentIdx = currentChapterIndex >= 0 ? currentChapterIndex : 0;
    const targetIdx = targetChapIdx >= 0 ? targetChapIdx : playbackReturnPoint.chapterIndex;
    if (targetIdx < currentIdx || playbackReturnPoint.globalTime < currentChapter.startTime) {
      isReturnAnterior = true;
      buttonStyle = {
        left: '0%',
        x: '0%',
      };
    } else {
      isReturnAnterior = false;
      buttonStyle = {
        right: '0%',
        left: 'auto',
        x: '0%',
      };
    }
  } else {
    // Caso 3: Mesmo capítulo -> indicar o tempo
    const duration = currentChapter.duration || 1;
    const returnPercent = Math.max(0, Math.min(100, (playbackReturnPoint.chapterElapsed / duration) * 100));
    const clampedPercent = Math.max(5, Math.min(95, returnPercent));
    isReturnAnterior = playbackReturnPoint.globalTime < playbackReturnPoint.transportedToTime;
    returnLabel = formatTime(playbackReturnPoint.chapterElapsed);
    returnTooltip = t('return_to_previous_time', { time: returnLabel }) || `Voltar para ${returnLabel}`;
    buttonStyle = {
      left: `${clampedPercent}%`,
      x: '-50%',
    };
  }
  return (
    <AnimatePresence>
      <motion.button
        type="button"
        key="playback-return-btn"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6, transition: FADE_OUT }}
        data-press="true"
        transition={SPRING.snappy}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleReturnToPreviousPoint();
        }}
        style={{ ...buttonStyle, y: '-50%' }}
        data-playback-return="true"
        className="absolute top-1/2 z-20 flex items-center cursor-pointer pointer-events-auto select-none"
        title={returnTooltip}
      >
        <div className="bg-white text-slate-900 h-4 px-1.5 rounded-full shadow-[0_0_6px_rgba(0,0,0,0.35),0_0_6px_rgba(255,255,255,0.7)] flex items-center gap-0.5 font-bold font-mono text-[8px] leading-none whitespace-nowrap hover:bg-slate-50 transition-colors max-w-[112px] sm:max-w-[160px]">
          {isReturnAnterior ? (
            <>
              <ChevronLeft size={10} className="stroke-[2.5] text-slate-900 shrink-0 rtl:rotate-180 -ml-0.5" />
              <span className="truncate">{returnLabel}</span>
            </>
          ) : (
            <>
              <span className="truncate">{returnLabel}</span>
              <ChevronRight size={10} className="stroke-[2.5] text-slate-900 shrink-0 rtl:rotate-180 -mr-0.5" />
            </>
          )}
        </div>
      </motion.button>
    </AnimatePresence>
  );
}
