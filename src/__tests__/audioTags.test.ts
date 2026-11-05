// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { parseVorbisComments } from '../audioTags';

// Monta um bloco de comentários Vorbis (tamanhos em little-endian)
const comments = (entries: string[]) => {
  const enc = new TextEncoder();
  const u32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
  const out: number[] = [...u32(3), ...enc.encode('abc'), ...u32(entries.length)];
  entries.forEach(e => { const b = enc.encode(e); out.push(...u32(b.length), ...b); });
  return new Uint8Array(out);
};

describe('comentários Vorbis (Opus, OGG e FLAC)', () => {
  it('lê os campos de um audiobook', () => {
    const tags = parseVorbisComments(comments([
      'TITLE=Dom Casmurro', 'ARTIST=Machado de Assis', 'NARRATOR=Antônio', 'GENRE=Clássicos', 'GENRE=Romance',
      'DATE=1899-01-01', 'LANGUAGE=pt', 'DESCRIPTION=Sinopse',
    ]));
    expect(tags).toMatchObject({ title: 'Dom Casmurro', author: 'Machado de Assis', narrator: 'Antônio', category: 'Clássicos, Romance', year: '1899', language: 'pt', description: 'Sinopse' });
  });

  it('lê capítulos em ordem', () => {
    const tags = parseVorbisComments(comments([
      'CHAPTER002=00:10:00.500', 'CHAPTER002NAME=Dois', 'CHAPTER001=00:00:00.000', 'CHAPTER001NAME=Um',
    ]));
    expect(tags.chapters).toEqual([{ startTime: 0, title: 'Um' }, { startTime: 600.5, title: 'Dois' }]);
  });

  it('chaves em minúsculas e campos ausentes não quebram', () => {
    const tags = parseVorbisComments(comments(['title=Livro', 'semigual', '=vazio']));
    expect(tags.title).toBe('Livro');
    expect(tags.author).toBeUndefined();
  });
});
