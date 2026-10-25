import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatCountdown,
  calculateChapterTiming,
  findChapterAtTime,
} from '../audioUtils';
import { Chapter } from '../data';

describe('Chapter Times & Formatting Calculations', () => {
  describe('formatTime', () => {
    it('formats seconds under one minute as m:ss', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(9)).toBe('0:09');
      expect(formatTime(45)).toBe('0:45');
      expect(formatTime(59)).toBe('0:59');
    });

    it('formats minutes and seconds without hours as m:ss', () => {
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(75)).toBe('1:15');
      expect(formatTime(599)).toBe('9:59');
      expect(formatTime(600)).toBe('10:00');
      expect(formatTime(3599)).toBe('59:59');
    });

    it('formats hours, minutes, and seconds as h:mm:ss', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3661)).toBe('1:01:01');
      expect(formatTime(7200 + 120 + 5)).toBe('2:02:05');
      expect(formatTime(36000)).toBe('10:00:00');
    });

    it('handles negative or invalid values gracefully', () => {
      expect(formatTime(-10)).toBe('0:00');
      expect(formatTime(NaN)).toBe('0:00');
    });
  });

  describe('formatCountdown', () => {
    it('formats remaining countdown times properly', () => {
      expect(formatCountdown(0)).toBe('00:00');
      expect(formatCountdown(5)).toBe('00:05');
      expect(formatCountdown(65)).toBe('01:05');
      expect(formatCountdown(3605)).toBe('1:00:05');
      expect(formatCountdown(-5)).toBe('00:00');
    });
  });

  describe('calculateChapterTiming', () => {
    const mockChapter = {
      startTime: 300, // Starts at 5:00
      duration: 600,   // 10 minutes long
    };

    it('returns zeroes when chapter is undefined', () => {
      const result = calculateChapterTiming(100, undefined);
      expect(result).toEqual({
        chapterElapsed: 0,
        chapterRemaining: 0,
        progressPercent: 0,
      });
    });

    it('calculates elapsed, remaining and percent at start of chapter', () => {
      const result = calculateChapterTiming(300, mockChapter);
      expect(result.chapterElapsed).toBe(0);
      expect(result.chapterRemaining).toBe(600);
      expect(result.progressPercent).toBe(0);
    });

    it('calculates midpoint values accurately', () => {
      const result = calculateChapterTiming(600, mockChapter); // 5 mins in
      expect(result.chapterElapsed).toBe(300);
      expect(result.chapterRemaining).toBe(300);
      expect(result.progressPercent).toBe(50);
    });

    it('clamps values at the end of chapter', () => {
      const result = calculateChapterTiming(950, mockChapter); // Past duration
      expect(result.chapterElapsed).toBe(650);
      expect(result.chapterRemaining).toBe(0);
      expect(result.progressPercent).toBe(100);
    });

    it('handles currentTime before chapter starts', () => {
      const result = calculateChapterTiming(150, mockChapter);
      expect(result.chapterElapsed).toBe(0);
      expect(result.chapterRemaining).toBe(600);
      expect(result.progressPercent).toBe(0);
    });
  });

  describe('findChapterAtTime', () => {
    const chapters: Chapter[] = [
      { id: 1, title: 'Prologue', startTime: 0, duration: 180 },
      { id: 2, title: 'Chapter 1', startTime: 180, duration: 400 },
      { id: 3, title: 'Chapter 2', startTime: 580, duration: 600 },
      { id: 4, title: 'Epilogue', startTime: 1180, duration: 200 },
    ];

    it('returns undefined for empty chapter list', () => {
      expect(findChapterAtTime([], 100)).toBeUndefined();
    });

    it('finds the first chapter at time 0', () => {
      const found = findChapterAtTime(chapters, 0);
      expect(found?.id).toBe(1);
    });

    it('finds intermediate chapters based on timestamp', () => {
      expect(findChapterAtTime(chapters, 100)?.id).toBe(1);
      expect(findChapterAtTime(chapters, 180)?.id).toBe(2);
      expect(findChapterAtTime(chapters, 300)?.id).toBe(2);
      expect(findChapterAtTime(chapters, 580)?.id).toBe(3);
      expect(findChapterAtTime(chapters, 1000)?.id).toBe(3);
      expect(findChapterAtTime(chapters, 1180)?.id).toBe(4);
      expect(findChapterAtTime(chapters, 2000)?.id).toBe(4);
    });
  });
});

