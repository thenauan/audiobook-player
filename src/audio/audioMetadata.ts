import type { Chapter, TranscriptLine } from '../data/catalog';
import { resolveGenreList } from '../data/genreData';
import { parseContainerTags, findWavId3Chunk } from './audioTags';
import { autoCropImageToEbookCover } from '../lib/imageProcessing';
import { normalizeAudiobookLanguage } from '../i18n/translations';
import { getGenericBookCover } from '../lib/coverArt';
import { parseTextContentAuto, parseTextContentByFormat, validateAndNormalizeTranscript } from './transcripts';

// ==========================================
// 5. MP4 / M4B ISO-BMFF METADATA & CHAPTER PARSER
// ==========================================
export interface Mp4ParsedMetadata {
  title?: string;
  author?: string;
  album?: string;
  narrator?: string;
  category?: string;
  year?: string;
  description?: string;
  coverBlob?: Blob;
  chapters?: { title: string; startTime: number; duration?: number }[];
  transcript?: TranscriptLine[];
  durationSec?: number;
}

/**
 * Utilitário para localizar a primeira caixa de um tipo específico em um intervalo de bytes ISO-BMFF
 */
function findBox(
  bytes: Uint8Array,
  start: number,
  end: number,
  targetType: string
): { start: number; length: number; dataStart: number } | null {
  let offset = start;
  while (offset <= end - 8) {
    let size = (bytes[offset] * 0x1000000 + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])) >>> 0;
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (size === 0) size = end - offset;
    let dataStart = offset + 8;
    if (size === 1) {
      if (offset + 16 > end) break;
      dataStart = offset + 16;
      const high = (bytes[offset + 8] * 0x1000000 + ((bytes[offset + 9] << 16) | (bytes[offset + 10] << 8) | bytes[offset + 11])) >>> 0;
      const low = (bytes[offset + 12] * 0x1000000 + ((bytes[offset + 13] << 16) | (bytes[offset + 14] << 8) | bytes[offset + 15])) >>> 0;
      size = high * 0x100000000 + low;
    }
    if (size < 8 || offset + size > end) break;
    if (type === targetType) {
      return { start: offset, length: size, dataStart };
    }
    offset += size;
  }
  return null;
}

/**
 * Utilitário para localizar todas as caixas de um tipo específico (ex: todos os átomos 'trak' em 'moov')
 */
function findAllBoxes(
  bytes: Uint8Array,
  start: number,
  end: number,
  targetType: string
): { start: number; length: number; dataStart: number }[] {
  const list: { start: number; length: number; dataStart: number }[] = [];
  let offset = start;
  while (offset <= end - 8) {
    let size = (bytes[offset] * 0x1000000 + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])) >>> 0;
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (size === 0) size = end - offset;
    let dataStart = offset + 8;
    if (size === 1) {
      if (offset + 16 > end) break;
      dataStart = offset + 16;
      const high = (bytes[offset + 8] * 0x1000000 + ((bytes[offset + 9] << 16) | (bytes[offset + 10] << 8) | bytes[offset + 11])) >>> 0;
      const low = (bytes[offset + 12] * 0x1000000 + ((bytes[offset + 13] << 16) | (bytes[offset + 14] << 8) | bytes[offset + 15])) >>> 0;
      size = high * 0x100000000 + low;
    }
    if (size < 8 || offset + size > end) break;
    if (type === targetType) {
      list.push({ start: offset, length: size, dataStart });
    }
    offset += size;
  }
  return list;
}

export async function parseMp4M4bMetadata(file: File): Promise<Mp4ParsedMetadata | null> {
  try {
    const headCheckBuf = await file.slice(0, Math.min(file.size, 4096)).arrayBuffer();
    const headCheckBytes = new Uint8Array(headCheckBuf);
    if (headCheckBytes.length < 8) return null;

    let isIsoBmff = false;
    for (let i = 0; i <= headCheckBytes.length - 8; i++) {
      const type = String.fromCharCode(headCheckBytes[i + 4], headCheckBytes[i + 5], headCheckBytes[i + 6], headCheckBytes[i + 7]);
      if (type === 'ftyp' || type === 'moov') {
        isIsoBmff = true;
        break;
      }
    }

    const lowerExt = file.name.toLowerCase();
    const isAudiobookExt = lowerExt.endsWith('.m4b') || lowerExt.endsWith('.mp4') || lowerExt.endsWith('.m4a') || lowerExt.endsWith('.aac');
    if (!isIsoBmff && !isAudiobookExt) {
      return null;
    }

    let moovBuffer: ArrayBuffer | null = null;

    // 1. Tenta leitura sequencial das caixas de nível superior (ISO Base Media)
    let searchPos = 0;
    let attempts = 0;
    while (searchPos < file.size && attempts < 100) {
      attempts++;
      const boxHeadBuf = await file.slice(searchPos, Math.min(file.size, searchPos + 16)).arrayBuffer();
      if (boxHeadBuf.byteLength < 8) break;
      const bView = new DataView(boxHeadBuf);
      let bSize = bView.getUint32(0);
      const bBytes = new Uint8Array(boxHeadBuf);
      const bType = String.fromCharCode(bBytes[4], bBytes[5], bBytes[6], bBytes[7]);

      if (bSize === 1 && boxHeadBuf.byteLength >= 16) {
        const high = bView.getUint32(8);
        const low = bView.getUint32(12);
        bSize = Number((BigInt(high) << 32n) | BigInt(low));
      }

      if (bType === 'moov') {
        const actualMoovSize = bSize > 8 && bSize <= 50 * 1024 * 1024 ? bSize : Math.min(file.size - searchPos, 25 * 1024 * 1024);
        moovBuffer = await file.slice(searchPos, searchPos + actualMoovSize).arrayBuffer();
        break;
      }

      if (bSize < 8 || searchPos + bSize > file.size) {
        break;
      }
      searchPos += bSize;
    }

    // 2. Fallback: Varredura nos primeiros 2MB do arquivo
    if (!moovBuffer) {
      const startChunkSize = Math.min(file.size, 2 * 1024 * 1024);
      const startBuf = await file.slice(0, startChunkSize).arrayBuffer();
      const startBytes = new Uint8Array(startBuf);
      let pos = 0;
      while (pos <= startBytes.length - 8) {
        let boxSize = (startBytes[pos] * 0x1000000 + ((startBytes[pos + 1] << 16) | (startBytes[pos + 2] << 8) | startBytes[pos + 3])) >>> 0;
        const boxType = String.fromCharCode(startBytes[pos + 4], startBytes[pos + 5], startBytes[pos + 6], startBytes[pos + 7]);
        if (boxSize === 0) break;
        if (boxSize === 1 && pos + 16 <= startBytes.length) {
          const high = (startBytes[pos + 8] * 0x1000000 + ((startBytes[pos + 9] << 16) | (startBytes[pos + 10] << 8) | startBytes[pos + 11])) >>> 0;
          const low = (startBytes[pos + 12] * 0x1000000 + ((startBytes[pos + 13] << 16) | (startBytes[pos + 14] << 8) | startBytes[pos + 15])) >>> 0;
          boxSize = high * 0x100000000 + low;
        }
        if (boxType === 'moov') {
          const fullMoovBuf = await file.slice(pos, pos + (boxSize > 0 && boxSize <= 50 * 1024 * 1024 ? boxSize : startChunkSize)).arrayBuffer();
          moovBuffer = fullMoovBuf;
          break;
        }
        if (boxSize < 8) break;
        pos += boxSize;
      }
    }

    // 3. Fallback: Varredura nos últimos 15MB do arquivo (comum quando moov fica no final do contêiner)
    if (!moovBuffer && file.size > 2 * 1024 * 1024) {
      const endChunkSize = Math.min(file.size, 15 * 1024 * 1024);
      const endOffset = file.size - endChunkSize;
      const endBuf = await file.slice(endOffset, file.size).arrayBuffer();
      const endBytes = new Uint8Array(endBuf);

      for (let i = 0; i <= endBytes.length - 8; i++) {
        if (endBytes[i + 4] === 0x6d && endBytes[i + 5] === 0x6f && endBytes[i + 6] === 0x6f && endBytes[i + 7] === 0x76) { // 'moov'
          let boxSize = (endBytes[i] * 0x1000000 + ((endBytes[i + 1] << 16) | (endBytes[i + 2] << 8) | endBytes[i + 3])) >>> 0;
          if (boxSize > 0 && boxSize <= endChunkSize - i) {
            moovBuffer = endBuf.slice(i, i + boxSize);
          } else {
            const actualStart = endOffset + i;
            const fullBuf = await file.slice(actualStart, Math.min(file.size, actualStart + (boxSize > 0 && boxSize <= 50 * 1024 * 1024 ? boxSize : endChunkSize))).arrayBuffer();
            moovBuffer = fullBuf;
          }
          break;
        }
      }
    }

    if (!moovBuffer) return null;

    const result: Mp4ParsedMetadata = {};
    const moovBytes = new Uint8Array(moovBuffer);
    const view = new DataView(moovBuffer);

    // 1. Extração da Duração Geral via mvhd (Movie Header)
    const mvhdBox = findBox(moovBytes, 8, moovBytes.length, 'mvhd');
    if (mvhdBox && mvhdBox.length >= 24) {
      const version = moovBytes[mvhdBox.dataStart];
      let timescale = 1000;
      let duration = 0;
      if (version === 0 && mvhdBox.dataStart + 20 <= mvhdBox.start + mvhdBox.length) {
        timescale = view.getUint32(mvhdBox.dataStart + 12);
        duration = view.getUint32(mvhdBox.dataStart + 16);
      } else if (version === 1 && mvhdBox.dataStart + 28 <= mvhdBox.start + mvhdBox.length) {
        timescale = view.getUint32(mvhdBox.dataStart + 20);
        const durHigh = view.getUint32(mvhdBox.dataStart + 24);
        const durLow = view.getUint32(mvhdBox.dataStart + 28);
        duration = Number((BigInt(durHigh) << 32n) | BigInt(durLow));
      }
      if (timescale > 0 && duration > 0) {
        result.durationSec = Math.round(duration / timescale);
      }
    }

    // 2. Extração de Capítulos Apple / Timed Text (moov -> trak -> ... -> text / tx3g)
    const trakBoxes = findAllBoxes(moovBytes, 8, moovBytes.length, 'trak');
    const referencedChapterTrackIds = new Set<number>();

    for (const trak of trakBoxes) {
      const trakEnd = trak.start + trak.length;
      const tref = findBox(moovBytes, trak.dataStart, trakEnd, 'tref');
      if (tref) {
        const trefEnd = tref.start + tref.length;
        const chap = findBox(moovBytes, tref.dataStart, trefEnd, 'chap');
        if (chap) {
          const chapEnd = chap.start + chap.length;
          let p = chap.dataStart;
          while (p + 4 <= chapEnd) {
            referencedChapterTrackIds.add(view.getUint32(p));
            p += 4;
          }
        }
      }
    }

    interface ChapterTrackCandidate {
      trak: { start: number; length: number; dataStart: number };
      trackId: number;
      timescale: number;
      sttsBox: { start: number; length: number; dataStart: number };
      stszBox?: { start: number; length: number; dataStart: number };
      stscBox?: { start: number; length: number; dataStart: number };
      stcoBox?: { start: number; length: number; dataStart: number };
      co64Box?: { start: number; length: number; dataStart: number };
      isExplicit: boolean;
    }

    const candidateTracks: ChapterTrackCandidate[] = [];

    for (const trak of trakBoxes) {
      const trakEnd = trak.start + trak.length;
      const tkhd = findBox(moovBytes, trak.dataStart, trakEnd, 'tkhd');
      let trackId = 0;
      if (tkhd) {
        const tkhdVersion = moovBytes[tkhd.dataStart];
        if (tkhdVersion === 0 && tkhd.dataStart + 16 <= tkhd.start + tkhd.length) {
          trackId = view.getUint32(tkhd.dataStart + 12);
        } else if (tkhdVersion === 1 && tkhd.dataStart + 24 <= tkhd.start + tkhd.length) {
          trackId = view.getUint32(tkhd.dataStart + 20);
        }
      }

      const mdia = findBox(moovBytes, trak.dataStart, trakEnd, 'mdia');
      if (!mdia) continue;
      const mdiaEnd = mdia.start + mdia.length;

      const mdhd = findBox(moovBytes, mdia.dataStart, mdiaEnd, 'mdhd');
      let timescale = 1000;
      if (mdhd) {
        const mdhdVersion = moovBytes[mdhd.dataStart];
        if (mdhdVersion === 0 && mdhd.dataStart + 16 <= mdhd.start + mdhd.length) {
          timescale = view.getUint32(mdhd.dataStart + 12);
        } else if (mdhdVersion === 1 && mdhd.dataStart + 24 <= mdhd.start + mdhd.length) {
          timescale = view.getUint32(mdhd.dataStart + 20);
        }
      }
      if (timescale <= 0) timescale = 1000;

      const hdlr = findBox(moovBytes, mdia.dataStart, mdiaEnd, 'hdlr');
      let handlerType = '';
      if (hdlr && hdlr.dataStart + 12 <= hdlr.start + hdlr.length) {
        handlerType = String.fromCharCode(
          moovBytes[hdlr.dataStart + 8],
          moovBytes[hdlr.dataStart + 9],
          moovBytes[hdlr.dataStart + 10],
          moovBytes[hdlr.dataStart + 11]
        );
      }

      const minf = findBox(moovBytes, mdia.dataStart, mdiaEnd, 'minf');
      if (!minf) continue;
      const minfEnd = minf.start + minf.length;

      const stbl = findBox(moovBytes, minf.dataStart, minfEnd, 'stbl');
      if (!stbl) continue;
      const stblEnd = stbl.start + stbl.length;

      const stsd = findBox(moovBytes, stbl.dataStart, stblEnd, 'stsd');
      let sampleFormat = '';
      if (stsd && stsd.dataStart + 16 <= stsd.start + stsd.length) {
        sampleFormat = String.fromCharCode(
          moovBytes[stsd.dataStart + 12],
          moovBytes[stsd.dataStart + 13],
          moovBytes[stsd.dataStart + 14],
          moovBytes[stsd.dataStart + 15]
        );
      }

      const isExplicit = referencedChapterTrackIds.has(trackId);
      const isTextTrack =
        handlerType === 'text' ||
        handlerType === 'sbtl' ||
        handlerType === 'subt' ||
        sampleFormat === 'text' ||
        sampleFormat === 'tx3g';

      if (isExplicit || isTextTrack) {
        const sttsBox = findBox(moovBytes, stbl.dataStart, stblEnd, 'stts');
        if (sttsBox) {
          const stszBox = findBox(moovBytes, stbl.dataStart, stblEnd, 'stsz');
          const stscBox = findBox(moovBytes, stbl.dataStart, stblEnd, 'stsc');
          const stcoBox = findBox(moovBytes, stbl.dataStart, stblEnd, 'stco');
          const co64Box = findBox(moovBytes, stbl.dataStart, stblEnd, 'co64');

          candidateTracks.push({
            trak,
            trackId,
            timescale,
            sttsBox,
            stszBox: stszBox || undefined,
            stscBox: stscBox || undefined,
            stcoBox: stcoBox || undefined,
            co64Box: co64Box || undefined,
            isExplicit
          });
        }
      }
    }

    // Ordena para que faixas explicitamente marcadas em tref->chap tenham prioridade
    candidateTracks.sort((a, b) => (b.isExplicit ? 1 : 0) - (a.isExplicit ? 1 : 0));

    for (const track of candidateTracks) {
      const { timescale, sttsBox, stszBox, stscBox, stcoBox, co64Box } = track;
      const sttsEnd = sttsBox.start + sttsBox.length;
      if (sttsBox.dataStart + 8 > sttsEnd) continue;

      const entryCount = view.getUint32(sttsBox.dataStart + 4);
      if (entryCount === 0 || entryCount > 5000) continue;

      const sampleStartTimes: number[] = [];
      const sampleDurations: number[] = [];
      let currentTicks = 0;
      let p = sttsBox.dataStart + 8;

      for (let e = 0; e < entryCount && p + 8 <= sttsEnd; e++) {
        const count = view.getUint32(p);
        const delta = view.getUint32(p + 4);
        p += 8;

        for (let s = 0; s < count && sampleStartTimes.length < 5000; s++) {
          sampleStartTimes.push(currentTicks / timescale);
          sampleDurations.push(delta / timescale);
          currentTicks += delta;
        }
      }

      const sampleCount = sampleStartTimes.length;
      if (sampleCount === 0) continue;

      // Tamanhos das amostras (stsz)
      const sampleSizes: number[] = [];
      if (stszBox) {
        const stszEnd = stszBox.start + stszBox.length;
        if (stszBox.dataStart + 12 <= stszEnd) {
          const uniformSize = view.getUint32(stszBox.dataStart + 4);
          const stszSampleCount = view.getUint32(stszBox.dataStart + 8);
          if (uniformSize > 0) {
            for (let s = 0; s < sampleCount; s++) sampleSizes.push(uniformSize);
          } else {
            let sp = stszBox.dataStart + 12;
            for (let s = 0; s < stszSampleCount && sp + 4 <= stszEnd; s++) {
              sampleSizes.push(view.getUint32(sp));
              sp += 4;
            }
          }
        }
      }

      // Mapeamento amostra -> chunk (stsc)
      const stscEntries: { firstChunk: number; samplesPerChunk: number }[] = [];
      if (stscBox) {
        const stscEnd = stscBox.start + stscBox.length;
        if (stscBox.dataStart + 8 <= stscEnd) {
          const stscCount = view.getUint32(stscBox.dataStart + 4);
          let sp = stscBox.dataStart + 8;
          for (let e = 0; e < stscCount && sp + 12 <= stscEnd; e++) {
            stscEntries.push({
              firstChunk: view.getUint32(sp),
              samplesPerChunk: view.getUint32(sp + 4)
            });
            sp += 12;
          }
        }
      }

      // Offsets de cada chunk no arquivo (stco ou co64)
      const chunkOffsets: number[] = [];
      if (stcoBox) {
        const stcoEnd = stcoBox.start + stcoBox.length;
        if (stcoBox.dataStart + 8 <= stcoEnd) {
          const chunkCount = view.getUint32(stcoBox.dataStart + 4);
          let cp = stcoBox.dataStart + 8;
          for (let c = 0; c < chunkCount && cp + 4 <= stcoEnd; c++) {
            chunkOffsets.push(view.getUint32(cp));
            cp += 4;
          }
        }
      } else if (co64Box) {
        const co64End = co64Box.start + co64Box.length;
        if (co64Box.dataStart + 8 <= co64End) {
          const chunkCount = view.getUint32(co64Box.dataStart + 4);
          let cp = co64Box.dataStart + 8;
          for (let c = 0; c < chunkCount && cp + 8 <= co64End; c++) {
            const high = view.getUint32(cp);
            const low = view.getUint32(cp + 4);
            chunkOffsets.push(Number((BigInt(high) << 32n) | BigInt(low)));
            cp += 8;
          }
        }
      }

      // Calcula os byte offsets no arquivo para cada amostra
      const sampleOffsets: number[] = [];
      if (chunkOffsets.length > 0 && stscEntries.length > 0) {
        let currentSample = 0;
        let stscIdx = 0;

        for (let c = 0; c < chunkOffsets.length && currentSample < sampleCount; c++) {
          const chunkNum = c + 1;
          while (stscIdx + 1 < stscEntries.length && stscEntries[stscIdx + 1].firstChunk <= chunkNum) {
            stscIdx++;
          }
          const samplesInChunk = stscEntries[stscIdx].samplesPerChunk;
          let offset = chunkOffsets[c];

          for (let s = 0; s < samplesInChunk && currentSample < sampleCount; s++) {
            sampleOffsets[currentSample] = offset;
            offset += sampleSizes[currentSample] || 0;
            currentSample++;
          }
        }
      }

      // Decodificação dos títulos de cada capítulo
      const textDecoderUtf8 = new TextDecoder('utf-8');
      const textDecoderUtf16 = new TextDecoder('utf-16');

      const chapterPromises = sampleStartTimes.map(async (startTime, idx) => {
        let title = '';
        const offset = sampleOffsets[idx];
        const size = sampleSizes[idx] || 0;

        if (offset > 0 && size > 0 && offset + size <= file.size) {
          try {
            const sampleBuf = await file.slice(offset, offset + size).arrayBuffer();
            const sBytes = new Uint8Array(sampleBuf);

            if (sBytes.length >= 2) {
              const textLen = (sBytes[0] << 8) | sBytes[1];
              if (textLen > 0 && textLen <= sBytes.length - 2) {
                const strBytes = sBytes.subarray(2, 2 + textLen);
                if (
                  strBytes.length >= 2 &&
                  ((strBytes[0] === 0xfe && strBytes[1] === 0xff) || (strBytes[0] === 0xff && strBytes[1] === 0xfe))
                ) {
                  title = textDecoderUtf16.decode(strBytes);
                } else {
                  title = textDecoderUtf8.decode(strBytes);
                }
              } else {
                title = textDecoderUtf8.decode(sBytes);
              }
            } else if (sBytes.length === 1) {
              title = textDecoderUtf8.decode(sBytes);
            }
          } catch {}
        }

        title = title.replace(/\0+$/, '').trim();
        if (!title || /^[\x00-\x1F]+$/.test(title)) {
          title = `Capítulo ${idx + 1}`;
        }

        return {
          title,
          startTime: Math.max(0, Math.round(startTime)),
          duration: Math.max(1, Math.round(sampleDurations[idx] || 0))
        };
      });

      const extractedTrackChapters = await Promise.all(chapterPromises);
      if (extractedTrackChapters.length > 0) {
        result.chapters = extractedTrackChapters;
        break; // Faixa de capítulos processada com sucesso
      }
    }

    // 3. Fallback: Extração de Capítulos Nero (moov -> udta -> chpl ou moov -> chpl)
    const udtaBox = findBox(moovBytes, 8, moovBytes.length, 'udta');
    if (!result.chapters || result.chapters.length === 0) {
      const chplBox = udtaBox
        ? findBox(moovBytes, udtaBox.dataStart, udtaBox.start + udtaBox.length, 'chpl')
        : findBox(moovBytes, 8, moovBytes.length, 'chpl');

      if (chplBox) {
        const chplEnd = chplBox.start + chplBox.length;
        const countWithReserved = chplBox.dataStart + 9 <= chplEnd ? view.getUint32(chplBox.dataStart + 5) : 0;
        const countWithoutReserved = chplBox.dataStart + 8 <= chplEnd ? view.getUint32(chplBox.dataStart + 4) : 0;

        let chapterCount = 0;
        let chplPos = chplBox.dataStart + 8;
        if (countWithReserved > 0 && countWithReserved < 3000) {
          chapterCount = countWithReserved;
          chplPos = chplBox.dataStart + 9;
        } else if (countWithoutReserved > 0 && countWithoutReserved < 3000) {
          chapterCount = countWithoutReserved;
          chplPos = chplBox.dataStart + 8;
        }

        if (chapterCount > 0) {
          const chaptersList: { title: string; startTime: number; duration?: number }[] = [];
          for (let c = 0; c < chapterCount; c++) {
            if (chplPos + 9 > chplEnd) break;
            const highTime = view.getUint32(chplPos);
            const lowTime = view.getUint32(chplPos + 4);
            chplPos += 8;
            const fullTime100ns = (BigInt(highTime) << 32n) | BigInt(lowTime);
            const startTimeSec = Number(fullTime100ns) / 10000000;

            const titleLen = moovBytes[chplPos];
            chplPos += 1;
            if (chplPos + titleLen > chplEnd) break;
            const titleBytes = moovBytes.subarray(chplPos, chplPos + titleLen);
            const chapTitle = new TextDecoder('utf-8').decode(titleBytes);
            chplPos += titleLen;

            chaptersList.push({
              title: chapTitle.trim() || `Capítulo ${c + 1}`,
              startTime: Math.max(0, Math.round(startTimeSec))
            });
          }
          if (chaptersList.length > 0) {
            result.chapters = chaptersList;
          }
        }
      }
    }

    // 4. Extração de Metadados e Capa iTunes/QuickTime (moov -> udta -> meta -> ilst ou moov -> meta -> ilst)
    let metaBox = udtaBox ? findBox(moovBytes, udtaBox.dataStart, udtaBox.start + udtaBox.length, 'meta') : null;
    if (!metaBox) {
      metaBox = findBox(moovBytes, 8, moovBytes.length, 'meta');
    }

    if (metaBox) {
      const ilstBox = findBox(moovBytes, metaBox.dataStart + 4, metaBox.start + metaBox.length, 'ilst');
      if (ilstBox) {
        let tagPos = ilstBox.dataStart;
        const ilstEnd = ilstBox.start + ilstBox.length;

        while (tagPos <= ilstEnd - 8) {
          const tagSize = (moovBytes[tagPos] * 0x1000000 + ((moovBytes[tagPos + 1] << 16) | (moovBytes[tagPos + 2] << 8) | moovBytes[tagPos + 3])) >>> 0;
          if (tagSize < 8 || tagPos + tagSize > ilstEnd) break;
          const tagType = String.fromCharCode(moovBytes[tagPos + 4], moovBytes[tagPos + 5], moovBytes[tagPos + 6], moovBytes[tagPos + 7]);

          const dataBox = findBox(moovBytes, tagPos + 8, tagPos + tagSize, 'data');
          if (dataBox) {
            const typeIndicator = (moovBytes[dataBox.dataStart] * 0x1000000 + ((moovBytes[dataBox.dataStart + 1] << 16) | (moovBytes[dataBox.dataStart + 2] << 8) | moovBytes[dataBox.dataStart + 3])) >>> 0;
            const payload = moovBytes.subarray(dataBox.dataStart + 8, dataBox.start + dataBox.length);

            if (tagType === '\xa9nam' || tagType === '©nam') {
              result.title = new TextDecoder('utf-8').decode(payload).trim();
            } else if (tagType === '\xa9ART' || tagType === '©ART' || tagType === 'aART') {
              if (!result.author || tagType !== 'aART') {
                result.author = new TextDecoder('utf-8').decode(payload).trim();
              }
            } else if (tagType === '\xa9alb' || tagType === '©alb') {
              result.album = new TextDecoder('utf-8').decode(payload).trim();
            } else if (tagType === '\xa9gen' || tagType === '©gen' || tagType === 'gnre') {
              result.category = new TextDecoder('utf-8').decode(payload).trim();
            } else if (tagType === '\xa9day' || tagType === '©day') {
              const dayStr = new TextDecoder('utf-8').decode(payload).trim();
              result.year = dayStr.slice(0, 4);
            } else if (tagType === 'desc' || tagType === '\xa9des' || tagType === '©des' || tagType === 'ldes' || tagType === '\xa9cmt' || tagType === '©cmt') {
              if (!result.description) {
                result.description = new TextDecoder('utf-8').decode(payload).trim();
              }
            } else if (tagType === '\xa9nrt' || tagType === '©nrt' || tagType === '\xa9wrt' || tagType === '©wrt') {
              result.narrator = new TextDecoder('utf-8').decode(payload).trim();
            } else if (tagType === 'covr') {
              let mime = 'image/jpeg';
              if (typeIndicator === 14) {
                mime = 'image/png';
              } else if (payload.length >= 8 && payload[0] === 0x89 && payload[1] === 0x50 && payload[2] === 0x4e && payload[3] === 0x47) {
                mime = 'image/png';
              } else if (payload.length >= 4 && payload[0] === 0x52 && payload[1] === 0x49 && payload[2] === 0x46 && payload[3] === 0x46) {
                mime = 'image/webp';
              }
              result.coverBlob = new Blob([payload], { type: mime });
            } else if (tagType === '\xa9lyr' || tagType === '©lyr') {
              const lyrText = new TextDecoder('utf-8').decode(payload).trim();
              if (lyrText) {
                const autoParsed = parseTextContentAuto(lyrText);
                if (autoParsed.length > 0) {
                  result.transcript = autoParsed;
                }
              }
            }
          }

          tagPos += tagSize;
        }
      }
    }

    return result;
  } catch (err) {
    console.warn('Erro ao processar metadados MP4/M4B:', err);
    return null;
  }
}

// ==========================================
// 5. AUDIO METADATA & COVER PARSER
// ==========================================
export async function parseAudioMetadata(file: File): Promise<{
  title: string;
  author: string;
  authorNationality: string;
  category: string;
  subgenre?: string;
  year: string;
  cover: string;
  durationSec: number;
  durationEst: string;
  sizeStr: string;
  chapters: Chapter[];
  transcript: TranscriptLine[];
  description?: string;
  narrator?: string;
  language?: string;
}> {
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const sizeStr = `${sizeMb} MB`;

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  let title = baseName.replace(/^(\d+[\s._-]+)+/, '').trim();
  if (!title) title = baseName;
  let author = 'Autor Desconhecido';
  let rawAuthorNationality = '';
  let rawCategory = '';
  let rawSubgenre = '';
  let year = new Date().getFullYear().toString();
  let description = '';
  let narrator = '';
  let rawLanguage = '';
  let extractedCover: string | null = null;
  let extractedTranscript: TranscriptLine[] = [];
  let extractedChapters: { title: string; startTime: number; duration?: number }[] = [];
  const id3Chapters: { title: string; startTime: number }[] = [];
  let album = '';
  let albumArtist = '';
  let durationSec = 1800;

  try {
    // WAV guarda as etiquetas ID3 num bloco próprio; os demais, no início do arquivo
    const id3Source = (await findWavId3Chunk(file)) || file;
    const buffer = await id3Source.slice(0, 1024 * 512).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const isId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const lowerName = file.name.toLowerCase();
    const isM4bOrMp4 = lowerName.endsWith('.m4b') || lowerName.endsWith('.mp4') || lowerName.endsWith('.m4a') || lowerName.endsWith('.aac');

    if (isId3) {
      const majorVersion = bytes[3];
      const tagSize = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
      
      // Letra embutida fica depois da capa: com limite baixo, livros longos perdiam a letra sem aviso
      const fullTagBuffer = await id3Source.slice(0, Math.min(tagSize + 10, 96 * 1024 * 1024)).arrayBuffer();
      const tagBytes = new Uint8Array(fullTagBuffer);
      let offset = 10;

      while (offset < tagBytes.length - 10) {
        const frameId = String.fromCharCode(tagBytes[offset], tagBytes[offset + 1], tagBytes[offset + 2], tagBytes[offset + 3]);
        if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

        let frameSize = 0;
        if (majorVersion === 4) {
          frameSize = ((tagBytes[offset + 4] & 0x7f) << 21) | ((tagBytes[offset + 5] & 0x7f) << 14) | ((tagBytes[offset + 6] & 0x7f) << 7) | (tagBytes[offset + 7] & 0x7f);
        } else {
          frameSize = (tagBytes[offset + 4] << 24) | (tagBytes[offset + 5] << 16) | (tagBytes[offset + 6] << 8) | tagBytes[offset + 7];
        }

        if (frameSize <= 0 || offset + 10 + frameSize > tagBytes.length) break;

        const frameData = tagBytes.subarray(offset + 10, offset + 10 + frameSize);

        if (frameId === 'TIT2') {
          const text = decodeId3Text(frameData);
          if (text) title = text.trim();
        } else if (frameId === 'TALB') {
          const text = decodeId3Text(frameData);
          if (text) album = text.trim();
        } else if (frameId === 'TPE2') {
          const text = decodeId3Text(frameData);
          if (text) albumArtist = text.trim();
        } else if (frameId === 'CHAP') {
          // Capítulo: identificador, início e fim em milissegundos, e o título num quadro interno
          let p = 0;
          while (p < frameData.length && frameData[p] !== 0) p++;
          p++;
          if (p + 16 <= frameData.length) {
            const startMs = ((frameData[p] << 24) >>> 0) + (frameData[p + 1] << 16) + (frameData[p + 2] << 8) + frameData[p + 3];
            p += 16;
            let chapterTitle = '';
            while (p + 10 <= frameData.length) {
              const subId = String.fromCharCode(frameData[p], frameData[p + 1], frameData[p + 2], frameData[p + 3]);
              const subSize = majorVersion === 4
                ? ((frameData[p + 4] & 0x7f) << 21) | ((frameData[p + 5] & 0x7f) << 14) | ((frameData[p + 6] & 0x7f) << 7) | (frameData[p + 7] & 0x7f)
                : (frameData[p + 4] << 24) | (frameData[p + 5] << 16) | (frameData[p + 6] << 8) | frameData[p + 7];
              if (subSize <= 0) break;
              if (subId === 'TIT2') chapterTitle = decodeId3Text(frameData.subarray(p + 10, p + 10 + subSize)).trim();
              p += 10 + subSize;
            }
            id3Chapters.push({ title: chapterTitle, startTime: startMs / 1000 });
          }
        } else if (frameId === 'TIT1') {
          const text = decodeId3Text(frameData);
          if (text) rawSubgenre = text.trim();
        } else if (frameId === 'TPE1') {
          const text = decodeId3Text(frameData);
          if (text) author = text.trim();
        } else if (frameId === 'TCON') {
          const text = decodeId3Text(frameData);
          if (text) rawCategory = text.trim();
        } else if (frameId === 'TYER' || frameId === 'TDRC') {
          const text = decodeId3Text(frameData);
          if (text) year = text.trim().slice(0, 4);
        } else if (frameId === 'TPE3' || frameId === 'TEXT' || frameId === 'TCOM') {
          const text = decodeId3Text(frameData);
          if (text && !narrator) narrator = text.trim();
        } else if (frameId === 'TLAN') {
          const text = decodeId3Text(frameData);
          if (text && !rawLanguage) rawLanguage = text.trim();
        } else if (frameId === 'SYLT' && extractedTranscript.length === 0) {
          const syltLines = decodeId3SyltFrame(frameData);
          if (syltLines.length > 0) {
            extractedTranscript = syltLines;
          }
        } else if (frameId === 'USLT' && !extractedTranscript.some(l => l.words?.length)) {
          try {
            if (frameData.length > 4) {
              const usltText = decodeId3Text(frameData.subarray(4));
              if (usltText) {
                const parsedFromUslt = parseTextContentByFormat(usltText, 'lrc');
                // Vale se não há letra ainda ou se esta traz o tempo de cada palavra (a SYLT só tem frases)
                if (parsedFromUslt.length > 0 && (extractedTranscript.length === 0 || parsedFromUslt.some(l => l.words?.length))) {
                  extractedTranscript = parsedFromUslt;
                }
              }
            }
          } catch {}
        } else if (frameId === 'TXXX') {
          const text = decodeId3Text(frameData);
          if (text) {
            const parts = text.split('\0').map(s => s.trim()).filter(Boolean);
            if (parts.length >= 2) {
              const key = parts[0].toLowerCase();
              const val = parts.slice(1).join(' ').trim();
              if (val && (key.includes('national') || key.includes('nacional') || key.includes('country') || key.includes('pais') || key.includes('país'))) {
                if (!rawAuthorNationality) rawAuthorNationality = val;
              } else if (val && (key === 'language' || key === 'idioma' || key === 'lang')) {
                if (!rawLanguage) rawLanguage = val;
              } else if (val && extractedTranscript.length === 0 && (key.includes('transcript') || key.includes('sync') || key.includes('lyrics') || key.includes('texto') || key.includes('subtitles'))) {
                const autoParsed = parseTextContentAuto(val);
                if (autoParsed.length > 0) {
                  extractedTranscript = autoParsed;
                }
              }
            }
          }
        } else if (frameId === 'COMM') {
          try {
            if (frameData.length > 4) {
              const commBytes = frameData.subarray(4);
              const text = decodeId3Text(commBytes);
              if (text) description = text.trim();
            }
          } catch(e) {}
        } else if (frameId === 'APIC' && !extractedCover) {
          try {
            let p = 1;
            let mime = '';
            while (p < frameData.length && frameData[p] !== 0) {
              mime += String.fromCharCode(frameData[p]);
              p++;
            }
            p++;
            p++;
            while (p < frameData.length && frameData[p] !== 0) {
              p++;
            }
            p++;
            if (p < frameData.length) {
              const imgBytes = frameData.subarray(p);
              const mimeType = mime || 'image/jpeg';
              const blob = new Blob([imgBytes], { type: mimeType });
              try {
                extractedCover = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (typeof reader.result === 'string') resolve(reader.result);
                    else resolve(URL.createObjectURL(blob));
                  };
                  reader.onerror = () => resolve(URL.createObjectURL(blob));
                  reader.readAsDataURL(blob);
                });
              } catch {
                extractedCover = URL.createObjectURL(blob);
              }
            }
          } catch (e) {
            console.warn('Could not extract APIC cover', e);
          }
        }

        offset += 10 + frameSize;
      }
    }

    if (id3Chapters.length > 0) extractedChapters = id3Chapters.sort((a, b) => a.startTime - b.startTime);
    // Audiobook em MP3: o título da faixa pode ser só o capítulo; o livro é o álbum
    if (album && (title === baseName || /^(cap[ií]tulo|chapter|faixa|track|parte|part)\b/i.test(title))) title = album;
    if (albumArtist && author === 'Autor Desconhecido') author = albumArtist;

    // Opus, OGG, FLAC, WAV e WMA
    const containerTags = await parseContainerTags(file);
    if (containerTags) {
      if (containerTags.title) title = containerTags.title;
      if (containerTags.author) author = containerTags.author;
      if (containerTags.narrator && !narrator) narrator = containerTags.narrator;
      if (containerTags.category) rawCategory = containerTags.category;
      if (containerTags.subgenre) rawSubgenre = containerTags.subgenre;
      if (containerTags.year) year = containerTags.year;
      if (containerTags.description && !description) description = containerTags.description;
      if (containerTags.language && !rawLanguage) rawLanguage = containerTags.language;
      if (containerTags.chapters?.length) extractedChapters = containerTags.chapters;
      if (containerTags.durationSec && containerTags.durationSec > 0) durationSec = Math.round(containerTags.durationSec);
      if (containerTags.coverBlob && !extractedCover) extractedCover = URL.createObjectURL(containerTags.coverBlob);
      if (containerTags.lyrics && extractedTranscript.length === 0) {
        const parsedLyrics = parseTextContentAuto(containerTags.lyrics);
        if (parsedLyrics.length > 0) extractedTranscript = parsedLyrics;
      }
    }

    // Se for contêiner MP4 / M4B ou se não encontrou capítulos / capa suficientes via ID3
    if (!containerTags && (isM4bOrMp4 || !isId3 || extractedChapters.length === 0 || !extractedCover)) {
      const mp4Meta = await parseMp4M4bMetadata(file);
      if (mp4Meta) {
        if (mp4Meta.title && (!title || title === baseName)) title = mp4Meta.title;
        if (mp4Meta.author && (!author || author === 'Autor Desconhecido')) author = mp4Meta.author;
        if (mp4Meta.category && !rawCategory) rawCategory = mp4Meta.category;
        if (mp4Meta.year && (!year || year === new Date().getFullYear().toString())) year = mp4Meta.year;
        if (mp4Meta.description && !description) description = mp4Meta.description;
        if (mp4Meta.narrator && !narrator) narrator = mp4Meta.narrator;
        if (mp4Meta.coverBlob && !extractedCover) {
          extractedCover = URL.createObjectURL(mp4Meta.coverBlob);
        }
        if (mp4Meta.chapters && mp4Meta.chapters.length > 0) {
          extractedChapters = mp4Meta.chapters;
        }
        if (mp4Meta.transcript && mp4Meta.transcript.length > 0 && extractedTranscript.length === 0) {
          extractedTranscript = mp4Meta.transcript;
        }
        if (mp4Meta.durationSec && mp4Meta.durationSec > 0) {
          durationSec = mp4Meta.durationSec;
        }
      }
    }
  } catch (err) {
    console.warn('Error reading audio tags:', err);
  }

  if (typeof Audio !== 'undefined') {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = objectUrl;
      audio.load();

      await new Promise<void>((resolve) => {
        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
            durationSec = Math.round(audio.duration);
          }
          resolve();
        };
        audio.addEventListener('loadedmetadata', done);
        audio.addEventListener('durationchange', done);
        audio.addEventListener('canplay', done);
        audio.addEventListener('error', done);
        setTimeout(done, durationSec > 0 && durationSec !== 1800 ? 800 : 3000);
      });
    } catch (e) {
      console.warn('Audio duration check error:', e);
    } finally {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch {}
      }
    }
  }

  const h = Math.floor(durationSec / 3600);
  const m = Math.floor((durationSec % 3600) / 60);
  const durationEst = h > 0 ? `${h < 10 ? '0' : ''}${h}h ${m < 10 ? '0' : ''}${m}m` : `${m}m`;

  const cover = extractedCover ? await autoCropImageToEbookCover(extractedCover) : getGenericBookCover(title, author);
  if (extractedCover && extractedCover.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(extractedCover);
    } catch {}
  }

  const chapterCount = Math.max(1, Math.min(10, Math.ceil(durationSec / 600)));
  const chapDuration = Math.floor(durationSec / chapterCount);
  
  // Utiliza os capítulos reais extraídos do contêiner M4B / MP4 se presentes
  const chapters: Chapter[] = extractedChapters.length > 0
    ? extractedChapters.map((c, idx) => {
        const nextStart = idx < extractedChapters.length - 1 ? extractedChapters[idx + 1].startTime : durationSec;
        return {
          id: idx + 1,
          title: c.title || `Capítulo ${idx + 1}`,
          startTime: c.startTime,
          duration: Math.max(1, nextStart - c.startTime)
        };
      })
    : Array.from({ length: chapterCount }, (_, i) => ({
        id: i + 1,
        title: `Capítulo ${i + 1}`,
        startTime: i * chapDuration,
        duration: i === chapterCount - 1 ? durationSec - i * chapDuration : chapDuration
      }));

  const resolved = resolveGenreList(rawCategory, rawSubgenre);
  const resolvedLanguage = normalizeAudiobookLanguage(rawLanguage);
  const authorNationality = rawAuthorNationality.trim() || 'Desconhecido';
  const validatedTranscript = validateAndNormalizeTranscript(extractedTranscript, durationSec);

  return {
    title,
    author,
    authorNationality,
    category: resolved.category,
    subgenre: resolved.subgenre,
    year,
    cover,
    durationSec,
    durationEst,
    sizeStr,
    chapters,
    transcript: validatedTranscript,
    description: description || undefined,
    narrator: narrator || undefined,
    language: resolvedLanguage
  };
}

function decodeId3Text(bytes: Uint8Array): string {
  if (bytes.length <= 1) return '';
  const encoding = bytes[0];
  const data = bytes.subarray(1);
  try {
    if (encoding === 0) {
      return new TextDecoder('latin1').decode(data).replace(/\0+$/, '');
    } else if (encoding === 1 || encoding === 2) {
      return new TextDecoder('utf-16').decode(data).replace(/\0+$/, '');
    } else {
      return new TextDecoder('utf-8').decode(data).replace(/\0+$/, '');
    }
  } catch {
    return '';
  }
}

// ==========================================
// 5. SYNCHRONIZED TEXT PARSER & VALIDATOR
// ==========================================

/**
 * Decodes ID3v2 SYLT (Synchronised lyric/text) frame into TranscriptLine[]
 */
function decodeId3SyltFrame(frameData: Uint8Array): TranscriptLine[] {
  try {
    if (frameData.length < 7) return [];
    const encoding = frameData[0];
    // [1..3] language, [4] time stamp format (1 = frames, 2 = milliseconds), [5] content type
    const timeFormat = frameData[4];
    if (timeFormat !== 2) return []; // Only millisecond timestamps are directly usable without MPEG frame tables

    const isUtf16 = encoding === 1 || encoding === 2;
    const decoder = new TextDecoder(
      encoding === 0 ? 'latin1' : isUtf16 ? 'utf-16' : 'utf-8'
    );

    let pos = 6;
    // Skip content descriptor (null-terminated)
    if (isUtf16) {
      while (pos + 1 < frameData.length && !(frameData[pos] === 0 && frameData[pos + 1] === 0)) {
        pos += 2;
      }
      pos += 2;
    } else {
      while (pos < frameData.length && frameData[pos] !== 0) {
        pos++;
      }
      pos++;
    }

    const rawEntries: { start: number; text: string }[] = [];
    while (pos < frameData.length) {
      const textStart = pos;
      if (isUtf16) {
        while (pos + 1 < frameData.length && !(frameData[pos] === 0 && frameData[pos + 1] === 0)) {
          pos += 2;
        }
      } else {
        while (pos < frameData.length && frameData[pos] !== 0) {
          pos++;
        }
      }
      const textBytes = frameData.subarray(textStart, pos);
      const rawText = decoder.decode(textBytes).replace(/[\r\n]+/g, ' ').trim();
      pos += isUtf16 ? 2 : 1;

      if (pos + 4 > frameData.length) break;
      const timeMs =
        ((frameData[pos] << 24) >>> 0) +
        (frameData[pos + 1] << 16) +
        (frameData[pos + 2] << 8) +
        frameData[pos + 3];
      pos += 4;

      if (rawText) {
        rawEntries.push({ start: timeMs / 1000, text: rawText });
      }
    }

    if (rawEntries.length === 0) return [];
    rawEntries.sort((a, b) => a.start - b.start);

    return rawEntries.map((entry, idx) => {
      const next = rawEntries[idx + 1];
      const end = next ? Math.max(entry.start + 0.2, next.start) : entry.start + 4.0;
      return {
        start: Number(entry.start.toFixed(2)),
        end: Number(end.toFixed(2)),
        text: entry.text,
      };
    });
  } catch {
    return [];
  }
}
