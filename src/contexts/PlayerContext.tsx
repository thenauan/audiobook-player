import React, { createContext, useContext } from 'react';
import type { Audiobook, Chapter } from '../data';
import type { QueueItem } from '../queueUtils';

export interface PlaybackReturnPoint {
  globalTime: number;
  bookId: string;
  chapterTitle: string;
  createdAt: number;
}

export interface PlayerContextType {
  currentBook: Audiobook | null;
  currentChapter: Chapter | null;
  currentChapterIndex: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  playbackQueue: QueueItem[];
  isFullScreen: boolean;
  isPlayerVisible: boolean;
  sleepTimerMinutes: number | null;
  sleepTimerRemaining: number | null;
  playbackReturnPoint: PlaybackReturnPoint | null;
  
  // Actions
  play: (book: Audiobook, chapterIndex?: number) => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (timeSec: number) => void;
  skipForward: (sec?: number) => void;
  skipBackward: (sec?: number) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setSleepTimer: (minutes: number | null) => void;
  setIsFullScreen: (full: boolean) => void;
  toggleFullScreen: () => void;
  addToQueue: (item: QueueItem, position?: 'next' | 'end') => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  dismissReturnPoint: () => void;
  applyReturnPoint: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({
  value,
  children
}: {
  value: PlayerContextType;
  children: React.ReactNode;
}) {
  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return ctx;
}

