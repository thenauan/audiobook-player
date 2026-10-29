// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { parseSynchronizedTextFile } from '../audioUtils';

// Arquivos que sincronizam frases e palavras: as frases ficam com o tempo de cada palavra
const parse = (name: string, content: string) => parseSynchronizedTextFile(new File([content], name, { type: 'text/plain' }));

describe('texto sincronizado por frase e por palavra', () => {
  it('VTT com marcas de tempo por palavra', async () => {
    const vtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<00:00:01.000>Era <00:00:01.600>uma <00:00:02.100>vez\n\n00:00:03.000 --> 00:00:05.000\nSem palavras\n';
    const res: any = await parse('a.vtt', vtt);
    expect(res.ok).toBe(true);
    expect(res.lines[0].text).toBe('Era uma vez');
    expect(res.lines[0].words.map((w: any) => w.text)).toEqual(['Era', 'uma', 'vez']);
    expect(res.lines[0].words[1].start).toBeCloseTo(1.6);
    expect(res.lines[1].words).toBeUndefined();
  });

  it('LRC estendido com palavras', async () => {
    const lrc = '[00:01.00]<00:01.00>Era <00:01.50>uma <00:02.00>vez\n[00:04.00]Outra frase\n';
    const res: any = await parse('a.lrc', lrc);
    expect(res.ok).toBe(true);
    expect(res.lines[0].text).toBe('Era uma vez');
    expect(res.lines[0].words).toHaveLength(3);
    expect(res.lines[0].words[2].start).toBeCloseTo(2);
  });

  it('SMIL com um trecho por palavra vira frases com palavras', async () => {
    const pars = ['No', 'princípio', 'era', 'o', 'Verbo.', 'E', 'o', 'Verbo', 'estava', 'com', 'Deus.']
      .map((w, i) => `<par><text>${w}</text><audio src="a.mp3" clipBegin="${(i * 0.5).toFixed(1)}s" clipEnd="${(i * 0.5 + 0.5).toFixed(1)}s"/></par>`)
      .join('');
    const res: any = await parse('a.smil', `<smil><body><seq>${pars}</seq></body></smil>`);
    expect(res.ok).toBe(true);
    expect(res.lines.length).toBe(2);
    expect(res.lines[0].text).toBe('No princípio era o Verbo.');
    expect(res.lines[0].words).toHaveLength(5);
  });
});
