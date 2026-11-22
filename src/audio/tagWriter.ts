// ===== Gravar metadados no próprio arquivo de áudio =====
// Depois de editar um audiobook, os dados novos vão para dentro do arquivo, para aparecerem iguais em qualquer outro
// player. MP3 (ID3v2.3/2.4) e M4B/M4A/MP4 (átomos iTunes). Só os campos editados são trocados: capítulos, letra
// sincronizada e o que mais o arquivo tiver continuam lá. O áudio em si não é lido nem copiado (só fatias do Blob).

export interface TagValues {
  title: string;
  author: string;
  narrator?: string;
  genre?: string;
  year?: string;
  description?: string;
  language?: string;
  /** Capa em data URL (JPEG ou PNG). Capas genéricas (SVG) não são gravadas */
  cover?: string;
}

const enc = new TextEncoder();
const latin1 = (s: string) => Uint8Array.from(s, c => c.charCodeAt(0) & 0xff);

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function coverBytes(cover?: string): { mime: string; data: Uint8Array } | null {
  const m = /^data:(image\/(?:jpeg|jpg|png));base64,(.+)$/i.exec(cover || '');
  if (!m) return null;
  const bin = atob(m[2]);
  const data = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  return { mime: m[1].toLowerCase().replace('jpg', 'jpeg'), data };
}

const extOf = (name: string) => (name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '');
export const canWriteTags = (fileName: string) => ['mp3', 'm4b', 'm4a', 'mp4', 'aac'].includes(extOf(fileName));

// ---------- MP3 (ID3v2) ----------
const readSyncsafe = (b: Uint8Array, o: number) => ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);
const syncsafe = (n: number) => new Uint8Array([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]);
const be32 = (n: number) => new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);

function id3Text(version: number, text: string): Uint8Array {
  if (version === 4) return concat([new Uint8Array([3]), enc.encode(text), new Uint8Array([0])]);
  // v2.3: UTF-16 com BOM
  // codificação (1) + BOM (2) + texto + fim (00 00)
  const u = new Uint8Array(3 + text.length * 2 + 2);
  u[0] = 1; u.set([0xff, 0xfe], 1);
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); u[3 + i * 2] = c & 0xff; u[4 + i * 2] = c >> 8; }
  return u;
}

function id3Frame(version: number, id: string, body: Uint8Array): Uint8Array {
  return concat([latin1(id), version === 4 ? syncsafe(body.length) : be32(body.length), new Uint8Array([0, 0]), body]);
}

// Quadros trocados pela edição (os antigos saem, os novos entram)
const ID3_REPLACED = new Set(['TIT2', 'TALB', 'TPE1', 'TPE2', 'TCON', 'TYER', 'TDRC', 'TPE3', 'TCOM', 'TEXT', 'TLAN', 'COMM']);

export async function writeMp3Tags(blob: Blob, v: TagValues): Promise<Blob | null> {
  const head = new Uint8Array(await blob.slice(0, 10).arrayBuffer());
  let version = 3; let tagEnd = 0; const kept: Uint8Array[] = [];
  const cover = coverBytes(v.cover);
  if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) {
    version = head[3] === 4 ? 4 : 3;
    const flags = head[5];
    if (head[3] < 3 || flags & 0x80) return null; // v2.2 ou "unsynchronisation": melhor não mexer
    const size = readSyncsafe(head, 6);
    tagEnd = 10 + size + (flags & 0x10 ? 10 : 0);
    const tag = new Uint8Array(await blob.slice(0, 10 + size).arrayBuffer());
    let off = 10;
    if (flags & 0x40) off += version === 4 ? readSyncsafe(tag, 10) : ((tag[10] << 24) | (tag[11] << 16) | (tag[12] << 8) | tag[13]) + 4;
    while (off + 10 <= tag.length) {
      const id = String.fromCharCode(tag[off], tag[off + 1], tag[off + 2], tag[off + 3]);
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const fsize = version === 4 ? readSyncsafe(tag, off + 4) : ((tag[off + 4] << 24) | (tag[off + 5] << 16) | (tag[off + 6] << 8) | tag[off + 7]) >>> 0;
      if (fsize <= 0 || off + 10 + fsize > tag.length) break;
      const replaced = ID3_REPLACED.has(id) || (id === 'APIC' && cover);
      if (!replaced) kept.push(tag.subarray(off, off + 10 + fsize));
      off += 10 + fsize;
    }
  }
  const frames: Uint8Array[] = [];
  const text = (id: string, value?: string) => { if (value && value.trim()) frames.push(id3Frame(version, id, id3Text(version, value.trim()))); };
  text('TIT2', v.title);
  text('TALB', v.title);
  text('TPE1', v.author);
  text('TPE2', v.author);
  text('TCOM', v.narrator);
  text('TCON', v.genre);
  text(version === 4 ? 'TDRC' : 'TYER', v.year);
  text('TLAN', v.language);
  if (v.description && v.description.trim()) {
    const t = id3Text(version, v.description.trim());
    // COMM: codificação, idioma (3 letras), descrição vazia e o texto
    const nul = version === 4 ? new Uint8Array([0]) : new Uint8Array([0xff, 0xfe, 0, 0]);
    frames.push(id3Frame(version, 'COMM', concat([t.subarray(0, 1), latin1('und'), nul, t.subarray(1)])));
  }
  if (cover) frames.push(id3Frame(version, 'APIC', concat([new Uint8Array([0]), latin1(cover.mime), new Uint8Array([0, 3, 0]), cover.data])));
  const body = concat([...frames, ...kept, new Uint8Array(2048)]);
  const header = concat([latin1('ID3'), new Uint8Array([version, 0, 0]), syncsafe(body.length)]);
  // ID3v1 antigo no fim do arquivo: sai, para não ficar com o título velho
  let end = blob.size;
  if (end - tagEnd > 128) {
    const tail = new Uint8Array(await blob.slice(end - 128, end - 125).arrayBuffer());
    if (tail[0] === 0x54 && tail[1] === 0x41 && tail[2] === 0x47) end -= 128;
  }
  return new Blob([header as BlobPart, body as BlobPart, blob.slice(tagEnd, end)], { type: blob.type || 'audio/mpeg' });
}

// ---------- M4B / M4A / MP4 ----------
interface Box { type: string; start: number; size: number; header: number }

function boxesIn(b: Uint8Array, start: number, end: number): Box[] {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const out: Box[] = [];
  let o = start;
  while (o + 8 <= end) {
    let size = dv.getUint32(o); let header = 8;
    const type = String.fromCharCode(b[o + 4], b[o + 5], b[o + 6], b[o + 7]);
    if (size === 1) { size = Number(dv.getBigUint64(o + 8)); header = 16; } else if (size === 0) size = end - o;
    if (size < header || o + size > end) break;
    out.push({ type, start: o, size, header });
    o += size;
  }
  return out;
}

function box(type: string, ...children: Uint8Array[]): Uint8Array {
  const body = concat(children);
  return concat([be32(body.length + 8), latin1(type), body]);
}
const ilstItem = (type: string, dataType: number, payload: Uint8Array) =>
  box(type, box('data', new Uint8Array([0, 0, 0, dataType, 0, 0, 0, 0]), payload));

const ILST_REPLACED = new Set(['\xa9nam', '\xa9alb', '\xa9ART', 'aART', '\xa9gen', 'gnre', '\xa9day', 'desc', 'ldes', '\xa9des', '\xa9cmt', '\xa9nrt', '\xa9wrt']);
const HDLR_MDIR = new Uint8Array([0, 0, 0, 0x21, 0x68, 0x64, 0x6c, 0x72, 0, 0, 0, 0, 0, 0, 0, 0, 0x6d, 0x64, 0x69, 0x72, 0x61, 0x70, 0x70, 0x6c, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

function newIlst(b: Uint8Array, old: Box | null, v: TagValues): Uint8Array {
  const cover = coverBytes(v.cover);
  const kept = old ? boxesIn(b, old.start + old.header, old.start + old.size)
    .filter(x => !ILST_REPLACED.has(x.type) && !(x.type === 'covr' && cover))
    .map(x => b.subarray(x.start, x.start + x.size)) : [];
  const items: Uint8Array[] = [];
  const text = (type: string, value?: string) => { if (value && value.trim()) items.push(ilstItem(type, 1, enc.encode(value.trim()))); };
  text('\xa9nam', v.title); text('\xa9alb', v.title); text('\xa9ART', v.author); text('aART', v.author);
  text('\xa9nrt', v.narrator); text('\xa9wrt', v.narrator); text('\xa9gen', v.genre); text('\xa9day', v.year);
  text('desc', v.description); text('ldes', v.description);
  if (cover) items.push(ilstItem('covr', cover.mime === 'image/png' ? 14 : 13, cover.data));
  return box('ilst', ...items, ...kept);
}

// Reconstrói um container trocando o filho `type` pelo resultado de `fn` (ou criando, se não existir)
function rebuild(b: Uint8Array, parent: Box, skip: number, type: string, fn: (child: Box | null) => Uint8Array, create = true): Uint8Array {
  const kids = boxesIn(b, parent.start + parent.header + skip, parent.start + parent.size);
  let found = false;
  const parts = kids.map(k => { if (k.type === type && !found) { found = true; return fn(k); } return b.subarray(k.start, k.start + k.size); });
  if (!found && create) parts.push(fn(null));
  const body = concat([b.subarray(parent.start + parent.header, parent.start + parent.header + skip), ...parts]);
  return concat([be32(body.length + 8), latin1(parent.type), body]);
}

// Os deslocamentos das amostras de áudio (stco/co64) mudam quando o moov, antes do mdat, muda de tamanho
function shiftChunkOffsets(b: Uint8Array, start: number, end: number, delta: number) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  for (const k of boxesIn(b, start, end)) {
    if (['trak', 'mdia', 'minf', 'stbl'].includes(k.type)) shiftChunkOffsets(b, k.start + k.header, k.start + k.size, delta);
    else if (k.type === 'stco' || k.type === 'co64') {
      const n = dv.getUint32(k.start + k.header + 4);
      let p = k.start + k.header + 8;
      for (let i = 0; i < n; i++) {
        if (k.type === 'stco') { dv.setUint32(p, dv.getUint32(p) + delta); p += 4; }
        else { dv.setBigUint64(p, dv.getBigUint64(p) + BigInt(delta)); p += 8; }
      }
    }
  }
}

export async function writeMp4Tags(blob: Blob, v: TagValues): Promise<Blob | null> {
  // Caixas do primeiro nível: só os cabeçalhos são lidos
  const top: Box[] = [];
  let o = 0;
  while (o + 8 <= blob.size) {
    const h = new Uint8Array(await blob.slice(o, o + 16).arrayBuffer());
    const dv = new DataView(h.buffer);
    let size = dv.getUint32(0); let header = 8;
    if (size === 1) { size = Number(dv.getBigUint64(8)); header = 16; } else if (size === 0) size = blob.size - o;
    if (size < header) return null;
    top.push({ type: String.fromCharCode(h[4], h[5], h[6], h[7]), start: o, size, header });
    o += size;
  }
  const moov = top.find(x => x.type === 'moov');
  const firstMdat = top.find(x => x.type === 'mdat');
  if (!moov || moov.header !== 8) return null;
  const b = new Uint8Array(await blob.slice(moov.start, moov.start + moov.size).arrayBuffer());
  const root: Box = { type: 'moov', start: 0, size: b.length, header: 8 };
  let out = rebuild(b, root, 0, 'udta', udta => {
    if (!udta) return box('udta', box('meta', new Uint8Array(4), HDLR_MDIR, newIlst(b, null, v)));
    return rebuild(b, udta, 0, 'meta', meta => {
      if (!meta) return box('meta', new Uint8Array(4), HDLR_MDIR, newIlst(b, null, v));
      return rebuild(b, meta, 4, 'ilst', ilst => newIlst(b, ilst, v));
    });
  });
  const delta = out.length - b.length;
  if (delta !== 0 && firstMdat && firstMdat.start > moov.start) {
    out = new Uint8Array(out); // cópia própria para editar
    shiftChunkOffsets(out, 8, out.length, delta);
  }
  return new Blob([blob.slice(0, moov.start), out as BlobPart, blob.slice(moov.start + moov.size)], { type: blob.type || 'audio/mp4' });
}

export async function writeAudioTags(blob: Blob, fileName: string, v: TagValues): Promise<Blob | null> {
  const ext = extOf(fileName);
  try {
    if (ext === 'mp3') return await writeMp3Tags(blob, v);
    if (['m4b', 'm4a', 'mp4', 'aac'].includes(ext)) return await writeMp4Tags(blob, v);
  } catch (err) {
    console.warn('Could not write tags:', err);
  }
  return null;
}

// ---------- Juntar MP3s de capítulos num audiobook só (audiobooks da LibriVox) ----------
// Os arquivos de cada capítulo viram um MP3 único com os capítulos marcados (quadros CHAP/CTOC do ID3), a capa e os
// dados. O áudio não é recodificado: os quadros MP3 de cada parte são colados na ordem.
const BR1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] } as Record<number, number[]>;

export interface Mp3Part { bytes: Uint8Array; durationMs: number }

// Só os quadros de áudio da parte (sem ID3, sem ID3v1 e sem o quadro Xing/Info, que diria a duração errada no meio)
export function mp3AudioFrames(b: Uint8Array): Mp3Part {
  let o = 0;
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) o = 10 + readSyncsafe(b, 6) + (b[5] & 0x10 ? 10 : 0);
  let end = b.length;
  if (end - o > 128 && b[end - 128] === 0x54 && b[end - 127] === 0x41 && b[end - 126] === 0x47) end -= 128;
  // Primeiro quadro válido
  while (o + 4 < end && !(b[o] === 0xff && (b[o + 1] & 0xe0) === 0xe0)) o++;
  const chunks: Uint8Array[] = [];
  let samples = 0; let rate = 0; let first = true; let runStart = o;
  while (o + 4 <= end) {
    if (b[o] !== 0xff || (b[o + 1] & 0xe0) !== 0xe0) break;
    const ver = (b[o + 1] >> 3) & 3; const layer = (b[o + 1] >> 1) & 3;
    const brIdx = b[o + 2] >> 4; const srIdx = (b[o + 2] >> 2) & 3; const pad = (b[o + 2] >> 1) & 1;
    if (layer !== 1 || ver === 1 || brIdx === 0 || brIdx === 15 || srIdx === 3) break;
    const sr = SR[ver][srIdx]; const br = (ver === 3 ? BR1 : BR2)[brIdx];
    const len = Math.floor((ver === 3 ? 144000 : 72000) * br / sr) + pad;
    if (len < 24 || o + len > end) break;
    if (first) {
      first = false;
      const mono = (b[o + 3] >> 6) === 3;
      const x = o + (ver === 3 ? (mono ? 21 : 36) : (mono ? 13 : 21));
      const tag = String.fromCharCode(b[x], b[x + 1], b[x + 2], b[x + 3]);
      if (tag === 'Xing' || tag === 'Info') { o += len; runStart = o; continue; }
    }
    samples += ver === 3 ? 1152 : 576; rate = sr;
    o += len;
  }
  chunks.push(b.subarray(runStart, o));
  return { bytes: chunks[0], durationMs: rate ? Math.round(samples / rate * 1000) : 0 };
}

export function buildChapteredMp3(parts: Mp3Part[], titles: string[], v: TagValues): Blob {
  const version = 3;
  const frames: Uint8Array[] = [];
  const text = (id: string, value?: string) => { if (value && value.trim()) frames.push(id3Frame(version, id, id3Text(version, value.trim()))); };
  text('TIT2', v.title); text('TALB', v.title); text('TPE1', v.author); text('TPE2', v.author);
  text('TCOM', v.narrator); text('TCON', v.genre); text('TYER', v.year); text('TLAN', v.language);
  if (v.description && v.description.trim()) {
    const t = id3Text(version, v.description.trim());
    frames.push(id3Frame(version, 'COMM', concat([t.subarray(0, 1), latin1('und'), new Uint8Array([0xff, 0xfe, 0, 0]), t.subarray(1)])));
  }
  const cover = coverBytes(v.cover);
  if (cover) frames.push(id3Frame(version, 'APIC', concat([new Uint8Array([0]), latin1(cover.mime), new Uint8Array([0, 3, 0]), cover.data])));
  // Capítulos: um CHAP por parte e o índice (CTOC) com todos, na ordem
  const ids: string[] = [];
  let start = 0;
  parts.slice(0, 255).forEach((p, i) => {
    const id = `ch${i}`; ids.push(id);
    const endMs = start + p.durationMs;
    frames.push(id3Frame(version, 'CHAP', concat([
      latin1(id), new Uint8Array([0]), be32(start), be32(endMs), be32(0xffffffff), be32(0xffffffff),
      id3Frame(version, 'TIT2', id3Text(version, titles[i] || `${i + 1}`)),
    ])));
    start = endMs;
  });
  if (ids.length) frames.push(id3Frame(version, 'CTOC', concat([latin1('toc'), new Uint8Array([0, 0x03, ids.length]), ...ids.map(id => concat([latin1(id), new Uint8Array([0])]))])));
  const body = concat([...frames, new Uint8Array(2048)]);
  const header = concat([latin1('ID3'), new Uint8Array([version, 0, 0]), syncsafe(body.length)]);
  return new Blob([header as BlobPart, body as BlobPart, ...parts.map(p => p.bytes as BlobPart)], { type: 'audio/mpeg' });
}
