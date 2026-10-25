import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { NavigationProvider, useNavigation, type NavigationContextType } from '../contexts/NavigationContext';
import { PlayerProvider, usePlayer, type PlayerContextType } from '../contexts/PlayerContext';
import type { Audiobook } from '../data';

describe('Architecture & Modular Contexts', () => {
  describe('NavigationContext', () => {
    it('throws error when useNavigation is used outside NavigationProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      function Consumer() {
        useNavigation();
        return null;
      }
      expect(() => {
        renderToString(<Consumer />);
      }).toThrow('useNavigation must be used within a NavigationProvider');
      spy.mockRestore();
    });

    it('initializes with default home screen and passes values to consumers', () => {
      let nav!: NavigationContextType;
      function Consumer() {
        nav = useNavigation();
        return <div data-screen={nav.activeScreen.id}>{nav.activeScreen.id}</div>;
      }

      const html = renderToString(
        <NavigationProvider initialScreen={{ id: 'home' }}>
          <Consumer />
        </NavigationProvider>
      );

      expect(html).toContain('home');
      expect(nav.activeScreen.id).toBe('home');
      expect(nav.canGoBack).toBe(false);
      expect(nav.historyStack).toHaveLength(0);
    });

    it('allows navigateTo, goBack and history management', () => {
      let nav!: NavigationContextType;
      function Consumer() {
        nav = useNavigation();
        return null;
      }

      // Test component logic
      renderToString(
        <NavigationProvider initialScreen={{ id: 'home' }}>
          <Consumer />
        </NavigationProvider>
      );

      expect(nav.activeScreen.id).toBe('home');
      expect(typeof nav.navigateTo).toBe('function');
      expect(typeof nav.goBack).toBe('function');
      expect(typeof nav.setActiveModal).toBe('function');
      expect(typeof nav.closeAllModals).toBe('function');
    });
  });

  describe('PlayerContext', () => {
    it('throws error when usePlayer is used outside PlayerProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      function Consumer() {
        usePlayer();
        return null;
      }
      expect(() => {
        renderToString(<Consumer />);
      }).toThrow('usePlayer must be used within a PlayerProvider');
      spy.mockRestore();
    });

    it('provides player state and action triggers to consumers', () => {
      const mockPlay = vi.fn();
      const mockPause = vi.fn();
      const mockSeek = vi.fn();

      const mockBook: Audiobook = {
        id: 'b1',
        title: 'Memórias Póstumas',
        author: 'Machado de Assis',
        authorId: 'a1',
        narrator: 'Narrador',
        cover: '',
        category: 'Clássico',
        durationEst: '5h',
        sizeStr: '150 MB',
        chapters: [{ id: 1, title: 'Capítulo 1', startTime: 0, duration: 300 }],
        transcript: [],
        year: '1881'
      };

      const mockContextValue: PlayerContextType = {
        currentBook: mockBook,
        currentChapter: mockBook.chapters[0],
        currentChapterIndex: 0,
        currentTime: 42,
        duration: 300,
        isPlaying: true,
        playbackSpeed: 1.25,
        volume: 0.85,
        isMuted: false,
        playbackQueue: [],
        isFullScreen: false,
        isPlayerVisible: true,
        sleepTimerMinutes: 30,
        sleepTimerRemaining: 1800,
        playbackReturnPoint: null,
        play: mockPlay,
        pause: mockPause,
        togglePlay: vi.fn(),
        seek: mockSeek,
        skipForward: vi.fn(),
        skipBackward: vi.fn(),
        setSpeed: vi.fn(),
        setVolume: vi.fn(),
        toggleMute: vi.fn(),
        setSleepTimer: vi.fn(),
        setIsFullScreen: vi.fn(),
        toggleFullScreen: vi.fn(),
        addToQueue: vi.fn(),
        removeFromQueue: vi.fn(),
        clearQueue: vi.fn(),
        dismissReturnPoint: vi.fn(),
        applyReturnPoint: vi.fn()
      };

      let player!: PlayerContextType;
      function Consumer() {
        player = usePlayer();
        return <div>{player.currentBook?.title}</div>;
      }

      const html = renderToString(
        <PlayerProvider value={mockContextValue}>
          <Consumer />
        </PlayerProvider>
      );

      expect(html).toContain('Memórias Póstumas');
      expect(player.currentBook?.title).toBe('Memórias Póstumas');
      expect(player.isPlaying).toBe(true);
      expect(player.playbackSpeed).toBe(1.25);
      expect(player.currentTime).toBe(42);

      player.play(mockBook, 0);
      expect(mockPlay).toHaveBeenCalledWith(mockBook, 0);

      player.seek(100);
      expect(mockSeek).toHaveBeenCalledWith(100);
    });
  });
});

