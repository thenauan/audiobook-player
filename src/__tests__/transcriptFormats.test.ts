// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { parseSynchronizedTextFile } from '../audioUtils';

// O mesmo texto em cada formato tem de chegar com os mesmos tempos (livro de 10 horas, com tempos quebrados)
const lines = Array.from({ length: 4000 }, (_, i) => {
  const start = Math.round((i * 9.137 + 0.71) * 100) / 100;
  return { start, end: Math.round((start + 8.93) * 100) / 100, text: `Frase numero ${i + 1}.` };
});
const pad = (n: number, size = 2) => String(n).padStart(size, '0');
const clock = (t: number, sep: string) => {
  const ms = Math.round(t * 1000);
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}${sep}${pad(ms % 1000, 3)}`;
};
const lrcClock = (t: number) => {
  const cs = Math.round(t * 100);
  return `[${pad(Math.floor(cs / 6000))}:${pad(Math.floor(cs / 100) % 60)}.${pad(cs % 100)}]`;
};
const files: Record<string, string> = {
  'a.sync.json': JSON.stringify({ audio: 'a.mp3', segments: lines }),
  'a.lrc': lines.map(l => `${lrcClock(l.start)} ${l.text}`).join('\n'),
  'a.srt': lines.map((l, i) => `${i + 1}\n${clock(l.start, ',')} --> ${clock(l.end, ',')}\n${l.text}\n`).join('\n'),
  'a.vtt': `WEBVTT\n\n${lines.map(l => `${clock(l.start, '.')} --> ${clock(l.end, '.')}\n${l.text}\n`).join('\n')}`,
};

describe('mesmos tempos em todos os formatos de texto', () => {
  Object.entries(files).forEach(([name, content]) => {
    it(name, async () => {
      const res: any = await parseSynchronizedTextFile(new File([content], name), 36000);
      expect(res.ok).toBe(true);
      expect(res.lines).toHaveLength(lines.length);
      const worst = Math.max(...res.lines.map((l: any, i: number) => Math.abs(l.start - lines[i].start)));
      expect(worst).toBeLessThan(0.011);
    });
  });
});
