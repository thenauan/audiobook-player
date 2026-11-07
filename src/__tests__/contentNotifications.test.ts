import { describe, it, expect } from 'vitest';
import { crossedBookMilestone, pickContentSuggestion } from '../lib/contentNotifications';
import type { Audiobook } from '../data/catalog';

const DAY = 86400000;
const NOW = 1000 * DAY;
const book = (id: string, authorId = 'a') => ({ id, authorId, title: id }) as unknown as Audiobook;

describe('pickContentSuggestion', () => {
  const base = { now: NOW, sent: [] as string[], isCompleted: () => false, isStarted: () => true };

  it('sugere continuar um livro parado há alguns dias', () => {
    const s = pickContentSuggestion({ ...base, books: [book('x')], lastPlayed: { x: NOW - 2 * DAY } });
    expect(s?.kind).toBe('resume');
  });

  it('não sugere nada para um livro ouvido hoje', () => {
    expect(pickContentSuggestion({ ...base, books: [book('x')], lastPlayed: { x: NOW - 3600000 } })).toBeNull();
  });

  it('lembra de um livro esquecido há mais de 30 dias', () => {
    const s = pickContentSuggestion({ ...base, books: [book('x')], lastPlayed: { x: NOW - 40 * DAY } });
    expect(s?.kind).toBe('forgotten');
  });

  it('não repete uma sugestão já enviada', () => {
    const lastPlayed = { x: NOW - 2 * DAY };
    const sent = [`resume:x:${lastPlayed.x}`];
    expect(pickContentSuggestion({ ...base, sent, books: [book('x')], lastPlayed })).toBeNull();
  });

  it('volta a sugerir continuar depois que a pessoa ouviu de novo', () => {
    const sent = [`resume:x:${NOW - 9 * DAY}`];
    const s = pickContentSuggestion({ ...base, sent, books: [book('x')], lastPlayed: { x: NOW - 2 * DAY } });
    expect(s?.kind).toBe('resume');
  });

  it('indica outro livro do mesmo autor depois de terminar um', () => {
    const s = pickContentSuggestion({
      ...base,
      books: [book('fim'), book('novo'), book('outro', 'b')],
      lastPlayed: { fim: NOW - DAY },
      isCompleted: b => b.id === 'fim',
      isStarted: b => b.id === 'fim',
    });
    expect(s).toMatchObject({ kind: 'author', book: { id: 'novo' } });
  });
});

describe('marcações', () => {
  const marked = { ...book('x'), chapters: [{ id: 1, title: 'Cap. 1', bookmarks: [{ id: 'm1', text: 'Trecho bonito', timestamp: 10 }] }] } as unknown as Audiobook;
  const input = { now: NOW, isCompleted: () => true, isStarted: () => true, books: [marked], lastPlayed: { x: NOW - 5 * DAY } };

  it('relembra uma marcação de um livro parado há alguns dias', () => {
    expect(pickContentSuggestion({ ...input, sent: [] })).toMatchObject({ kind: 'bookmark', text: 'Trecho bonito' });
  });

  it('não relembra a mesma marcação duas vezes', () => {
    expect(pickContentSuggestion({ ...input, sent: ['bookmark:x:m1'] })).toBeNull();
  });

  it('não relembra se o livro foi ouvido agora há pouco', () => {
    expect(pickContentSuggestion({ ...input, sent: [], lastPlayed: { x: NOW - DAY } })).toBeNull();
  });
});

describe('crossedBookMilestone', () => {
  it('avisa ao cruzar a metade', () => {
    expect(crossedBookMilestone(4999, 5001, 10000)).toBe('half');
  });

  it('avisa quando faltam 30 minutos', () => {
    expect(crossedBookMilestone(8199, 8201, 10000)).toBe('end');
  });

  it('não avisa em livros curtos nem andando para trás', () => {
    expect(crossedBookMilestone(1700, 1701, 3000)).toBeNull();
    expect(crossedBookMilestone(5001, 4999, 10000)).toBeNull();
  });
});
