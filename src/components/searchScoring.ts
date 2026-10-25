// Extraído do App.tsx (conteúdo sem alterações)
import { matchesNationalityMultiLang } from '../nationalityTranslations';

export function normalizeSearchStr(str: string): string {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function toPhoneticSearchStr(s: string): string {
  return (s || '')
    .replace(/ph/g, 'f')
    .replace(/qu([eiy])/g, 'k$1')
    .replace(/qu/g, 'k')
    .replace(/c([eiy])/g, 's$1')
    .replace(/c/g, 'k')
    .replace(/g([eiy])/g, 'j$1')
    .replace(/ch/g, 'x')
    .replace(/sh/g, 'x')
    .replace(/ss/g, 's')
    .replace(/sc([eiy])/g, 's$1')
    .replace(/z/g, 's')
    .replace(/y/g, 'i')
    .replace(/w/g, 'v')
    .replace(/lh/g, 'l')
    .replace(/nh/g, 'n')
    .replace(/^h/, '')
    .replace(/(.)\1+/g, '$1');
}

export function damerauLevenshteinDistance(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;
  if (a === b) return 0;

  const dp: number[][] = Array.from({ length: lenA + 1 }, () => new Array(lenB + 1).fill(0));
  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[lenA][lenB];
}

export function diceBigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigramsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
  }
  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const count = bigramsA.get(bg) || 0;
    if (count > 0) {
      bigramsA.set(bg, count - 1);
      intersection++;
    }
  }
  return (2 * intersection) / (a.length - 1 + (b.length - 1));
}

export function compactSubsequencePenalty(query: string, target: string): number | null {
  if (query.length < 2 || target.length < query.length) return null;
  const maxSkipped = query.length === 2 ? 1 : Math.min(3, Math.floor(query.length * 0.5));
  let bestPenalty: number | null = null;

  for (let s = 0; s <= target.length - query.length; s++) {
    if (target[s] !== query[0]) continue;
    if (query.length === 2 && s > 0) break;

    let qi = 1;
    let lastIdx = s;
    for (let ti = s + 1; ti < target.length && qi < query.length; ti++) {
      if (target[ti] === query[qi]) {
        qi++;
        lastIdx = ti;
      }
    }
    if (qi === query.length) {
      const span = lastIdx - s + 1;
      const skipped = span - query.length;
      if (skipped <= maxSkipped) {
        const penalty = 2.0 + (skipped / (query.length + 1)) * 0.6 + (s > 0 ? 0.25 : 0);
        if (bestPenalty === null || penalty < bestPenalty) {
          bestPenalty = penalty;
        }
      }
    }
  }
  return bestPenalty;
}

export interface SearchTermMatch {
  tier: 1 | 2 | 3 | 4;
  subScore: number;
}

export function computeFuzzyTermSubScore(
  tNorm: string,
  tWords: string[],
  q: string,
  qWords: string[],
  qPhonetic: string
): number | null {
  let bestSub: number | null = null;
  const consider = (val: number) => {
    if (bestSub === null || val < bestSub) bestSub = val;
  };

  // 1. Equivalência fonética / ortográfica
  const tPhonetic = toPhoneticSearchStr(tNorm);
  if (qPhonetic.length >= 1 && tPhonetic.length >= 1) {
    if (q.length === 1) {
      if (tPhonetic.startsWith(qPhonetic) || tWords.some(w => toPhoneticSearchStr(w).startsWith(qPhonetic))) {
        consider(0.2);
      } else if (tPhonetic.includes(qPhonetic)) {
        consider(0.4);
      }
      return bestSub;
    } else {
      if (tPhonetic.startsWith(qPhonetic)) {
        consider(0.1);
      } else if (tWords.some(w => toPhoneticSearchStr(w).startsWith(qPhonetic))) {
        consider(0.2);
      } else if (tPhonetic.includes(qPhonetic)) {
        consider(0.35);
      }
    }
  }

  if (q.length < 2) return bestSub;

  // 2. Distância de edição Damerau-Levenshtein e Subsequência Compacta por palavra
  for (let wi = 0; wi < tWords.length; wi++) {
    const w = tWords[wi];
    if (!w) continue;
    const wordOffset = Math.min(wi, 8) * 0.03;

    if (q.length === 2) {
      // Transposição das 2 primeiras letras (ex: "la" -> "albert")
      if (w.length >= 2 && w[0] === q[1] && w[1] === q[0]) {
        consider(0.6 + wordOffset);
      }
      const subPen = compactSubsequencePenalty(q, w);
      if (subPen !== null) consider(subPen + wordOffset);
      continue;
    }

    // Comparar com a palavra inteira e com prefixos de tamanho próximo
    const candidates = [w];
    if (w.length > q.length) {
      candidates.push(w.slice(0, q.length));
      if (w.length >= q.length + 1) candidates.push(w.slice(0, q.length + 1));
    }

    const maxAllowedDist = q.length <= 3 ? 1 : q.length <= 5 ? 2 : Math.min(3, Math.floor(q.length * 0.35));

    for (const cand of candidates) {
      if (Math.abs(cand.length - q.length) > maxAllowedDist) continue;
      const dist = damerauLevenshteinDistance(q, cand);
      if (dist <= maxAllowedDist) {
        const sameStartOrTransposed =
          w[0] === q[0] ||
          (w.length >= 2 && q.length >= 2 && w[0] === q[1] && w[1] === q[0]) ||
          toPhoneticSearchStr(w[0]) === toPhoneticSearchStr(q[0]);

        if (q.length === 3 && dist === 1 && !sameStartOrTransposed && cand !== w) {
          continue;
        }
        if ((q.length === 4 || q.length === 5) && dist === 2 && !sameStartOrTransposed) {
          continue;
        }
        const normRatio = dist / Math.max(q.length, cand.length);
        if (normRatio <= 0.45) {
          consider(0.5 + normRatio * 1.5 + (sameStartOrTransposed ? 0 : 0.25) + wordOffset);
        }
      }
    }

    // Subsequência compacta (letras puladas na ordem)
    const subPen = compactSubsequencePenalty(q, w);
    if (subPen !== null) {
      consider(subPen + wordOffset);
    }

    // Similaridade de bigramas (Dice)
    if (q.length >= 4 && w.length >= 3) {
      const dice = diceBigramSimilarity(q, w);
      if (dice >= 0.5) {
        consider(3.0 + (1 - dice) * 1.5 + wordOffset);
      }
    }
  }

  // 3. Consulta com múltiplas palavras (todas as palavras da busca encontram correspondência aproximada)
  if (bestSub === null && qWords.length > 1) {
    let totalSub = 0;
    let allMatched = true;
    for (const qw of qWords) {
      if (!qw) continue;
      const qwPhon = toPhoneticSearchStr(qw);
      let matchedWordScore: number | null = null;
      for (const tw of tWords) {
        if (tw.startsWith(qw)) {
          matchedWordScore = 0.1;
          break;
        } else if (tw.includes(qw)) {
          matchedWordScore = 0.25;
          break;
        } else {
          const fz = computeFuzzyTermSubScore(tw, [tw], qw, [qw], qwPhon);
          if (fz !== null && (matchedWordScore === null || fz < matchedWordScore)) {
            matchedWordScore = fz;
          }
        }
      }
      if (matchedWordScore === null) {
        allMatched = false;
        break;
      }
      totalSub += matchedWordScore;
    }
    if (allMatched) {
      consider(1.0 + totalSub / qWords.length);
    }
  }

  return bestSub;
}

export function evaluateSearchTermMatch(
  rawTerm: string | undefined,
  q: string,
  qWords: string[],
  qPhonetic: string
): SearchTermMatch | null {
  if (!rawTerm) return null;
  const tNorm = normalizeSearchStr(rawTerm);
  if (!tNorm || !q) return null;

  const tWords = tNorm.split(/[\s:,\-_/().]+/).filter(Boolean);

  // TIER 1: Começa pela ou pelas letras (início do texto ou início de palavra)
  if (tNorm === q) {
    return { tier: 1, subScore: 0 };
  }
  if (tNorm.startsWith(q)) {
    return { tier: 1, subScore: 0.1 };
  }
  const exactWordIdx = tWords.findIndex(w => w === q);
  if (exactWordIdx !== -1) {
    return { tier: 1, subScore: 0.2 + Math.min(exactWordIdx, 10) * 0.02 };
  }
  const startWordIdx = tWords.findIndex(w => w.startsWith(q));
  if (startWordIdx !== -1) {
    return { tier: 1, subScore: 0.4 + Math.min(startWordIdx, 10) * 0.02 };
  }
  if (qWords.length > 1 && qWords.every(qw => tWords.some(tw => tw.startsWith(qw)))) {
    return { tier: 1, subScore: 0.7 };
  }

  // TIER 2: Tem a sequência no meio das palavras
  for (let wi = 0; wi < tWords.length; wi++) {
    const w = tWords[wi];
    const idx = w.indexOf(q);
    if (idx > 0 && idx + q.length < w.length) {
      return { tier: 2, subScore: (idx / w.length) * 0.5 + Math.min(wi, 10) * 0.02 };
    }
  }
  const fullIdx = tNorm.indexOf(q);
  if (fullIdx > 0 && fullIdx + q.length < tNorm.length && !tWords.some(w => w.endsWith(q))) {
    return { tier: 2, subScore: 0.6 + (fullIdx / tNorm.length) * 0.3 };
  }
  if (
    qWords.length > 1 &&
    qWords.every(qw => tNorm.includes(qw)) &&
    qWords.some(qw =>
      tWords.some(w => {
        const idx = w.indexOf(qw);
        return idx > 0 && idx + qw.length < w.length;
      })
    )
  ) {
    return { tier: 2, subScore: 0.9 };
  }

  // TIER 3: Tem a sequência no final das palavras
  if (tNorm.endsWith(q)) {
    return { tier: 3, subScore: 0 };
  }
  const endWordIdx = tWords.findIndex(w => w.length > q.length && w.endsWith(q));
  if (endWordIdx !== -1) {
    return { tier: 3, subScore: 0.2 + Math.min(endWordIdx, 10) * 0.02 };
  }
  if (tNorm.includes(q) || (qWords.length > 1 && qWords.every(qw => tNorm.includes(qw)))) {
    return { tier: 3, subScore: 0.5 };
  }

  // TIER 4: Não tem exatamente, mas tem algo semelhante (fuzzy / fonético / subsequência)
  const fuzzySub = computeFuzzyTermSubScore(tNorm, tWords, q, qWords, qPhonetic);
  if (fuzzySub !== null) {
    return { tier: 4, subScore: fuzzySub };
  }

  return null;
}

export function matchesNationality(natStr: string, queryStr: string): boolean {
  return matchesNationalityMultiLang(natStr, queryStr);
}
