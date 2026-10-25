import { describe, it, expect } from 'vitest';
import {
  createQueueItem,
  enqueueItem,
  enqueueMultipleItems,
  dequeueNext,
  removeItemFromQueue,
  reorderQueue,
  cleanQueueDeletedBooks,
  QueueItem,
} from '../queueUtils';
import { Audiobook, Chapter } from '../data';

describe('Playback Queue Management', () => {
  const mockBook1: Audiobook = {
    id: 'book-1',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    authorId: 'a1',
    narrator: 'Narrador Exemplo',
    cover: 'cover-1.jpg',
    category: 'Ficção',
    durationEst: '1h 00m',
    sizeStr: '45 MB',
    year: '1899',
    chapters: [],
    transcript: [],
  };

  const mockBook2: Audiobook = {
    id: 'book-2',
    title: 'Memórias Póstumas',
    author: 'Machado de Assis',
    authorId: 'a1',
    narrator: 'Narrador Exemplo',
    cover: 'cover-2.jpg',
    category: 'Ficção',
    durationEst: '1h 30m',
    sizeStr: '65 MB',
    year: '1881',
    chapters: [],
    transcript: [],
  };

  const mockChapter1: Chapter = {
    id: 1,
    title: 'Capítulo I - Do Título',
    startTime: 0,
    duration: 300,
  };

  const mockChapter2: Chapter = {
    id: 2,
    title: 'Capítulo II - Do Livro',
    startTime: 300,
    duration: 450,
  };

  it('createQueueItem builds a valid QueueItem with accurate references', () => {
    const item = createQueueItem(mockBook1, mockChapter1, 0);
    expect(item.bookId).toBe('book-1');
    expect(item.bookTitle).toBe('Dom Casmurro');
    expect(item.chapterId).toBe(1);
    expect(item.chapterTitle).toBe('Capítulo I - Do Título');
    expect(item.chapterIndex).toBe(0);
    expect(item.duration).toBe(300);
    expect(item.id).toBeDefined();
    expect(item.id.length).toBeGreaterThan(0);
  });

  describe('enqueueItem and enqueueMultipleItems', () => {
    it('appends item to the end of queue by default', () => {
      const item1 = createQueueItem(mockBook1, mockChapter1, 0);
      const item2 = createQueueItem(mockBook1, mockChapter2, 1);

      let queue: QueueItem[] = [];
      queue = enqueueItem(queue, item1, 'end');
      queue = enqueueItem(queue, item2, 'end');

      expect(queue.length).toBe(2);
      expect(queue[0].chapterId).toBe(1);
      expect(queue[1].chapterId).toBe(2);
    });

    it('prepends item when position is "next"', () => {
      const item1 = createQueueItem(mockBook1, mockChapter1, 0);
      const item2 = createQueueItem(mockBook1, mockChapter2, 1);
      const priorityItem = createQueueItem(mockBook2, mockChapter1, 0);

      let queue: QueueItem[] = [item1, item2];
      queue = enqueueItem(queue, priorityItem, 'next');

      expect(queue.length).toBe(3);
      expect(queue[0].bookId).toBe('book-2');
      expect(queue[1].chapterId).toBe(1);
      expect(queue[2].chapterId).toBe(2);
    });

    it('enqueues multiple items maintaining order', () => {
      const item1 = createQueueItem(mockBook1, mockChapter1, 0);
      const item2 = createQueueItem(mockBook1, mockChapter2, 1);

      const queue = enqueueMultipleItems([], [item1, item2], 'end');
      expect(queue.length).toBe(2);
      expect(queue[0].chapterId).toBe(1);
      expect(queue[1].chapterId).toBe(2);
    });
  });

  describe('dequeueNext', () => {
    it('returns null and empty array when queue is empty', () => {
      const result = dequeueNext([]);
      expect(result.nextItem).toBeNull();
      expect(result.remainingQueue).toEqual([]);
    });

    it('returns the first item and the remaining queue', () => {
      const item1 = createQueueItem(mockBook1, mockChapter1, 0);
      const item2 = createQueueItem(mockBook1, mockChapter2, 1);

      const result = dequeueNext([item1, item2]);
      expect(result.nextItem?.chapterId).toBe(1);
      expect(result.remainingQueue.length).toBe(1);
      expect(result.remainingQueue[0].chapterId).toBe(2);
    });
  });

  describe('removeItemFromQueue', () => {
    it('removes target item by id without mutating other elements', () => {
      const item1 = createQueueItem(mockBook1, mockChapter1, 0);
      const item2 = createQueueItem(mockBook1, mockChapter2, 1);

      const queue = [item1, item2];
      const filtered = removeItemFromQueue(queue, item1.id);

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(item2.id);
    });

    it('returns same elements if itemId is not found', () => {
      const item1 = createQueueItem(mockBook1, mockChapter1, 0);
      const filtered = removeItemFromQueue([item1], 'non-existent-id');
      expect(filtered.length).toBe(1);
    });
  });

  describe('reorderQueue', () => {
    it('moves item from source to target index', () => {
      const item1 = { ...createQueueItem(mockBook1, mockChapter1, 0), id: 'q-1' };
      const item2 = { ...createQueueItem(mockBook1, mockChapter2, 1), id: 'q-2' };
      const item3 = { ...createQueueItem(mockBook2, mockChapter1, 0), id: 'q-3' };

      const queue = [item1, item2, item3];
      // Move item at index 0 ('q-1') to index 2
      const reordered = reorderQueue(queue, 0, 2);

      expect(reordered.map((i) => i.id)).toEqual(['q-2', 'q-3', 'q-1']);
    });

    it('returns original queue if fromIndex is identical to toIndex', () => {
      const item1 = { ...createQueueItem(mockBook1, mockChapter1, 0), id: 'q-1' };
      const queue = [item1];
      expect(reorderQueue(queue, 0, 0)).toBe(queue);
    });
  });

  describe('cleanQueueDeletedBooks', () => {
    it('removes all items matching deleted book ids', () => {
      const item1 = createQueueItem(mockBook1, mockChapter1, 0);
      const item2 = createQueueItem(mockBook2, mockChapter1, 0);
      const item3 = createQueueItem(mockBook1, mockChapter2, 1);

      const queue = [item1, item2, item3];
      const cleaned = cleanQueueDeletedBooks(queue, ['book-1']);

      expect(cleaned.length).toBe(1);
      expect(cleaned[0].bookId).toBe('book-2');
    });

    it('handles empty deletion lists safely', () => {
      const item1 = createQueueItem(mockBook1, mockChapter1, 0);
      expect(cleanQueueDeletedBooks([item1], [])).toEqual([item1]);
    });
  });
});
