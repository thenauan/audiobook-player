// ===== Vários autores num mesmo audiobook =====
// O campo de autor pode trazer mais de um nome, separados por vírgula, "&" ou ponto e vírgula
// (ex.: "Neil Gaiman & Terry Pratchett", "Ana, Bruno"). Cada nome é um autor próprio: o audiobook aparece
// na página e na lista de cada um. O texto original continua sendo o que se mostra no audiobook.
import type { Audiobook } from './data';

const SEPARATOR = /\s*(?:,|&|;)\s*/;

const norm = (name: string) => (name || '').trim().toLowerCase();

// "Ana, Bruno & Carla" -> ["Ana", "Bruno", "Carla"] (sem repetidos nem vazios)
export function splitAuthorNames(raw: string | undefined | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of String(raw || '').split(SEPARATOR)) {
    const name = part.trim();
    if (!name || seen.has(norm(name))) continue;
    seen.add(norm(name));
    out.push(name);
  }
  return out;
}

// O nome tem mais de um autor?
export const hasMultipleAuthors = (raw: string | undefined | null) => splitAuthorNames(raw).length > 1;

// Nomes dos autores de um audiobook
export const getBookAuthorNames = (book: Pick<Audiobook, 'author'>) => splitAuthorNames(book.author);

// O audiobook é deste autor? (pelo id cadastrado ou por um dos nomes do campo de autor)
export function bookHasAuthor(
  book: Pick<Audiobook, 'author' | 'authorId'> & { authorIds?: string[] },
  author: { id?: string; name?: string } | null | undefined,
): boolean {
  if (!author) return false;
  if (author.id && (book.authorIds?.includes(author.id) || book.authorId === author.id)) return true;
  const name = norm(author.name || '');
  if (!name) return false;
  return getBookAuthorNames(book).some(n => norm(n) === name);
}

// Troca o nome de um dos autores no campo do audiobook (renomear um autor), mantendo os outros nomes e
// os separadores originais
export function renameAuthorInField(raw: string, oldName: string, newName: string): string {
  const target = norm(oldName);
  return String(raw || '')
    .split(/(\s*(?:,|&|;)\s*)/)
    .map(part => (norm(part) === target ? newName : part))
    .join('');
}
