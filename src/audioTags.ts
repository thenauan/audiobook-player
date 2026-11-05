// ===== Metadados de formatos além de MP3 e M4B =====
// Opus e OGG (comentários Vorbis), FLAC, WAV (LIST INFO) e WMA (ASF): título, autor, narrador, gênero, ano,
// descrição, idioma, capa, capítulos, letra e duração. Lê só as partes do arquivo que guardam essas informações.

export interface AudioTags {
  title?: string;
  author?: string;
  narrator?: string;
  category?: string;
  subgenre?: string;
  year?: string;
  description?: string;
  language?: string;
  lyrics?: string;
  coverBlob?: Blob;
  chapters?: { title: string; startTime: number }[];
  durationSec?: number;
}

const utf8 = new TextDecoder('utf-8');
const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));
const le32 = (b: Uint8Array, at: number) => (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0;
const be32 = (b: Uint8Array, at: number) => ((b[at] << 24) | (b[at + 1] << 16) | (b[at + 2] << 8) | b[at + 3]) >>> 0;
const readBytes = async (file: Blob, from: number, to: number) => new Uint8Array(await file.slice(from, to).arrayBuffer());

function parseClock(value: string): number | null {
  const parts = value.trim().replace(',', '.').split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(n => !isFinite(n))) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

// Bloco de imagem do FLAC (também usado, em base64, nos comentários do Opus e do OGG)
function parsePictureBlock(b: Uint8Array): Blob | undefined {
  let at = 4;
  const mimeLen = be32(b, at); at += 4;
  const mime = ascii(b, at, mimeLen); at += mimeLen;
  at += 4 + be32(b, at); // descrição
  at += 16; // largura, altura, cores
  const size = be32(b, at); at += 4;
  if (size === 0 || at + size > b.length) return undefined;
  return new Blob([b.slice(at, at + size)], { type: mime || 'image/jpeg' });
}

function base64Bytes(text: string): Uint8Array | null {
  try {
    const bin = atob(text.replace(/\s+/g, ''));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

// Comentários Vorbis: "CHAVE=valor". A mesma chave pode repetir (ex.: dois gêneros)
export function parseVorbisComments(b: Uint8Array, start = 0): AudioTags {
  const map = new Map<string, string[]>();
  let at = start;
  at += 4 + le32(b, at); // fornecedor
  const count = le32(b, at); at += 4;
  for (let i = 0; i < count && at + 4 <= b.length; i++) {
    const len = le32(b, at); at += 4;
    if (at + len > b.length) break;
    const entry = utf8.decode(b.subarray(at, at + len));
    at += len;
    const eq = entry.indexOf('=');
    if (eq <= 0) continue;
    const key = entry.slice(0, eq).toUpperCase();
    map.set(key, [...(map.get(key) || []), entry.slice(eq + 1)]);
  }
  const first = (...keys: string[]) => {
    for (const k of keys) {
      const v = map.get(k)?.find(x => x.trim());
      if (v) return v.trim();
    }
    return undefined;
  };
  const tags: AudioTags = {
    title: first('TITLE', 'ALBUM'),
    author: first('ARTIST', 'ALBUMARTIST', 'ALBUM ARTIST', 'AUTHOR', 'WRITER'),
    narrator: first('NARRATOR', 'NARRATEDBY', 'PERFORMER', 'READER', 'COMPOSER'),
    category: map.get('GENRE')?.map(v => v.trim()).filter(Boolean).join(', ') || undefined,
    subgenre: first('SUBGENRE', 'GROUPING'),
    year: first('DATE', 'YEAR', 'ORIGINALDATE')?.slice(0, 4),
    description: first('DESCRIPTION', 'SYNOPSIS', 'SUMMARY', 'COMMENT'),
    language: first('LANGUAGE', 'LANG'),
    lyrics: first('LYRICS', 'UNSYNCEDLYRICS', 'SYNCEDLYRICS'),
  };
  const chapters: { title: string; startTime: number }[] = [];
  map.forEach((values, key) => {
    const m = key.match(/^CHAPTER(\d+)$/);
    if (!m) return;
    const time = parseClock(values[0]);
    if (time !== null) chapters.push({ startTime: time, title: map.get(`CHAPTER${m[1]}NAME`)?.[0]?.trim() || '' });
  });
  if (chapters.length > 0) tags.chapters = chapters.sort((a, c) => a.startTime - c.startTime);
  const picture = first('METADATA_BLOCK_PICTURE');
  if (picture) {
    const bytes = base64Bytes(picture);
    if (bytes) { try { tags.coverBlob = parsePictureBlock(bytes); } catch { /* imagem inválida */ } }
  }
  const legacyCover = first('COVERART');
  if (!tags.coverBlob && legacyCover) {
    const bytes = base64Bytes(legacyCover);
    if (bytes) tags.coverBlob = new Blob([bytes.slice()], { type: first('COVERARTMIME') || 'image/jpeg' });
  }
  return tags;
}

async function parseFlac(file: Blob): Promise<AudioTags> {
  let tags: AudioTags = {};
  let durationSec: number | undefined;
  let cover: Blob | undefined;
  let at = 4;
  for (let i = 0; i < 64 && at + 4 <= file.size; i++) {
    const head = await readBytes(file, at, at + 4);
    const last = (head[0] & 0x80) !== 0;
    const type = head[0] & 0x7f;
    const size = (head[1] << 16) | (head[2] << 8) | head[3];
    at += 4;
    if (type === 0 || type === 4 || (type === 6 && !cover)) {
      const b = await readBytes(file, at, at + size);
      if (type === 0) {
        const rate = (b[10] << 12) | (b[11] << 4) | (b[12] >> 4);
        const samples = (b[13] & 0x0f) * 2 ** 32 + be32(b, 14);
        if (rate > 0 && samples > 0) durationSec = samples / rate;
      } else if (type === 4) {
        tags = parseVorbisComments(b);
      } else {
        try { cover = parsePictureBlock(b); } catch { /* imagem inválida */ }
      }
    }
    at += size;
    if (last) break;
  }
  return { ...tags, coverBlob: tags.coverBlob || cover, durationSec };
}

// Ogg (Opus e Vorbis): junta as páginas até ter os dois primeiros pacotes (identificação e comentários, que pode
// ocupar muitas páginas por causa da capa). A duração vem da posição da última página.
async function parseOgg(file: Blob): Promise<AudioTags> {
  const head = await readBytes(file, 0, Math.min(file.size, 48 * 1024 * 1024));
  const packets: Uint8Array[] = [];
  let current: Uint8Array[] = [];
  let at = 0;
  while (packets.length < 2 && at + 27 <= head.length && ascii(head, at, 4) === 'OggS') {
    const segments = head[at + 26];
    let body = at + 27 + segments;
    for (let i = 0; i < segments; i++) {
      const lace = head[at + 27 + i];
      current.push(head.subarray(body, body + lace));
      body += lace;
      if (lace < 255) {
        const total = current.reduce((n, c) => n + c.length, 0);
        const packet = new Uint8Array(total);
        let w = 0;
        current.forEach(c => { packet.set(c, w); w += c.length; });
        packets.push(packet);
        current = [];
        if (packets.length === 2) break;
      }
    }
    at = body;
  }
  const [id, comments] = packets;
  if (!id) return {};
  const isOpus = ascii(id, 0, 8) === 'OpusHead';
  const isVorbis = ascii(id, 1, 6) === 'vorbis';
  if (!isOpus && !isVorbis) return {};
  const rate = isOpus ? 48000 : le32(id, 12);
  const preSkip = isOpus ? id[10] | (id[11] << 8) : 0;
  let tags: AudioTags = {};
  if (comments) {
    if (isOpus && ascii(comments, 0, 8) === 'OpusTags') tags = parseVorbisComments(comments, 8);
    else if (isVorbis && ascii(comments, 1, 6) === 'vorbis') tags = parseVorbisComments(comments, 7);
  }
  const tail = await readBytes(file, Math.max(0, file.size - 128 * 1024), file.size);
  for (let i = tail.length - 27; i >= 0; i--) {
    if (tail[i] === 0x4f && tail[i + 1] === 0x67 && tail[i + 2] === 0x67 && tail[i + 3] === 0x53) {
      const granule = le32(tail, i + 6) + le32(tail, i + 10) * 2 ** 32;
      if (rate > 0 && granule > preSkip && granule < 2 ** 52) tags.durationSec = (granule - preSkip) / rate;
      break;
    }
  }
  return tags;
}

// Bloco "id3 " de um WAV (capa, capítulos, letra): lido como as etiquetas de um MP3
export async function findWavId3Chunk(file: Blob): Promise<Blob | null> {
  const head = await readBytes(file, 0, 12);
  if (ascii(head, 0, 4) !== 'RIFF' || ascii(head, 8, 4) !== 'WAVE') return null;
  let at = 12;
  for (let i = 0; i < 64 && at + 8 <= file.size; i++) {
    const chunk = await readBytes(file, at, at + 8);
    const id = ascii(chunk, 0, 4).toLowerCase();
    const size = le32(chunk, 4);
    if (id === 'id3 ') return file.slice(at + 8, at + 8 + size);
    at += 8 + size + (size % 2);
  }
  return null;
}

async function parseWav(file: Blob): Promise<AudioTags> {
  const tags: AudioTags = {};
  let at = 12;
  for (let i = 0; i < 64 && at + 8 <= file.size; i++) {
    const head = await readBytes(file, at, at + 12);
    const id = ascii(head, 0, 4);
    const size = le32(head, 4);
    if (id === 'LIST' && ascii(head, 8, 4) === 'INFO' && size < 4 * 1024 * 1024) {
      const b = await readBytes(file, at + 12, at + 8 + size);
      let p = 0;
      while (p + 8 <= b.length) {
        const key = ascii(b, p, 4);
        const len = le32(b, p + 4);
        const value = utf8.decode(b.subarray(p + 8, p + 8 + len)).replace(/\0+$/, '').trim();
        p += 8 + len + (len % 2);
        if (!value) continue;
        if (key === 'INAM') tags.title = value;
        else if (key === 'IART') tags.author = value;
        else if (key === 'IGNR') tags.category = value;
        else if (key === 'ICRD') tags.year = value.slice(0, 4);
        else if (key === 'ICMT' || key === 'ISBJ') tags.description = tags.description || value;
        else if (key === 'ILNG') tags.language = value;
      }
    }
    at += 8 + size + (size % 2);
  }
  return tags;
}

// WMA (ASF): objetos de descrição dentro do cabeçalho
const GUID_HEADER = '3026b2758e66cf11a6d900aa0062ce6c';
const GUID_CONTENT = '3326b2758e66cf11a6d900aa0062ce6c';
const GUID_EXTENDED = '40a4d0d207e3d21197f000a0c95ea850';
const GUID_FILE = 'a1dcab8c47a9cf118ee400c00c205365';
const hex = (b: Uint8Array, at: number) => Array.from(b.subarray(at, at + 16)).map(x => x.toString(16).padStart(2, '0')).join('');
const utf16 = (b: Uint8Array, at: number, len: number) => new TextDecoder('utf-16le').decode(b.subarray(at, at + len)).replace(/\0+$/, '').trim();

async function parseAsf(file: Blob): Promise<AudioTags> {
  const start = await readBytes(file, 0, 30);
  const headerSize = le32(start, 16);
  const b = await readBytes(file, 0, Math.min(file.size, headerSize, 32 * 1024 * 1024));
  const tags: AudioTags = {};
  let at = 30;
  while (at + 24 <= b.length) {
    const guid = hex(b, at);
    const size = le32(b, at + 16);
    if (size < 24) break;
    if (guid === GUID_CONTENT) {
      const lens = [0, 1, 2, 3, 4].map(i => b[at + 24 + i * 2] | (b[at + 25 + i * 2] << 8));
      let p = at + 34;
      const values = lens.map(len => { const v = utf16(b, p, len); p += len; return v; });
      tags.title = values[0] || undefined;
      tags.author = values[1] || undefined;
      tags.description = values[3] || undefined;
    } else if (guid === GUID_EXTENDED) {
      let p = at + 26;
      const count = b[at + 24] | (b[at + 25] << 8);
      for (let i = 0; i < count && p + 6 <= at + size; i++) {
        const nameLen = b[p] | (b[p + 1] << 8);
        const name = utf16(b, p + 2, nameLen);
        p += 2 + nameLen;
        const kind = b[p] | (b[p + 1] << 8);
        const valueLen = b[p + 2] | (b[p + 3] << 8);
        p += 4;
        if (kind === 0) {
          const value = utf16(b, p, valueLen);
          if (name === 'WM/AlbumTitle' && !tags.title) tags.title = value;
          else if (name === 'WM/AlbumArtist' && !tags.author) tags.author = value;
          else if (name === 'WM/Genre') tags.category = value;
          else if (name === 'WM/Year') tags.year = value.slice(0, 4);
          else if (name === 'WM/Language') tags.language = value;
          else if (name === 'WM/Lyrics') tags.lyrics = value;
        }
        p += valueLen;
      }
    } else if (guid === GUID_FILE) {
      // Duração em unidades de 100 ns, descontando o atraso inicial (ms)
      const play = le32(b, at + 64) + le32(b, at + 68) * 2 ** 32;
      const preroll = le32(b, at + 80);
      if (play > 0) tags.durationSec = Math.max(0, play / 1e7 - preroll / 1000);
    }
    at += size;
  }
  return tags;
}

export async function parseContainerTags(file: Blob): Promise<AudioTags | null> {
  try {
    const head = await readBytes(file, 0, 16);
    const magic = ascii(head, 0, 4);
    if (magic === 'fLaC') return await parseFlac(file);
    if (magic === 'OggS') return await parseOgg(file);
    if (magic === 'RIFF' && ascii(head, 8, 4) === 'WAVE') return await parseWav(file);
    if (hex(head, 0) === GUID_HEADER) return await parseAsf(file);
  } catch (err) {
    console.warn('Não foi possível ler os metadados do áudio:', err);
  }
  return null;
}
