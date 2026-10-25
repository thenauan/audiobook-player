import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('1.1 & 1.2 Memory Sanitization & LRU Blob Cache', () => {
  let revokeObjectURLSpy: any;
  let createObjectURLSpy: any;

  beforeEach(() => {
    revokeObjectURLSpy = vi.fn();
    createObjectURLSpy = vi.fn((_blob: Blob) => `blob:http://localhost/${Math.random().toString(36).substring(2, 9)}`);

    global.URL.revokeObjectURL = revokeObjectURLSpy;
    global.URL.createObjectURL = createObjectURLSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('revokes previous object URL when replacing an audio file', () => {
    const audioUrls = new Map<string, string>();
    const bookId = 'book-123';

    // 1. Initial assignment
    const url1 = URL.createObjectURL(new Blob(['audio1']));
    audioUrls.set(bookId, url1);
    expect(audioUrls.get(bookId)).toBe(url1);

    // 2. Replacement with new file
    const prevUrl = audioUrls.get(bookId);
    if (prevUrl && prevUrl.startsWith('blob:')) {
      URL.revokeObjectURL(prevUrl);
    }
    const url2 = URL.createObjectURL(new Blob(['audio2']));
    audioUrls.set(bookId, url2);

    expect(revokeObjectURLSpy).toHaveBeenCalledWith(url1);
    expect(audioUrls.get(bookId)).toBe(url2);
  });

  it('revokes object URL when a book is deleted', () => {
    const audioUrls = new Map<string, string>();
    const bookId = 'book-to-delete';
    const url = URL.createObjectURL(new Blob(['audio-content']));
    audioUrls.set(bookId, url);

    // Deletion routine
    const urlToRevoke = audioUrls.get(bookId);
    if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRevoke);
    }
    audioUrls.delete(bookId);

    expect(revokeObjectURLSpy).toHaveBeenCalledWith(url);
    expect(audioUrls.has(bookId)).toBe(false);
  });

  it('enforces LRU cache by revoking unneeded audio blobs (keeps only current book and queue)', () => {
    const audioUrls = new Map<string, string>();
    const urlA = URL.createObjectURL(new Blob(['A']));
    const urlB = URL.createObjectURL(new Blob(['B']));
    const urlC = URL.createObjectURL(new Blob(['C']));

    audioUrls.set('book-A', urlA);
    audioUrls.set('book-B', urlB);
    audioUrls.set('book-C', urlC);

    // Currently playing Book B, next in queue is Book C -> Book A must be evicted and revoked
    const keepIds = new Set<string>(['book-B', 'book-C']);

    for (const [id, url] of audioUrls.entries()) {
      if (!keepIds.has(id)) {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
        audioUrls.delete(id);
      }
    }

    expect(revokeObjectURLSpy).toHaveBeenCalledWith(urlA);
    expect(audioUrls.has('book-A')).toBe(false);
    expect(audioUrls.has('book-B')).toBe(true);
    expect(audioUrls.has('book-C')).toBe(true);
  });

  it('revokes all active blob URLs on cleanup/unload', () => {
    const audioUrls = new Map<string, string>();
    const url1 = URL.createObjectURL(new Blob(['1']));
    const url2 = URL.createObjectURL(new Blob(['2']));
    audioUrls.set('b1', url1);
    audioUrls.set('b2', url2);

    // Unload routine
    audioUrls.forEach((url) => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    audioUrls.clear();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith(url1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(url2);
    expect(audioUrls.size).toBe(0);
  });
});

describe('1.3 Throttled Timeupdate & Synchronous Exit Persistence', () => {
  let localStorageMock: Record<string, string>;
  let setItemSpy: any;

  beforeEach(() => {
    localStorageMock = {};
    setItemSpy = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: setItemSpy,
        removeItem: vi.fn((key: string) => delete localStorageMock[key]),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createPlaybackThrottler() {
    let lastSavedTime = 0;
    let lastSavedBookId: string | null = null;

    return (time: number, bookId: string, force = false) => {
      const nowSec = Math.floor(time);
      if (force || Math.abs(nowSec - lastSavedTime) >= 3 || lastSavedBookId !== bookId) {
        lastSavedTime = nowSec;
        lastSavedBookId = bookId;
        localStorage.setItem('app_last_played_time', String(time));
        localStorage.setItem('app_last_played_book_id', bookId);
        return true; // wrote to disk
      }
      return false; // throttled / skipped
    };
  }

  it('throttles rapid timeupdates to avoid blocking main thread', () => {
    const throttler = createPlaybackThrottler();

    // At 250ms intervals
    expect(throttler(0.25, 'book-1', false)).toBe(true);  // First write at 0s
    expect(throttler(0.50, 'book-1', false)).toBe(false); // Throttled
    expect(throttler(0.75, 'book-1', false)).toBe(false); // Throttled
    expect(throttler(1.00, 'book-1', false)).toBe(false); // Throttled
    expect(throttler(2.50, 'book-1', false)).toBe(false); // Throttled (< 3s)
    expect(throttler(3.10, 'book-1', false)).toBe(true);  // >= 3s, writes to disk!

    // Verify localStorage was written exactly twice, not 6 times
    expect(setItemSpy).toHaveBeenCalledTimes(4); // 2 keys * 2 writes
  });

  it('immediately writes when force is true (e.g. pause, seek, sleep timer, pagehide)', () => {
    const throttler = createPlaybackThrottler();

    throttler(10.0, 'book-1', false); // Initial write
    expect(setItemSpy).toHaveBeenCalledTimes(2);

    // User pauses or seeks 200ms later with force = true
    throttler(10.2, 'book-1', true);
    expect(setItemSpy).toHaveBeenCalledTimes(4);
    expect(localStorageMock['app_last_played_time']).toBe('10.2');
  });

  it('immediately writes when bookId changes regardless of elapsed time', () => {
    const throttler = createPlaybackThrottler();

    throttler(5.0, 'book-1', false);
    expect(setItemSpy).toHaveBeenCalledTimes(2);

    // Switch to another book immediately
    throttler(0.0, 'book-2', false);
    expect(setItemSpy).toHaveBeenCalledTimes(4);
    expect(localStorageMock['app_last_played_book_id']).toBe('book-2');
  });
});
