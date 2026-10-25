import { describe, it, expect } from 'vitest';
import {
  findActiveTranscriptIndex,
  findActiveWordIndex,
  groupTimedWordsIntoSegments,
  validateAndNormalizeTranscript,
} from '../audioUtils';
import { TranscriptLine, TranscriptWord } from '../data';

describe('Transcript Synchronization & Search', () => {
  const sampleTranscript: TranscriptLine[] = [
    { start: 0.0, end: 3.5, text: 'No princípio era o Verbo.' },
    { start: 4.0, end: 7.2, text: 'E o Verbo estava com Deus.' },
    { start: 7.5, end: 11.0, text: 'E o Verbo era Deus.' },
    { start: 12.0, end: 16.5, text: 'Ele estava no princípio com Deus.' },
    { start: 17.0, end: 22.0, text: 'Todas as coisas foram feitas por intermédio dele.' },
  ];

  describe('findActiveTranscriptIndex', () => {
    it('returns -1 for empty or undefined transcript', () => {
      expect(findActiveTranscriptIndex(undefined, 5)).toBe(-1);
      expect(findActiveTranscriptIndex([], 5)).toBe(-1);
    });

    it('finds exact active index via binary search when lastIndex is -1', () => {
      expect(findActiveTranscriptIndex(sampleTranscript, 1.5, -1)).toBe(0);
      expect(findActiveTranscriptIndex(sampleTranscript, 5.0, -1)).toBe(1);
      expect(findActiveTranscriptIndex(sampleTranscript, 9.0, -1)).toBe(2);
      expect(findActiveTranscriptIndex(sampleTranscript, 14.0, -1)).toBe(3);
      expect(findActiveTranscriptIndex(sampleTranscript, 19.0, -1)).toBe(4);
    });

    it('performs O(1) sequential lookup when time stays on current line or advances to next line', () => {
      // Current line check
      expect(findActiveTranscriptIndex(sampleTranscript, 2.0, 0)).toBe(0);
      expect(findActiveTranscriptIndex(sampleTranscript, 3.4, 0)).toBe(0);

      // Next line check (O(1))
      expect(findActiveTranscriptIndex(sampleTranscript, 4.5, 0)).toBe(1);
      expect(findActiveTranscriptIndex(sampleTranscript, 6.0, 1)).toBe(1);
      expect(findActiveTranscriptIndex(sampleTranscript, 8.0, 1)).toBe(2);
    });

    it('handles seek jumps backwards and forwards correctly via binary fallback', () => {
      // User jumped from index 4 to time 1.0 (index 0)
      expect(findActiveTranscriptIndex(sampleTranscript, 1.0, 4)).toBe(0);

      // User jumped from index 0 to time 18.0 (index 4)
      expect(findActiveTranscriptIndex(sampleTranscript, 18.0, 0)).toBe(4);
    });

    it('maintains recently finished line during short pauses/gaps between sentences', () => {
      // Gap between 3.5 and 4.0
      expect(findActiveTranscriptIndex(sampleTranscript, 3.8, 0)).toBe(0);

      // Gap between 11.0 and 12.0
      expect(findActiveTranscriptIndex(sampleTranscript, 11.5, 2)).toBe(2);
    });

    it('returns -1 before the first line starts', () => {
      const delayedTranscript: TranscriptLine[] = [
        { start: 10.0, end: 15.0, text: 'Começando após 10 segundos.' },
      ];
      expect(findActiveTranscriptIndex(delayedTranscript, 2.0, -1)).toBe(-1);
    });
  });

  describe('findActiveWordIndex', () => {
    const sampleWords: TranscriptWord[] = [
      { start: 1.0, end: 1.4, text: 'No' },
      { start: 1.5, end: 2.1, text: 'princípio' },
      { start: 2.2, end: 2.5, text: 'era' },
      { start: 2.6, end: 3.2, text: 'o' },
      { start: 3.3, end: 4.0, text: 'Verbo.' },
    ];

    it('returns -1 for undefined or empty word list', () => {
      expect(findActiveWordIndex(undefined, 1.5)).toBe(-1);
      expect(findActiveWordIndex([], 1.5)).toBe(-1);
    });

    it('identifies the active word currently being spoken', () => {
      expect(findActiveWordIndex(sampleWords, 1.2)).toBe(0);
      expect(findActiveWordIndex(sampleWords, 1.8)).toBe(1);
      expect(findActiveWordIndex(sampleWords, 2.3)).toBe(2);
      expect(findActiveWordIndex(sampleWords, 3.0)).toBe(3);
      expect(findActiveWordIndex(sampleWords, 3.8)).toBe(4);
    });

    it('returns -1 between words or outside range', () => {
      expect(findActiveWordIndex(sampleWords, 0.5)).toBe(-1);
      expect(findActiveWordIndex(sampleWords, 5.0)).toBe(-1);
    });
  });

  describe('groupTimedWordsIntoSegments', () => {
    it('returns empty array when no valid words are provided', () => {
      expect(groupTimedWordsIntoSegments([])).toEqual([]);
    });

    it('groups words into sentences when punctuation is detected', () => {
      const words: TranscriptWord[] = [
        { start: 0.0, end: 0.5, text: 'Olá' },
        { start: 0.6, end: 1.0, text: 'mundo.' },
        { start: 1.2, end: 1.8, text: 'Aqui' },
        { start: 1.9, end: 2.4, text: 'começa' },
        { start: 2.5, end: 3.0, text: 'o' },
        { start: 3.1, end: 3.5, text: 'livro.' },
      ];

      const segments = groupTimedWordsIntoSegments(words);
      expect(segments.length).toBeGreaterThanOrEqual(1);
      expect(segments[0].start).toBe(0.0);
      expect(segments[segments.length - 1].end).toBe(3.5);
      expect(segments.some(s => s.text.includes('mundo.'))).toBe(true);
    });
  });

  describe('validateAndNormalizeTranscript', () => {
    it('cleans up invalid lines and ensures start < end', () => {
      const raw: any[] = [
        { start: 5.0, end: 4.0, text: 'Invalid order' }, // end <= start
        { start: '10.5', end: '15.0', text: 'String timestamps' },
        { start: -1, end: 5.0, text: 'Negative timestamp' },
        { start: 20.0, end: 25.0, text: '   Excess whitespace trimmed   ' },
      ];

      const validated = validateAndNormalizeTranscript(raw);
      expect(validated.length).toBe(3); // The negative timestamp is filtered out
      // end <= start should be assigned a default fallback end
      expect(validated[0].start).toBe(5.0);
      expect(validated[0].end).toBeGreaterThan(5.0);

      // Strings should be converted to numbers
      expect(validated[1].start).toBe(10.5);
      expect(validated[1].end).toBe(15.0);

      // Whitespace trimmed
      expect(validated[2].text).toBe('Excess whitespace trimmed');
    });
  });
});

