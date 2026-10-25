import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Playback Return Point (Botão de Voltar para Onde Estava)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  interface PlaybackReturnPoint {
    bookId: string;
    chapterId: number | string;
    chapterIndex: number;
    chapterElapsed: number;
    globalTime: number;
    transportedToTime: number;
    transportedToChapterId: number | string;
    createdAt: number;
  }

  interface MockBook {
    id: string;
    title: string;
    chapters: { id: number | string; title: string; startTime: number; duration: number }[];
  }

  function createReturnPointManager() {
    let returnPoint: PlaybackReturnPoint | null = null;
    let timer: any = null;

    const setReturnPoint = (pt: PlaybackReturnPoint | null) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      returnPoint = pt;

      if (!pt) return;

      const elapsed = Date.now() - (pt.createdAt || Date.now());
      const remaining = Math.max(0, 30000 - elapsed);

      if (remaining === 0) {
        returnPoint = null;
        return;
      }

      timer = setTimeout(() => {
        returnPoint = null;
        timer = null;
      }, remaining);
    };

    const isVisible = () => {
      if (!returnPoint) return false;
      const isExpired = Date.now() - returnPoint.createdAt >= 30000;
      return !isExpired;
    };

    const getReturnButtonLabel = (
      currentBook: MockBook,
      currentChapterId: string | number,
      allBooks: MockBook[]
    ) => {
      if (!returnPoint) return '';

      const isSameBook = returnPoint.bookId === currentBook.id;
      const isSameChapter = isSameBook && returnPoint.chapterId === currentChapterId;

      if (!isSameBook) {
        // Volta para outro audiobook -> nome do audiobook
        const targetBook = allBooks.find(b => b.id === returnPoint!.bookId);
        return targetBook ? targetBook.title : 'Audiobook';
      }

      if (!isSameChapter) {
        // Volta para outro capítulo do mesmo audiobook -> número do capítulo e NÃO o tempo
        const targetChapIdx = (currentBook.chapters || []).findIndex(c => c.id === returnPoint!.chapterId);
        const chapNum = targetChapIdx >= 0 ? targetChapIdx + 1 : (returnPoint.chapterIndex + 1);
        return `Cap. ${chapNum}`;
      }

      // Mesmo capítulo -> tempo formatado
      const mins = Math.floor(returnPoint.chapterElapsed / 60);
      const secs = Math.floor(returnPoint.chapterElapsed % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const onAudioTimeUpdate = (currentSec: number, currentBookId: string) => {
      if (returnPoint && returnPoint.bookId === currentBookId) {
        if (
          Math.abs(currentSec - returnPoint.globalTime) < 1.2 &&
          Math.abs(currentSec - returnPoint.transportedToTime) > 3
        ) {
          setReturnPoint(null);
        }
      }
    };

    return {
      getPoint: () => returnPoint,
      setReturnPoint,
      isVisible,
      getReturnButtonLabel,
      onAudioTimeUpdate,
    };
  }

  const sampleBooks: MockBook[] = [
    {
      id: 'book-1',
      title: 'Duna',
      chapters: [
        { id: 101, title: 'Capítulo 1', startTime: 0, duration: 1000 },
        { id: 102, title: 'Capítulo 2', startTime: 1000, duration: 1500 },
        { id: 103, title: 'Capítulo 3', startTime: 2500, duration: 2000 },
      ],
    },
    {
      id: 'book-2',
      title: 'Dom Casmurro',
      chapters: [
        { id: 201, title: 'Capítulo 1', startTime: 0, duration: 800 },
        { id: 202, title: 'Capítulo 2', startTime: 800, duration: 1200 },
      ],
    },
  ];

  it('displays the return button when jump occurs and auto-dismisses after exactly 30 seconds', () => {
    const manager = createReturnPointManager();

    manager.setReturnPoint({
      bookId: 'book-1',
      chapterId: 101,
      chapterIndex: 0,
      chapterElapsed: 120,
      globalTime: 120,
      transportedToTime: 300,
      transportedToChapterId: 101,
      createdAt: Date.now(),
    });

    expect(manager.isVisible()).toBe(true);

    // After 15 seconds, button is still visible
    vi.advanceTimersByTime(15000);
    expect(manager.isVisible()).toBe(true);

    // After 29.9 seconds, button is still visible
    vi.advanceTimersByTime(14900);
    expect(manager.isVisible()).toBe(true);

    // At 30 seconds, timer fires and button disappears
    vi.advanceTimersByTime(100);
    expect(manager.getPoint()).toBeNull();
    expect(manager.isVisible()).toBe(false);
  });

  it('indicates chapter number (and not time) when returning to another chapter of the same audiobook', () => {
    const manager = createReturnPointManager();

    // Estava no Capítulo 2 (id: 102) a 50s, e pulou para o Capítulo 3 (id: 103)
    manager.setReturnPoint({
      bookId: 'book-1',
      chapterId: 102,
      chapterIndex: 1,
      chapterElapsed: 50,
      globalTime: 1050,
      transportedToTime: 2500,
      transportedToChapterId: 103,
      createdAt: Date.now(),
    });

    expect(manager.isVisible()).toBe(true);

    const label = manager.getReturnButtonLabel(sampleBooks[0], 103, sampleBooks);
    // Deve indicar o número do capítulo anterior e NÃO o tempo
    expect(label).toBe('Cap. 2');
    expect(label).not.toContain(':');
  });

  it('indicates the audiobook title when returning to a chapter of another audiobook', () => {
    const manager = createReturnPointManager();

    // Estava ouvindo "Duna" (book-1) e começou a ouvir "Dom Casmurro" (book-2)
    manager.setReturnPoint({
      bookId: 'book-1',
      chapterId: 101,
      chapterIndex: 0,
      chapterElapsed: 300,
      globalTime: 300,
      transportedToTime: 0,
      transportedToChapterId: 201,
      createdAt: Date.now(),
    });

    // Permanece visível mesmo tendo trocado de livro
    expect(manager.isVisible()).toBe(true);

    const label = manager.getReturnButtonLabel(sampleBooks[1], 201, sampleBooks);
    // Deve indicar o nome do audiobook anterior ("Duna")
    expect(label).toBe('Duna');
  });

  it('indicates the formatted time when returning within the same chapter', () => {
    const manager = createReturnPointManager();

    // Estava no Capítulo 1 (id: 101) a 125s (02:05) e arrastou a barra para 600s no mesmo capítulo
    manager.setReturnPoint({
      bookId: 'book-1',
      chapterId: 101,
      chapterIndex: 0,
      chapterElapsed: 125,
      globalTime: 125,
      transportedToTime: 600,
      transportedToChapterId: 101,
      createdAt: Date.now(),
    });

    expect(manager.isVisible()).toBe(true);

    const label = manager.getReturnButtonLabel(sampleBooks[0], 101, sampleBooks);
    expect(label).toBe('02:05');
  });

  it('auto-dismisses if playback naturally returns close to previous point', () => {
    const manager = createReturnPointManager();

    // User was at 100s, jumped back to 10s
    manager.setReturnPoint({
      bookId: 'book-1',
      chapterId: 101,
      chapterIndex: 0,
      chapterElapsed: 100,
      globalTime: 100,
      transportedToTime: 10,
      transportedToChapterId: 101,
      createdAt: Date.now(),
    });

    expect(manager.isVisible()).toBe(true);

    // User listens up to 95s
    manager.onAudioTimeUpdate(95, 'book-1');
    expect(manager.isVisible()).toBe(true);

    // User reaches 99.5s (within 1.2s of 100s)
    manager.onAudioTimeUpdate(99.5, 'book-1');
    expect(manager.getPoint()).toBeNull();
    expect(manager.isVisible()).toBe(false);
  });
});
