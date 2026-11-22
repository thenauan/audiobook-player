import { describe, it, expect } from 'vitest';
import { writeAudioTags } from '../audio/tagWriter';
import { parseMp4M4bMetadata } from '../audio/audioMetadata';

const latin1 = (s: string) => Uint8Array.from(s, c => c.charCodeAt(0) & 0xff);
const be32 = (n: number) => new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
const cat = (...p: Uint8Array[]) => { const o = new Uint8Array(p.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; };
const box = (t: string, ...c: Uint8Array[]) => { const b = cat(...c); return cat(be32(b.length + 8), latin1(t), b); };
const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

describe('gravar metadados no arquivo', () => {
  it('M4B: troca os dados, mantém o áudio e corrige os deslocamentos das amostras', async () => {
    const audio = latin1('AUDIODATA');
    const ftyp = box('ftyp', latin1('M4B '), new Uint8Array(4));
    const build = (offset: number) => box('moov',
      box('trak', box('mdia', box('minf', box('stbl', box('stco', new Uint8Array(4), be32(1), be32(offset)))))),
      box('udta', box('meta', new Uint8Array(4), box('ilst', box('\xa9nam', box('data', new Uint8Array([0, 0, 0, 1, 0, 0, 0, 0]), latin1('Velho')))))));
    const moovLen = build(0).length;
    const file = cat(ftyp, build(ftyp.length + moovLen + 8), box('mdat', audio));
    const out = await writeAudioTags(new Blob([file]), 'livro.m4b', { title: 'Título Novo', author: 'Autora', narrator: 'Narrador', year: '2024' });
    expect(out).not.toBeNull();
    const b = await bytes(out!);
    const meta = await parseMp4M4bMetadata(new File([b], 'livro.m4b'));
    expect(meta?.title).toBe('Título Novo');
    expect(meta?.author).toBe('Autora');
    expect(meta?.narrator).toBe('Narrador');
    // O deslocamento gravado no stco aponta exatamente para o áudio, mesmo com o moov maior
    const text = new TextDecoder('latin1').decode(b);
    const stco = text.indexOf('stco');
    const offset = new DataView(b.buffer).getUint32(stco + 12);
    expect(new TextDecoder('latin1').decode(b.subarray(offset, offset + audio.length))).toBe('AUDIODATA');
  });

  it('MP3: troca título e autor e mantém os outros quadros e o áudio', async () => {
    const frame = (id: string, body: Uint8Array) => cat(latin1(id), be32(body.length), new Uint8Array(2), body);
    const frames = cat(frame('TIT2', cat(new Uint8Array([0]), latin1('Velho'))), frame('TXXX', cat(new Uint8Array([0]), latin1('x\0fica'))));
    const ss = (n: number) => new Uint8Array([(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]);
    const file = cat(latin1('ID3'), new Uint8Array([3, 0, 0]), ss(frames.length), frames, latin1('MPEGAUDIO'));
    const out = await writeAudioTags(new Blob([file]), 'livro.mp3', { title: 'Novo', author: 'Autor' });
    const b = await bytes(out!);
    const s = new TextDecoder('latin1').decode(b);
    expect(s.startsWith('ID3')).toBe(true);
    expect(s).not.toContain('Velho');
    expect(s).toContain('fica');
    expect(s.endsWith('MPEGAUDIO')).toBe(true);
    // Título em UTF-16 (ID3v2.3)
    expect(s).toContain('N\0o\0v\0o\0');
  });

  it('formatos sem suporte não são alterados', async () => {
    expect(await writeAudioTags(new Blob([new Uint8Array(10)]), 'livro.flac', { title: 'x', author: 'y' })).toBeNull();
  });
});
