import { describe, it, expect } from 'vitest';
import { authorMatches } from '../lib/onlineCatalog';

describe('mesmo autor', () => {
  it('aceita o nome completo e o formato de catálogo', () => {
    expect(authorMatches('Machado de Assis', 'Joaquim Maria Machado de Assis')).toBe(true);
    expect(authorMatches('Machado de Assis', 'Assis, Machado de')).toBe(true);
    expect(authorMatches('J. K. Rowling', 'J.K. Rowling')).toBe(true);
  });
  it('não aceita outro autor com o mesmo sobrenome', () => {
    expect(authorMatches('Machado de Assis', 'Gonçalves de Assis')).toBe(false);
    expect(authorMatches('Machado de Assis', 'Assis Chateaubriand')).toBe(false);
    expect(authorMatches('Charlotte Brontë', 'Emily Brontë')).toBe(false);
  });
});
