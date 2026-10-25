// Audiobook Player — app de computador (Electron)
// Abre a versão gerada em dist/ de forma totalmente local e offline, num protocolo próprio (app://)
// para que o armazenamento (IndexedDB/localStorage) funcione como num site normal.
const { app, BrowserWindow, protocol, net, shell, ipcMain, dialog, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const DIST = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } },
]);

// Idioma escolhido no instalador do Windows (gravado pelo instalador como código LCID)
function readInstallerLanguage() {
  try {
    const file = path.join(process.resourcesPath || '', 'installer-language.txt');
    const lcid = parseInt(fs.readFileSync(file, 'utf8').trim(), 10);
    const map = { 1046: 'pt', 2070: 'pt', 1033: 'en', 2057: 'en', 3082: 'es', 1034: 'es', 1049: 'ru', 1025: 'ar' };
    return map[lcid] || null;
  } catch {
    return null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 400,
    minHeight: 600,
    backgroundColor: '#04070f',
    title: 'Audiobook Player',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Links externos abrem no navegador padrão
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  win.loadURL('app://audiobook-player/index.html');
}

app.whenReady().then(() => {
  // Serve os arquivos de dist/ pelo protocolo app://
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    let filePath = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (!filePath.startsWith(DIST) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST, 'index.html');
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  ipcMain.on('get-installer-language', (event) => { event.returnValue = readInstallerLanguage(); });
  ipcMain.handle('open-external', (_e, url) => {
    if (/^https?:\/\//i.test(String(url))) shell.openExternal(String(url));
  });
  ipcMain.handle('open-path', (_e, target) => shell.openPath(String(target || '')));
  ipcMain.handle('select-folder', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
    return res.canceled ? '' : res.filePaths[0];
  });
  ipcMain.handle('close-app', () => app.quit());

  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
