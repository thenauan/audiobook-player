import type { TranscriptLine, TranscriptWord } from '../data/catalog';

/**
 * Parses SMIL clock values (e.g. "0.0s", "3.2s", "500ms", "01:23.45", "00:01:23.450") into seconds
 */
export function parseTimeValueToSeconds(val: unknown): number | null {
  if (typeof val === 'number') {
    return !isNaN(val) && isFinite(val) && val >= 0 ? val : null;
  }
  if (typeof val !== 'string') return null;
  const s = val.trim();
  if (!s) return null;

  // Milliseconds: "500ms"
  const msMatch = s.match(/^(\d+(?:\.\d+)?)\s*ms$/i);
  if (msMatch) {
    return parseFloat(msMatch[1]) / 1000;
  }

  // Seconds: "3.2s" or plain number "3.2"
  const secMatch = s.match(/^(\d+(?:\.\d+)?)\s*s?$/i);
  if (secMatch) {
    return parseFloat(secMatch[1]);
  }

  // Minutes: "1.5min" or "1.5m"
  const minMatch = s.match(/^(\d+(?:\.\d+)?)\s*m(?:in)?$/i);
  if (minMatch) {
    return parseFloat(minMatch[1]) * 60;
  }

  // Hours: "1.5h"
  const hrMatch = s.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (hrMatch) {
    return parseFloat(hrMatch[1]) * 3600;
  }

  // HH:MM:SS.mmm or MM:SS.mmm (with . or , for decimals)
  const normalized = s.replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  } else if (parts.length === 3) {
    const hrs = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2]);
    if (!isNaN(hrs) && !isNaN(mins) && !isNaN(secs)) {
      return hrs * 3600 + mins * 60 + secs;
    }
  }

  return null;
}

/**
 * Groups word-level synchronized items into natural sentences/segments while preserving individual word timings
 */
export function groupTimedWordsIntoSegments(rawWords: TranscriptWord[]): TranscriptLine[] {
  const validWords = rawWords
    .filter(w => w && typeof w.text === 'string' && w.text.trim().length > 0 && typeof w.start === 'number' && !isNaN(w.start) && w.start >= 0)
    .map(w => ({
      start: w.start,
      end: typeof w.end === 'number' && !isNaN(w.end) && w.end >= w.start ? w.end : w.start + 0.35,
      text: w.text.trim(),
    }))
    .sort((a, b) => a.start - b.start);

  if (validWords.length === 0) return [];

  const segments: TranscriptLine[] = [];
  let currentWords: TranscriptWord[] = [];

  const flushSegment = () => {
    if (currentWords.length === 0) return;
    const start = currentWords[0].start;
    const end = currentWords[currentWords.length - 1].end;
    const text = currentWords.map(w => w.text).join(' ');
    segments.push({
      start: Number(start.toFixed(2)),
      end: Number(Math.max(start + 0.1, end).toFixed(2)),
      text,
      words: [...currentWords],
    });
    currentWords = [];
  };

  for (let i = 0; i < validWords.length; i++) {
    const w = validWords[i];
    const nextW = validWords[i + 1];
    currentWords.push(w);

    const endsWithSentencePunct = /[.!?…:;]["'”’)]*$/.test(w.text);
    const pauseBeforeNext = nextW ? nextW.start - w.end : 0;
    const reachedMaxWords = currentWords.length >= 14;
    const reachedNaturalBreak = (endsWithSentencePunct && currentWords.length >= 3) || pauseBeforeNext >= 1.0;

    if (reachedNaturalBreak || reachedMaxWords) {
      flushSegment();
    }
  }
  flushSegment();

  return segments;
}

/**
 * Validates and normalizes parsed TranscriptLine[] against audio duration
 */
export function validateAndNormalizeTranscript(
  lines: TranscriptLine[],
  _audioDurationSec?: number
): TranscriptLine[] {
  if (!Array.isArray(lines) || lines.length === 0) return [];

  const cleaned: TranscriptLine[] = [];
  for (const item of lines) {
    if (!item || typeof item.text !== 'string') continue;
    const text = item.text.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const start = parseTimeValueToSeconds(item.start);
    if (start === null || start < 0) continue;
    let end = parseTimeValueToSeconds(item.end);
    if (end === null || end <= start) {
      end = start + 3.5;
    }
    cleaned.push({
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text,
      words: item.words,
    });
  }

  if (cleaned.length === 0) return [];
  cleaned.sort((a, b) => a.start - b.start);

  // Fill/fix overlapping or missing end times using next segment's start time
  for (let i = 0; i < cleaned.length - 1; i++) {
    const cur = cleaned[i];
    const next = cleaned[i + 1];
    if (cur.end > next.start && next.start > cur.start) {
      cur.end = Number(next.start.toFixed(2));
    }
  }

  // Todas as linhas ficam: a duração conhecida na importação pode estar errada (no iPhone, às vezes só 30
  // minutos), e cortar por ela apagava o resto da letra
  return cleaned;
}

function parseJsonTranscript(jsonText: string): TranscriptLine[] {
  const cleanedText = jsonText
    .replace(/^\uFEFF/, '')
    .trim();
  const data = JSON.parse(cleanedText);

  // Case 1: { "segments": [...] } or { "transcript": [...] } or { "lines": [...] } or { "cues": [...] }
  const segmentsArr = Array.isArray(data)
    ? data
    : Array.isArray(data?.segments)
      ? data.segments
      : Array.isArray(data?.transcript)
        ? data.transcript
        : Array.isArray(data?.lines)
          ? data.lines
          : Array.isArray(data?.cues)
            ? data.cues
            : Array.isArray(data?.sentences)
              ? data.sentences
              : null;

  if (segmentsArr && segmentsArr.length > 0) {
    // Check if the array is actually a flat array of single words
    const avgLen = segmentsArr.reduce((acc: number, it: any) => acc + String(it?.text || it?.word || '').trim().split(/\s+/).length, 0) / segmentsArr.length;
    if (avgLen <= 1.35 && segmentsArr.length > 5 && !Array.isArray(data?.segments)) {
      const words: TranscriptWord[] = segmentsArr
        .map((w: any) => ({
          start: parseTimeValueToSeconds(w.start ?? w.startTime ?? w.begin) ?? -1,
          end: parseTimeValueToSeconds(w.end ?? w.endTime ?? w.finish) ?? -1,
          text: String(w.text ?? w.word ?? w.value ?? '').trim(),
        }))
        .filter((w: TranscriptWord) => w.start >= 0 && w.text.length > 0);
      return groupTimedWordsIntoSegments(words);
    }

    const result: TranscriptLine[] = [];
    for (const seg of segmentsArr) {
      if (!seg || typeof seg !== 'object') continue;
      const start = parseTimeValueToSeconds(seg.start ?? seg.startTime ?? seg.begin ?? seg.clipBegin);
      if (start === null) continue;
      const end = parseTimeValueToSeconds(seg.end ?? seg.endTime ?? seg.finish ?? seg.clipEnd) ?? (start + 3.5);
      const text = String(seg.text ?? seg.content ?? seg.sentence ?? seg.line ?? '').trim();

      let segWords: TranscriptWord[] | undefined;
      if (Array.isArray(seg.words)) {
        const parsedWords: TranscriptWord[] = seg.words
          .map((w: any) => {
            const ws = parseTimeValueToSeconds(w.start ?? w.startTime ?? w.begin);
            if (ws === null) return null;
            const we = parseTimeValueToSeconds(w.end ?? w.endTime) ?? (ws + 0.3);
            const wt = String(w.text ?? w.word ?? '').trim();
            return wt ? { start: ws, end: we, text: wt } : null;
          })
          .filter(Boolean) as TranscriptWord[];
        if (parsedWords.length > 0) segWords = parsedWords;
      }

      const finalText = text || (segWords ? segWords.map(w => w.text).join(' ') : '');
      if (finalText) {
        result.push({
          start,
          end: Math.max(start + 0.1, end),
          text: finalText,
          words: segWords,
        });
      }
    }
    if (result.length > 0) {
      // Frases e palavras em listas separadas no mesmo arquivo ({ segments: [...], words: [...] }, como o
      // .sync.json do Audiobook Generator): cada palavra vai para a frase em que ela começa
      if (Array.isArray(data?.words) && data.words.length > 0 && !result.some(r => r.words && r.words.length > 0)) {
        attachWordsToSegments(result, parseWordList(data.words));
      }
      return result;
    }
  }

  // Case 2: { "words": [ { "start": 0.0, "end": 0.35, "text": "Era" }, ... ] }
  if (Array.isArray(data?.words) && data.words.length > 0) {
    const words: TranscriptWord[] = data.words
      .map((w: any) => {
        const ws = parseTimeValueToSeconds(w.start ?? w.startTime ?? w.begin);
        if (ws === null) return null;
        const we = parseTimeValueToSeconds(w.end ?? w.endTime) ?? (ws + 0.35);
        const wt = String(w.text ?? w.word ?? '').trim();
        return wt ? { start: ws, end: we, text: wt } : null;
      })
      .filter(Boolean) as TranscriptWord[];
    return groupTimedWordsIntoSegments(words);
  }

  return [];
}

function parseWordList(list: any[]): TranscriptWord[] {
  return list
    .map((w: any) => {
      const ws = parseTimeValueToSeconds(w?.start ?? w?.startTime ?? w?.begin);
      if (ws === null) return null;
      const we = parseTimeValueToSeconds(w?.end ?? w?.endTime) ?? (ws + 0.35);
      const wt = String(w?.text ?? w?.word ?? '').trim();
      return wt ? { start: ws, end: Math.max(ws, we), text: wt } : null;
    })
    .filter(Boolean) as TranscriptWord[];
}

// Distribui palavras (com tempo) pelas frases: cada palavra fica na frase em que começa (com pequena
// tolerância no início). Frases sem palavras continuam só com o destaque da frase.
function attachWordsToSegments(lines: TranscriptLine[], words: TranscriptWord[]) {
  if (words.length === 0 || lines.length === 0) return;
  const order = lines.map((_, i) => i).sort((a, b) => lines[a].start - lines[b].start);
  const sorted = [...words].sort((a, b) => a.start - b.start);
  const TOL = 0.12;
  let wi = 0;
  order.forEach((li, k) => {
    const line = lines[li];
    const nextStart = k + 1 < order.length ? lines[order[k + 1]].start : Infinity;
    const bucket: TranscriptWord[] = [];
    while (wi < sorted.length && sorted[wi].start < nextStart - TOL) {
      bucket.push(sorted[wi]);
      wi++;
    }
    if (bucket.length > 0) line.words = bucket;
  });
}

// Texto com marcas de tempo por palavra dentro da frase (VTT "<00:00:01.200>", LRC estendido "<01:02.30>"):
// devolve as palavras com início/fim. Trechos com várias palavras entre duas marcas dividem o tempo igualmente.
function parseInlineTimedWords(body: string, lineStart: number, lineEnd: number): TranscriptWord[] {
  const re = /<(\d{1,5}:\d{2}(?::\d{2})?[.,:]\d{1,3})>/g;
  if (!re.test(body)) return [];
  re.lastIndex = 0;
  const chunks: { start: number; text: string }[] = [];
  let last = 0;
  let curStart = lineStart;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    chunks.push({ start: curStart, text: body.slice(last, m.index) });
    const t = parseTimeValueToSeconds(m[1].replace(/:(\d{1,3})$/, '.$1'));
    if (t !== null) curStart = t;
    last = m.index + m[0].length;
  }
  chunks.push({ start: curStart, text: body.slice(last) });
  const words: TranscriptWord[] = [];
  chunks.forEach((c, i) => {
    const parts = c.text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length === 0) return;
    const chunkEnd = Math.max(c.start + 0.05, i + 1 < chunks.length ? chunks[i + 1].start : lineEnd);
    const step = (chunkEnd - c.start) / parts.length;
    parts.forEach((text, j) => words.push({ start: c.start + step * j, end: c.start + step * (j + 1), text }));
  });
  return words.length > 1 ? words : [];
}

function parseSmilOrXmlTranscript(
  xmlText: string,
  xhtmlMap?: Map<string, Document>
): TranscriptLine[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const results: TranscriptLine[] = [];
    // Elemento do texto de cada trecho (para juntar palavras da mesma frase)
    const fragParents: (Element | null)[] = [];

    // 1. Standard EPUB 3 Media Overlays / SMIL (<par> with <text> and <audio>)
    const pars = Array.from(doc.getElementsByTagName('par'));
    for (const par of pars) {
      const audioEl = par.getElementsByTagName('audio')[0];
      const textEl = par.getElementsByTagName('text')[0];
      if (!audioEl) continue;

      const clipBegin = parseTimeValueToSeconds(
        audioEl.getAttribute('clipBegin') ||
        audioEl.getAttribute('clip-begin') ||
        audioEl.getAttribute('begin') ||
        audioEl.getAttribute('start')
      );
      if (clipBegin === null) continue;

      const clipEnd = parseTimeValueToSeconds(
        audioEl.getAttribute('clipEnd') ||
        audioEl.getAttribute('clip-end') ||
        audioEl.getAttribute('end')
      ) ?? (clipBegin + 3.5);

      let resolvedText = '';
      let fragParent: Element | null = null;
      if (textEl) {
        const srcAttr = textEl.getAttribute('src') || '';
        const inlineText = (textEl.textContent || '').trim();
        if (srcAttr && xhtmlMap && xhtmlMap.size > 0) {
          const [filePart, fragmentId] = srcAttr.split('#');
          const cleanFile = filePart.split('/').pop()?.toLowerCase() || '';
          let targetDoc: Document | undefined;
          for (const [k, d] of xhtmlMap.entries()) {
            if (k.toLowerCase().endsWith(cleanFile) || k.toLowerCase() === filePart.toLowerCase()) {
              targetDoc = d;
              break;
            }
          }
          if (targetDoc && fragmentId) {
            const fragEl = targetDoc.getElementById(fragmentId) || targetDoc.querySelector(`[id="${CSS.escape(fragmentId)}"]`);
            if (fragEl && fragEl.textContent) {
              resolvedText = fragEl.textContent.replace(/\s+/g, ' ').trim();
              fragParent = fragEl.parentElement;
            }
          }
        }
        if (!resolvedText && inlineText) {
          resolvedText = inlineText.replace(/\s+/g, ' ').trim();
        }
      }

      if (resolvedText) {
        results.push({
          start: clipBegin,
          end: Math.max(clipBegin + 0.1, clipEnd),
          text: resolvedText,
        });
        fragParents.push(fragParent);
      }
    }

    // Sincronização por palavra (cada trecho é uma palavra): junta as palavras em frases, mantendo o
    // tempo de cada uma, para destacar a frase e a palavra ao mesmo tempo
    const singleWords = results.filter(r => !/\s/.test(r.text)).length;
    if (results.length > 1 && singleWords / results.length >= 0.8) {
      const haveParents = fragParents.every(Boolean);
      if (haveParents) {
        const grouped: TranscriptLine[] = [];
        results.forEach((r, i) => {
          const prev = grouped[grouped.length - 1];
          if (prev && fragParents[i] === fragParents[i - 1]) {
            prev.words!.push({ start: r.start, end: r.end, text: r.text });
            prev.end = Math.max(prev.end, r.end);
            prev.text = `${prev.text} ${r.text}`;
          } else {
            grouped.push({ start: r.start, end: r.end, text: r.text, words: [{ start: r.start, end: r.end, text: r.text }] });
          }
        });
        // Frase muito longa (o pai é o parágrafo inteiro, por exemplo): divide em frases menores
        return grouped.flatMap(g => (g.words!.length > 24 ? groupTimedWordsIntoSegments(g.words!) : [g]));
      }
      return groupTimedWordsIntoSegments(results.map(r => ({ start: r.start, end: r.end, text: r.text })));
    }

    if (results.length > 0) return results;

    // 2. Generic XML / TTML (<p begin="..." end="..."> or <segment start="..." end="..."> or <cue>)
    const candidateTags = ['p', 'segment', 'cue', 'line', 'item', 'text'];
    for (const tag of candidateTags) {
      const els = Array.from(doc.getElementsByTagName(tag));
      for (const el of els) {
        const start = parseTimeValueToSeconds(
          el.getAttribute('start') ||
          el.getAttribute('begin') ||
          el.getAttribute('clipBegin') ||
          el.getAttribute('t')
        );
        if (start === null) continue;
        const dur = parseTimeValueToSeconds(el.getAttribute('dur') || el.getAttribute('d'));
        const endAttr = parseTimeValueToSeconds(
          el.getAttribute('end') ||
          el.getAttribute('clipEnd')
        );
        const end = endAttr !== null ? endAttr : dur !== null ? start + dur : start + 3.5;
        const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (txt) {
          results.push({ start, end: Math.max(start + 0.1, end), text: txt });
        }
      }
      if (results.length > 0) break;
    }

    return results;
  } catch {
    return [];
  }
}

function parseLrcOrVttOrSrtTranscript(raw: string): TranscriptLine[] {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const results: TranscriptLine[] = [];

  // 1. Try WebVTT / SRT block format: "00:00:00.000 --> 00:00:03.200"
  const cueRegex = /(?:^|\n)(?:[^\n]*\n)?(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3}|\d{1,2}:\d{2})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3}|\d{1,2}:\d{2})[^\n]*\n([\s\S]*?)(?=\n\s*\n|\n(?:[^\n]*\n)?\d{1,2}:\d{2}(?::\d{2})?[.,]?\d*\s*-->|$)/g;
  let match: RegExpExecArray | null;
  while ((match = cueRegex.exec(text)) !== null) {
    const start = parseTimeValueToSeconds(match[1]);
    const end = parseTimeValueToSeconds(match[2]);
    const cueText = match[3]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (start !== null && cueText) {
      const cueEnd = end !== null && end > start ? end : start + 3.5;
      const words = parseInlineTimedWords(match[3], start, cueEnd);
      results.push({
        start,
        end: cueEnd,
        text: cueText,
        ...(words.length > 0 ? { words } : {}),
      });
    }
  }
  if (results.length > 0) return results;

  // 2. Try LRC format: "[mm:ss.xx] Texto"
  const lines = text.split('\n');
  const lrcEntries: { start: number; text: string; raw: string }[] = [];
  // Minutos sem limite prático: audiobooks longos passam de 1000 minutos
  const lrcRegex = /\[(\d{1,5}:\d{2}(?:[.:]\d{1,3})?)\]/g;
  for (const line of lines) {
    const timestamps: number[] = [];
    let m: RegExpExecArray | null;
    lrcRegex.lastIndex = 0;
    while ((m = lrcRegex.exec(line)) !== null) {
      const sec = parseTimeValueToSeconds(m[1]);
      if (sec !== null) timestamps.push(sec);
    }
    if (timestamps.length > 0) {
      const raw = line.replace(/\[[^\]]*\]/g, '').trim();
      const lyricText = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (lyricText) {
        for (const ts of timestamps) {
          lrcEntries.push({ start: ts, text: lyricText, raw });
        }
      }
    }
  }

  if (lrcEntries.length > 0) {
    lrcEntries.sort((a, b) => a.start - b.start);
    return lrcEntries.map((item, idx) => {
      const next = lrcEntries[idx + 1];
      const end = next && next.start > item.start ? next.start : item.start + 4.0;
      // LRC estendido: "<mm:ss.xx>palavra" marca o tempo de cada palavra
      const words = parseInlineTimedWords(item.raw, item.start, end);
      return {
        start: item.start,
        end,
        text: item.text,
        ...(words.length > 0 ? { words } : {}),
      };
    });
  }

  return [];
}

function parseTsTranscript(raw: string): TranscriptLine[] {
  // Extracts array/object literal from TypeScript/JS files (e.g. `export default { ... }` or `export const transcript = [ ... ]`)
  const trimmed = raw.replace(/^\uFEFF/, '').trim();
  try {
    return parseJsonTranscript(trimmed);
  } catch {}

  const firstBrace = trimmed.search(/[\[{]/);
  if (firstBrace !== -1) {
    const lastBracket = Math.max(trimmed.lastIndexOf(']'), trimmed.lastIndexOf('}'));
    if (lastBracket > firstBrace) {
      const candidate = trimmed
        .slice(firstBrace, lastBracket + 1)
        .replace(/,\s*([\]}])/g, '$1');
      try {
        return parseJsonTranscript(candidate);
      } catch {}
    }
  }
  return [];
}

export function parseTextContentByFormat(content: string, ext: string): TranscriptLine[] {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  if (cleanExt === 'json') {
    return parseJsonTranscript(content);
  }
  if (cleanExt === 'xml' || cleanExt === 'smil') {
    return parseSmilOrXmlTranscript(content);
  }
  if (cleanExt === 'ts' || cleanExt === 'js') {
    return parseTsTranscript(content);
  }
  if (cleanExt === 'lrc' || cleanExt === 'vtt' || cleanExt === 'srt') {
    return parseLrcOrVttOrSrtTranscript(content);
  }
  return parseTextContentAuto(content);
}

export function parseTextContentAuto(content: string): TranscriptLine[] {
  const trimmed = content.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const res = parseJsonTranscript(trimmed);
      if (res.length > 0) return res;
    } catch {}
  }
  if (trimmed.startsWith('<')) {
    const res = parseSmilOrXmlTranscript(trimmed);
    if (res.length > 0) return res;
  }
  const subRes = parseLrcOrVttOrSrtTranscript(trimmed);
  if (subRes.length > 0) return subRes;
  return parseTsTranscript(trimmed);
}

/**
 * Unpacks an EPUB (ZIP archive) in the browser and extracts EPUB 3 Media Overlays (.smil + .xhtml)
 */
async function parseEpubMediaOverlays(file: File): Promise<{
  lines: TranscriptLine[];
  hasContentButNoSync: boolean;
}> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const minEocdOffset = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minEocdOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('invalid_epub_zip');
  }

  const cdEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  interface ZipEntry {
    fileName: string;
    compressionMethod: number;
    compressedSize: number;
    uncompressedSize: number;
    localHeaderOffset: number;
  }

  const entries: ZipEntry[] = [];
  let ptr = cdOffset;
  const utf8Decoder = new TextDecoder('utf-8');

  for (let i = 0; i < cdEntries && ptr + 46 <= bytes.length; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const uncompressedSize = view.getUint32(ptr + 24, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const fileNameBytes = bytes.subarray(ptr + 46, ptr + 46 + fileNameLen);
    const fileName = utf8Decoder.decode(fileNameBytes);

    entries.push({
      fileName,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    ptr += 46 + fileNameLen + extraLen + commentLen;
  }

  const extractEntryText = async (entry: ZipEntry): Promise<string> => {
    const lh = entry.localHeaderOffset;
    if (lh + 30 > bytes.length || view.getUint32(lh, true) !== 0x04034b50) return '';
    const fnLen = view.getUint16(lh + 26, true);
    const exLen = view.getUint16(lh + 28, true);
    const dataStart = lh + 30 + fnLen + exLen;
    const compData = bytes.subarray(dataStart, dataStart + entry.compressedSize);

    if (entry.compressionMethod === 0) {
      return utf8Decoder.decode(compData);
    } else if (entry.compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compData).catch(() => {});
      writer.close().catch(() => {});
      const resp = new Response(ds.readable);
      const ab = await resp.arrayBuffer();
      return utf8Decoder.decode(new Uint8Array(ab));
    }
    return '';
  };

  const smilEntries = entries.filter(e => /\.smil$/i.test(e.fileName));
  const xhtmlEntries = entries.filter(e => /\.(xhtml|html|htm|xml)$/i.test(e.fileName) && !/container\.xml$/i.test(e.fileName));
  const jsonEntries = entries.filter(e => /\.json$/i.test(e.fileName));

  const domParser = new DOMParser();
  const xhtmlMap = new Map<string, Document>();
  for (const xe of xhtmlEntries) {
    try {
      const txt = await extractEntryText(xe);
      if (txt) {
        const doc = domParser.parseFromString(txt, 'application/xhtml+xml');
        xhtmlMap.set(xe.fileName, doc);
      }
    } catch {}
  }

  const allLines: TranscriptLine[] = [];
  for (const se of smilEntries) {
    try {
      const smilTxt = await extractEntryText(se);
      if (smilTxt) {
        const parsed = parseSmilOrXmlTranscript(smilTxt, xhtmlMap);
        if (parsed.length > 0) {
          allLines.push(...parsed);
        }
      }
    } catch {}
  }

  if (allLines.length === 0 && jsonEntries.length > 0) {
    for (const je of jsonEntries) {
      try {
        const jTxt = await extractEntryText(je);
        if (jTxt) {
          const parsed = parseJsonTranscript(jTxt);
          if (parsed.length > 0) {
            allLines.push(...parsed);
          }
        }
      } catch {}
    }
  }

  return {
    lines: allLines,
    hasContentButNoSync: allLines.length === 0 && xhtmlEntries.length > 0,
  };
}

export type ParseSynchronizedTextResult =
  | { ok: true; lines: TranscriptLine[]; fileName: string }
  | { ok: false; reason: 'epub_no_media_overlays' | 'invalid_or_no_timestamps' | 'unsupported_format'; fileName: string };

/**
 * Parses and validates an external synchronized text file (.epub, .json, .xml, .smil, .ts, .vtt, .srt, .lrc)
 */
export async function parseSynchronizedTextFile(
  file: File,
  audioDurationSec?: number
): Promise<ParseSynchronizedTextResult> {
  const fileName = file.name;
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  try {
    if (ext === 'epub') {
      const { lines, hasContentButNoSync } = await parseEpubMediaOverlays(file);
      const validated = validateAndNormalizeTranscript(lines, audioDurationSec);
      if (validated.length > 0) {
        return { ok: true, lines: validated, fileName };
      }
      return {
        ok: false,
        reason: hasContentButNoSync ? 'epub_no_media_overlays' : 'invalid_or_no_timestamps',
        fileName,
      };
    }

    const rawText = await file.text();
    const rawLines = parseTextContentByFormat(rawText, ext);
    const validated = validateAndNormalizeTranscript(rawLines, audioDurationSec);

    if (validated.length > 0) {
      return { ok: true, lines: validated, fileName };
    }

    return { ok: false, reason: 'invalid_or_no_timestamps', fileName };
  } catch {
    return { ok: false, reason: 'invalid_or_no_timestamps', fileName };
  }
}

// ===== Transições entre telas =====
// Computador: surge suavemente. Celular: como a navegação do iOS — as duas telas se movem juntas:
// ao avançar, a nova entra por cima deslizando da direita e a anterior recua um terço para a esquerda,
// escurecendo um pouco; ao voltar, o contrário. Trocar de aba (ou abrir pela capa) só funde as telas.
// "popSwipe": o gesto da borda já levou a tela embora; a anterior só termina de voltar ao lugar.
// "instant": o próprio navegador (Safari) já animou o voltar com o gesto dele; aqui a troca é imediata.
// Arquivos de texto sincronizado aceitos junto com o áudio, e o "nome-base" usado para achar o par
const SYNC_TEXT_SUFFIXES = ['.sync.json', '.json', '.epub', '.xml', '.smil', '.smi', '.vtt', '.srt', '.lrc'];

export function isSyncTextFile(name: string) {
  const lower = name.toLowerCase();
  return SYNC_TEXT_SUFFIXES.some(sfx => lower.endsWith(sfx));
}

export function syncTextStem(name: string) {
  const base = (name.split(/[\\/]/).pop() || '').toLowerCase();
  const sfx = SYNC_TEXT_SUFFIXES.find(x => base.endsWith(x));
  const noExt = sfx ? base.slice(0, -sfx.length) : base.replace(/\.[^.]+$/, '');
  return noExt.normalize('NFC').trim();
}
