import { IS_INSTALLED_APP } from '../desktopBridge';
import { APP_VERSION } from '../version';
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Palette, BookOpen, Bell, Settings as SettingsIcon, Moon, Sun, Laptop, Monitor, ChevronDown,
  Sliders, Type, ALargeSmall, Globe, FolderOpen, RefreshCw, Clock, Download, Upload,
  Gauge, Play, FileText, Activity, CheckCircle2, ListPlus, Database, Trash2, Info,
  Turtle, Rabbit, Dog, Bird, Clock3, Clock6, Clock9, Clock12, Hand, Power, ChevronRight, Cloud, X
} from 'lucide-react';
import { BsPlayFill, BsArrowClockwise, BsArrowCounterclockwise } from 'react-icons/bs';
import {
  SupportedLanguage,
  LANGUAGE_NATIVE_NAMES,
  getLanguageDisplayName,
  getSystemLanguage,
} from '../translations';

export const ACCENT_COLORS: Record<string, { name: string; hex: string; rgb: string; bgClass: string }> = {
  blue: { name: 'Azul', hex: '#0086F0', rgb: '0, 134, 240', bgClass: 'bg-[#0086F0]' },
  purple: { name: 'Roxo', hex: '#8B5CF6', rgb: '139, 92, 246', bgClass: 'bg-[#8B5CF6]' },
  green: { name: 'Verde', hex: '#10B981', rgb: '16, 185, 129', bgClass: 'bg-[#10B981]' },
  red: { name: 'Vermelho', hex: '#EF4444', rgb: '239, 68, 68', bgClass: 'bg-[#EF4444]' },
  orange: { name: 'Laranja', hex: '#F97316', rgb: '249, 115, 22', bgClass: 'bg-[#F97316]' },
  pink: { name: 'Rosa', hex: '#EC4899', rgb: '236, 72, 153', bgClass: 'bg-[#EC4899]' },
};

export function SettingToggle({
  checked,
  onChange,
  enabledLabel,
  disabledLabel,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  enabledLabel?: string;
  disabledLabel?: string;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new Event('close-all-popups'));
        onChange(!checked);
      }}
      className="flex items-center gap-3 shrink-0 select-none cursor-pointer group"
    >
      <span
        className={`text-xs font-semibold transition-colors duration-150 ${
          checked ? 'text-winblue' : 'text-[var(--text-muted)]'
        }`}
      >
        {checked ? (enabledLabel || 'Ativado') : (disabledLabel || 'Desativado')}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative w-[48px] h-[28px] rounded-full p-[4px] transition-[background-color,border-color,box-shadow] duration-150 flex items-center border cursor-pointer ${
          checked
            ? 'bg-winblue/20 border-winblue/40 hover:bg-winblue/25 hover:border-winblue/55 hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)] group-hover:bg-winblue/25 group-hover:border-winblue/55 group-hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)]'
            : 'bg-card/75 backdrop-blur-3xl border-[var(--text-main)]/10 hover:bg-white/15 hover:border-white/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] group-hover:bg-white/15 group-hover:border-white/20 group-hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]'
        }`}
      >
        <span
          className={`w-[18px] h-[18px] rounded-full shadow-md transition-transform duration-150 transform flex items-center justify-center ${
            checked
              ? 'translate-x-[20px] bg-winblue shadow-[0_2px_8px_rgba(var(--winblue-rgb),0.4)]'
              : 'translate-x-0 bg-[var(--text-main)]/40 group-hover:bg-[var(--text-main)]/60'
          }`}
        />
      </button>
    </div>
  );
}

export type DetectNewFilesMode = 'manual' | 'startup' | 'folder-select';

export interface SettingsViewProps {
  activeScreen: { id: string; [key: string]: any };
  navigateTo: (screenId: string, params?: any) => void;
  t: (key: string, params?: any) => string;
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  uiDensity?: any;
  setUiDensity?: any;
  fontSize: 'standard' | 'large' | 'small';
  setFontSize: (size: any) => void;
  appLanguage: string;
  setAppLanguage: (lang: any) => void;
  resolvedLanguage: SupportedLanguage;
  libraryFolder: string;
  isSyncingLibrary: boolean;
  handleSyncLibraryNow: () => void;
  handleSelectLibraryFolder: () => void;
  altLibraryFolder: string;
  handleConnectGoogleDrive: () => void;
  handleDisconnectGoogleDrive: () => void;
  detectNewFiles: DetectNewFilesMode;
  setDetectNewFiles: React.Dispatch<React.SetStateAction<DetectNewFilesMode>>;
  checkOnStartup: boolean;
  setCheckOnStartup: (val: boolean) => void;
  handleExportLibraryBackup: () => void;
  handleImportLibraryBackup: (file: File) => void;
  defaultPlaybackSpeed: number;
  setDefaultPlaybackSpeed: (speed: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  seekForwardTime: number;
  setSeekForwardTime: (time: number) => void;
  seekBackwardTime: number;
  setSeekBackwardTime: (time: number) => void;
  resumePlayback: boolean;
  setResumePlayback: (val: boolean) => void;
  autoShowText: boolean;
  setAutoShowText: (val: boolean) => void;
  voiceBoostEnabled: boolean;
  setVoiceBoostEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  dynamicCompressionEnabled: boolean;
  setDynamicCompressionEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
  notifyChapterCompleted: boolean;
  setNotifyChapterCompleted: (val: boolean) => void;
  notifyBookCompleted: boolean;
  setNotifyBookCompleted: (val: boolean) => void;
  notifyBookAdded: boolean;
  setNotifyBookAdded: (val: boolean) => void;
  dataFolder: string;
  handleOpenDataFolder: () => void;
  showToast: (msg: string) => void;
  closeAllPopups: () => void;
  activeSettingSelector: any;
  setActiveSettingSelector: (selector: any) => void;
  showLicensesModal: boolean;
  setShowLicensesModal: (show: boolean) => void;
  transicaoConteudo: any;
  getBackdropProps: (onClose: (e?: any) => void) => any;
  setupWebAudioGraph: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  activeScreen,
  navigateTo,
  t,
  themeMode,
  setThemeMode,
  accentColor,
  setAccentColor,
  uiDensity: _uiDensity,
  setUiDensity: _setUiDensity,
  fontSize,
  setFontSize,
  appLanguage,
  setAppLanguage,
  resolvedLanguage,
  libraryFolder,
  isSyncingLibrary,
  handleSyncLibraryNow,
  handleSelectLibraryFolder,
  altLibraryFolder,
  handleConnectGoogleDrive,
  handleDisconnectGoogleDrive,
  detectNewFiles,
  setDetectNewFiles,
  checkOnStartup,
  setCheckOnStartup,
  handleExportLibraryBackup,
  handleImportLibraryBackup,
  defaultPlaybackSpeed,
  setDefaultPlaybackSpeed,
  setPlaybackSpeed,
  seekForwardTime,
  setSeekForwardTime,
  seekBackwardTime,
  setSeekBackwardTime,
  resumePlayback,
  setResumePlayback,
  autoShowText,
  setAutoShowText,
  voiceBoostEnabled,
  setVoiceBoostEnabled,
  dynamicCompressionEnabled,
  setDynamicCompressionEnabled,
  notificationsEnabled,
  setNotificationsEnabled,
  notifyChapterCompleted,
  setNotifyChapterCompleted,
  notifyBookCompleted,
  setNotifyBookCompleted,
  notifyBookAdded,
  setNotifyBookAdded,
  dataFolder,
  handleOpenDataFolder,
  showToast,
  closeAllPopups,
  activeSettingSelector,
  setActiveSettingSelector,
  showLicensesModal,
  setShowLicensesModal,
  transicaoConteudo,
  getBackdropProps,
  setupWebAudioGraph,
}) => {
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Botões de ação dos ajustes (no celular aparecem só dentro da tela própria de cada ajuste)
  const actionControls_settings_lib_folder = () => (
    <>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                <div 
                  data-path-pill="true"
                  title={libraryFolder}
                  className="h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-xs text-winblue flex items-center max-w-[200px] md:max-w-xs truncate select-all"
                >
                  <span className="truncate">{libraryFolder}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleSyncLibraryNow()}
                  className={`h-8 px-4 rounded-full backdrop-blur-3xl font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSyncingLibrary
                      ? 'bg-winblue/20 border border-winblue text-winblue shadow-[0_0_15px_rgba(var(--winblue-rgb),0.35)]'
                      : 'bg-card/75 border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                  }`}
                  title={t('sync_now')}
                >
                  <span>{t('sync_now')}</span>
                  <RefreshCw size={14} className={isSyncingLibrary ? "animate-spin text-winblue" : ""} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleSelectLibraryFolder}
                  className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title={t('select_folder')}
                >
                  <span>{t('select_folder')}</span>
                  <FolderOpen size={14} />
                </motion.button>
              </div>
            
    </>
  );
  // Google Drive como pasta alternativa da biblioteca (app instalado, com o Google Drive para computador)
  const actionControls_settings_gdrive = () => (
    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
      {altLibraryFolder && (
        <div
          data-path-pill="true"
          title={altLibraryFolder}
          className="h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-xs text-winblue flex items-center max-w-[200px] md:max-w-xs truncate select-all"
        >
          <span className="truncate">{altLibraryFolder}</span>
        </div>
      )}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleConnectGoogleDrive}
        className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        title={altLibraryFolder ? t('gdrive_change') : t('gdrive_connect')}
      >
        <span>{altLibraryFolder ? t('gdrive_change') : t('gdrive_connect')}</span>
        <Cloud size={14} />
      </motion.button>
      {altLibraryFolder && (
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleDisconnectGoogleDrive}
          className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          title={t('gdrive_disconnect')}
        >
          <span>{t('gdrive_disconnect')}</span>
          <X size={14} />
        </motion.button>
      )}
    </div>
  );
  const actionControls_export_library = () => (
    <>

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleExportLibraryBackup}
                className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
                title={t('export_library_btn')}
              >
                <Download size={14} />
                <span>{t('export_library_btn')}</span>
              </motion.button>
            
    </>
  );
  const actionControls_import_backup = () => (
    <>

              <input
                type="file"
                ref={backupFileInputRef}
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImportLibraryBackup(file);
                    e.target.value = '';
                  }
                }}
              />
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => backupFileInputRef.current?.click()}
                className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
                title={t('import_backup_btn')}
              >
                <Upload size={14} />
                <span>{t('import_backup_btn')}</span>
              </motion.button>
            
    </>
  );
  // Endereço da pasta de dados legível: barras normalizadas e só o final do caminho (o completo fica no título)
  const SEP = String.fromCharCode(92);
  const dataFolderClean = (dataFolder || '').replace(/^%APPDATA%/i, `AppData${SEP}Roaming`).split(/[\\/]+/).join(SEP);
  const dataFolderParts = dataFolderClean.split(SEP).filter(Boolean);
  const dataFolderShort = dataFolderParts.length > 2 ? `…${SEP}${dataFolderParts.slice(-2).join(SEP)}` : dataFolderClean;
  const actionControls_settings_data_folder = () => (
    <>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <div 
                    data-path-pill="true"
                    title={dataFolderClean}
                    className="h-8 px-3.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-xs text-winblue flex items-center max-w-[220px] md:max-w-xs min-w-0"
                  >
                    <span className="truncate whitespace-nowrap">{dataFolderShort}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleOpenDataFolder}
                    className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    title={t('settings_open_folder')}
                  >
                    <span>{t('settings_open_folder')}</span>
                    <FolderOpen size={14} />
                  </motion.button>
                </div>
              
    </>
  );
  const actionControls_settings_clear_cache = () => (
    <>

                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => showToast(t('settings_cache_cleared'))}
                  className="self-start sm:self-center h-8 px-4 rounded-full text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 font-semibold text-xs transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{t('settings_clear_cache_btn')}</span>
                  <Trash2 size={14} />
                </motion.button>
              
    </>
  );
  // Celular: a licença aparece direto na tela do ajuste, no lugar do botão
  const actionControls_version_label_inline = () => (
    <section className="settings-license-inline w-full text-left rtl:text-right p-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 space-y-3 text-sm text-[var(--text-muted)] leading-relaxed select-text">
      <h3 className="text-[15px] font-bold text-[var(--text-main)]">{t('license')} — MIT License</h3>
      <p className="text-[var(--text-main)] font-semibold">Copyright (c) 2026 Nauan</p>
      <p>
        Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
      </p>
      <p className="text-xs opacity-80">
        THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      </p>
    </section>
  );

  const actionControls_version_label = () => (
    <>

                <div className="relative shrink-0 min-w-[76px] h-8 flex items-center justify-end">
                  <AnimatePresence>
                    {!showLicensesModal ? (
                      <motion.button
                        key="btn-license"
                        layoutId="license-popup-morph"
                        layout
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          closeAllPopups();
                          setShowLicensesModal(true);
                        }}
                        className="h-8 px-4 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 select-none cursor-pointer shadow-sm"
                      >
                        <span>{t('license')}</span>
                        <FileText size={14} />
                      </motion.button>
                    ) : (
                      <>
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          {...getBackdropProps(() => setShowLicensesModal(false))}
                        />
                        <motion.div
                          key="pop-license"
                          layoutId="license-popup-morph"
                          layout
                          transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          data-popup-content="true"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-0 right-0 w-[340px] max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[26px] shadow-2xl p-4 z-50 flex flex-col text-left overflow-hidden select-none"
                        >
                          <div className="mb-2.5 px-1">
                            <h3 className="text-sm font-bold text-[var(--text-main)]">
                              {t('license')}
                            </h3>
                          </div>
                          <div className="overflow-y-auto custom-scrollbar pr-1.5 space-y-2 text-xs text-[var(--text-muted)] max-h-56 leading-relaxed select-text">
                            <p className="font-bold text-[var(--text-main)]">MIT License</p>
                            <p>Copyright (c) 2026 Nauan</p>
                            <p>
                              Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
                            </p>
                            <p className="text-[11px] opacity-75">
                              THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
                            </p>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              
    </>
  );
  const settingActionControls: Record<string, () => React.ReactNode> = {
    settings_lib_folder: actionControls_settings_lib_folder,
    settings_gdrive: actionControls_settings_gdrive,
    export_library: actionControls_export_library,
    import_backup: actionControls_import_backup,
    settings_data_folder: actionControls_settings_data_folder,
    settings_clear_cache: actionControls_settings_clear_cache,
    version_label: actionControls_version_label_inline,
  };

  // Tocar em qualquer parte da linha aciona o controle dela (quando há um único controle)
  const handleSettingRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const row = e.currentTarget;
    const actionKey = row.dataset.settingAction;
    if (actionKey && typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches) {
      navigateTo('settings-action', { id: actionKey, key: actionKey, title: row.dataset.settingTitle, subtitle: row.dataset.settingSubtitle });
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest('button, [role="switch"], input, select, a, label')) return;
    const controls = e.currentTarget.querySelectorAll<HTMLElement>('button, [role="switch"]');
    if (controls.length !== 1) return;
    controls[0].click();
  };

  return (
    <>
      {/* SCREEN: AJUSTE COM AÇÃO (MOBILE) — título, explicação e os botões do ajuste */}
      {activeScreen.id === 'settings-action' && activeScreen.data?.key && settingActionControls[activeScreen.data.key] && (
        <motion.div key={`settings-action-${activeScreen.data.key}`} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
          <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">{activeScreen.data.title}</h1>
          {/* Uma única legenda: a explicação detalhada (ou, sem ela, o subtítulo simples) */}
          {(() => {
            const helpKey = `settings_help_${activeScreen.data.key}`;
            const help = t(helpKey);
            const text = help && help !== helpKey ? help : activeScreen.data.subtitle;
            return text ? (
              <p className="text-sm leading-relaxed text-[var(--text-muted)] md:mt-2">{text}</p>
            ) : null;
          })()}
          <div className="settings-action-panel mt-8 max-md:mt-6 flex flex-col items-stretch gap-3 [&_div]:flex-col [&_div]:items-stretch [&_div]:w-full [&_div]:max-w-full [&_div]:gap-3 [&_button]:!h-12 [&_button]:!w-full [&_button]:!justify-center [&_button]:!text-sm [&_button]:!rounded-full [&_label]:!h-12 [&_label]:!w-full [&_label]:!justify-center [&_label]:!text-sm">
            {settingActionControls[activeScreen.data.key]()}
          </div>
        </motion.div>
      )}

      {/* SCREEN: SETTINGS (MAIN MENU) */}
      {activeScreen.id === 'settings' && (
        <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
          <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] capitalize mb-12 tracking-tight">
            {t('nav_settings')}
          </h1>
          <div className="space-y-2.5">
            {[
              {
                id: 'settings-interface',
                title: t('settings_interface'),
                subtitle: t('settings_interface_sub'),
                icon: <Palette size={26} />,
                emoji: '🎨',
                gradient: 'from-violet-600 via-purple-600 to-pink-600',
              },
              {
                id: 'settings-biblioteca',
                title: t('settings_library'),
                subtitle: t('settings_library_sub'),
                icon: <BookOpen size={26} />,
                emoji: '📚',
                gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
              },
              {
                id: 'settings-reproducao',
                title: t('settings_playback'),
                subtitle: t('settings_playback_sub'),
                icon: <BsPlayFill size={32} className="translate-x-[1px]" />,
                emoji: '🎧',
                gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
              },
              {
                id: 'settings-notificacoes',
                title: t('settings_notifications'),
                subtitle: t('settings_notifications_sub'),
                icon: <Bell size={26} />,
                emoji: '🔔',
                gradient: 'from-amber-500 via-orange-500 to-rose-500',
              },
              {
                id: 'settings-sistema',
                title: t('settings_sistema'),
                subtitle: t('settings_sistema_sub'),
                icon: <SettingsIcon size={26} />,
                emoji: '⚙️',
                gradient: 'from-slate-700 via-gray-800 to-zinc-900',
              },
            ].map((card) => (
              <motion.button
                key={card.id}
                whileTap={{ scale: 0.985 }}
                onClick={() => navigateTo(card.id)}
                className="settings-list-row w-full flex items-center gap-3.5 px-4 py-3 text-left rtl:text-right rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer"
              >
                <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shrink-0 shadow-sm [&_svg]:w-[18px] [&_svg]:h-[18px]`}>
                  {card.icon}
                </span>
                <span className="flex-1 min-w-0 flex flex-col">
                  <span className="text-[15px] font-semibold text-[var(--text-main)] truncate">{card.title}</span>
                  <span className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{card.subtitle}</span>
                </span>
                <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* SCREEN: SETTINGS - INTERFACE */}
      {activeScreen.id === 'settings-interface' && (
        <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
          <div className="mb-8 max-md:mb-0">
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">{t('settings_interface')}</h1>
          </div>

          <div className="space-y-2.5">
            {/* 1. Tema */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Moon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_theme')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_theme_sub')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.06 }} 
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSettingSelector?.id === 'theme') {
                    setActiveSettingSelector(null);
                    return;
                  }
                  closeAllPopups();
                  setActiveSettingSelector({
                    id: 'theme',
                    triggerEl: e.currentTarget,
                    title: t('settings_theme'),
                    subtitle: t('settings_theme_sub'),
                    currentValue: themeMode,
                    options: [
                      { value: 'system', label: t('theme_system'), description: t('theme_system_desc'), icon: <Laptop size={15} /> },
                      { value: 'light', label: t('theme_light'), description: t('theme_light_desc'), icon: <Sun size={15} /> },
                      { value: 'dark', label: t('theme_dark'), description: t('theme_dark_desc'), icon: <Moon size={15} /> },
                    ],
                    onSelect: (val: any) => setThemeMode(val)
                  });
                }}
                className="h-8 pl-3.5 pr-2.5 max-md:px-0 rounded-full bg-card/75 max-md:!bg-transparent backdrop-blur-3xl border border-[var(--text-main)]/10 max-md:border-transparent shadow-sm max-md:shadow-none max-md:text-[var(--text-muted)] text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 select-none cursor-pointer"
              >
                <span>{themeMode === 'system' ? t('theme_system') : themeMode === 'light' ? t('theme_light') : t('theme_dark')}</span>
                <ChevronDown size={14} className="-mr-0.5 text-[var(--text-muted)] max-md:-rotate-90" />
              </motion.button>
            </div>

            {/* 2. Cor de destaque */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Palette size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_accent')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_accent_sub')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.06 }} 
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSettingSelector?.id === 'accent-color') {
                    setActiveSettingSelector(null);
                    return;
                  }
                  closeAllPopups();
                  setActiveSettingSelector({
                    id: 'accent-color',
                    triggerEl: e.currentTarget,
                    title: t('settings_accent'),
                    subtitle: t('settings_accent_sub'),
                    currentValue: accentColor,
                    options: Object.entries(ACCENT_COLORS).map(([key, item]) => ({
                      value: key,
                      label: t('color_' + key) || item.name,
                      colorPreview: item.hex,
                    })),
                    onSelect: (val: any) => setAccentColor(val)
                  });
                }}
                className="h-8 pl-3 pr-2.5 max-md:px-0 rounded-full bg-card/75 max-md:!bg-transparent backdrop-blur-3xl border border-[var(--text-main)]/10 max-md:border-transparent shadow-sm max-md:shadow-none max-md:text-[var(--text-muted)] text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 select-none cursor-pointer"
              >
                <div className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shrink-0" style={{ backgroundColor: ACCENT_COLORS[accentColor]?.hex || '#0086F0' }} />
                <span>{t('color_' + accentColor) || ACCENT_COLORS[accentColor]?.name || 'Azul'}</span>
                <ChevronDown size={14} className="-mr-0.5 text-[var(--text-muted)] max-md:-rotate-90" />
              </motion.button>
            </div>

            {/* 3. Tamanho da fonte */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Type size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_font_size')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_font_size_sub')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.06 }} 
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSettingSelector?.id === 'font-size') {
                    setActiveSettingSelector(null);
                    return;
                  }
                  closeAllPopups();
                  setActiveSettingSelector({
                    id: 'font-size',
                    triggerEl: e.currentTarget,
                    title: t('settings_font_size'),
                    subtitle: t('settings_font_size_sub'),
                    currentValue: fontSize,
                    options: [
                      { value: 'standard', label: t('font_standard'), description: 'Padrão', icon: <Type size={14} /> },
                      { value: 'large', label: t('font_large'), description: '+20%', icon: <ALargeSmall size={15} /> },
                    ],
                    onSelect: (val: any) => setFontSize(val)
                  });
                }}
                className="h-8 pl-3.5 pr-2.5 max-md:px-0 rounded-full bg-card/75 max-md:!bg-transparent backdrop-blur-3xl border border-[var(--text-main)]/10 max-md:border-transparent shadow-sm max-md:shadow-none max-md:text-[var(--text-muted)] text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 select-none cursor-pointer"
              >
                <span>{fontSize === 'large' ? t('font_large') : t('font_standard')}</span>
                <ChevronDown size={14} className="-mr-0.5 text-[var(--text-muted)] max-md:-rotate-90" />
              </motion.button>
            </div>

            {/* 5. Idioma */}
            <div onClick={handleSettingRowClick} className={`${IS_INSTALLED_APP ? 'max-md:hidden [@media(pointer:coarse)]:hidden' : 'hidden'} settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Globe size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_language')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_language_sub')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.06 }} 
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSettingSelector?.id === 'app-language') {
                    setActiveSettingSelector(null);
                    return;
                  }
                  closeAllPopups();
                  setActiveSettingSelector({
                    id: 'app-language',
                    triggerEl: e.currentTarget,
                    title: t('settings_language'),
                    subtitle: t('settings_language_sub'),
                    currentValue: appLanguage,
                    options: [
                      { 
                        value: 'system', 
                        label: t('lang_system_label'), 
                        description: t('lang_system_desc', { lang: LANGUAGE_NATIVE_NAMES[getSystemLanguage()] }),
                        icon: <Monitor size={15} />
                      },
                      { value: 'en', label: 'English', description: getLanguageDisplayName('en', resolvedLanguage), icon: <Globe size={15} /> },
                      { value: 'es', label: 'Español', description: getLanguageDisplayName('es', resolvedLanguage), icon: <Globe size={15} /> },
                      { value: 'pt', label: 'Português', description: getLanguageDisplayName('pt', resolvedLanguage), icon: <Globe size={15} /> },
                      { value: 'ru', label: 'Русский', description: getLanguageDisplayName('ru', resolvedLanguage), icon: <Globe size={15} /> },
                      { value: 'ar', label: 'العربية', description: getLanguageDisplayName('ar', resolvedLanguage), icon: <Globe size={15} /> },
                    ],
                    onSelect: (val: any) => setAppLanguage(val)
                  });
                }}
                className={`h-8 pl-3.5 pr-2.5 max-md:px-0 max-md:!bg-transparent max-md:!border-transparent max-md:!shadow-none max-md:!text-[var(--text-muted)] rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 select-none cursor-pointer ${
                  activeSettingSelector?.id === 'app-language'
                    ? 'bg-card/95 border-white/20'
                    : 'bg-card/75 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                }`}
              >
                <span>
                  {appLanguage === 'system' 
                    ? `${t('lang_system_label')} (${LANGUAGE_NATIVE_NAMES[resolvedLanguage]})` 
                    : (LANGUAGE_NATIVE_NAMES[appLanguage as SupportedLanguage] || appLanguage)}
                </span>
                <ChevronDown size={14} className="-mr-0.5 text-[var(--text-muted)] max-md:-rotate-90" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* SCREEN: SETTINGS - BIBLIOTECA */}
      {activeScreen.id === 'settings-biblioteca' && (
        <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
          <div className="mb-8 max-md:mb-0">
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">{t('settings_library')}</h1>
          </div>

          <div className="space-y-2.5">
            {/* 1. Pasta da biblioteca — só no computador: navegadores de celular/tablet (iPhone, iPad e Android)
                não deixam o app escolher nem lembrar uma pasta do aparelho */}
            <div data-setting-action="settings_lib_folder" data-setting-title={t('settings_lib_folder')} data-setting-subtitle={t('settings_lib_folder_sub')} onClick={handleSettingRowClick} className="max-md:hidden [@media(pointer:coarse)]:hidden settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 flex flex-row items-center justify-between gap-4"><div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <FolderOpen size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_lib_folder')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_lib_folder_sub')}</span>
                </div>
              </div>
              {/* Botões: no computador ficam na linha; no celular, só dentro da tela própria do ajuste */}
              <div className="max-md:hidden md:contents">{actionControls_settings_lib_folder()}</div>
              <ChevronRight size={16} className="md:hidden text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
            </div>

            {/* 1b. Google Drive como pasta alternativa (app instalado no computador) */}
            <div data-setting-action="settings_gdrive" data-setting-title={t('settings_gdrive')} data-setting-subtitle={t('settings_gdrive_sub')} onClick={handleSettingRowClick} className={`${IS_INSTALLED_APP ? 'max-md:hidden [@media(pointer:coarse)]:hidden' : 'hidden'} settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 flex flex-row items-center justify-between gap-4`}><div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Cloud size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_gdrive')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_gdrive_sub')}</span>
                </div>
              </div>
              <div className="max-md:hidden md:contents">{actionControls_settings_gdrive()}</div>
              <ChevronRight size={16} className="md:hidden text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
            </div>

            {/* 2. Detectar novos arquivos */}
            <div onClick={handleSettingRowClick} className={`${IS_INSTALLED_APP ? 'max-md:hidden [@media(pointer:coarse)]:hidden' : 'hidden'} settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 flex flex-row items-center justify-between gap-4`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <RefreshCw size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_detect_files')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_detect_files_sub')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.06 }} 
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSettingSelector?.id === 'detect-new-files') {
                    setActiveSettingSelector(null);
                    return;
                  }
                  closeAllPopups();
                  setActiveSettingSelector({
                    id: 'detect-new-files',
                    triggerEl: e.currentTarget,
                    title: t('settings_detect_files'),
                    subtitle: t('settings_detect_files_sub'),
                    currentValue: detectNewFiles,
                    options: [
                      { value: 'manual', label: t('detect_files_manual'), icon: <Hand size={15} /> },
                      { value: 'startup', label: t('detect_files_startup'), icon: <Power size={15} /> },
                      { value: 'folder-select', label: t('detect_files_folder_select'), icon: <FolderOpen size={15} /> },
                    ],
                    onSelect: (val: any) => setDetectNewFiles(val)
                  });
                }}
                className={`h-8 pl-3.5 pr-2.5 rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 self-start sm:self-center select-none cursor-pointer max-md:max-w-[45%] max-md:self-center max-md:[&>span]:truncate ${
                  activeSettingSelector?.id === 'detect-new-files'
                    ? 'bg-card/95 border-white/20'
                    : 'bg-card/75 shadow-sm hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                }`}
              >
                <span>
                  {detectNewFiles === 'manual'
                    ? t('detect_files_manual')
                    : detectNewFiles === 'startup'
                    ? t('detect_files_startup')
                    : t('detect_files_folder_select')}
                </span>
                <ChevronDown size={14} className="-mr-0.5 text-[var(--text-muted)] shrink-0" />
              </motion.button>
            </div>

            {/* 3. Verificar biblioteca ao iniciar */}
            <div onClick={handleSettingRowClick} className={`${IS_INSTALLED_APP ? 'max-md:hidden [@media(pointer:coarse)]:hidden' : 'hidden'} settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('check_library_startup')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('check_library_startup_sub')}</span>
                </div>
              </div>
              <SettingToggle checked={checkOnStartup} onChange={setCheckOnStartup} />
            </div>

            {/* 4. Exportar Biblioteca (Backup JSON) */}
            <div data-setting-action="export_library" data-setting-title={t('export_library')} data-setting-subtitle={t('export_library_sub')} onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 flex flex-row items-center justify-between gap-4"><div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Download size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('export_library')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('export_library_sub')}</span>
                </div>
              </div>
              {/* Botões: no computador ficam na linha; no celular, só dentro da tela própria do ajuste */}
              <div className="max-md:hidden md:contents">{actionControls_export_library()}</div>
              <ChevronRight size={16} className="md:hidden text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
            </div>

            {/* 5. Importar Backup */}
            <div data-setting-action="import_backup" data-setting-title={t('import_backup')} data-setting-subtitle={t('import_backup_sub')} onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 flex flex-row items-center justify-between gap-4"><div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Upload size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('import_backup')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('import_backup_sub')}</span>
                </div>
              </div>
              {/* Botões: no computador ficam na linha; no celular, só dentro da tela própria do ajuste */}
              <div className="max-md:hidden md:contents">{actionControls_import_backup()}</div>
              <ChevronRight size={16} className="md:hidden text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
            </div>
          </div>
        </motion.div>
      )}

      {/* SCREEN: SETTINGS - REPRODUCAO */}
      {activeScreen.id === 'settings-reproducao' && (
        <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
          <div className="mb-8 max-md:mb-0">
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">{t('settings_playback')}</h1>
          </div>

          <div className="space-y-2.5">
            {/* 1. Velocidade padrão */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Gauge size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_default_speed')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_default_speed_sub')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.06 }} 
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSettingSelector?.id === 'default-speed') {
                    setActiveSettingSelector(null);
                    return;
                  }
                  closeAllPopups();
                  setActiveSettingSelector({
                    id: 'default-speed',
                    triggerEl: e.currentTarget,
                    title: t('settings_default_speed'),
                    subtitle: t('settings_default_speed_sub'),
                    currentValue: defaultPlaybackSpeed,
                    options: [
                      { value: 0.75, label: '0,75×', description: '0.75×', icon: <Turtle size={15} /> },
                      { value: 1.0, label: '1,0×', description: '1.0×', icon: <Dog size={15} /> },
                      { value: 1.25, label: '1,25×', description: '1.25×', icon: <Rabbit size={15} /> },
                      { value: 1.5, label: '1,5×', description: '1.5×', icon: <Rabbit size={15} /> },
                      { value: 1.75, label: '1,75×', description: '1.75×', icon: <Bird size={15} /> },
                      { value: 2.0, label: '2,0×', description: '2.0×', icon: <Bird size={15} /> },
                    ],
                    onSelect: (val: any) => {
                      setDefaultPlaybackSpeed(val);
                      setPlaybackSpeed(val);
                    }
                  });
                }}
                className="h-8 pl-3.5 pr-2.5 max-md:px-0 rounded-full bg-card/75 max-md:!bg-transparent backdrop-blur-3xl border border-[var(--text-main)]/10 max-md:border-transparent shadow-sm max-md:shadow-none max-md:text-[var(--text-muted)] text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 select-none cursor-pointer"
              >
                <span>{defaultPlaybackSpeed.toFixed(2).replace('.00', '').replace('.', ',')}×</span>
                <ChevronDown size={14} className="-mr-0.5 text-[var(--text-muted)] max-md:-rotate-90" />
              </motion.button>
            </div>

            {/* 2. Tempo de avanço */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <BsArrowClockwise size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_seek_forward')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_seek_forward_sub')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.06 }} 
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSettingSelector?.id === 'seek-forward-setting') {
                    setActiveSettingSelector(null);
                    return;
                  }
                  closeAllPopups();
                  setActiveSettingSelector({
                    id: 'seek-forward-setting',
                    triggerEl: e.currentTarget,
                    title: t('settings_seek_forward'),
                    subtitle: t('settings_seek_forward_sub'),
                    currentValue: seekForwardTime,
                    options: [
                      { value: 15, label: '15s', description: '15s', icon: <Clock3 size={15} /> },
                      { value: 30, label: '30s', description: '30s', icon: <Clock6 size={15} /> },
                      { value: 45, label: '45s', description: '45s', icon: <Clock9 size={15} /> },
                      { value: 60, label: '1m', description: '60s', icon: <Clock12 size={15} /> },
                    ],
                    onSelect: (val: any) => setSeekForwardTime(val)
                  });
                }}
                className="h-8 pl-3.5 pr-2.5 max-md:px-0 rounded-full bg-card/75 max-md:!bg-transparent backdrop-blur-3xl border border-[var(--text-main)]/10 max-md:border-transparent shadow-sm max-md:shadow-none max-md:text-[var(--text-muted)] text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 select-none cursor-pointer"
              >
                <span>{seekForwardTime >= 60 ? '1m' : `${seekForwardTime}s`}</span>
                <ChevronDown size={14} className="-mr-0.5 text-[var(--text-muted)] max-md:-rotate-90" />
              </motion.button>
            </div>

            {/* 3. Tempo de retrocesso */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <BsArrowCounterclockwise size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_seek_backward')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_seek_backward_sub')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.06 }} 
                whileTap={{ scale: 0.94 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSettingSelector?.id === 'seek-backward-setting') {
                    setActiveSettingSelector(null);
                    return;
                  }
                  closeAllPopups();
                  setActiveSettingSelector({
                    id: 'seek-backward-setting',
                    triggerEl: e.currentTarget,
                    title: t('settings_seek_backward'),
                    subtitle: t('settings_seek_backward_sub'),
                    currentValue: seekBackwardTime,
                    options: [
                      { value: 15, label: '15s', description: '15s', icon: <Clock3 size={15} /> },
                      { value: 30, label: '30s', description: '30s', icon: <Clock6 size={15} /> },
                      { value: 45, label: '45s', description: '45s', icon: <Clock9 size={15} /> },
                      { value: 60, label: '1m', description: '60s', icon: <Clock12 size={15} /> },
                    ],
                    onSelect: (val: any) => setSeekBackwardTime(val)
                  });
                }}
                className="h-8 pl-3.5 pr-2.5 max-md:px-0 rounded-full bg-card/75 max-md:!bg-transparent backdrop-blur-3xl border border-[var(--text-main)]/10 max-md:border-transparent shadow-sm max-md:shadow-none max-md:text-[var(--text-muted)] text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 select-none cursor-pointer"
              >
                <span>{seekBackwardTime >= 60 ? '1m' : `${seekBackwardTime}s`}</span>
                <ChevronDown size={14} className="-mr-0.5 text-[var(--text-muted)] max-md:-rotate-90" />
              </motion.button>
            </div>

            {/* 4. Continuar reprodução */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Play size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_resume_playback')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_resume_playback_sub')}</span>
                </div>
              </div>
              <SettingToggle checked={resumePlayback} onChange={setResumePlayback} />
            </div>

            {/* 5. Mostrar texto automaticamente */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_auto_show_text')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_auto_show_text_sub')}</span>
                </div>
              </div>
              <SettingToggle checked={autoShowText} onChange={setAutoShowText} />
            </div>

            {/* 6. Realce de voz humana (Web Audio API) */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Sliders size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_voice_boost')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_voice_boost_sub')}</span>
                </div>
              </div>
              <SettingToggle 
                checked={voiceBoostEnabled} 
                onChange={(val) => {
                  setupWebAudioGraph();
                  setVoiceBoostEnabled(val);
                  showToast(val ? 'Realce de voz humana ativado' : 'Realce de voz desativado');
                }} 
              />
            </div>

            {/* 7. Normalização dinâmica (DynamicsCompressorNode) */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Activity size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_dynamic_compression')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_dynamic_compression_sub')}</span>
                </div>
              </div>
              <SettingToggle 
                checked={dynamicCompressionEnabled} 
                onChange={(val) => {
                  setupWebAudioGraph();
                  setDynamicCompressionEnabled(val);
                  showToast(val ? 'Normalização dinâmica ativada' : 'Normalização dinâmica desativada');
                }} 
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* SCREEN: SETTINGS - NOTIFICACOES */}
      {activeScreen.id === 'settings-notificacoes' && (
        <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
          <div className="mb-8 max-md:mb-0">
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">{t('settings_notifications')}</h1>
          </div>

          <div className="space-y-2.5">
            {/* 1. Ativar notificações */}
            <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                  <Bell size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_notif_enabled')}</span>
                  <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_notif_enabled_sub')}</span>
                </div>
              </div>
              <SettingToggle checked={notificationsEnabled} onChange={setNotificationsEnabled} />
            </div>

            {/* Sub-notificações (Apenas se Ativadas) */}
            {notificationsEnabled && (
              <div className="pt-6 space-y-1">
                <h2 className="text-xl font-bold text-[var(--text-main)] mb-2 tracking-tight">
                  {t('more_options')}
                </h2>

                {/* Capítulo concluído */}
                <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_notif_chapter')}</span>
                      <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_notif_chapter_sub')}</span>
                    </div>
                  </div>
                  <SettingToggle checked={notifyChapterCompleted} onChange={setNotifyChapterCompleted} />
                </div>

                {/* Audiobook concluído */}
                <div onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_notif_book')}</span>
                      <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_notif_book_sub')}</span>
                    </div>
                  </div>
                  <SettingToggle checked={notifyBookCompleted} onChange={setNotifyBookCompleted} />
                </div>

                {/* Novo audiobook adicionado */}
                <div onClick={handleSettingRowClick} className={`${IS_INSTALLED_APP ? 'max-md:hidden [@media(pointer:coarse)]:hidden' : 'hidden'} settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                      <ListPlus size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_notif_added')}</span>
                      <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_notif_added_sub')}</span>
                    </div>
                  </div>
                  <SettingToggle checked={notifyBookAdded} onChange={setNotifyBookAdded} />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* SCREEN: SETTINGS - SISTEMA */}
      {activeScreen.id === 'settings-sistema' && (
        <motion.div key={activeScreen.id} variants={transicaoConteudo} initial="escondido" animate="visivel" exit="saindo" className="w-full flex flex-col">
          <div className="mb-8 max-md:mb-0">
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] tracking-tight">{t('settings_sistema')}</h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2.5">
              {/* Pasta de dados — só no computador (no celular/tablet os dados ficam dentro do próprio navegador) */}
              <div data-setting-action="settings_data_folder" data-setting-title={t('settings_data_folder')} data-setting-subtitle={t('settings_data_folder_sub')} onClick={handleSettingRowClick} className="max-md:hidden [@media(pointer:coarse)]:hidden settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 flex flex-row items-center justify-between gap-4"><div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                    <Database size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_data_folder')}</span>
                    <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_data_folder_sub')}</span>
                  </div>
                </div>
              {/* Botões: no computador ficam na linha; no celular, só dentro da tela própria do ajuste */}
              <div className="max-md:hidden md:contents">{actionControls_settings_data_folder()}</div>
              <ChevronRight size={16} className="md:hidden text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
            </div>

              {/* Limpar cache */}
              <div data-setting-action="settings_clear_cache" data-setting-title={t('settings_clear_cache')} data-setting-subtitle={t('settings_clear_cache_sub')} onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 flex flex-row items-center justify-between gap-4"><div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0 mt-0.5">
                    <Trash2 size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base text-[var(--text-main)]">{t('settings_clear_cache')}</span>
                    <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('settings_clear_cache_sub')}</span>
                  </div>
                </div>
              {/* Botões: no computador ficam na linha; no celular, só dentro da tela própria do ajuste */}
              <div className="max-md:hidden md:contents">{actionControls_settings_clear_cache()}</div>
              <ChevronRight size={16} className="md:hidden text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
            </div>

              {/* Informações da Versão e Autoria */}
              <div data-setting-action="version_label" data-setting-title={t('version_label', { ver: APP_VERSION })} data-setting-subtitle={t('developed_by', { name: 'Nauan' })} onClick={handleSettingRowClick} className="settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors hover:bg-white/10 cursor-pointer flex items-center justify-between gap-4"><div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-winblue/10 text-winblue flex items-center justify-center shrink-0">
                    <Info size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-base text-[var(--text-main)]">{t('version_label', { ver: APP_VERSION })}</span>
                    <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{t('developed_by', { name: 'Nauan' })}</span>
                  </div>
                </div>
              {/* Botões: no computador ficam na linha; no celular, só dentro da tela própria do ajuste */}
              <div className="max-md:hidden md:contents">{actionControls_version_label()}</div>
              <ChevronRight size={16} className="md:hidden text-[var(--text-muted)] shrink-0 rtl:rotate-180" />
            </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default SettingsView;
