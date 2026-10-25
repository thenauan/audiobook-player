import { Audiobook, Chapter } from './data';

export type QueueItem = {
  id: string;
  bookId: string;
  bookTitle: string;
  author: string;
  cover: string;
  chapterId: number | string;
  chapterTitle: string;
  startTime: number;
  duration: number;
  chapterIndex: number;
  book: Audiobook;
};

/**
 * Creates a QueueItem from an Audiobook and Chapter
 */
export function createQueueItem(
  book: Audiobook,
  chapter: Chapter,
  chapterIndex: number
): QueueItem {
  return {
    id: `queue-${book.id}-${chapter.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    bookId: book.id,
    bookTitle: book.title,
    author: book.author,
    cover: book.cover,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    startTime: chapter.startTime,
    duration: chapter.duration,
    chapterIndex,
    book,
  };
}

/**
 * Adds an item to the playback queue at the specified position ('next' or 'end')
 */
export function enqueueItem(
  queue: QueueItem[],
  item: QueueItem,
  position: 'next' | 'end' = 'end'
): QueueItem[] {
  if (position === 'next') {
    return [item, ...queue];
  }
  return [...queue, item];
}

/**
 * Adds multiple items to the playback queue
 */
export function enqueueMultipleItems(
  queue: QueueItem[],
  items: QueueItem[],
  position: 'next' | 'end' = 'end'
): QueueItem[] {
  if (position === 'next') {
    return [...items, ...queue];
  }
  return [...queue, ...items];
}

/**
 * Dequeues the next item from the queue
 */
export function dequeueNext(queue: QueueItem[]): {
  nextItem: QueueItem | null;
  remainingQueue: QueueItem[];
} {
  if (!queue || queue.length === 0) {
    return { nextItem: null, remainingQueue: [] };
  }
  const [nextItem, ...remainingQueue] = queue;
  return { nextItem, remainingQueue };
}

/**
 * Removes an item from the queue by its queue ID
 */
export function removeItemFromQueue(queue: QueueItem[], itemId: string): QueueItem[] {
  if (!queue) return [];
  return queue.filter((item) => item.id !== itemId);
}

/**
 * Reorders an item in the queue from fromIndex to toIndex
 */
export function reorderQueue(
  queue: QueueItem[],
  fromIndex: number,
  toIndex: number
): QueueItem[] {
  if (!queue || fromIndex < 0 || fromIndex >= queue.length) return queue;
  const targetIndex = Math.max(0, Math.min(queue.length - 1, toIndex));
  if (fromIndex === targetIndex) return queue;

  const result = [...queue];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(targetIndex, 0, removed);
  return result;
}

/**
 * Filters out queue items for books that have been deleted
 */
export function cleanQueueDeletedBooks(
  queue: QueueItem[],
  deletedBookIds: string[]
): QueueItem[] {
  if (!queue || !deletedBookIds || deletedBookIds.length === 0) return queue;
  const set = new Set(deletedBookIds);
  return queue.filter((item) => !set.has(item.bookId) && !set.has(item.book?.id));
}

