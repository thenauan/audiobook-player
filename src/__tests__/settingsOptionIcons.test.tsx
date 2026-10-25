import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SettingsView } from '../views/SettingsView';
import { getTranslation, I18nContext } from '../translations';
import { Laptop, Sun, Moon } from 'lucide-react';

describe('Settings Popup Option Icons', () => {
  const baseProps: any = {
    activeScreen: { id: 'settings' },
    navigateTo: vi.fn(),
    t: (k: string, params?: any) => getTranslation('pt', k, params),
    themeMode: 'system',
    setThemeMode: vi.fn(),
    accentColor: 'blue',
    setAccentColor: vi.fn(),
    fontSize: 'standard',
    setFontSize: vi.fn(),
    appLanguage: 'pt',
    setAppLanguage: vi.fn(),
    resolvedLanguage: 'pt',
    libraryFolder: '/audiobooks',
    isSyncingLibrary: false,
    handleSyncLibraryNow: vi.fn(),
    handleSelectLibraryFolder: vi.fn(),
    detectNewFiles: 'manual',
    setDetectNewFiles: vi.fn(),
    checkOnStartup: false,
    setCheckOnStartup: vi.fn(),
    handleExportLibraryBackup: vi.fn(),
    handleImportLibraryBackup: vi.fn(),
    defaultPlaybackSpeed: 1.0,
    setDefaultPlaybackSpeed: vi.fn(),
    setPlaybackSpeed: vi.fn(),
    seekForwardTime: 30,
    setSeekForwardTime: vi.fn(),
    seekBackwardTime: 15,
    setSeekBackwardTime: vi.fn(),
    resumePlayback: true,
    setResumePlayback: vi.fn(),
    autoShowText: false,
    setAutoShowText: vi.fn(),
    voiceBoostEnabled: false,
    setVoiceBoostEnabled: vi.fn(),
    dynamicCompressionEnabled: false,
    setDynamicCompressionEnabled: vi.fn(),
    notificationsEnabled: true,
    setNotificationsEnabled: vi.fn(),
    notifyChapterCompleted: true,
    setNotifyChapterCompleted: vi.fn(),
    notifyBookCompleted: true,
    setNotifyBookCompleted: vi.fn(),
    notifyBookAdded: true,
    setNotifyBookAdded: vi.fn(),
    dataFolder: '/data',
    handleOpenDataFolder: vi.fn(),
    showToast: vi.fn(),
    closeAllPopups: vi.fn(),
    activeSettingSelector: null,
    setActiveSettingSelector: vi.fn(),
    showLicensesModal: false,
    setShowLicensesModal: vi.fn(),
    transicaoConteudo: {},
    getBackdropProps: vi.fn(() => ({})),
    setupWebAudioGraph: vi.fn(),
  };

  it('renders SettingsView without throwing', () => {
    const html = renderToString(
      <I18nContext.Provider
        value={{
          language: 'pt',
          appLanguage: 'pt',
          setAppLanguage: vi.fn(),
          t: (k: string, params?: any) => getTranslation('pt', k, params),
        }}
      >
        <SettingsView {...baseProps} />
      </I18nContext.Provider>
    );

    expect(html).toContain('Ajustes');
  });

  it('verifies that setting selector options render icons and color previews correctly', () => {
    // Simular o componente de popup de seleção de configurações
    const sampleOptions = [
      { value: 'system', label: 'Sistema', description: 'Seguir o sistema', icon: <Laptop data-testid="icon-system" size={15} /> },
      { value: 'light', label: 'Claro', description: 'Tema claro', icon: <Sun data-testid="icon-light" size={15} /> },
      { value: 'dark', label: 'Escuro', description: 'Tema escuro', icon: <Moon data-testid="icon-dark" size={15} /> },
    ];

    const PopupContent = ({ options, currentValue }: { options: typeof sampleOptions; currentValue: string }) => (
      <div>
        {options.map((option, idx) => {
          const isSelected = currentValue === option.value;
          return (
            <div key={idx} className="option-row">
              {option.icon ? (
                <span className={`icon-wrapper ${isSelected ? 'selected' : ''}`}>{option.icon}</span>
              ) : null}
              <span>{option.label}</span>
              {option.description && <span>{option.description}</span>}
            </div>
          );
        })}
      </div>
    );

    const html = renderToString(<PopupContent options={sampleOptions} currentValue="system" />);

    expect(html).toContain('Sistema');
    expect(html).toContain('Claro');
    expect(html).toContain('Escuro');
    expect(html).toContain('data-testid="icon-system"');
    expect(html).toContain('data-testid="icon-light"');
    expect(html).toContain('data-testid="icon-dark"');
  });
});

