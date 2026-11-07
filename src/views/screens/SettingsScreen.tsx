// Tela extraída do App.tsx. Recebe do App, pelo contexto, só o que usa; enquanto sai com animação, mantém os
// dados que tinha (como quando o conteúdo ficava dentro do App)
import { Suspense } from 'react';
import { getBackdropProps } from '../../components/popups/popupUtils';
import { SettingsView, transicaoConteudo } from '../../App';
import { useScreenScope } from '../../app/AppScope';

export function SettingsScreen() {
  const { accentColor, activeScreen, activeSettingSelector, appLanguage, autoShowText, checkOnStartup, closeAllPopups, dataFolder, defaultPlaybackSpeed, detectNewFiles, dynamicCompressionEnabled, fontSize, handleExportLibraryBackup, handleImportLibraryBackup, handleOpenDataFolder, handleSelectLibraryFolder, handleSyncLibraryNow, isMobile, isSyncingLibrary, libraryFolder, navigateTo, notificationsOn, notifyBookAdded, notifyBookCompleted, notifyChapterCompleted, notifyContent, resolvedLanguage, resumePlayback, seekBackwardTime, seekForwardTime, setAccentColor, setActiveSettingSelector, setAppLanguage, setAutoShowText, setCheckOnStartup, setDefaultPlaybackSpeed, setDetectNewFiles, setDynamicCompressionEnabled, setFontSize, setNotifyBookAdded, setNotifyBookCompleted, setNotifyChapterCompleted, setNotifyContent, setPlaybackSpeed, setResumePlayback, setSeekBackwardTime, setSeekForwardTime, setShowLicensesModal, setThemeMode, setUiDensity, setVoiceBoostEnabled, setupWebAudioGraph, showLicensesModal, showToast, t, themeMode, toggleNotifications, uiDensity, voiceBoostEnabled } = useScreenScope();
  return (
    <Suspense fallback={
      <div className="w-full min-h-[320px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-winblue border-t-transparent animate-spin" />
      </div>
    }>
      <SettingsView
        activeScreen={activeScreen}
        navigateTo={navigateTo}
        t={t}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        uiDensity={uiDensity}
        setUiDensity={setUiDensity}
        fontSize={fontSize}
        setFontSize={setFontSize}
        appLanguage={appLanguage}
        setAppLanguage={setAppLanguage}
        resolvedLanguage={resolvedLanguage}
        libraryFolder={libraryFolder}
        isSyncingLibrary={isSyncingLibrary}
        handleSyncLibraryNow={handleSyncLibraryNow}
        handleSelectLibraryFolder={handleSelectLibraryFolder}
        detectNewFiles={detectNewFiles}
        setDetectNewFiles={setDetectNewFiles}
        checkOnStartup={checkOnStartup}
        setCheckOnStartup={setCheckOnStartup}
        handleExportLibraryBackup={handleExportLibraryBackup}
        handleImportLibraryBackup={handleImportLibraryBackup}
        defaultPlaybackSpeed={defaultPlaybackSpeed}
        setDefaultPlaybackSpeed={setDefaultPlaybackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
        seekForwardTime={seekForwardTime}
        setSeekForwardTime={setSeekForwardTime}
        seekBackwardTime={seekBackwardTime}
        setSeekBackwardTime={setSeekBackwardTime}
        resumePlayback={resumePlayback}
        setResumePlayback={setResumePlayback}
        autoShowText={autoShowText}
        setAutoShowText={setAutoShowText}
        voiceBoostEnabled={voiceBoostEnabled}
        setVoiceBoostEnabled={setVoiceBoostEnabled}
        dynamicCompressionEnabled={dynamicCompressionEnabled}
        setDynamicCompressionEnabled={setDynamicCompressionEnabled}
        notificationsEnabled={notificationsOn}
        setNotificationsEnabled={toggleNotifications}
        notifyChapterCompleted={notifyChapterCompleted}
        setNotifyChapterCompleted={setNotifyChapterCompleted}
        notifyBookCompleted={notifyBookCompleted}
        setNotifyBookCompleted={setNotifyBookCompleted}
        notifyBookAdded={notifyBookAdded}
        notifyContent={notifyContent}
        setNotifyContent={setNotifyContent}
        setNotifyBookAdded={setNotifyBookAdded}
        dataFolder={dataFolder}
        handleOpenDataFolder={handleOpenDataFolder}
        showToast={showToast}
        closeAllPopups={closeAllPopups}
        activeSettingSelector={activeSettingSelector}
        setActiveSettingSelector={(sel: any) => {
          if (sel && isMobile) {
            closeAllPopups();
            navigateTo('settings-option', { ...sel, triggerEl: undefined });
            return;
          }
          setActiveSettingSelector(sel);
        }}
        showLicensesModal={showLicensesModal}
        setShowLicensesModal={setShowLicensesModal}
        transicaoConteudo={transicaoConteudo}
        getBackdropProps={getBackdropProps}
        setupWebAudioGraph={setupWebAudioGraph}
      />
    </Suspense>
  );
}
