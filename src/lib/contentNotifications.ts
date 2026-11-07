// Sugestões de conteúdo: escolhe no máximo um aviso de cada vez e nunca repete o mesmo. Fica fora do App para poder ser
// testado com datas fixas.
import type { Audiobook } from '../data/catalog';

const DAY = 86400000;
const MIN_INTERVAL = 20 * 3600000;
const SENT_KEY = 'app_content_sent';
const LAST_KEY = 'app_content_last_at';
const WEEK_KEY = 'app_content_week';
const MAX_SENT = 200;

export type ContentSuggestion = { id: string; kind: 'resume' | 'forgotten' | 'author' | 'bookmark'; book: Audiobook; text?: string };

type SuggestionInput = {
  books: Audiobook[];
  lastPlayed: Record<string, number>;
  isStarted: (book: Audiobook) => boolean;
  isCompleted: (book: Audiobook) => boolean;
  now: number;
  sent: string[];
};

export function pickContentSuggestion({ books, lastPlayed, isStarted, isCompleted, now, sent }: SuggestionInput): ContentSuggestion | null {
  const age = (book: Audiobook) => now - (lastPlayed[book.id] || 0);
  const byRecent = (a: Audiobook, b: Audiobook) => (lastPlayed[b.id] || 0) - (lastPlayed[a.id] || 0);
  const fresh = (id: string) => !sent.includes(id);
  const unfinished = books.filter(b => lastPlayed[b.id] && isStarted(b) && !isCompleted(b)).sort(byRecent);

  const resume = unfinished.find(b => age(b) >= DAY && age(b) < 7 * DAY && fresh(`resume:${b.id}:${lastPlayed[b.id]}`));
  if (resume) return { id: `resume:${resume.id}:${lastPlayed[resume.id]}`, kind: 'resume', book: resume };

  const finished = books.filter(b => lastPlayed[b.id] && isCompleted(b)).sort(byRecent);
  for (const done of finished) {
    const next = books.find(b => b.id !== done.id && b.authorId === done.authorId && !isStarted(b) && !isCompleted(b) && fresh(`author:${b.id}`));
    if (next) return { id: `author:${next.id}`, kind: 'author', book: next };
  }

  // Relembra uma marcação de um livro que não foi ouvido nos últimos dias
  for (const book of [...books].sort(byRecent)) {
    if (!lastPlayed[book.id] || age(book) < 3 * DAY) continue;
    for (const chapter of book.chapters || []) {
      const mark = (chapter.bookmarks || []).find(m => fresh(`bookmark:${book.id}:${m.id}`));
      if (mark) return { id: `bookmark:${book.id}:${mark.id}`, kind: 'bookmark', book, text: (mark.text || chapter.title).slice(0, 80) };
    }
  }

  const forgotten = unfinished.find(b => age(b) >= 30 * DAY && fresh(`forgotten:${b.id}`));
  return forgotten ? { id: `forgotten:${forgotten.id}`, kind: 'forgotten', book: forgotten } : null;
}

// Marcos do livro ao ouvir: só contam quando o tempo cruza o ponto andando, não ao pular para lá
export function crossedBookMilestone(previous: number, current: number, total: number): 'half' | 'end' | null {
  if (total <= 0 || current <= previous) return null;
  const crossed = (mark: number) => previous < mark && current >= mark;
  if (total > 3600 && crossed(total - 1800)) return 'end';
  return crossed(total / 2) ? 'half' : null;
}

function readSent(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(SENT_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export const getSentSuggestions = readSent;

export function markSuggestionSent(id: string) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify([...readSent(), id].slice(-MAX_SENT)));
  } catch {}
}

export function canSendSuggestion(now: number) {
  try {
    return now - Number(localStorage.getItem(LAST_KEY) || 0) >= MIN_INTERVAL;
  } catch {
    return false;
  }
}

export function markSuggestionTime(now: number) {
  try {
    localStorage.setItem(LAST_KEY, String(now));
  } catch {}
}

// Resumo semanal: compara o total ouvido com o da semana anterior. Devolve os segundos da semana quando ela fechou
export function takeWeeklySeconds(totalSeconds: number, now: number): number | null {
  try {
    const saved = JSON.parse(localStorage.getItem(WEEK_KEY) || 'null') as { at: number; total: number } | null;
    if (!saved) {
      localStorage.setItem(WEEK_KEY, JSON.stringify({ at: now, total: totalSeconds }));
      return null;
    }
    if (now - saved.at < 7 * DAY) return null;
    localStorage.setItem(WEEK_KEY, JSON.stringify({ at: now, total: totalSeconds }));
    return Math.max(0, totalSeconds - saved.total);
  } catch {
    return null;
  }
}
