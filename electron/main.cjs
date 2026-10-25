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

  // ----- Biblioteca no disco (só no app instalado; o site nunca acessa arquivos sem o usuário escolher) -----
  const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.m4b', '.mp4', '.aac', '.wav', '.flac', '.ogg', '.opus', '.wma', '.webm']);
  const isAudio = (file) => AUDIO_EXTS.has(path.extname(String(file)).toLowerCase());
  // Pasta padrão quando o caminho salvo não existe neste computador: Música\Audiobooks
  const resolveFolder = (folder) => {
    const f = String(folder || '');
    if (f && path.isAbsolute(f)) return f;
    return path.join(app.getPath('music'), 'Audiobooks');
  };
  // Salva uma cópia do audiobook na pasta da biblioteca e devolve o caminho
  ipcMain.handle('save-audiobook', async (_e, fileName, folder, data) => {
    const dir = resolveFolder(folder);
    const name = path.basename(String(fileName || 'audiobook.mp3'));
    if (!isAudio(name)) return '';
    await fs.promises.mkdir(dir, { recursive: true });
    const target = path.join(dir, name);
    await fs.promises.writeFile(target, Buffer.from(data));
    return target;
  });
  // Lista os arquivos de áudio da pasta da biblioteca (inclui subpastas)
  ipcMain.handle('scan-library-folder', async (_e, folder) => {
    const dir = resolveFolder(folder);
    const out = [];
    const walk = async (d) => {
      let entries = [];
      try { entries = await fs.promises.readdir(d, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.isFile() && isAudio(entry.name)) {
          try { out.push({ name: entry.name, path: full, size: (await fs.promises.stat(full)).size }); } catch {}
        }
      }
    };
    if (fs.existsSync(dir)) await walk(dir);
    return { folder: dir, exists: fs.existsSync(dir), files: out };
  });
  // Lê um arquivo de áudio da biblioteca (só arquivos de áudio)
  ipcMain.handle('read-audio-file', async (_e, filePath) => {
    const target = String(filePath || '');
    if (!isAudio(target) || !fs.existsSync(target)) return null;
    return fs.promises.readFile(target);
  });

  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
