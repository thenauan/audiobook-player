import { describe, it, expect } from 'vitest';
import { searchLyrics, parseTimeQuery } from '../lib/lyricSearch';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const lines = [
  { start: 0, text: 'O principezinho chegou ao planeta' },
  { start: 10, text: 'Era uma vez um príncipe' },
  { start: 20, text: 'Príncipe' },
  { start: 30, text: 'o príncipe e a rosa' },
  { start: 40, text: 'a rosa falou com o príncipe' },
  { start: 75, text: 'O PRÍNCIPE voltou' },
];
const run = (q: string) => searchLyrics(lines, q, l => l.text, l => [l.start], fmt).map(h => h.item.start);

describe('busca na letra', () => {
  it('ordena por correspondência e, no empate, do início para o fim', () => {
    // exata > começa a frase com a palavra > palavra inteira > começo de palavra
    expect(run('principe')).toEqual([20, 10, 30, 40, 75, 0]);
    expect(run('o principe')).toEqual([30, 75, 40, 0]);
  });
  it('todas as palavras fora de ordem entram por último', () => {
    expect(run('rosa principe')).toEqual([30, 40]);
    expect(run('a rosa')).toEqual([40, 30]);
  });
  it('um tempo completo traz a frase dita naquele momento primeiro', () => {
    expect(run('0:25')[0]).toBe(20);
    expect(run('1:20')[0]).toBe(75);
  });
  it('o começo de um tempo lista as frases daquele trecho na ordem', () => {
    expect(parseTimeQuery('1:')?.seconds).toBeNull();
    expect(run('0:')).toEqual([0, 10, 20, 30, 40]);
  });
});
