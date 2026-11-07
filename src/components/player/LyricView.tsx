import React from 'react';

import { MoreHorizontal } from 'lucide-react';

import { type LyricsHighlight } from '../../audio/lyricsPrefs';

import type { TranscriptLine } from '../../data/catalog';

import { formatTime } from '../../audio/playbackTiming';
import { FADE_IN } from '../../lib/motion';

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
      className={`text-[length:calc(1.5625rem*var(--font-scale,1))] sm:text-3xl leading-[1.3] font-bold cursor-pointer px-4 py-2 ${lineOn ? 'lyric-on' : isPast ? 'lyric-past' : 'lyric-next'}`}
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
                    : isWordPast ? 'lyric-on' : lineOn ? 'lyric-soft' : ''
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
  const estimate = lines.reduce((sum, l) => sum + Math.ceil(l.text.length / 27) * 33 + 40, 0);
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

// Fade da letra, do player e dos desfoques ao abrir e fechar a letra
export const LYRICS_FADE = FADE_IN;

export function LyricBlocks({ transcript, time: appTime, playing, audioRef, mode, onSeek, onMounted }: { transcript: TranscriptLine[]; time: number; playing: boolean; audioRef: React.RefObject<HTMLAudioElement | null>; mode: LyricsHighlight; onSeek: (time: number) => void; onMounted?: () => void }) {
  const time = useLyricClock(audioRef, appTime, playing);
  // Antes de aparecer na tela (a letra volta depois da busca já no ponto atual, sem pular)
  React.useLayoutEffect(() => { onMounted?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
export const foldText = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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

export function LyricSearchResults({ transcript, chapters, query, emptyText, moreLabel, onPick, onOptions }: {
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
          <p key={idx} data-transcript-idx={idx} onClick={() => onPick(line)} className="group/lyricres relative px-4 py-1 md:py-2.5 md:pr-12 md:rounded-3xl md:transition-colors md:hover:bg-[var(--hover-fill)] cursor-pointer text-lg font-bold leading-snug text-[var(--text-main)]">
            {onOptions && (
              <button
                type="button"
                aria-label={moreLabel}
                onClick={(e) => { e.stopPropagation(); onOptions(line); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-card/75 backdrop-blur-3xl text-[var(--text-main)] opacity-0 group-hover/lyricres:opacity-100 focus:opacity-100 transition-opacity"
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
