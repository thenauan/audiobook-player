// Ponte segura entre o app (página) e o Electron
const { contextBridge, ipcRenderer } = require('electron');

// Idioma escolhido no instalador (Windows); undefined quando não há
let installerLanguage;
try { installerLanguage = ipcRenderer.sendSync('get-installer-language') || undefined; } catch { installerLanguage = undefined; }

contextBridge.exposeInMainWorld('electron', {
  isDesktopApp: true,
  installerLanguage,
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openPath: (target) => ipcRenderer.invoke('open-path', target),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveAudiobook: (fileName, folder, data) => ipcRenderer.invoke('save-audiobook', fileName, folder, data),
  scanLibraryFolder: (folder) => ipcRenderer.invoke('scan-library-folder', folder),
  readAudioFile: (filePath) => ipcRenderer.invoke('read-audio-file', filePath),
  closeApp: () => ipcRenderer.invoke('close-app'),
});
