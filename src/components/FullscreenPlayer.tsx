import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MarqueeText } from './MarqueeText';
import { Minimize2, SkipBack, SkipForward, Bookmark, Play, Copy, Share, TextSearch, X, MoreHorizontal } from 'lucide-react';
import { PopupSearchField } from './LibraryCards';
import { MobileConfirmCard } from './MobileConfirm';
import { useLyricsHighlight, type LyricsHighlight } from '../lyricsPrefs';
import { BsPlayFill, BsPauseFill, BsArrowCounterclockwise, BsArrowClockwise } from 'react-icons/bs';
import type { Audiobook, Chapter, Author, TranscriptLine } from '../data';
import { AUTHORS_DATABASE } from '../data';
import { getGenericBookCover, getAuthorAvatar, formatTime } from '../audioUtils';
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
  audioRef: React.RefObject<HTMLAudioElement | null>;
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
    toneSecondary: string;
    toneSecondarySoft: string;
  };
  showTranscript: boolean;
  hasTranscript: boolean;
  fsTranscriptScrollRef: React.RefObject<HTMLDivElement | null>;
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

// Uma frase da letra. A letra inteira fica na tela (rolagem até o fim e toque no ponto certo); como o tempo muda
// várias vezes por segundo, só as frases que mudaram são redesenhadas, e só a frase ativa é dividida em palavras
const LyricLine = React.memo(function LyricLine({ line, idx, isActive, isPast, activeWordIdx, mode, onSeek }: {
  line: TranscriptLine;
  idx: number;
  isActive: boolean;
  isPast: boolean;
  activeWordIdx: number;
  mode: LyricsHighlight;
  onSeek: (time: number) => void;
}) {
  const hasWords = Boolean(line.words && line.words.length > 0);
  // "Só palavras": a frase não ganha destaque (sem tempo por palavra, a frase é o único destaque possível)
  const lineOn = isActive && (mode !== 'word' || !hasWords);
  // O destaque é só de cor, na frase e na palavra: sem fundo, brilho nem aumento
  const tokens: { text: string; start?: number }[] = !isActive
    ? []
    : hasWords ? line.words! : line.text.split(/\s+/).filter(Boolean).map(text => ({ text }));
  return (
    <p
      data-transcript-idx={idx}
      // Sem nada que crie camada de vídeo por frase (transform-gpu, opacidade): com a letra inteira na tela seriam
      // milhares de camadas, e o iPhone encerra a página por falta de memória (tela preta)
      className={`text-xl sm:text-2xl font-bold cursor-pointer px-4 py-2 ${
        lineOn
          ? 'text-black dark:text-white'
          : isPast
          ? 'text-slate-700/75 dark:text-[var(--text-muted)]/40 hover:text-black dark:hover:text-white'
          : 'text-slate-800/85 dark:text-[var(--text-muted)]/60 hover:text-black dark:hover:text-white'
      }`}
      onClick={() => onSeek(line.start)}
    >
      {isActive ? (
        tokens.map((w, wIdx) => {
          const isWordActive = mode !== 'phrase' && wIdx === activeWordIdx;
          const isWordPast = mode !== 'phrase' && activeWordIdx >= 0 && wIdx < activeWordIdx;
          return (
            <React.Fragment key={wIdx}>
              <span
                onClick={w.start === undefined ? undefined : (e) => {
                  e.stopPropagation();
                  onSeek(w.start!);
                }}
                className={`transition-colors duration-100 ${
                  isWordActive
                    ? 'text-[var(--book-accent)]'
                    : isWordPast ? 'text-black dark:text-white/95' : lineOn ? 'text-slate-700 dark:text-white/75' : ''
                }`}
              >
                {w.text}
              </span>{' '}
            </React.Fragment>
          );
        })
      ) : (
        hasWords ? line.words!.map(w => w.text).join(' ') : line.text
      )}
    </p>
  );
});

// A letra vai em blocos de frases. Em um audiobook longo são milhares de frases, e o tempo muda várias vezes por
// segundo: só o bloco que está tocando é redesenhado, e o navegador nem desenha os blocos fora da tela
// (content-visibility). Sem isso, abrir a letra travava o iPhone e a página era encerrada (tela preta).
const LYRIC_BLOCK = 40;

const LyricBlock = React.memo(function LyricBlock({ lines, first, nextStart, time, phase, mode, onSeek }: {
  lines: TranscriptLine[];
  first: number;
  // Início da primeira frase do bloco seguinte
  nextStart?: number;
  // Só o bloco que está tocando recebe o tempo: nos outros ele fica fixo, e nada muda
  time: number;
  phase: 'past' | 'current' | 'future';
  mode: LyricsHighlight;
  onSeek: (time: number) => void;
}) {
  // Altura aproximada do bloco enquanto ele não foi desenhado (linhas de texto + espaçamento)
  const estimate = lines.reduce((sum, l) => sum + Math.ceil(l.text.length / 34) * 30 + 40, 0);
  return (
    <div className="space-y-6" style={{ contentVisibility: 'auto', containIntrinsicBlockSize: `auto ${estimate}px` } as React.CSSProperties}>
      {lines.map((line, i) => {
        // A frase segue ativa até a próxima começar: nos silêncios entre frases o destaque não some
        const end = Math.max(line.end, lines[i + 1]?.start ?? nextStart ?? line.end);
        const isActive = phase === 'current' && time >= line.start && time < end;
        let activeWordIdx = -1;
        // Palavra sendo lida: a última que já começou na frase ativa (continua destacada nos pequenos silêncios
        // entre uma palavra e outra, sem piscar)
        if (isActive && line.words) {
          for (let wi = 0; wi < line.words.length; wi++) {
            if (line.words[wi].start <= time) activeWordIdx = wi; else break;
          }
        }
        return (
          <LyricLine
            key={first + i}
            line={line}
            idx={first + i}
            isActive={isActive}
            isPast={phase === 'past' || (phase === 'current' && time >= end)}
            activeWordIdx={activeWordIdx}
            mode={mode}
            onSeek={onSeek}
          />
        );
      })}
    </div>
  );
});

// Relógio da letra: lê o tempo direto do áudio cerca de 20 vezes por segundo. O evento de tempo do áudio vem só umas
// 4 vezes por segundo, e palavras mais curtas que isso passavam sem receber destaque.
function useLyricClock(audioRef: React.RefObject<HTMLAudioElement | null>, fallback: number, playing: boolean) {
  const [time, setTime] = React.useState(fallback);
  // Pulo (voltar, avançar, tocar numa frase): a letra acompanha na hora, sem esperar o áudio chegar ao ponto
  if (Math.abs(fallback - time) > 1.5) setTime(fallback);
  React.useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let lastAt = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastAt < 45) return;
      lastAt = now;
      const audio = audioRef.current;
      if (audio && audio.currentSrc && audio.readyState >= 1 && !audio.seeking) setTime(audio.currentTime);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, audioRef]);
  // Sem áudio real tocando (pausado, audiobook de demonstração), vale o tempo do app
  const running = playing && Boolean(audioRef.current?.currentSrc);
  return running ? time : fallback;
}

function LyricBlocks({ transcript, time: appTime, playing, audioRef, mode, onSeek }: { transcript: TranscriptLine[]; time: number; playing: boolean; audioRef: React.RefObject<HTMLAudioElement | null>; mode: LyricsHighlight; onSeek: (time: number) => void }) {
  const time = useLyricClock(audioRef, appTime, playing);
  const blocks = React.useMemo(() => {
    const list: { first: number; lines: TranscriptLine[]; start: number; end: number }[] = [];
    for (let i = 0; i < transcript.length; i += LYRIC_BLOCK) {
      const lines = transcript.slice(i, i + LYRIC_BLOCK);
      list.push({ first: i, lines, start: lines[0].start, end: lines[lines.length - 1].end });
    }
    return list;
  }, [transcript]);
  return (
    <>
      {blocks.map((b, i) => {
        const next = blocks[i + 1];
        const phase = time < b.start ? 'future' : (time > b.end && (!next || time >= next.start)) ? 'past' : 'current';
        return <LyricBlock key={b.first} lines={b.lines} first={b.first} nextStart={next?.start} time={phase === 'current' ? time : 0} phase={phase} mode={mode} onSeek={onSeek} />;
      })}
    </>
  );
}

// Busca na letra (celular). O trecho buscado fica só na cor do audiobook, sem nada ao redor
const foldText = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function MatchedText({ text, query }: { text: string; query: string }) {
  // Posição de cada letra do texto original no texto sem acentos
  const map: number[] = [];
  let folded = '';
  for (let i = 0; i < text.length; i++) {
    const f = foldText(text[i]);
    for (let k = 0; k < f.length; k++) map.push(i);
    folded += f;
  }
  const parts: React.ReactNode[] = [];
  let from = 0;
  let at = folded.indexOf(query);
  while (at !== -1) {
    const start = map[at];
    const after = at + query.length;
    const end = after < map.length ? map[after] : text.length;
    if (start > from) parts.push(text.slice(from, start));
    parts.push(<span key={start} className="text-[var(--book-accent)]">{text.slice(start, end)}</span>);
    from = end;
    at = folded.indexOf(query, after);
  }
  if (from < text.length) parts.push(text.slice(from));
  return <>{parts}</>;
}

function LyricSearchResults({ transcript, chapters, query, emptyText, moreLabel, onPick, onOptions }: {
  transcript: TranscriptLine[];
  chapters: { title: string; startTime: number; duration: number }[];
  query: string;
  emptyText: string;
  moreLabel: string;
  onPick: (line: TranscriptLine) => void;
  // Computador: três pontinhos ao passar o mouse
  onOptions?: (line: TranscriptLine) => void;
}) {
  const found = React.useMemo(() => {
    const list: { line: TranscriptLine; idx: number; text: string }[] = [];
    for (let idx = 0; idx < transcript.length && list.length < 100; idx++) {
      const line = transcript[idx];
      const text = line.words?.length ? line.words.map(w => w.text).join(' ') : line.text;
      if (foldText(text).includes(query)) list.push({ line, idx, text });
    }
    return list;
  }, [transcript, query]);
  if (found.length === 0) return <p className="text-sm text-[var(--text-muted)] text-center py-10">{emptyText}</p>;
  return (
    <>
      {found.map(({ line, idx, text }) => {
        const chapter = chapters.find(ch => line.start >= ch.startTime && line.start < ch.startTime + ch.duration);
        return (
          <p key={idx} data-transcript-idx={idx} onClick={() => onPick(line)} className="group/lyricres relative px-4 py-1 md:py-2.5 md:pr-12 md:rounded-3xl md:transition-colors md:hover:bg-[var(--ios-fill)] cursor-pointer text-lg font-bold leading-snug text-[var(--text-main)]">
            {onOptions && (
              <button
                type="button"
                aria-label={moreLabel}
                onClick={(e) => { e.stopPropagation(); onOptions(line); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] opacity-0 group-hover/lyricres:opacity-100 focus:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={15} />
              </button>
            )}
            <MatchedText text={text} query={query} />
            <span className="block mt-1 text-[10px] font-medium text-[var(--text-muted)] truncate">
              {chapter ? `${chapter.title} • ${formatTime(line.start - chapter.startTime)}` : formatTime(line.start)}
            </span>
          </p>
        );
      })}
    </>
  );
}

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
  audioRef,
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
  // Mantém as opções na tela enquanto o menu fecha
  const lastLineRef = React.useRef<TranscriptLine | null>(null);
  if (lineMenu) lastLineRef.current = lineMenu.line;
  const renderLineOptions = (line: TranscriptLine, close: () => void) => (
    <PagedMenu className="flex flex-col p-1.5 text-left rtl:text-right">
      <MenuOptionItem icon={<Play size={14} />} onClick={() => { close(); playLine(line); }}>
        <span>{t('play_from_here')}</span>
      </MenuOptionItem>
      <MenuOptionItem icon={<Bookmark size={14} />} onClick={() => { onAddLineBookmark?.(line); close(); }}>
        <span>{t('add_line_as_bookmark')}</span>
      </MenuOptionItem>
      <MenuOptionItem icon={<Share size={14} />} onClick={() => { close(); onShareLine?.(line); }}>
        <span>{t('share_excerpt')}</span>
      </MenuOptionItem>
      <MenuOptionItem
        icon={<Copy size={14} />}
        onClick={() => {
          navigator.clipboard?.writeText(lineText(line)).then(() => showToast?.(t('toast_text_copied'))).catch(() => {});
          close();
        }}
      >
        <span>{t('copy_text')}</span>
      </MenuOptionItem>
    </PagedMenu>
  );
  const lyricsHighlight = useLyricsHighlight();
  // Celular: ao rolar a letra, surge a busca no cabeçalho; aberta, os resultados tomam o lugar da letra
  const [lyricSearchShown, setLyricSearchShown] = useState(false);
  const [lyricSearchOpen, setLyricSearchOpen] = useState(false);
  const [lyricQuery, setLyricQuery] = useState('');
  // Computador: a barra fica na área do texto, na altura dos botões do player; opções do trecho num pop-up
  const desktopLyrics = !isMobileFs && showTranscript && hasTranscript;
  const [desktopLineMenu, setDesktopLineMenu] = useState<TranscriptLine | null>(null);
  const [lyricBarBottom, setLyricBarBottom] = useState(24);
  const lyricBarRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (!lyricSearchShown && !lyricSearchOpen) return;
    const column = lyricBarRef.current?.parentElement;
    const play = document.querySelector('[data-fs-main-play]');
    if (!column || !play) return;
    const r = play.getBoundingClientRect();
    setLyricBarBottom(Math.max(16, column.getBoundingClientRect().bottom - (r.top + r.height / 2) - 22));
  }, [lyricSearchShown, lyricSearchOpen]);
  const lyricSearchOpenRef = React.useRef(false);
  lyricSearchOpenRef.current = lyricSearchOpen;
  const foldedQuery = foldText(lyricQuery.trim());
  // Toca a partir do trecho (e sai da busca, se estiver nela)
  const playLine = (line: TranscriptLine) => {
    handleSeek(line.start);
    setIsPlaying(true);
    if (lyricQuery) closeLyricSearch();
  };
  const closeLyricSearch = () => {
    setLyricSearchOpen(false);
    setLyricSearchShown(false);
    setLyricQuery('');
    // Depois que a letra voltar à tela, ela vai para o ponto atual
    setTimeout(() => window.dispatchEvent(new Event('lyrics-recenter')), 60);
  };
  React.useEffect(() => {
    const el = fsTranscriptScrollRef.current;
    if ((!mobileLyrics && !desktopLyrics) || !el) {
      setLyricSearchShown(false);
      setLyricSearchOpen(false);
      setLyricQuery('');
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    let gestureAt = 0;
    const show = () => {
      setLyricSearchShown(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (!lyricSearchOpenRef.current) setLyricSearchShown(false); }, 4000);
    };
    const onGesture = () => {
      gestureAt = Date.now();
      show();
    };
    // Barra de rolagem e inércia depois de soltar o dedo. A rolagem automática da letra não conta (sem gesto recente)
    const onPress = () => { gestureAt = Date.now(); };
    const onScroll = () => { if (Date.now() - gestureAt < 1500) onGesture(); };
    el.addEventListener('touchmove', onGesture, { passive: true });
    el.addEventListener('wheel', onGesture, { passive: true });
    el.addEventListener('pointerdown', onPress, { passive: true });
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener('touchmove', onGesture);
      el.removeEventListener('wheel', onGesture);
      el.removeEventListener('pointerdown', onPress);
      el.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileLyrics, desktopLyrics]);
  React.useEffect(() => {
    if (fsTranscriptScrollRef.current && foldedQuery) fsTranscriptScrollRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foldedQuery]);
  // Mesma função sempre, para as frases que não mudaram não serem redesenhadas
  const seekRef = React.useRef(handleSeek);
  seekRef.current = handleSeek;
  const seekLyric = React.useCallback((time: number) => seekRef.current(time), []);

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
      exit={{ clipPath: miniClip, opacity: 0, transition: { clipPath: { type: "spring", stiffness: 720, damping: 54, mass: 0.5 }, opacity: { duration: 0.1, delay: 0.08 } } }}
      transition={{ clipPath: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 }, opacity: { duration: 0.12, ease: "easeOut" } }}
      style={{ willChange: 'clip-path, opacity' }}
      onAnimationComplete={() => setIsIntroDone(true)}
      className="fixed inset-x-0 top-0 h-[var(--screen-h)] z-[200] px-4 sm:px-8 md:px-10 pt-[max(24px,calc(var(--safe-top)+8px))] pb-[max(24px,env(safe-area-inset-bottom))] max-md:pt-[var(--app-header-top)] max-md:pb-[max(16px,env(safe-area-inset-bottom))] fs-safe flex flex-col justify-between overflow-hidden text-[var(--text-main)] transform-gpu"
    >
      {/* Fundo Animado com Blur dinâmico se movendo e mudando de cores (tons da capa + luz e escuridão no escuro / fusão com branco no claro) */}
      <motion.div
        layoutId="player-shell"
        transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }}
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
              fullscreenAmbientColors.toneSecondary,
              fullscreenAmbientColors.toneVeryLight,
              fullscreenAmbientColors.toneLight,
              fullscreenAmbientColors.toneSecondary,
            ] : [
              fullscreenAmbientColors.toneSecondary,
              fullscreenAmbientColors.tonePastel,
              fullscreenAmbientColors.tonePrimary,
              fullscreenAmbientColors.toneSecondary,
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
        className="flex items-center justify-between z-20 max-md:z-40 relative shrink-0 h-9 max-md:h-11"
        initial={{ opacity: 0 }}
        animate={{ opacity: isIntroDone ? 1 : 0 }}
        exit={{ opacity: 0, transition: { duration: 0 } }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        style={{ pointerEvents: isIntroDone ? 'auto' : 'none' }}
      >
        {/* Botão Minimizar à esquerda (mesma posição do voltar de outras telas com ícone Minimize2) */}
        {/* Celular: com a busca aberta, estes botões saem do cabeçalho até o X cancelar */}
        <div className={mobileLyrics && lyricSearchOpen ? 'hidden' : 'contents'}>
        {isMobileFs ? (
          // Celular: botão redondo no mesmo padrão e alinhamento dos botões do cabeçalho do app
          <motion.button
            data-press="true"
            onClick={() => {
              closeAllPopups();
              setIsFullScreen(false);
            }}
            aria-label={t('minimize_fullscreen')}
            data-instant="true"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl text-[var(--text-main)] backdrop-blur-3xl"
          >
            <Minimize2 size={18} />
          </motion.button>
        ) : (
        <motion.button 
          whileHover={{ scale: 1.08 }}
          data-press="true"
          onClick={() => {
            closeAllPopups();
            setIsFullScreen(false);
          }}
          className="h-9 flex items-center justify-center gap-1.5 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] text-[var(--text-main)] transition-all backdrop-blur-3xl"
          title={t('minimize_fullscreen')}
          data-instant="true"
        >
          <Minimize2 size={14} className="text-[var(--text-main)]" />
          <span className="text-xs font-medium text-[var(--text-main)]">{t('minimize')}</span>
        </motion.button>
        )}
        </div>

        {/* Celular, ao rolar a letra: busca no texto */}
        <AnimatePresence>
          {mobileLyrics && (lyricSearchShown || lyricSearchOpen) && (
            <motion.div
              key="lyric-search"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className={`flex-1 min-w-0 flex items-center gap-2 ${lyricSearchOpen ? '' : 'mx-2.5'}`}
            >
              <div
                onClick={() => setLyricSearchOpen(true)}
                className="flex-1 min-w-0 h-9 flex items-center gap-2 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-muted)]"
              >
                <TextSearch size={15} className="shrink-0" />
                {lyricSearchOpen ? (
                  <input
                    autoFocus
                    type="text"
                    enterKeyHint="search"
                    autoCapitalize="sentences"
                    autoCorrect="on"
                    spellCheck
                    value={lyricQuery}
                    onChange={(e) => setLyricQuery(e.target.value)}
                    placeholder={t('search_in_text_placeholder')}
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-[15px] text-[var(--text-main)] placeholder-[var(--text-muted)] font-medium"
                  />
                ) : (
                  <span className="truncate text-xs font-medium">{t('search_in_text')}</span>
                )}
              </div>
              {lyricSearchOpen && (
                <button
                  type="button"
                  data-instant="true"
                  onClick={closeLyricSearch}
                  aria-label={t('clear_search')}
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)]"
                >
                  <X size={15} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botões de função do miniplayer no cabeçalho à direita */}
        <div className={mobileLyrics && lyricSearchOpen ? 'hidden' : 'contents'}>
          {renderFullScreenHeaderControls(isMobileFs ? 'header' : 'all')}
        </div>
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
              transition={{ type: "spring", stiffness: 680, damping: 52, mass: 0.5 }}
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
                  transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }}
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
                  <MarqueeText text={currentChapter.title} />
                </motion.h2>

                <motion.div layoutId="player-book-line" layout="position" transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} className="fs-bookline flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-800 dark:text-[var(--text-muted)] max-w-full px-4 truncate font-medium">
                  <MarqueeText text={`${currentBook.title} • ${currentBook.author}`}>
                  <span 
                    className="text-slate-800 dark:text-[var(--text-muted)] hover:text-winblue cursor-pointer transition-colors font-semibold dark:drop-shadow-sm"
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
                  <span className="mx-1.5 text-[10px] text-slate-600 dark:text-[var(--text-muted)] opacity-70">•</span>
                  <span 
                    className="text-slate-800 dark:text-[var(--text-muted)] hover:text-winblue cursor-pointer transition-colors font-semibold dark:drop-shadow-sm"
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
                  </MarqueeText>
                </motion.div>
              </div>
            </div>

            <div className="fs-controls w-full flex flex-col items-center shrink-0">
              {/* Controles Principais */}
              <div className="w-full shrink-0 max-w-sm sm:max-w-md">
                {/* Barra de Progresso com grupo para hover da bolinha */}
                <motion.div layoutId="player-progress" transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} className="w-full flex items-center gap-2.5 group mb-3.5">
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
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
                    whileHover={{ scale: 1.12 }} 
                    data-press="true" 
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
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
                    whileHover={{ scale: 1.12 }} 
                    data-press="true" 
                    onClick={() => handleSeek(Math.max(0, currentTime - seekBackwardTime))}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm relative shrink-0"
                    title={t('seek_backward', { sec: seekBackwardTime })}
                  >
                    <BsArrowCounterclockwise data-spin="-1" size={22} />
                    <span className="absolute text-[8px] font-bold mt-[1px]">{seekBackwardTime}</span>
                  </motion.button>

                  {/* Play/Pause MAIOR que os demais (destaque visual como no miniplayer) */}
                  <motion.button
                    layoutId="player-play"
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
                    whileHover={{ scale: 1.08 }} 
                    data-press="true" 
                    onClick={() => setIsPlaying(!isPlaying)}
                    data-fs-main-play="true"
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
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
                    whileHover={{ scale: 1.12 }} 
                    data-press="true" 
                    onClick={() => handleSeek(Math.min(totalDuration, currentTime + seekForwardTime))}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-white/15 hover:border-black/15 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all shadow-sm relative shrink-0"
                    title={t('seek_forward', { sec: seekForwardTime })}
                  >
                    <BsArrowClockwise data-spin="1" size={22} />
                    <span className="absolute text-[8px] font-bold mt-[1px]">{seekForwardTime}</span>
                  </motion.button>

                  {/* Próximo capítulo */}
                  <motion.button
                    layoutId="player-next"
                    transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }} 
                    whileHover={{ scale: 1.12 }} 
                    data-press="true" 
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
              style={{
                willChange: 'transform, opacity, width',
                // Cor de destaque da página deste audiobook (a palavra sendo lida)
                '--book-accent': currentBookHighlight.hex,
                '--book-accent-rgb': currentBookHighlight.rgb,
              } as React.CSSProperties}
              // Celular: a letra ocupa a tela inteira (passa por baixo do cabeçalho e da barra da base, com
              // desfoque nos dois), e só rola na vertical
              className={mobileLyrics
                ? "fs-transcript fixed left-0 top-0 w-screen h-[var(--screen-h)] z-0 flex flex-col overflow-hidden"
                : "fs-transcript flex max-md:flex-1 max-md:w-full max-md:min-h-0 md:max-w-2xl lg:max-w-3xl h-full flex-col min-w-0 overflow-hidden transform-gpu md:shrink-0"}
            >
              <div 
                ref={fsTranscriptScrollRef}
                data-lyrics-full={mobileLyrics ? 'true' : undefined}
                data-searching={foldedQuery ? 'true' : undefined}
                style={mobileLyrics ? {
                  paddingTop: 'calc(var(--app-header-top) + 44px + 20px)',
                  paddingBottom: 'calc(62px + var(--mobile-bar-bottom) + 28px)',
                  paddingLeft: 'max(var(--page-margin), var(--safe-left))',
                  paddingRight: 'max(var(--page-margin), var(--safe-right))',
                  touchAction: 'pan-y',
                  overscrollBehaviorX: 'none',
                } : {
                  // Computador: com a busca na tela, a letra termina acima da barra
                  marginBottom: desktopLyrics && (lyricSearchShown || lyricSearchOpen || lyricQuery) ? lyricBarBottom + 52 : 0,
                  transition: 'margin-bottom 0.18s ease-out',
                }}
                className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pl-8 md:pl-12 pr-6 md:pr-10 py-8 max-md:px-2 max-md:py-4 flex flex-col fullscreen-transcript w-full md:w-[min(48vw,680px)] md:shrink-0"
              >
                <div
                  className={`select-none ${foldedQuery ? 'space-y-5 md:space-y-1' : 'my-auto space-y-6'}`}
                  style={{ WebkitTouchCallout: 'none' }}
                  onPointerDown={onLinesPointerDown}
                  onPointerMove={cancelLinePress}
                  onPointerUp={(e) => cancelLinePress(e)}
                  onPointerCancel={(e) => cancelLinePress(e)}
                  onClickCapture={onLinesClickCapture}
                  onContextMenu={onLinesContextMenu}
                >
                  {foldedQuery ? (
                    <LyricSearchResults
                      transcript={currentBook.transcript}
                      chapters={currentBook.chapters || []}
                      query={foldedQuery}
                      emptyText={t('search_in_text_empty')}
                      moreLabel={t('more_options')}
                      onPick={(line) => { if (isMobileFs) { seekLyric(line.start); closeLyricSearch(); } else playLine(line); }}
                      onOptions={isMobileFs ? undefined : setDesktopLineMenu}
                    />
                  ) : (
                    <LyricBlocks transcript={currentBook.transcript} time={currentTime} playing={isPlaying} audioRef={audioRef} mode={lyricsHighlight} onSeek={seekLyric} />
                  )}
                  <div className="h-[25vh] shrink-0" />
                </div>
              </div>
              {/* Computador: ao rolar a letra, a busca surge dentro da área do texto, na altura dos botões do player */}
              <AnimatePresence>
                {desktopLyrics && (lyricSearchShown || lyricSearchOpen || lyricQuery) && (
                  <motion.div
                    key="lyric-search-desktop"
                    ref={lyricBarRef}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    style={{
                      bottom: lyricBarBottom,
                      // Destaque da barra na cor do audiobook
                      '--winblue': currentBookHighlight.hex,
                      '--winblue-rgb': currentBookHighlight.rgb,
                      '--color-winblue': currentBookHighlight.hex,
                    } as React.CSSProperties}
                    className="absolute left-14 right-12 z-10"
                    onFocusCapture={() => setLyricSearchOpen(true)}
                    onBlurCapture={() => { if (!lyricQuery) { setLyricSearchOpen(false); setLyricSearchShown(false); } }}
                  >
                    <PopupSearchField value={lyricQuery} onChange={setLyricQuery} placeholder={t('search_in_text_placeholder')} autoFocus={false} icon={TextSearch} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Espaço da barra fixa abaixo da letra */}


        {/* Celular com letra aberta: desfoque do cabeçalho e do rodapé por cima da letra (atrás dos botões do
            cabeçalho e da barra do audiobook), igual ao rodapé dos ajustes iniciais. Ficam fora da área que rola:
            no iPhone, a área com rolagem pode ser desenhada por cima de camadas dentro dela */}
        {mobileLyrics && (
          <>
            {/* Cabeçalho: o mesmo desfoque progressivo do cabeçalho da interface ao rolar (6 camadas + véu) */}
            <div
              aria-hidden="true"
              className="apple-header-blur pointer-events-none"
              style={{
                zIndex: 4,
                ['--header-blur' as any]: 1,
                ['--header-tint' as any]: fullscreenAmbientColors.isDark ? '#04070f' : '#ffffff',
              }}
            >
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-tint" />
            </div>
            {/* Rodapé: o mesmo desfoque do cabeçalho, espelhado — cobre a barra do audiobook e esmaece logo acima */}
            <div
              aria-hidden="true"
              className="apple-header-blur apple-footer-blur pointer-events-none"
              style={{
                zIndex: 4,
                ['--header-blur' as any]: 1,
                ['--header-tint' as any]: fullscreenAmbientColors.isDark ? '#04070f' : '#ffffff',
              }}
            >
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-layer" />
              <div className="apple-blur-tint" />
            </div>
          </>
        )}

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
            // No lugar da barra de abas (mesmas margens e altura), sem fundo de vidro: o player em tela cheia
            // não tem outro conteúdo passando por baixo, então não há o que destacar
            style={{
              left: 'var(--mobile-bar-inset)',
              right: 'var(--mobile-bar-inset)',
              top: 'calc(var(--screen-h) - var(--mobile-bar-bottom) - 62px)',
              height: 62,
            }}
            className="fixed z-[5] flex items-center gap-3 pl-2.5 pr-2 cursor-pointer select-none bg-transparent"
          >
            <motion.img
              layoutId="player-cover"
              transition={{ type: "spring", stiffness: 680, damping: 52, mass: 0.5 }}
              style={{ borderRadius: 8 }}
              src={currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author)}
              onError={(e) => handleBookCoverError(currentBook, e)}
              alt=""
              className="h-11 aspect-[1/1.6] object-cover shadow-md shrink-0"
            />
            <div className="flex-1 min-w-0 text-left">
              <motion.p
                layoutId="player-chapter-title"
                layout="position"
                transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }}
                className="text-sm font-bold text-[var(--text-main)] truncate"
              >
                <MarqueeText text={currentChapter.title} />
              </motion.p>
              <motion.p
                layoutId="player-book-line"
                layout="position"
                transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }}
                className="text-xs text-[var(--text-muted)] truncate mt-0.5"
              >
                <MarqueeText text={`${currentBook.title} • ${currentBook.author}`} />
              </motion.p>
            </div>
            {/* Deitado há espaço: o capítulo anterior aparece também */}
            {isLandFs && (
              <motion.button layoutId="player-prev" data-press="true" title={t('previous_chapter')}
                onClick={(e) => { e.stopPropagation(); if (handlePrevChapter) handlePrevChapter(); else handleSeek(currentChapter.startTime); }}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0 relative">
                <SkipBack size={17} />
              </motion.button>
            )}
            {/* Voltar alguns segundos, à esquerda do play/pause (em pé e deitado) */}
            <motion.button layoutId="player-seek-back" data-press="true" title={t('seek_backward', { sec: seekBackwardTime })}
              aria-label={t('seek_backward', { sec: seekBackwardTime })}
              onClick={(e) => { e.stopPropagation(); handleSeek(Math.max(0, currentTime - seekBackwardTime)); }}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0 relative">
              <BsArrowCounterclockwise data-spin="-1" size={20} />
              <span className="absolute text-[7px] font-bold mt-[1px]">{seekBackwardTime}</span>
            </motion.button>
            <motion.button
              layoutId="player-play"
              transition={{ layout: { type: "spring", stiffness: 680, damping: 52, mass: 0.5 } }}
              data-press="true"
              onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
              aria-label={isPlaying ? t('pause') : t('listen')}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0"
            >
              {isPlaying ? <BsPauseFill size={20} /> : <BsPlayFill size={20} className="translate-x-[1px]" />}
            </motion.button>
            {isLandFs && (
              <>
                <motion.button layoutId="player-seek-fwd" data-press="true" title={t('seek_forward', { sec: seekForwardTime })}
                  onClick={(e) => { e.stopPropagation(); handleSeek(Math.min(totalDuration, currentTime + seekForwardTime)); }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0 relative">
                  <BsArrowClockwise data-spin="1" size={20} />
                  <span className="absolute text-[7px] font-bold mt-[1px]">{seekForwardTime}</span>
                </motion.button>
                <motion.button layoutId="player-next" data-press="true" title={t('next_chapter')}
                  onClick={(e) => { e.stopPropagation(); handleNextChapter?.(); }}
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] shrink-0 relative">
                  <SkipForward size={17} />
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {desktopLineMenu && (
          <MobileConfirmCard key="lyric-line-menu" menuWidth={270} onClose={() => setDesktopLineMenu(null)}>
            {renderLineOptions(desktopLineMenu, () => setDesktopLineMenu(null))}
          </MobileConfirmCard>
        )}
      </AnimatePresence>
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
        {lastLineRef.current && renderLineOptions(lastLineRef.current, () => setLineMenu(null))}
      </MobileContextMenu>
    </motion.div>
  );
}
