import { describe, it, expect } from 'vitest';
import {
  getAuthorInitials,
  getDefaultAuthorColor,
  getCoverTones,
  parseMp4M4bMetadata,
  parseAudioMetadata,
} from '../audioUtils';
import { normalizeAudiobookLanguage } from '../translations';

describe('Audiobook Metadata & Color Transformations', () => {
  describe('getAuthorInitials', () => {
    it('returns empty string for null, undefined or empty input', () => {
      expect(getAuthorInitials('')).toBe('');
      expect(getAuthorInitials(null as any)).toBe('');
      expect(getAuthorInitials(undefined as any)).toBe('');
    });

    it('extracts single initial for single name', () => {
      expect(getAuthorInitials('Aristóteles')).toBe('A');
      expect(getAuthorInitials('Platão')).toBe('P');
      expect(getAuthorInitials('Homero')).toBe('H');
    });

    it('extracts first and last initials for multi-word names', () => {
      expect(getAuthorInitials('Machado de Assis')).toBe('MA');
      expect(getAuthorInitials('Clarice Lispector')).toBe('CL');
      expect(getAuthorInitials('Gabriel García Márquez')).toBe('GM');
      expect(getAuthorInitials('Fiódor Dostoiévski')).toBe('FD');
    });

    it('handles titles with parentheses, quotes or brackets', () => {
      expect(getAuthorInitials('"Machado de Assis" (Org.)')).toBe('MO');
      expect(getAuthorInitials('J. K. Rowling')).toBe('JR');
    });
  });

  describe('getDefaultAuthorColor and getCoverTones', () => {
    it('generates consistent deterministic colors for author names', () => {
      const color1 = getDefaultAuthorColor('Machado de Assis');
      const color2 = getDefaultAuthorColor('Machado de Assis');
      expect(color1).toBe(color2);
      expect(color1.startsWith('#')).toBe(true);
    });

    it('getCoverTones computes complementary light/dark contrast and gradients', () => {
      const lightTones = getCoverTones('#ffffff');
      expect(lightTones.isLight).toBe(true);
      expect(lightTones.textColor.startsWith('#')).toBe(true);
      expect(lightTones.gradStart.startsWith('#')).toBe(true);
      expect(lightTones.gradEnd.startsWith('#')).toBe(true);

      const darkTones = getCoverTones('#1e1e24');
      expect(darkTones.isLight).toBe(false);
      expect(darkTones.textColor.startsWith('#')).toBe(true);
      expect(darkTones.gradStart.startsWith('#')).toBe(true);
      expect(darkTones.gradEnd.startsWith('#')).toBe(true);
    });
  });

  describe('normalizeAudiobookLanguage', () => {
    it('normalizes common language names into canonical representations', () => {
      expect(normalizeAudiobookLanguage('Português')).toBe('Português');
      expect(normalizeAudiobookLanguage('portugues')).toBe('Português');
      expect(normalizeAudiobookLanguage('pt-BR')).toBe('Português');
      expect(normalizeAudiobookLanguage('pt')).toBe('Português');

      expect(normalizeAudiobookLanguage('English')).toBe('Inglês');
      expect(normalizeAudiobookLanguage('en')).toBe('Inglês');
      expect(normalizeAudiobookLanguage('en-US')).toBe('Inglês');

      expect(normalizeAudiobookLanguage('Español')).toBe('Espanhol');
      expect(normalizeAudiobookLanguage('es')).toBe('Espanhol');
    });

    it('filters out undefined and unknown placeholders', () => {
      expect(normalizeAudiobookLanguage(undefined)).toBeUndefined();
      expect(normalizeAudiobookLanguage('')).toBeUndefined();
      expect(normalizeAudiobookLanguage('desconhecido')).toBeUndefined();
      expect(normalizeAudiobookLanguage('unknown')).toBeUndefined();
    });
  });

  describe('parseMp4M4bMetadata container validation', () => {
    it('rejects files without an ISO-BMFF / ftyp container header', async () => {
      // 32 zero bytes (no ftyp box)
      const fakeBlob = new Blob([new Uint8Array(32)]);
      const fakeFile = new File([fakeBlob], 'audio.mp3', { type: 'audio/mpeg' });

      const result = await parseMp4M4bMetadata(fakeFile);
      expect(result).toBeNull();
    });

    it('recognizes ftyp signature and extracts metadata when moov is present', async () => {
      // Create minimal buffer with ftyp box (32 bytes) + empty moov box (8 bytes)
      const buffer = new Uint8Array(40);
      // ftyp box size = 32
      buffer[0] = 0; buffer[1] = 0; buffer[2] = 0; buffer[3] = 32;
      // 'f', 't', 'y', 'p'
      buffer[4] = 0x66; buffer[5] = 0x74; buffer[6] = 0x79; buffer[7] = 0x70;
      // major brand 'M4B '
      buffer[8] = 0x4d; buffer[9] = 0x34; buffer[10] = 0x42; buffer[11] = 0x20;

      // moov box size = 8
      buffer[32] = 0; buffer[33] = 0; buffer[34] = 0; buffer[35] = 8;
      // 'm', 'o', 'o', 'v'
      buffer[36] = 0x6d; buffer[37] = 0x6f; buffer[38] = 0x6f; buffer[39] = 0x76;

      const fakeFile = new File([new Blob([buffer])], 'book.m4b', { type: 'audio/mp4' });
      const result = await parseMp4M4bMetadata(fakeFile);
      expect(result).not.toBeNull();
      expect(result?.chapters || []).toEqual([]);
    });

    it('extracts duration from mvhd movie header box', async () => {
      function makeBox(type: string, payload: Uint8Array): Uint8Array {
        const size = payload.length + 8;
        const box = new Uint8Array(size);
        box[0] = (size >> 24) & 0xff;
        box[1] = (size >> 16) & 0xff;
        box[2] = (size >> 8) & 0xff;
        box[3] = size & 0xff;
        for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i);
        box.set(payload, 8);
        return box;
      }

      const ftyp = makeBox('ftyp', new TextEncoder().encode('M4B \0\0\0\0'));
      // mvhd version 0: 4 bytes ver/flags, 4 bytes create, 4 bytes mod, 4 bytes timescale (1000), 4 bytes duration (7200000 = 7200s)
      const mvhdPayload = new Uint8Array(20);
      const view = new DataView(mvhdPayload.buffer);
      view.setUint32(12, 1000); // timescale
      view.setUint32(16, 7200000); // duration = 7200s (2h)
      const mvhd = makeBox('mvhd', mvhdPayload);

      const moov = makeBox('moov', mvhd);
      const total = new Uint8Array(ftyp.length + moov.length);
      total.set(ftyp, 0);
      total.set(moov, ftyp.length);

      const fakeFile = new File([new Blob([total])], 'test.m4b', { type: 'audio/mp4' });
      const result = await parseMp4M4bMetadata(fakeFile);
      expect(result).not.toBeNull();
      expect(result?.durationSec).toBe(7200);
    });

    it('extracts Nero chapters from moov -> udta -> chpl', async () => {
      function makeBox(type: string, payload: Uint8Array): Uint8Array {
        const size = payload.length + 8;
        const box = new Uint8Array(size);
        box[0] = (size >> 24) & 0xff;
        box[1] = (size >> 16) & 0xff;
        box[2] = (size >> 8) & 0xff;
        box[3] = size & 0xff;
        for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i);
        box.set(payload, 8);
        return box;
      }

      // Nero chpl payload: 4 bytes version/flags (0), 1 byte reserved (0), 4 bytes chapter count (2)
      // Chap 1: 8 bytes 100ns (0), 1 byte len, 'Capítulo 1'
      // Chap 2: 8 bytes 100ns (120s = 1200000000 units), 1 byte len, 'Capítulo 2'
      const title1 = new TextEncoder().encode('Capítulo 1');
      const title2 = new TextEncoder().encode('Capítulo 2');

      const chplPayload = new Uint8Array(9 + (8 + 1 + title1.length) + (8 + 1 + title2.length));
      const view = new DataView(chplPayload.buffer);
      view.setUint32(5, 2); // 2 chapters

      let p = 9;
      // Chap 1: time 0
      p += 8;
      chplPayload[p++] = title1.length;
      chplPayload.set(title1, p);
      p += title1.length;

      // Chap 2: time 120s
      const time120sUnits = BigInt(120) * 10000000n;
      view.setUint32(p, Number(time120sUnits >> 32n));
      view.setUint32(p + 4, Number(time120sUnits & 0xffffffffn));
      p += 8;
      chplPayload[p++] = title2.length;
      chplPayload.set(title2, p);

      const chplBox = makeBox('chpl', chplPayload);
      const udtaBox = makeBox('udta', chplBox);
      const moovBox = makeBox('moov', udtaBox);
      const ftypBox = makeBox('ftyp', new TextEncoder().encode('M4B '));

      const total = new Uint8Array(ftypBox.length + moovBox.length);
      total.set(ftypBox, 0);
      total.set(moovBox, ftypBox.length);

      const fakeFile = new File([new Blob([total])], 'nero.m4b', { type: 'audio/mp4' });
      const result = await parseMp4M4bMetadata(fakeFile);
      expect(result).not.toBeNull();
      expect(result?.chapters).toHaveLength(2);
      expect(result?.chapters?.[0]).toEqual({ title: 'Capítulo 1', startTime: 0 });
      expect(result?.chapters?.[1]).toEqual({ title: 'Capítulo 2', startTime: 120 });
    });

    it('extracts Apple Timed Text chapter track with titles from samples (tx3g / text)', async () => {
      function makeBox(type: string, payload: Uint8Array): Uint8Array {
        const size = payload.length + 8;
        const box = new Uint8Array(size);
        box[0] = (size >> 24) & 0xff;
        box[1] = (size >> 16) & 0xff;
        box[2] = (size >> 8) & 0xff;
        box[3] = size & 0xff;
        for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i);
        box.set(payload, 8);
        return box;
      }

      function concat(...arrays: Uint8Array[]): Uint8Array {
        const totalLen = arrays.reduce((acc, curr) => acc + curr.length, 0);
        const res = new Uint8Array(totalLen);
        let off = 0;
        for (const arr of arrays) {
          res.set(arr, off);
          off += arr.length;
        }
        return res;
      }

      // 1. Prepare chapter title samples
      const text1 = new TextEncoder().encode('01 - Introdução');
      const sample1 = new Uint8Array(2 + text1.length);
      sample1[0] = 0; sample1[1] = text1.length;
      sample1.set(text1, 2);

      const text2 = new TextEncoder().encode('02 - O Enigma');
      const sample2 = new Uint8Array(2 + text2.length);
      sample2[0] = 0; sample2[1] = text2.length;
      sample2.set(text2, 2);

      // 2. Build track sample table (stbl)
      // stsd with tx3g entry
      const tx3gEntry = makeBox('tx3g', new Uint8Array(24));
      const stsdPayload = new Uint8Array(8 + tx3gEntry.length);
      const stsdView = new DataView(stsdPayload.buffer);
      stsdView.setUint32(4, 1); // 1 entry
      stsdPayload.set(tx3gEntry, 8);
      const stsdBox = makeBox('stsd', stsdPayload);

      // stts (time to sample): 2 samples, each 300s (timescale = 1000 => delta = 300000)
      const sttsPayload = new Uint8Array(8 + 8 + 8);
      const sttsView = new DataView(sttsPayload.buffer);
      sttsView.setUint32(4, 2); // 2 entries
      sttsView.setUint32(8, 1); // count
      sttsView.setUint32(12, 300000); // delta = 300s
      sttsView.setUint32(16, 1); // count
      sttsView.setUint32(20, 450000); // delta = 450s
      const sttsBox = makeBox('stts', sttsPayload);

      // stsz (sample sizes)
      const stszPayload = new Uint8Array(12 + 8);
      const stszView = new DataView(stszPayload.buffer);
      stszView.setUint32(4, 0); // uniform size = 0
      stszView.setUint32(8, 2); // 2 samples
      stszView.setUint32(12, sample1.length);
      stszView.setUint32(16, sample2.length);
      const stszBox = makeBox('stsz', stszPayload);

      // stsc (sample to chunk)
      const stscPayload = new Uint8Array(8 + 12);
      const stscView = new DataView(stscPayload.buffer);
      stscView.setUint32(4, 1); // 1 entry
      stscView.setUint32(8, 1); // first chunk = 1
      stscView.setUint32(12, 1); // 1 sample per chunk
      stscView.setUint32(16, 1); // desc index = 1
      const stscBox = makeBox('stsc', stscPayload);

      // We will place samples right after ftyp and moov.
      // Let's first build mdia, minf, trak without stco to calculate offsets
      const hdlrPayload = new Uint8Array(24);
      // handler_type at offset 8 = 'text'
      hdlrPayload[8] = 0x74; hdlrPayload[9] = 0x65; hdlrPayload[10] = 0x78; hdlrPayload[11] = 0x74;
      const hdlrBox = makeBox('hdlr', hdlrPayload);

      // mdhd with timescale = 1000
      const mdhdPayload = new Uint8Array(24);
      const mdhdView = new DataView(mdhdPayload.buffer);
      mdhdView.setUint32(12, 1000); // timescale
      const mdhdBox = makeBox('mdhd', mdhdPayload);

      // tkhd with track_id = 2
      const tkhdPayload = new Uint8Array(24);
      const tkhdView = new DataView(tkhdPayload.buffer);
      tkhdView.setUint32(12, 2); // track id
      const tkhdBox = makeBox('tkhd', tkhdPayload);

      // stco placeholder with 2 chunks
      const stcoPayload = new Uint8Array(8 + 8);
      const stcoView = new DataView(stcoPayload.buffer);
      stcoView.setUint32(4, 2); // 2 chunks
      const stcoBox = makeBox('stco', stcoPayload);

      const stblBox = makeBox('stbl', concat(stsdBox, sttsBox, stszBox, stscBox, stcoBox));
      const minfBox = makeBox('minf', stblBox);
      const mdiaBox = makeBox('mdia', concat(mdhdBox, hdlrBox, minfBox));
      const trakBox = makeBox('trak', concat(tkhdBox, mdiaBox));
      const moovBox = makeBox('moov', trakBox);
      const ftypBox = makeBox('ftyp', new TextEncoder().encode('M4B '));

      // Calculate sample offset: placed immediately after ftyp and moov
      const sample1Offset = ftypBox.length + moovBox.length;
      const sample2Offset = sample1Offset + sample1.length;

      // Update stco with real offsets by locating 'stco' in moovBox
      for (let i = 0; i < moovBox.length - 8; i++) {
        if (moovBox[i] === 0x73 && moovBox[i + 1] === 0x74 && moovBox[i + 2] === 0x63 && moovBox[i + 3] === 0x6f) {
          const view = new DataView(moovBox.buffer, moovBox.byteOffset, moovBox.byteLength);
          view.setUint32(i + 12, sample1Offset);
          view.setUint32(i + 16, sample2Offset);
          break;
        }
      }

      const fullFileBytes = concat(ftypBox, moovBox, sample1, sample2);
      const fakeFile = new File([new Blob([fullFileBytes])], 'apple_chapters.m4b', { type: 'audio/mp4' });

      const result = await parseMp4M4bMetadata(fakeFile);
      expect(result).not.toBeNull();
      expect(result?.chapters).toHaveLength(2);
      expect(result?.chapters?.[0]).toEqual({
        title: '01 - Introdução',
        startTime: 0,
        duration: 300
      });
      expect(result?.chapters?.[1]).toEqual({
        title: '02 - O Enigma',
        startTime: 300,
        duration: 450
      });
    });

    it('extracts metadata tags (title, author, cover, lyrics) from ilst', async () => {
      function makeBox(type: string, payload: Uint8Array): Uint8Array {
        const size = payload.length + 8;
        const box = new Uint8Array(size);
        box[0] = (size >> 24) & 0xff;
        box[1] = (size >> 16) & 0xff;
        box[2] = (size >> 8) & 0xff;
        box[3] = size & 0xff;
        for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i);
        box.set(payload, 8);
        return box;
      }

      function concat(...arrays: Uint8Array[]): Uint8Array {
        const totalLen = arrays.reduce((acc, curr) => acc + curr.length, 0);
        const res = new Uint8Array(totalLen);
        let off = 0;
        for (const arr of arrays) {
          res.set(arr, off);
          off += arr.length;
        }
        return res;
      }

      function makeDataTag(tagType: string, typeIndicator: number, data: Uint8Array): Uint8Array {
        const dataPayload = new Uint8Array(8 + data.length);
        const dv = new DataView(dataPayload.buffer);
        dv.setUint32(0, typeIndicator); // type (1 = utf8, 14 = png)
        dataPayload.set(data, 8);
        const dataBox = makeBox('data', dataPayload);
        return makeBox(tagType, dataBox);
      }

      const titleTag = makeDataTag('©nam', 1, new TextEncoder().encode('Memórias Póstumas'));
      const authorTag = makeDataTag('©ART', 1, new TextEncoder().encode('Machado de Assis'));
      const narratorTag = makeDataTag('©nrt', 1, new TextEncoder().encode('Guilherme Briggs'));
      const yearTag = makeDataTag('©day', 1, new TextEncoder().encode('1881'));
      // Minimal 8-byte PNG header for cover
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const coverTag = makeDataTag('covr', 14, pngBytes);
      const lyrTag = makeDataTag('©lyr', 1, new TextEncoder().encode('[00:01.00]Ao verme que primeiro roeu as frias carnes'));

      const ilstBox = makeBox('ilst', concat(titleTag, authorTag, narratorTag, yearTag, coverTag, lyrTag));
      const metaPayload = new Uint8Array(4 + ilstBox.length);
      metaPayload.set(ilstBox, 4);
      const metaBox = makeBox('meta', metaPayload);
      const moovBox = makeBox('moov', metaBox);
      const ftypBox = makeBox('ftyp', new TextEncoder().encode('M4B '));

      const fileBytes = concat(ftypBox, moovBox);
      const fakeFile = new File([new Blob([fileBytes])], 'memorias.m4b', { type: 'audio/mp4' });

      const result = await parseMp4M4bMetadata(fakeFile);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Memórias Póstumas');
      expect(result?.author).toBe('Machado de Assis');
      expect(result?.narrator).toBe('Guilherme Briggs');
      expect(result?.year).toBe('1881');
      expect(result?.coverBlob).not.toBeUndefined();
      expect(result?.coverBlob?.type).toBe('image/png');
      expect(result?.transcript).toHaveLength(1);
      expect(result?.transcript?.[0].text).toBe('Ao verme que primeiro roeu as frias carnes');
    });

    it('integrates seamlessly with parseAudioMetadata for M4B audiobooks', async () => {
      function makeBox(type: string, payload: Uint8Array): Uint8Array {
        const size = payload.length + 8;
        const box = new Uint8Array(size);
        box[0] = (size >> 24) & 0xff;
        box[1] = (size >> 16) & 0xff;
        box[2] = (size >> 8) & 0xff;
        box[3] = size & 0xff;
        for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i);
        box.set(payload, 8);
        return box;
      }

      function concat(...arrays: Uint8Array[]): Uint8Array {
        const totalLen = arrays.reduce((acc, curr) => acc + curr.length, 0);
        const res = new Uint8Array(totalLen);
        let off = 0;
        for (const arr of arrays) {
          res.set(arr, off);
          off += arr.length;
        }
        return res;
      }

      function makeDataTag(tagType: string, typeIndicator: number, data: Uint8Array): Uint8Array {
        const dataPayload = new Uint8Array(8 + data.length);
        const dv = new DataView(dataPayload.buffer);
        dv.setUint32(0, typeIndicator);
        dataPayload.set(data, 8);
        const dataBox = makeBox('data', dataPayload);
        return makeBox(tagType, dataBox);
      }

      const ftypBox = makeBox('ftyp', new TextEncoder().encode('M4B '));

      // mvhd: 3600s
      const mvhdPayload = new Uint8Array(20);
      const mvhdView = new DataView(mvhdPayload.buffer);
      mvhdView.setUint32(12, 1000); // timescale
      mvhdView.setUint32(16, 3600000); // duration = 3600s
      const mvhdBox = makeBox('mvhd', mvhdPayload);

      // ilst tags
      const titleTag = makeDataTag('©nam', 1, new TextEncoder().encode('A Arte da Guerra'));
      const authorTag = makeDataTag('©ART', 1, new TextEncoder().encode('Sun Tzu'));
      const narratorTag = makeDataTag('©nrt', 1, new TextEncoder().encode('Narrador Clássico'));
      const ilstBox = makeBox('ilst', concat(titleTag, authorTag, narratorTag));
      const metaPayload = new Uint8Array(4 + ilstBox.length);
      metaPayload.set(ilstBox, 4);
      const metaBox = makeBox('meta', metaPayload);

      // Nero chapters
      const chap1 = new TextEncoder().encode('Capítulo 1: Cálculos');
      const chap2 = new TextEncoder().encode('Capítulo 2: Em Combate');
      const chplPayload = new Uint8Array(9 + 8 + 1 + chap1.length + 8 + 1 + chap2.length);
      const chplView = new DataView(chplPayload.buffer);
      chplView.setUint32(5, 2); // 2 chapters
      let p = 9;
      // Chap 1
      p += 8;
      chplPayload[p++] = chap1.length;
      chplPayload.set(chap1, p);
      p += chap1.length;
      // Chap 2 at 1200s
      const time1200s = 1200n * 10000000n;
      chplView.setUint32(p, Number(time1200s >> 32n));
      chplView.setUint32(p + 4, Number(time1200s & 0xffffffffn));
      p += 8;
      chplPayload[p++] = chap2.length;
      chplPayload.set(chap2, p);
      const chplBox = makeBox('chpl', chplPayload);
      const udtaBox = makeBox('udta', concat(chplBox, metaBox));

      const moovBox = makeBox('moov', concat(mvhdBox, udtaBox));
      const fileBytes = concat(ftypBox, moovBox);

      const fakeM4bFile = new File([new Blob([fileBytes])], 'sun_tzu.m4b', { type: 'audio/mp4' });
      const metadata = await parseAudioMetadata(fakeM4bFile);

      expect(metadata.title).toBe('A Arte da Guerra');
      expect(metadata.author).toBe('Sun Tzu');
      expect(metadata.narrator).toBe('Narrador Clássico');
      expect(metadata.durationSec).toBe(3600);
      expect(metadata.chapters).toHaveLength(2);
      expect(metadata.chapters[0].title).toBe('Capítulo 1: Cálculos');
      expect(metadata.chapters[0].startTime).toBe(0);
      expect(metadata.chapters[0].duration).toBe(1200);
      expect(metadata.chapters[1].title).toBe('Capítulo 2: Em Combate');
      expect(metadata.chapters[1].startTime).toBe(1200);
      expect(metadata.chapters[1].duration).toBe(2400); // 3600 - 1200
    });
  });
});
