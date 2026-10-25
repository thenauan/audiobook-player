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
  closeApp: () => ipcRenderer.invoke('close-app'),
});
