import { describe, it, expect } from 'vitest';
import { splitAuthorNames, bookHasAuthor, renameAuthorInField } from '../authorUtils';

describe('vários autores no mesmo audiobook', () => {
  it('separa por vírgula, & e ponto e vírgula', () => {
    expect(splitAuthorNames('Neil Gaiman & Terry Pratchett')).toEqual(['Neil Gaiman', 'Terry Pratchett']);
    expect(splitAuthorNames('Ana, Bruno & Carla')).toEqual(['Ana', 'Bruno', 'Carla']);
    expect(splitAuthorNames('Ana; Bruno')).toEqual(['Ana', 'Bruno']);
    expect(splitAuthorNames('Machado de Assis')).toEqual(['Machado de Assis']);
    expect(splitAuthorNames('Ana & ana, ')).toEqual(['Ana']);
    expect(splitAuthorNames('')).toEqual([]);
  });

  it('o audiobook pertence a cada um dos autores', () => {
    const book = { author: 'Neil Gaiman & Terry Pratchett', authorId: 'x' };
    expect(bookHasAuthor(book, { id: 'a1', name: 'Terry Pratchett' })).toBe(true);
    expect(bookHasAuthor(book, { id: 'a2', name: 'neil gaiman' })).toBe(true);
    expect(bookHasAuthor(book, { id: 'a3', name: 'Neil Gaiman & Terry Pratchett' })).toBe(false);
    expect(bookHasAuthor(book, { id: 'x', name: 'Outro' })).toBe(true);
    expect(bookHasAuthor({ author: 'A', authorId: '', authorIds: ['k1', 'k2'] }, { id: 'k2' })).toBe(true);
  });

  it('renomear um autor mantém os coautores e os separadores', () => {
    expect(renameAuthorInField('Ana, Bruno & Carla', 'Bruno', 'Beto')).toBe('Ana, Beto & Carla');
    expect(renameAuthorInField('Ana', 'Ana', 'Ana Maria')).toBe('Ana Maria');
  });
});
