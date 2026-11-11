// Extraído do App.tsx (mesma ordem de antes: os efeitos rodam na mesma sequência)
import { isExplicitBlocked } from '../lib/explicitContent';
import { useCallback, useEffect, useRef } from 'react';
import { EMPTY_BOOK } from '../components/popups/Popovers';
import { getGenericBookCover } from '../lib/coverArt';
import { Audiobook, TranscriptLine } from '../data/catalog';
import { visibleChapters } from '../audio/chapterPrefs';
import { diag } from '../audio/playbackDiag';
import { parseSynchronizedTextFile } from '../audio/transcripts';
import { IS_APPLE_TOUCH, desktop } from '../lib/desktopBridge';
import { isTestBookId } from '../data/libraryData';
import { QueueItem, VOLUME_KEY } from '../App';
import type { PlaybackReturnPoint, ScreenState } from '../App';
import type { Chapter } from '../data/catalog';

export function usePlaybackEngine({ accrueListeningSeconds, activeScreen, applyBookDurationRef, audioContextRef, audioRecoveryTriesRef, audioRef, audioUrlsRef, beginBookSwitch, books, checkChapterFinished, currentAudioSrc, currentBook, currentChapter, currentChapterIndex, currentTime, currentTimeRef, durationFixedBooksRef, durationTimerRef, editBookChapters, gainNodeRef, getChapterResumeElapsed, handleSeek, isAudioLoading, isEditingBook, isMuted, isMutedRef, isPlaying, isSleepTimerPaused, lastSrcSetAtRef, lastTrackedAudioTimeRef, latestBookIdRef, loadAudioForBook, loadedSrcRef, markChapterCompleted, mediaSessionContextRef, navigateTo, noFragmentRef, pendingChapterScrollRef, pendingSeekRef, playbackQueue, playbackReturnPoint, playbackSpeed, queueAddedTimeoutRef, recordPlaySession, recoverAudioRef, resumePlayback, savePlaybackPosition, seekVerifyRef, selectedBook, setActiveScreen, setBooks, setCurrentBook, setCurrentTime, setEditBookTranscript, setEditBookTranscriptFileName, setEditBookTranscriptSource, setIsPlaying, setIsQueuePulse, setIsSleepTimerPaused, setPlaybackQueue, setPlaybackReturnPoint, setQueueAddedAnim, setSelectedBook, setShowAddTextPopup, setShowTranscript, setSleepTimerMode, setSleepTimerRemaining, setStartedChapters, setupWebAudioGraph, showExtraChapters, showToast, sleepTimerMode, sleepTimerRemaining, storedAudioBlobKeysRef, t, targetScrollChapterIdRef, totalDuration, updateMediaSessionPosition, volume, volumeRef }: { accrueListeningSeconds: (book: Audiobook, deltaSec: number) => void; activeScreen: ScreenState; applyBookDurationRef: React.RefObject<(audio: HTMLAudioElement) => void>; audioContextRef: React.RefObject<AudioContext | null>; audioRecoveryTriesRef: React.RefObject<Map<string, number>>; audioRef: React.RefObject<HTMLAudioElement | null>; audioUrlsRef: React.RefObject<Map<string, string>>; beginBookSwitch: (next: Audiobook | undefined | null) => void; books: Audiobook[]; checkChapterFinished: (bookId: string, time: number) => void; currentAudioSrc: string | null; currentBook: Audiobook; currentChapter: Chapter; currentChapterIndex: number; currentTime: number; currentTimeRef: React.RefObject<number>; durationFixedBooksRef: React.RefObject<Set<string>>; durationTimerRef: React.RefObject<NodeJS.Timeout | null>; editBookChapters: Chapter[]; gainNodeRef: React.RefObject<GainNode | null>; getChapterResumeElapsed: (bookId: string, chapter: Chapter | undefined) => number | null; handleSeek: (newTime: number) => void; isAudioLoading: boolean; isEditingBook: boolean; isMuted: boolean; isMutedRef: React.RefObject<boolean>; isPlaying: boolean; isSleepTimerPaused: boolean; lastSrcSetAtRef: React.RefObject<number>; lastTrackedAudioTimeRef: React.RefObject<number>; latestBookIdRef: React.RefObject<string | undefined>; loadAudioForBook: (bookId: string, isCurrent?: boolean) => Promise<void>; loadedSrcRef: React.RefObject<string | null>; markChapterCompleted: (bookId: string, chapterId: string | number) => void; mediaSessionContextRef: React.RefObject<{ currentBook: Audiobook; currentChapter: Chapter; currentChapterIndex: number; currentTime: number; totalDuration: number; playbackSpeed: number; isPlaying: boolean; seekBackwardTime: number; seekForwardTime: number; playbackQueue: QueueItem[]; handleSeek: (newTime: number) => void; handlePrevChapter: () => void; handleNextChapter: () => void; setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>; setPlaybackQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>; setCurrentBook: React.Dispatch<React.SetStateAction<Audiobook>>; setSelectedBook: React.Dispatch<React.SetStateAction<Audiobook>>; }>; navigateTo: (screenId: string, data?: any) => void; noFragmentRef: React.RefObject<boolean>; pendingChapterScrollRef: React.RefObject<boolean>; pendingSeekRef: React.RefObject<number | null>; playbackQueue: QueueItem[]; playbackReturnPoint: PlaybackReturnPoint | null; playbackSpeed: number; queueAddedTimeoutRef: React.RefObject<any>; recordPlaySession: (book: Audiobook) => void; recoverAudioRef: React.RefObject<(reason: string) => boolean>; resumePlayback: boolean; savePlaybackPosition: (time: number, bookId: string, force?: boolean) => void; seekVerifyRef: React.RefObject<{ target: number; at: number; tries: number; lastTry: number; } | null>; selectedBook: Audiobook; setActiveScreen: React.Dispatch<React.SetStateAction<ScreenState>>; setBooks: React.Dispatch<React.SetStateAction<Audiobook[]>>; setCurrentBook: React.Dispatch<React.SetStateAction<Audiobook>>; setCurrentTime: React.Dispatch<React.SetStateAction<number>>; setEditBookTranscript: React.Dispatch<React.SetStateAction<TranscriptLine[]>>; setEditBookTranscriptFileName: React.Dispatch<React.SetStateAction<string | undefined>>; setEditBookTranscriptSource: React.Dispatch<React.SetStateAction<"metadata" | "upload" | undefined>>; setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>; setIsQueuePulse: React.Dispatch<React.SetStateAction<boolean>>; setIsSleepTimerPaused: React.Dispatch<React.SetStateAction<boolean>>; setPlaybackQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>; setPlaybackReturnPoint: (value: PlaybackReturnPoint | null) => void; setQueueAddedAnim: React.Dispatch<React.SetStateAction<{ cover: string; title: string; author: string; isBook: boolean; key: number; } | null>>; setSelectedBook: React.Dispatch<React.SetStateAction<Audiobook>>; setShowAddTextPopup: React.Dispatch<React.SetStateAction<boolean>>; setShowTranscript: React.Dispatch<React.SetStateAction<boolean>>; setSleepTimerMode: React.Dispatch<React.SetStateAction<"duration" | "end-of-chapter" | null>>; setSleepTimerRemaining: React.Dispatch<React.SetStateAction<number | null>>; setStartedChapters: React.Dispatch<React.SetStateAction<string[]>>; setupWebAudioGraph: (forVolume?: boolean) => void; showExtraChapters: boolean; showToast: (message: string) => void; sleepTimerMode: "duration" | "end-of-chapter" | null; sleepTimerRemaining: number | null; storedAudioBlobKeysRef: React.RefObject<Set<string>>; t: (key: string, params?: Record<string, string | number>) => string; targetScrollChapterIdRef: React.RefObject<string | null>; totalDuration: number; updateMediaSessionPosition: (time: number, duration: number, rate: number, force?: boolean) => void; volume: number; volumeRef: React.RefObject<number> }) {
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (!currentBook || currentBook.id === EMPTY_BOOK.id) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    const coverUrl = currentBook.cover || getGenericBookCover(currentBook.title, currentBook.author);
    const setMetadata = (art: { src: string; type: string }[]) => {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentBook.title || 'Audiobook',
          artist: currentBook.author || 'Autor Desconhecido',
          album: currentChapter?.title || currentBook.category || 'Audiobook Player',
          artwork: art.flatMap(a => ['256x256', '512x512'].map(sizes => ({ src: a.src, sizes, type: a.type }))),
        });
      } catch (e) {
        console.warn('Erro ao configurar MediaMetadata:', e);
      }
    };
    // Primeiro com a capa original; em seguida, com uma versão quadrada em PNG (o iOS e o Android não
    // exibem capas em SVG nem fora do formato quadrado)
    setMetadata([{ src: coverUrl, type: coverUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png' }]);
    let cancelled = false;
    (async () => {
      try {
        const img = new Image();
        if (!coverUrl.startsWith('data:') && !coverUrl.startsWith('blob:')) img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); img.src = coverUrl; });
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Fundo: a própria capa ampliada e escurecida; por cima, a capa inteira centralizada
        ctx.drawImage(img, -size * 0.25, -size * 0.25, size * 1.5, size * 1.5 * (img.height / img.width || 1.6));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, size, size);
        const h = size * 0.92;
        const w = h * ((img.width / img.height) || 0.625);
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const png = canvas.toDataURL('image/png');
        if (!cancelled) setMetadata([{ src: png, type: 'image/png' }]);
      } catch {
        // Sem a capa (imagem de outro site sem permissão): usa o ícone do app
        if (!cancelled) setMetadata([{ src: `${import.meta.env.BASE_URL}icons/app-icon-512.png`, type: 'image/png' }]);
      }
    })();
    return () => { cancelled = true; };
  }, [currentBook?.id, currentBook?.title, currentBook?.author, currentBook?.cover, currentChapter?.title]);

  // Sincronização do estado de reprodução na Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Registro desacoplado dos Action Handlers da Media Session (Fones Bluetooth, botões de hardware e lockscreen)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionMap: [MediaSessionAction, MediaSessionActionHandler][] = [
      [
        'play',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.setIsPlaying(true);
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
        }
      ],
      [
        'pause',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.setIsPlaying(false);
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
        }
      ],
      [
        'stop',
        () => {
          const ctx = mediaSessionContextRef.current;
          // Só pausa: o sistema também pede "parar" ao passar o áudio para outro app, e voltar a 0 aqui
          // apagava o ponto em que a pessoa estava
          ctx.setIsPlaying(false);
          audioRef.current?.pause();
        }
      ],
      [
        'seekbackward',
        (details) => {
          const ctx = mediaSessionContextRef.current;
          const skip = details.seekOffset || ctx.seekBackwardTime || 15;
          // Parte do tempo real (o da tela fica parado com o app em segundo plano)
          const base = seekVerifyRef.current?.target ?? audioRef.current?.currentTime ?? ctx.currentTime;
          ctx.handleSeek(Math.max(0, base - skip));
        }
      ],
      [
        'seekforward',
        (details) => {
          const ctx = mediaSessionContextRef.current;
          const skip = details.seekOffset || ctx.seekForwardTime || 15;
          const base = seekVerifyRef.current?.target ?? audioRef.current?.currentTime ?? ctx.currentTime;
          ctx.handleSeek(Math.min(ctx.totalDuration, base + skip));
        }
      ],
      [
        'previoustrack',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.handlePrevChapter();
        }
      ],
      [
        'nexttrack',
        () => {
          const ctx = mediaSessionContextRef.current;
          ctx.handleNextChapter();
        }
      ],
      [
        'seekto',
        (details) => {
          const ctx = mediaSessionContextRef.current;
          if (details.seekTime !== undefined && details.seekTime !== null && !isNaN(details.seekTime)) {
            ctx.handleSeek(details.seekTime);
          }
        }
      ]
    ];

    actionMap.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        // Ignora ações não suportadas por este navegador/dispositivo
      }
    });

    return () => {
      actionMap.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      });
    };
  }, []);

  const createQueueItem = (book: Audiobook, chapter: any, chapterIndex: number): QueueItem => ({
    id: `q-${book.id}-${chapter.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bookId: book.id,
    bookTitle: book.title,
    author: book.author,
    cover: book.cover || getGenericBookCover(book.title, book.author),
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    startTime: chapter.startTime,
    duration: chapter.duration,
    chapterIndex,
    book,
  });

  const triggerQueuePulse = (book?: Audiobook, isBook = false) => {
    setIsQueuePulse(true);
    setTimeout(() => setIsQueuePulse(false), 800);
    if (book) {
      if (queueAddedTimeoutRef.current) clearTimeout(queueAddedTimeoutRef.current);
      setQueueAddedAnim({
        cover: book.cover || getGenericBookCover(book.title, book.author),
        title: book.title,
        author: book.author,
        isBook,
        key: Date.now() + Math.random(),
      });
      queueAddedTimeoutRef.current = setTimeout(() => {
        setQueueAddedAnim(null);
      }, 1500);
    }
  };

  const handleAddBookToQueue = (book: Audiobook, position: 'next' | 'last') => {
    const shown = visibleChapters(book.chapters, showExtraChapters);
    const items = book.chapters.flatMap((chap, idx) => (shown.includes(chap) ? [createQueueItem(book, chap, idx)] : []));
    if (position === 'next') {
      setPlaybackQueue(prev => [...items, ...prev]);
      showToast(t('toast_book_queue_next', { title: book.title }));
    } else {
      setPlaybackQueue(prev => [...prev, ...items]);
      showToast(t('toast_book_queue_last', { title: book.title }));
    }
    triggerQueuePulse(book, true);
  };

  const handleAddChapterToQueue = (book: Audiobook, chapter: any, chapterIndex: number, position: 'next' | 'last') => {
    const item = createQueueItem(book, chapter, chapterIndex);
    if (position === 'next') {
      setPlaybackQueue(prev => [item, ...prev]);
      showToast(t('toast_chapter_queue_next', { title: chapter.title }));
    } else {
      setPlaybackQueue(prev => [...prev, item]);
      showToast(t('toast_chapter_queue_last', { title: chapter.title }));
    }
    triggerQueuePulse(book, false);
  };

  const handleAddToQueue = (item: Audiobook, position: 'next'|'last') => {
    handleAddBookToQueue(item, position);
  };

  const getTranscriptParseErrorMessage = (reason: 'epub_no_media_overlays' | 'invalid_or_no_timestamps' | 'unsupported_format') => {
    if (reason === 'epub_no_media_overlays') {
      return 'Este arquivo EPUB não possui sincronização de áudio (Media Overlays / SMIL).';
    }
    if (reason === 'unsupported_format') {
      return 'Formato de arquivo não suportado para sincronização de texto.';
    }
    return 'Nenhum tempo de sincronização válido encontrado para a duração deste audiobook.';
  };

  // O app lê todos os formatos com os mesmos tempos: se a duração do texto não bate com a do áudio, o arquivo é de
  // outra conversão (a letra se desencontra cada vez mais ao longo do livro)
  const warnIfTextDoesNotMatch = (lines: TranscriptLine[], fileName: string, bookDuration: number) => {
    const real = audioRef.current?.duration;
    const duration = real && isFinite(real) ? real : bookDuration;
    const end = lines[lines.length - 1]?.end || 0;
    diag('letra-enviada', { arquivo: fileName.split('.').slice(-2).join('.'), linhas: lines.length, fimLetra: end, duracao: duration });
    if (duration > 60 && Math.abs(end / duration - 1) > 0.02) showToast(t('toast_text_duration_mismatch'));
  };

  const handleUploadTranscriptForPlayerBook = async (file?: File | null) => {
    if (!file || !currentBook || !currentBook.id || currentBook.id === EMPTY_BOOK.id) return;
    const bookDur = (currentBook.chapters || []).reduce((acc, c) => acc + (c.duration || 0), 0);
    const res = await parseSynchronizedTextFile(file, bookDur);
    if (!res.ok) {
      showToast(getTranscriptParseErrorMessage(res.reason));
      return;
    }
    if (res.lines.length === 0) {
      showToast(getTranscriptParseErrorMessage('invalid_or_no_timestamps'));
      return;
    }
    const targetId = currentBook.id;
    setBooks(prev => prev.map(b => b.id === targetId ? {
      ...b,
      transcript: res.lines,
      transcriptSource: 'upload',
      transcriptFileName: file.name,
    } : b));
    setCurrentBook(prev => prev.id === targetId ? {
      ...prev,
      transcript: res.lines,
      transcriptSource: 'upload',
      transcriptFileName: file.name,
    } : prev);
    setSelectedBook(prev => prev && prev.id === targetId ? {
      ...prev,
      transcript: res.lines,
      transcriptSource: 'upload',
      transcriptFileName: file.name,
    } : prev);
    setActiveScreen(prev => prev.data && prev.data.id === targetId ? {
      ...prev,
      data: {
        ...prev.data,
        transcript: res.lines,
        transcriptSource: 'upload',
        transcriptFileName: file.name,
      }
    } : prev);
    if (isEditingBook && (activeScreen.data?.id === targetId || selectedBook?.id === targetId)) {
      setEditBookTranscript(res.lines);
      setEditBookTranscriptSource('upload');
      setEditBookTranscriptFileName(file.name);
    }
    setShowAddTextPopup(false);
    setShowTranscript(true);
    showToast(t('toast_text_uploaded', { count: res.lines.length }));
    warnIfTextDoesNotMatch(res.lines, file.name, bookDur);
  };

  const handleUploadTranscriptForEditBook = async (file?: File | null) => {
    if (!file) return;
    const targetBook: Audiobook | undefined = books.find(b => b.id === (activeScreen.data?.id || selectedBook?.id)) || activeScreen.data || selectedBook;
    const chaps = editBookChapters.length > 0 ? editBookChapters : (targetBook?.chapters || []);
    const bookDur = chaps.reduce((acc, c) => acc + (c.duration || 0), 0);
    const res = await parseSynchronizedTextFile(file, bookDur);
    if (!res.ok) {
      showToast(getTranscriptParseErrorMessage(res.reason));
      return;
    }
    if (res.lines.length === 0) {
      showToast(getTranscriptParseErrorMessage('invalid_or_no_timestamps'));
      return;
    }
    setEditBookTranscript(res.lines);
    setEditBookTranscriptSource('upload');
    setEditBookTranscriptFileName(file.name);
    showToast(t('toast_text_uploaded', { count: res.lines.length }));
    warnIfTextDoesNotMatch(res.lines, file.name, bookDur);
  };

  // Sincronização da fonte de áudio nativa
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentAudioSrc) {
      if (loadedSrcRef.current !== currentAudioSrc) {
        // Nova fonte: a posição só pode ser aplicada depois que o arquivo carregar (o iPhone ignora antes e o
        // áudio começava do 0, no capítulo 1). Fica pendente e é aplicada em onLoadedMetadata/onPlay/timeupdate.
        const resumeAt = pendingSeekRef.current ?? currentTimeRef.current;
        if (resumeAt > 0) pendingSeekRef.current = resumeAt;
        diag('fonte', { livro: currentBook?.id, posicao: resumeAt, tocando: isPlaying });
        loadedSrcRef.current = currentAudioSrc;
        lastSrcSetAtRef.current = Date.now();
        // iPhone/iPad: o próprio arquivo já abre no ponto certo ("#t="), sem depender do pulo depois de carregar
        audio.src = IS_APPLE_TOUCH && !noFragmentRef.current && resumeAt > 1 && currentAudioSrc.startsWith('blob:')
          ? `${currentAudioSrc}#t=${resumeAt.toFixed(2)}`
          : currentAudioSrc;
        if (isPlaying) {
          audio.play().catch(e => console.warn('Erro ao iniciar áudio:', e));
        }
      }
    } else {
      loadedSrcRef.current = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }, [currentAudioSrc]);

  // Proteção da reprodução: no iPhone, mudar a biblioteca, a fila ou a velocidade às vezes fazia o sistema
  // pausar o áudio (ou suspender o processamento de áudio) sem o usuário pedir. Se isso acontecer logo
  // depois de uma dessas mudanças, a reprodução continua sozinha. Pausas do sistema em outros momentos
  // (ligação, Siri, outro app tocando) continuam sendo respeitadas.
  const playingNowRef = useRef(isPlaying);
  playingNowRef.current = isPlaying;
  const lastLibraryChangeAtRef = useRef(0);
  useEffect(() => { lastLibraryChangeAtRef.current = Date.now(); }, [books, playbackQueue, playbackSpeed]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const recentChange = () => Date.now() - lastLibraryChangeAtRef.current < 2000;
    const onUnexpectedPause = () => {
      if (!playingNowRef.current || audio.ended) return;
      if (recentChange()) {
        setTimeout(() => {
          if (playingNowRef.current && audio.paused && !audio.ended) audio.play().catch(() => {});
        }, 60);
        return;
      }
      // Trocando de arquivo ou pulando: não é uma pausa de verdade
      if (audio.seeking || Date.now() - lastSrcSetAtRef.current < 1500) return;
      // Pausa do sistema (ligação, Siri, outro app tocando): a tela passa a mostrar pausado e o próximo play
      // volta a tocar. Antes o app continuava achando que estava tocando e o botão de play não fazia nada.
      diag('pausa-sistema', { audio: audio.currentTime, ready: audio.readyState });
      setIsPlaying(false);
    };
    audio.addEventListener('pause', onUnexpectedPause);
    const ctx = audioContextRef.current;
    const onCtxState = () => {
      if (ctx && ctx.state !== 'running' && playingNowRef.current && recentChange()) ctx.resume().catch(() => {});
    };
    ctx?.addEventListener('statechange', onCtxState);
    return () => {
      audio.removeEventListener('pause', onUnexpectedPause);
      ctx?.removeEventListener('statechange', onCtxState);
    };
  }, [currentAudioSrc, isPlaying]);

  // Recarrega o arquivo guardado no aparelho e continua do mesmo ponto (o sistema pode descartar o áudio com o
  // app em segundo plano). As tentativas voltam a zero quando o áudio anda ou a pessoa dá play de novo.
  const recoverAudio = (reason: string): boolean => {
    const bookId = latestBookIdRef.current;
    if (!bookId || bookId === EMPTY_BOOK.id || !storedAudioBlobKeysRef.current.has(bookId)) return false;
    const tries = audioRecoveryTriesRef.current.get(bookId) || 0;
    if (tries >= 3) {
      diag('recuperacao-desistiu', { reason });
      setIsPlaying(false);
      return false;
    }
    audioRecoveryTriesRef.current.set(bookId, tries + 1);
    diag('recuperando', { reason, tentativa: tries + 1, erro: audioRef.current?.error?.code, ready: audioRef.current?.readyState });
    pendingSeekRef.current = pendingSeekRef.current ?? seekVerifyRef.current?.target ?? currentTimeRef.current;
    const oldUrl = audioUrlsRef.current.get(bookId);
    if (oldUrl?.startsWith('blob:')) { try { URL.revokeObjectURL(oldUrl); } catch {} }
    audioUrlsRef.current.delete(bookId);
    loadedSrcRef.current = null;
    loadAudioForBook(bookId, true);
    return true;
  };

  // Vigia: tocando sem o tempo andar (áudio travado) tenta dar play de novo e, se seguir parado, recarrega
  useEffect(() => {
    if (!isPlaying || !currentAudioSrc) return;
    let last = -1;
    let stuck = 0;
    // Ritmo real: quanto o tempo do áudio andou em relação ao relógio (se diferir de 1, o tempo informado
    // pelo sistema não acompanha o que se ouve, e a letra se desencontra)
    let paceFrom: { at: number; audio: number } | null = null;
    const timer = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.ended || audio.seeking || document.hidden) return;
      const nowMs = Date.now();
      if (!paceFrom || audio.currentTime < paceFrom.audio) paceFrom = { at: nowMs, audio: audio.currentTime };
      else if (nowMs - paceFrom.at >= 120000) {
        const pace = (audio.currentTime - paceFrom.audio) / ((nowMs - paceFrom.at) / 1000) / (audio.playbackRate || 1);
        diag('ritmo', { ritmo: String(Math.round(pace * 10000) / 10000), velocidade: audio.playbackRate, audio: audio.currentTime });
        paceFrom = { at: nowMs, audio: audio.currentTime };
      }
      if (Math.abs(audio.currentTime - last) > 0.05) {
        if (last >= 0) {
          stuck = 0;
          if (latestBookIdRef.current) audioRecoveryTriesRef.current.delete(latestBookIdRef.current);
        }
        last = audio.currentTime;
        return;
      }
      stuck += 1;
      if (stuck === 2) {
        diag('travou', { audio: audio.currentTime, ready: audio.readyState, rede: audio.networkState, pausado: audio.paused });
        audio.play().catch(() => {});
      } else if (stuck === 4) {
        stuck = 0;
        recoverAudio('travou');
      }
    }, 2500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentAudioSrc]);

  // Duração real do arquivo: a informada na importação pode estar errada (no iPhone, sem resposta a tempo, o
  // app assume 30 minutos), o que limitava os pulos e deixava o fim do livro fora do lugar
  // Uma vez por livro e só depois de o valor assentar: o iPhone refaz a estimativa várias vezes, e cada correção
  // regrava a biblioteca inteira (com as letras), o que travava o app
  const applyBookDuration = (audio: HTMLAudioElement) => {
    const book = currentBook;
    const dur = audio.duration;
    if (!book?.id || book.id === EMPTY_BOOK.id || book.id !== latestBookIdRef.current || !isFinite(dur) || dur <= 0) return;
    if (durationFixedBooksRef.current.has(book.id)) return;
    const chapters = book.chapters || [];
    if (chapters.length === 0) return;
    const last = chapters[chapters.length - 1];
    const lastDuration = dur - last.startTime;
    if (lastDuration < 1 || Math.abs(dur - (last.startTime + last.duration)) < 2) return;
    durationFixedBooksRef.current.add(book.id);
    diag('duracao-corrigida', { livro: book.id, antes: last.startTime + last.duration, agora: dur });
    const fixed = chapters.map((c, i) => (i === chapters.length - 1 ? { ...c, duration: lastDuration } : c));
    const fix = <T extends Audiobook>(b: T): T => (b.id === book.id ? { ...b, chapters: fixed } : b);
    setBooks(prev => prev.map(fix));
    setCurrentBook(prev => fix(prev));
    setSelectedBook(prev => (prev ? fix(prev) : prev));
  };

  applyBookDurationRef.current = applyBookDuration;
  const reconcileBookDuration = (audio: HTMLAudioElement) => {
    if (durationTimerRef.current) clearTimeout(durationTimerRef.current);
    durationTimerRef.current = setTimeout(() => applyBookDurationRef.current(audio), 4000);
  };

  // Primeiro play de cada livro na sessão: se o áudio vai começar antes de onde a pessoa parou (e ela não
  // escolheu outro ponto), volta para a posição salva — garantia contra o iPhone começar do capítulo 1
  const resumeCheckedBooksRef = useRef<Set<string>>(new Set());
  const ensureResumePosition = (audio: HTMLAudioElement) => {
    const bookId = currentBook?.id;
    if (!resumePlayback || !bookId || bookId === EMPTY_BOOK.id || resumeCheckedBooksRef.current.has(bookId)) return;
    resumeCheckedBooksRef.current.add(bookId);
    let saved = NaN;
    try { saved = Number(JSON.parse(localStorage.getItem('audiobook_playback_positions') || '{}')[bookId]); } catch {}
    if (!isFinite(saved) || saved <= 1) return;
    const now = pendingSeekRef.current ?? (audio.readyState >= 1 ? audio.currentTime : currentTimeRef.current);
    if (saved - now < 3) return;
    diag('garantia-retomada', { livro: bookId, salvo: saved, agora: now });
    setCurrentTime(saved);
    pendingSeekRef.current = saved;
    applyPendingSeek(audio, 'primeiro-play');
  };

  // Play dado pela pessoa: as tentativas de recuperar o áudio recomeçam
  useEffect(() => {
    if (isPlaying && latestBookIdRef.current) audioRecoveryTriesRef.current.delete(latestBookIdRef.current);
  }, [isPlaying]);

  // Sincronização de Play/Pause com o elemento HTML5 Audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioSrc) return;

    diag(isPlaying ? 'play' : 'pausou', { livro: currentBook?.id, audio: audio.currentTime, estado: currentTimeRef.current, pendente: pendingSeekRef.current, ready: audio.readyState });
    if (isPlaying) firstTimeUpdatesRef.current = 0;
    if (isPlaying) {
      // Pulo feito com o áudio parado: a conferência conta a partir de agora
      if (seekVerifyRef.current) seekVerifyRef.current.at = Date.now();
      // Áudio descartado pelo sistema enquanto estava pausado: recarrega em vez de ficar sem tocar
      // (logo depois de definir o arquivo o elemento ainda informa "sem fonte": isso não conta)
      if (audio.error || (audio.networkState === 3 && Date.now() - lastSrcSetAtRef.current > 3000)) {
        recoverAudio('play-sem-audio');
        return;
      }
      ensureResumePosition(audio);
      setupWebAudioGraph();
      // ("interrupted" é o estado do iOS depois de uma ligação ou de outro app tocar som)
      if (audioContextRef.current && audioContextRef.current.state !== 'running') {
        audioContextRef.current.resume().catch(() => {});
      }
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn('Autoplay impedido ou falhou:', e);
            diag('play-falhou', { erro: e?.name, ready: audio.readyState });
            if (e?.name === 'AbortError') return;
            // Sem permissão do sistema: a tela volta a mostrar pausado (o próximo toque toca)
            if (e?.name === 'NotAllowedError') setIsPlaying(false);
            else recoverAudio('play-falhou');
          });
        }
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
      // O tempo do app anda de segundo em segundo: ao pausar, fica no ponto exato (a letra não volta)
      if (audio.readyState >= 1 && pendingSeekRef.current === null && !seekVerifyRef.current) setCurrentTime(audio.currentTime);
    }
  }, [isPlaying, currentAudioSrc]);

  // Sincronização de Volume e Mudo
  useEffect(() => {
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
    try { localStorage.setItem(VOLUME_KEY, String(volume)); } catch {}
    const level = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    // Com o processamento de áudio ativo, o volume é aplicado nele (funciona também no iPhone)
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(level, audioContextRef.current.currentTime, 0.02);
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = gainNodeRef.current ? 1 : level;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  // Sincronização da velocidade de reprodução
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      // A padrão também: ao carregar um arquivo, o elemento volta para ela (a tela dizia 1,5x e tocava em 1x)
      audio.defaultPlaybackRate = playbackSpeed;
      audio.playbackRate = playbackSpeed;
    } catch (e) {
      console.warn('Erro ao definir taxa de reprodução:', e);
    }
  }, [playbackSpeed]);

  // Handler de atualização contínua do tempo de reprodução real do áudio
  const lastRenderedTimeRef = useRef(0);
  const firstTimeUpdatesRef = useRef(0);
  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Enquanto a posição salva ainda não foi aplicada (ou o arquivo ainda não carregou), o áudio informa 0:
    // ignora, senão a tela voltava ao capítulo 1 e o 0 era gravado por cima de onde a pessoa parou
    if (audio.readyState < 1) return;
    if (applyPendingSeek(audio, 'timeupdate')) return;
    if (verifySeek(audio, 'timeupdate')) return;
    if (firstTimeUpdatesRef.current < 3) {
      firstTimeUpdatesRef.current += 1;
      diag('tempo', { audio: audio.currentTime, estado: currentTimeRef.current, tocando: !audio.paused });
    }

    const currentSec = audio.currentTime;
    // Desempenho: a tela (todo o app) só re-renderiza quando o segundo exibido muda (~1x/s em vez de ~4x/s).
    // A letra tem o próprio relógio (useLyricClock).
    const lastRendered = lastRenderedTimeRef.current;
    if (Math.floor(currentSec) !== Math.floor(lastRendered) || Math.abs(currentSec - lastRendered) >= 0.9) {
      lastRenderedTimeRef.current = currentSec;
      setCurrentTime(currentSec);
    }

    // Persistência com debounce/throttle inteligente (elimina gravação síncrona a cada 250ms)
    if (currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
      savePlaybackPosition(currentSec, currentBook.id, false);
    }

    // Se o áudio em reprodução naturalmente alcançar o ponto de onde o usuário havia saltado, dispensa o botão
    if (playbackReturnPoint && currentBook?.id === playbackReturnPoint.bookId) {
      if (Math.abs(currentSec - playbackReturnPoint.globalTime) < 1.2 && Math.abs(currentSec - playbackReturnPoint.transportedToTime) > 3) {
        setPlaybackReturnPoint(null);
      }
    }

    if (isPlaying && currentBook) {
      const prevTime = lastTrackedAudioTimeRef.current;
      const delta = currentSec - prevTime;
      if (delta > 0 && delta < 2.5) {
        accrueListeningSeconds(currentBook, delta);
      }
      lastTrackedAudioTimeRef.current = currentSec;
      checkChapterFinished(currentBook.id, currentSec);
    }

    updateMediaSessionPosition(currentSec, totalDuration, playbackSpeed, false);

    // Sleep Timer: Fim do capítulo
    const chapEnd = (currentChapter?.startTime || 0) + (currentChapter?.duration || 0);
    if (sleepTimerMode === 'end-of-chapter' && !isSleepTimerPaused && chapEnd > 0 && currentSec >= chapEnd) {
      setIsPlaying(false);
      audio.pause();
      savePlaybackPosition(currentSec, currentBook?.id || '', true);
      setSleepTimerMode(null);
      setSleepTimerRemaining(null);
      setIsSleepTimerPaused(false);
      showToast(t('toast_sleep_timer_chapter_finished'));
      return;
    }

    // Se capítulos tiverem URLs distintas
    if (currentChapter?.audioUrl && currentChapter.audioUrl !== currentBook?.audioUrl && chapEnd > 0 && currentSec >= chapEnd) {
      if (currentChapterIndex < (currentBook?.chapters?.length || 0) - 1) {
        const nextChap = currentBook.chapters[currentChapterIndex + 1];
        handleSeek(nextChap.startTime);
      }
    }
  };

  const applyPendingSeek = (audio: HTMLAudioElement, reason: string): boolean => {
    const target = pendingSeekRef.current;
    if (target === null || audio.readyState < 1) return false;
    const dur = audio.duration;
    const t = isFinite(dur) && dur > 0 ? Math.min(target, Math.max(0, dur - 1)) : target;
    try {
      audio.currentTime = t;
    } catch (err) {
      diag('seek-erro', { reason, target: t, msg: String(err) });
      return false;
    }
    pendingSeekRef.current = null;
    seekVerifyRef.current = { target: t, at: Date.now(), tries: 0, lastTry: 0 };
    diag('seek', { reason, target: t, agora: audio.currentTime, ready: audio.readyState, dur });
    return true;
  };
  // true = ainda corrigindo (ignora o tempo informado pelo áudio nesse momento)
  const verifySeek = (audio: HTMLAudioElement, reason: string): boolean => {
    const v = seekVerifyRef.current;
    if (!v) return false;
    const now = Date.now();
    if (!audio.paused && now - v.at > 20000) { seekVerifyRef.current = null; return false; }
    if (audio.readyState < 1 || audio.seeking) return true;
    // Onde o áudio pode estar: no ponto pedido ou à frente dele, conforme o tempo que passou tocando
    const walked = audio.paused ? 0 : ((now - v.at) / 1000) * (audio.playbackRate || 1);
    if (audio.currentTime >= v.target - 3 && audio.currentTime <= v.target + walked + 5) {
      if (!audio.paused && audio.currentTime >= v.target + 1.5) {
        diag('seek-ok', { reason, agora: audio.currentTime, target: v.target, tentativas: v.tries });
        seekVerifyRef.current = null;
      }
      return false;
    }
    if (now - v.lastTry < 400) return true;
    if (v.tries >= 10) {
      diag('seek-falhou', { reason, agora: audio.currentTime, target: v.target, ready: audio.readyState, seekable: audio.seekable.length ? audio.seekable.end(audio.seekable.length - 1) : 0 });
      seekVerifyRef.current = null;
      return false;
    }
    v.tries += 1;
    v.lastTry = now;
    try { audio.currentTime = v.target; } catch { /* tenta de novo no próximo evento */ }
    diag('seek-repetido', { reason, tentativa: v.tries, agora: audio.currentTime, target: v.target, ready: audio.readyState });
    return true;
  };

  // Posição atual de verdade. Enquanto o áudio ainda carrega (ao abrir o app, ao trocar de livro) o elemento
  // de áudio está em 0: usa a posição restaurada/pendente, para não gravar 0 por cima de onde parou (era o
  // que fazia o play voltar ao primeiro capítulo depois de abrir o app)
  const getLivePlaybackTime = useCallback(() => {
    if (pendingSeekRef.current !== null) return pendingSeekRef.current;
    const a = audioRef.current;
    // Pulo ainda não confirmado e o áudio fora do ponto: vale o ponto pedido (não grava o tempo errado)
    const v = seekVerifyRef.current;
    if (v && a && Math.abs(a.currentTime - v.target) > 3 && (a.paused || a.currentTime < v.target)) return v.target;
    if (a && a.currentSrc && a.readyState >= 1) return a.currentTime;
    return currentTimeRef.current;
  }, []);

  // Tela bloqueada e Central de Controle: posição e velocidade sempre iguais às do app
  useEffect(() => {
    updateMediaSessionPosition(getLivePlaybackTime(), totalDuration, playbackSpeed, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playbackSpeed, totalDuration]);

  // Salva posição imediatamente ao pausar ou ao fechar a janela
  useEffect(() => {
    if (!isPlaying && currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
      savePlaybackPosition(getLivePlaybackTime(), currentBook.id, true);
    }
  }, [isPlaying, currentBook?.id, savePlaybackPosition, getLivePlaybackTime]);

  useEffect(() => {
    // Só salva a posição: sair do app (ou trocar de app no celular) não interrompe o áudio
    const handleUnload = () => {
      if (currentBook?.id && currentBook.id !== EMPTY_BOOK.id) {
        savePlaybackPosition(getLivePlaybackTime(), currentBook.id, true);
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleUnload();
      // Ao voltar, retoma o processamento de áudio se o sistema o suspendeu
      else if (audioContextRef.current && audioContextRef.current.state !== 'running' && audioRef.current && !audioRef.current.paused) {
        audioContextRef.current.resume().catch(() => {});
      } else if (audioRef.current?.error) {
        // Áudio descartado com o app em segundo plano: já deixa pronto para tocar
        recoverAudioRef.current('voltou-ao-app');
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentBook?.id, savePlaybackPosition, getLivePlaybackTime]);

  // Ao encerrar o app o áudio para (ir para outro app não encerra: o áudio segue em segundo plano)
  useEffect(() => {
    const stop = () => { audioRef.current?.pause(); };
    window.addEventListener('pagehide', stop);
    return () => window.removeEventListener('pagehide', stop);
  }, []);

  // Handler para quando a faixa de áudio termina
  recoverAudioRef.current = recoverAudio;
  const handleAudioEnded = () => {
    if (currentBook && currentChapter) markChapterCompleted(currentBook.id, currentChapter.id);
    if (playbackQueue.length > 0) {
      const nextItem = playbackQueue[0];
      setPlaybackQueue(prev => prev.slice(1));
      beginBookSwitch(nextItem.book);
      setCurrentBook(nextItem.book);
      setSelectedBook(nextItem.book);
      handleSeek(nextItem.startTime);
      setIsPlaying(true);
    } else if (currentChapterIndex < (currentBook?.chapters?.length || 0) - 1) {
      const nextChap = currentBook.chapters[currentChapterIndex + 1];
      handleSeek(nextChap.startTime);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      handleSeek(0);
    }
  };

  // Livros cujo áudio já foi procurado de novo sem sucesso (não fica procurando sem parar)
  const missingAudioRetryRef = useRef<Set<string>>(new Set());
  // Fallback demo timer: roda apenas quando o audiobook NÃO possui áudio real carregado nem no IndexedDB
  useEffect(() => {
    if (!isPlaying || currentAudioSrc || isAudioLoading || (currentBook && storedAudioBlobKeysRef.current.has(currentBook.id))) return;
    // Audiobook de verdade sem o arquivo carregado: nunca finge que toca (o tempo e a letra andavam sem som).
    // No site e no app do celular o "caminho do arquivo" é só um nome; o áudio fica guardado no aparelho:
    // procura de novo uma vez e, se não houver, avisa e pausa
    if (currentBook && !isTestBookId(currentBook.id) && (!currentBook.filePath || !desktop)) {
      if (!missingAudioRetryRef.current.has(currentBook.id)) {
        missingAudioRetryRef.current.add(currentBook.id);
        diag('procura-audio', { livro: currentBook.id });
        loadAudioForBook(currentBook.id, true);
        return;
      }
      const timer = setTimeout(() => {
        diag('sem-audio', { livro: currentBook.id });
        setIsPlaying(false);
        showToast(t('toast_audio_missing'));
      }, 2500);
      return () => clearTimeout(timer);
    }

    const timer = setInterval(() => {
      if (currentBook) {
        accrueListeningSeconds(currentBook, 1);
      }
      setCurrentTime(prevTime => {
        const chapEnd = (currentChapter?.startTime || 0) + (currentChapter?.duration || 0);
        const nextTime = prevTime + 1;

        if (sleepTimerMode === 'end-of-chapter' && !isSleepTimerPaused && chapEnd > 0 && nextTime >= chapEnd) {
          setIsPlaying(false);
          setSleepTimerMode(null);
          setSleepTimerRemaining(null);
          setIsSleepTimerPaused(false);
          showToast(t('toast_sleep_timer_chapter_finished'));
          return chapEnd;
        }

        if (chapEnd > 0 && nextTime >= chapEnd) {
          if (currentBook && currentChapter) markChapterCompleted(currentBook.id, currentChapter.id);
          if (playbackQueue.length > 0) {
            const nextItem = playbackQueue[0];
            setPlaybackQueue(prev => prev.slice(1));
            beginBookSwitch(nextItem.book);
            setCurrentBook(nextItem.book);
            setSelectedBook(nextItem.book);
            return nextItem.startTime;
          } else if (currentChapterIndex < (currentBook?.chapters?.length || 0) - 1) {
            return currentBook.chapters[currentChapterIndex + 1].startTime;
          } else {
            setIsPlaying(false);
            return 0;
          }
        }

        return nextTime >= totalDuration ? 0 : nextTime;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, currentAudioSrc, playbackSpeed, sleepTimerMode, isSleepTimerPaused, currentChapter, totalDuration, playbackQueue, currentChapterIndex, currentBook, t]);

  // Contagem do Sleep Timer por duração configurada
  useEffect(() => {
    if (!isPlaying || sleepTimerMode !== 'duration' || sleepTimerRemaining === null || isSleepTimerPaused) {
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerRemaining(r => {
        if (r === null) return null;
        if (r <= 1) {
          setIsPlaying(false);
          setSleepTimerMode(null);
          setIsSleepTimerPaused(false);
          showToast(t('toast_sleep_timer_ended'));
          return null;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, sleepTimerMode, sleepTimerRemaining, isSleepTimerPaused, t]);

  const handleSelectBookDetail = (book: Audiobook) => {
    pendingChapterScrollRef.current = false;
    targetScrollChapterIdRef.current = null;
    setSelectedBook(book);
    navigateTo('book-detail', book);
  };

  // Posição salva de um audiobook (onde parou), se houver e se ainda não tiver chegado ao fim
  const getResumeTime = (book: Audiobook): number | null => {
    if (!resumePlayback) return null;
    try {
      const saved = Number(JSON.parse(localStorage.getItem('audiobook_playback_positions') || '{}')[book.id]);
      const total = (book.chapters || []).reduce((acc, c) => acc + (c.duration || 0), 0);
      if (!isFinite(saved) || saved <= 1) return null;
      if (total > 0 && saved >= total - 5) return null;
      return saved;
    } catch {
      return null;
    }
  };

  // Tocar um audiobook. Com um capítulo escolhido, começa nele; sem capítulo (botão "Ouvir", play do card),
  // continua de onde parou: o livro atual só retoma (ou pausa) e outro livro volta à posição salva dele
  const handlePlayBookFromStart = (book: Audiobook, chapterIndex = -1) => {
    // Conteúdo explícito bloqueado em Ajustes: não toca
    if (isExplicitBlocked(book)) { showToast(t('toast_explicit_blocked', { title: book.title })); return; }
    if (chapterIndex >= 0) resumeCheckedBooksRef.current.add(book.id); // capítulo escolhido pela pessoa
    if (chapterIndex < 0 && currentBook?.id === book.id && book.id !== EMPTY_BOOK.id) {
      if (isPlaying) {
        setIsPlaying(false);
      } else {
        recordPlaySession(book);
        setSelectedBook(book);
        setIsPlaying(true);
      }
      return;
    }
    recordPlaySession(book);
    // Capítulo escolhido: continua de onde parou nele (se já tiver sido ouvido em parte)
    const chosenChapter = chapterIndex >= 0 ? book.chapters?.[chapterIndex] : undefined;
    const chapterElapsed = chosenChapter ? getChapterResumeElapsed(book.id, chosenChapter) : null;
    const resumeTime = chapterIndex < 0
      ? getResumeTime(book)
      : (chapterElapsed !== null ? (chosenChapter!.startTime || 0) + chapterElapsed : null);
    // Antes de pular para outro capítulo do mesmo livro, guarda onde parou no atual
    if (currentBook?.id === book.id && book.id !== EMPTY_BOOK.id) {
      savePlaybackPosition(getLivePlaybackTime(), book.id, true);
    }
    const resumeIdx = resumeTime !== null
      ? Math.max(0, (book.chapters || []).findIndex((chap, i) => {
          const next = book.chapters[i + 1];
          return resumeTime >= chap.startTime && (!next || resumeTime < next.startTime);
        }))
      : 0;
    const targetIdx = chapterIndex >= 0 ? chapterIndex : resumeIdx;
    const isSameBook = currentBook.id === book.id;
    const isSameChapter = isSameBook && currentChapter.id === (book.chapters?.[targetIdx]?.id || 1);
    
    if (isSameBook && isPlaying && isSameChapter) {
      setIsPlaying(false);
    } else {
      if (currentBook && currentBook.id !== EMPTY_BOOK.id && (!isSameBook || !isSameChapter)) {
        const prevElapsed = currentChapter
          ? Math.max(0, currentTime - currentChapter.startTime)
          : 0;
        const targetChapter = book.chapters?.[targetIdx] || { id: 1, startTime: 0 };
        const targetGlobalTime = resumeTime ?? (targetChapter.startTime || 0);

        if (!isSameBook || Math.abs(currentTime - targetGlobalTime) > 3) {
          setPlaybackReturnPoint({
            bookId: currentBook.id,
            chapterId: currentChapter?.id || 1,
            chapterIndex: currentChapterIndex >= 0 ? currentChapterIndex : 0,
            chapterElapsed: prevElapsed,
            globalTime: currentTime,
            transportedToTime: targetGlobalTime,
            transportedToChapterId: targetChapter.id,
            createdAt: Date.now(),
          });
        }
      }

      const targetTime = resumeTime ?? (book.chapters?.[targetIdx]?.startTime || 0);
      const switchingBook = !currentBook || currentBook.id !== book.id;
      if (switchingBook) {
        // Guarda onde o livro anterior parou ANTES de trocar; o salto para o livro novo não pode ser gravado
        // no anterior (era isso que fazia o livro voltar sempre ao início)
        beginBookSwitch(book);
        setCurrentBook(book);
        setSelectedBook(book);
        setCurrentTime(targetTime);
        lastTrackedAudioTimeRef.current = targetTime;
        pendingSeekRef.current = targetTime;
        savePlaybackPosition(targetTime, book.id, true);
      } else {
        setSelectedBook(book);
        handleSeek(targetTime);
      }
      setIsPlaying(true);
      if (book.chapters?.[targetIdx]) {
        const startedId = `${book.id}-${book.chapters[targetIdx].id}`;
        setStartedChapters(prev => prev.includes(startedId) ? prev : [...prev, startedId]);
      }

      // Auto-queue all subsequent chapters of this book in order
      const subsequent: QueueItem[] = [];
      const shown = visibleChapters(book.chapters, showExtraChapters);
      for (let idx = targetIdx + 1; idx < (book.chapters?.length || 0); idx++) {
        if (shown.includes(book.chapters[idx])) subsequent.push(createQueueItem(book, book.chapters[idx], idx));
      }
      setPlaybackQueue(subsequent);
    }
  };
  return { applyPendingSeek, getLivePlaybackTime, handleAddBookToQueue, handleAddChapterToQueue, handleAddToQueue, handleAudioEnded, handleAudioTimeUpdate, handlePlayBookFromStart, handleSelectBookDetail, handleUploadTranscriptForEditBook, handleUploadTranscriptForPlayerBook, reconcileBookDuration, recoverAudio, resumeCheckedBooksRef, verifySeek };
}
