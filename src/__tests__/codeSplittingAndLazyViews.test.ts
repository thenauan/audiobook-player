import { describe, it, expect } from 'vitest';

describe('Code Splitting & Dynamic Module Imports', { timeout: 20000 }, () => {
  it('dynamically imports SettingsView module without errors', async () => {
    const module = await import('../views/SettingsView');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('dynamically imports HelpCenterView module without errors', async () => {
    const module = await import('../views/HelpCenterView');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('dynamically imports DevToolsModal module without errors', async () => {
    const module = await import('../views/DevToolsModal');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('dynamically imports ImageCropperSquare module without errors', async () => {
    const module = await import('../ImageCropperSquare');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('dynamically imports BookDetailView module without errors', async () => {
    const module = await import('../views/BookDetailView');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('dynamically imports FullscreenPlayer module without errors', async () => {
    const module = await import('../components/FullscreenPlayer');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('dynamically imports MiniPlayer module without errors', async () => {
    const module = await import('../components/MiniPlayer');
    expect(module.default).toBeDefined();
    expect(typeof module.default).toBe('function');
  });

  it('verifies standardized loading spinner without text for Settings and Help views', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const appContent = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');

    // Both Settings and Help Center must use the same standardized spinner with no text
    const expectedSpinner = '<div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />';
    
    // Check Settings fallback
    const settingsMatch = appContent.match(/\{\/\* SCREEN: SETTINGS \(LAZY-LOADED\) \*\/\}[\s\S]*?<Suspense fallback=\{([\s\S]*?)\}>[\s\S]*?<SettingsView/);
    expect(settingsMatch).toBeTruthy();
    expect(settingsMatch![1]).toContain(expectedSpinner);
    expect(settingsMatch![1]).not.toContain('span');
    expect(settingsMatch![1]).not.toContain('t(');

    // Check Help Center fallback
    const helpMatch = appContent.match(/\{\/\* SCREEN: HELP SCREENS \(LAZY-LOADED\) \*\/\}[\s\S]*?<Suspense fallback=\{([\s\S]*?)\}>[\s\S]*?<HelpCenterView/);
    expect(helpMatch).toBeTruthy();
    expect(helpMatch![1]).toContain(expectedSpinner);
    expect(helpMatch![1]).not.toContain('span');
    expect(helpMatch![1]).not.toContain('t(');
  });
});

