// Busca no texto sincronizado (tela da letra e "compartilhar trecho"): os resultados vêm em ordem de
// correspondência com o que foi digitado; com a mesma correspondência, do mais perto do início do audiobook
// para o mais longe. Um tempo digitado ("12:30", "1:02:05") traz a frase dita naquele momento.

export const foldSearch = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const WORD = /[\p{L}\p{N}]/u;
const isWordChar = (c: string | undefined) => !!c && WORD.test(c);
export const queryWords = (foldedQuery: string) => foldedQuery.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 0);

// Tempo digitado: "m:ss", "h:mm:ss" ou o começo de um ("1:2", "12:"). seconds só quando está completo
export function parseTimeQuery(raw: string): { prefix: string; seconds: number | null } | null {
  const q = raw.trim();
  if (!/^\d{1,2}(:\d{0,2}){1,2}$/.test(q)) return null;
  const parts = q.split(':');
  const complete = parts.slice(1).every(p => p.length === 2);
  return { prefix: q, seconds: complete ? parts.reduce((acc, p) => acc * 60 + Number(p), 0) : null };
}

// Nota da correspondência de uma frase com a busca (0 = não corresponde)
export function textMatchScore(foldedText: string, foldedQuery: string): number {
  if (!foldedQuery) return 0;
  const text = foldedText.trim();
  if (text === foldedQuery) return 100;
  let best = 0;
  let at = text.indexOf(foldedQuery);
  while (at !== -1) {
    const startsWord = !isWordChar(text[at - 1]);
    const endsWord = !isWordChar(text[at + foldedQuery.length]);
    const score = at === 0 && endsWord ? 90 // começa a frase com a palavra ou expressão inteira
      : startsWord && endsWord ? 80 // palavra ou expressão inteira
      : at === 0 ? 70 // começo da frase
      : startsWord ? 60 // começo de uma palavra
      : 40; // no meio de uma palavra
    best = Math.max(best, score);
    if (best >= 80) break;
    at = text.indexOf(foldedQuery, at + 1);
  }
  if (best) return best;
  // Todas as palavras buscadas, fora de ordem ou separadas
  const words = queryWords(foldedQuery);
  if (words.length > 1 && words.every(w => text.includes(w))) return 20;
  return 0;
}

export interface LyricSearchHit<T> { item: T; index: number; score: number; byTime: boolean }

// items em ordem do audiobook. times: os tempos (em segundos) em que a frase é mostrada — no audiobook e/ou no
// capítulo; format: como o tempo aparece na tela (para buscas pelo começo de um tempo)
export function searchLyrics<T extends { start: number }>(
  items: T[],
  rawQuery: string,
  getText: (item: T) => string,
  times: (item: T) => number[],
  format: (seconds: number) => string,
  limit = 100,
): LyricSearchHit<T>[] {
  const query = foldSearch(rawQuery.trim());
  if (!query) return [];
  const time = parseTimeQuery(rawQuery);
  const hits: LyricSearchHit<T>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let score = textMatchScore(foldSearch(getText(item)), query);
    let byTime = false;
    if (time) {
      const next = items[i + 1];
      const span = next && next.start > item.start ? next.start - item.start : 15;
      for (const t of times(item)) {
        // A frase dita naquele momento vem antes de tudo
        if (time.seconds !== null && time.seconds >= Math.floor(t) && time.seconds < t + span) { score = Math.max(score, 110); byTime = true; break; }
        if (format(t).startsWith(time.prefix)) { score = Math.max(score, 50); byTime = true; }
      }
    }
    if (score > 0) hits.push({ item, index: i, score, byTime });
  }
  // Mesma nota: na ordem do audiobook (a ordenação é estável)
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
