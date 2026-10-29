// ===== App instalado (Windows, macOS e Linux) =====
// O app só acessa arquivos e pastas do computador quando está instalado: nesse caso o Electron oferece
// estas funções (electron/preload.cjs). No site (navegador ou atalho no celular) tudo roda só na web,
// sem servidor: os áudios ficam guardados no próprio navegador e os arquivos entram pelo seletor.

export interface DesktopBridge {
  isDesktopApp: true;
  installerLanguage?: string;
  openExternal: (url: string) => Promise<void>;
  openPath: (target: string) => Promise<string>;
  selectFolder: (defaultPath?: string) => Promise<string>;
  // Pastas do Google Drive para computador encontradas neste computador (vazio se não estiver instalado)
  findGoogleDrive?: () => Promise<string[]>;
  saveAudiobook: (fileName: string, folder: string, data: ArrayBuffer) => Promise<string>;
  scanLibraryFolder: (folder: string) => Promise<{ folder: string; exists: boolean; files: { name: string; path: string; size: number }[] }>;
  readAudioFile: (filePath: string) => Promise<Uint8Array | null>;
  closeApp: () => Promise<void>;
}

export const desktop: DesktopBridge | undefined =
  typeof window !== 'undefined' ? ((window as any).electron as DesktopBridge | undefined) : undefined;

// Recursos que dependem de pastas do computador (biblioteca no disco, abrir pasta, sincronizar)
export const IS_INSTALLED_APP = Boolean(desktop?.isDesktopApp);
