import type { Chapter, TranscriptLine, TranscriptWord } from '../data/catalog';

// ==========================================
// 4. TRANSCRIPT SEARCH & SYNCHRONIZATION (O(1) / O(log N))
// ==========================================
export function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) secs = 0;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatCountdown(secs: number): string {
  const total = Math.max(0, Math.floor(isNaN(secs) ? 0 : secs));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function calculateChapterTiming(
  currentTime: number,
  chapter?: { startTime: number; duration: number }
): { chapterElapsed: number; chapterRemaining: number; progressPercent: number } {
  if (!chapter) {
    return { chapterElapsed: 0, chapterRemaining: 0, progressPercent: 0 };
  }
  const start = Math.max(0, chapter.startTime || 0);
  const duration = Math.max(0, chapter.duration || 0);
  const chapterElapsed = Math.max(0, currentTime - start);
  const chapterRemaining = Math.max(0, duration - chapterElapsed);
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (chapterElapsed / duration) * 100)) : 0;
  return { chapterElapsed, chapterRemaining, progressPercent };
}

export function findChapterAtTime(chapters: Chapter[], currentTime: number): Chapter | undefined {
  if (!chapters || chapters.length === 0) return undefined;
  for (let i = chapters.length - 1; i >= 0; i--) {
    const ch = chapters[i];
    if (currentTime >= ch.startTime) {
      return ch;
    }
  }
  return chapters[0];
}

export function findActiveWordIndex(words: TranscriptWord[] | undefined, time: number): number {
  if (!words || words.length === 0) return -1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (time >= w.start && time <= w.end) {
      return i;
    }
  }
  return -1;
}

export function findActiveTranscriptIndex(
  transcript: TranscriptLine[] | undefined,
  time: number,
  lastIndex: number = -1
): number {
  if (!transcript || transcript.length === 0) return -1;
  const len = transcript.length;

  // 1. Verificação incremental rápida em O(1)
  if (lastIndex >= 0 && lastIndex < len) {
    const cur = transcript[lastIndex];
    if (time >= cur.start && time <= cur.end) {
      return lastIndex;
    }
    if (lastIndex + 1 < len) {
      const next = transcript[lastIndex + 1];
      if (time >= next.start && time <= next.end) {
        return lastIndex + 1;
      }
    }
  }

  // 2. Busca binária precisa em O(log N)
  let low = 0;
  let high = len - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const line = transcript[mid];

    if (time >= line.start && time <= line.end) {
      return mid;
    } else if (time < line.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Se estiver em gap curto entre frases, mantém a linha recém-concluída
  if (high >= 0 && high < len && time > transcript[high].end && (high === len - 1 || time < transcript[high + 1].start)) {
    return high;
  }

  return -1;
}
