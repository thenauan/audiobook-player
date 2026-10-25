import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { seoPlugin } from './seo.config'

function handleOpenFolder(req: any, res: any) {
  const reqUrl = new URL(req.url || '', 'http://localhost:5173');
  const targetPath = reqUrl.searchParams.get('path') || '';
  if (!targetPath) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Path is required' }));
    return;
  }

  try {
    let resolvedPath = path.resolve(targetPath);
    // Replace D: with C: if drive D: does not exist on this machine
    if (/^[dD]:/.test(resolvedPath) && !fs.existsSync('D:\\')) {
      resolvedPath = resolvedPath.replace(/^[dD]:/, 'C:');
    }

    if (fs.existsSync(resolvedPath)) {
      const stat = fs.statSync(resolvedPath);
      if (stat.isFile()) {
        exec(`explorer.exe /select,"${resolvedPath}"`);
      } else {
        exec(`explorer.exe "${resolvedPath}"`);
      }
    } else {
      try {
        fs.mkdirSync(resolvedPath, { recursive: true });
        exec(`explorer.exe "${resolvedPath}"`);
      } catch {
        const parent = path.dirname(resolvedPath);
        if (fs.existsSync(parent)) {
          exec(`explorer.exe "${parent}"`);
        } else {
          try {
            fs.mkdirSync(parent, { recursive: true });
            exec(`explorer.exe "${parent}"`);
          } catch {
            exec(`explorer.exe`);
          }
        }
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, path: resolvedPath }));
  } catch {
    exec(`explorer.exe`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, fallback: true }));
  }
}

function handleSaveAudiobook(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  const reqUrl = new URL(req.url || '', 'http://localhost:5173');
  const rawFilename = reqUrl.searchParams.get('filename') || (req.headers['x-filename'] as string) || 'audiobook.mp3';
  const filename = path.basename(decodeURIComponent(rawFilename));
  let folder = decodeURIComponent(reqUrl.searchParams.get('folder') || (req.headers['x-folder'] as string) || 'C:\\Audiobooks');
  if (/^[dD]:/.test(folder) && !fs.existsSync('D:\\')) {
    folder = folder.replace(/^[dD]:/, 'C:');
  }

  try {
    const resolvedFolder = path.resolve(folder);
    if (!fs.existsSync(resolvedFolder)) {
      fs.mkdirSync(resolvedFolder, { recursive: true });
    }

    const resolvedFilePath = path.join(resolvedFolder, filename);
    const writeStream = fs.createWriteStream(resolvedFilePath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, filePath: resolvedFilePath, filename }));
    });

    writeStream.on('error', (err: any) => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: err?.message || 'Error writing file' }));
    });
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err?.message || 'Error saving file' }));
  }
}

const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.m4b', '.aac', '.wav', '.flac', '.ogg', '.opus', '.wma', '.webm', '.alac']);

function scanDirectoryForAudioFiles(dirPath: string): { name: string; path: string; size: number }[] {
  const results: { name: string; path: string; size: number }[] = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        try {
          const subResults = scanDirectoryForAudioFiles(fullPath);
          results.push(...subResults);
        } catch {}
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (AUDIO_EXTS.has(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            results.push({ name: entry.name, path: fullPath, size: stat.size });
          } catch {}
        }
      }
    }
  } catch {}
  return results;
}

function handleScanFolder(req: any, res: any) {
  const reqUrl = new URL(req.url || '', 'http://localhost:5173');
  let folder = decodeURIComponent(reqUrl.searchParams.get('folder') || 'C:\\Audiobooks');
  if (/^[dD]:/.test(folder) && !fs.existsSync('D:\\')) {
    folder = folder.replace(/^[dD]:/, 'C:');
  }

  try {
    const resolvedFolder = path.resolve(folder);
    if (!fs.existsSync(resolvedFolder)) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, folder: resolvedFolder, exists: false, files: [] }));
      return;
    }

    const files = scanDirectoryForAudioFiles(resolvedFolder);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, folder: resolvedFolder, exists: true, files }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err?.message || 'Error scanning folder' }));
  }
}

function handleGetAudioFile(req: any, res: any) {
  const reqUrl = new URL(req.url || '', 'http://localhost:5173');
  let filePath = decodeURIComponent(reqUrl.searchParams.get('path') || '');
  if (/^[dD]:/.test(filePath) && !fs.existsSync('D:\\')) {
    filePath = filePath.replace(/^[dD]:/, 'C:');
  }

  try {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'File not found' }));
      return;
    }

    const stat = fs.statSync(resolvedPath);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(resolvedPath);
    stream.pipe(res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err?.message || 'Error streaming file' }));
  }
}

function handleSelectFolderDialog(req: any, res: any) {
  const reqUrl = new URL(req.url || '', 'http://localhost:5173');
  let initialPath = decodeURIComponent(reqUrl.searchParams.get('path') || '');
  if (/^[dD]:/.test(initialPath) && !fs.existsSync('D:\\')) {
    initialPath = initialPath.replace(/^[dD]:/, 'C:');
  }
  const validInitialPath = initialPath && fs.existsSync(initialPath) ? path.resolve(initialPath) : '';

  const psScript = `
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.Application]::EnableVisualStyles()
    $owner = New-Object System.Windows.Forms.Form
    $owner.TopMost = $true
    $owner.Width = 0
    $owner.Height = 0
    $owner.ShowInTaskbar = $false
    $owner.FormBorderStyle = 'None'
    $owner.Opacity = 0
    $owner.StartPosition = 'CenterScreen'
    $owner.Show()
    $owner.Activate()
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.Description = 'Selecionar pasta da biblioteca'
    $dlg.UseDescriptionForTitle = $true
    $dlg.ShowNewFolderButton = $true
    ${validInitialPath ? `$dlg.SelectedPath = '${validInitialPath.replace(/'/g, "''")}'` : ''}
    $res = $dlg.ShowDialog($owner)
    $owner.Close()
    if ($res -eq [System.Windows.Forms.DialogResult]::OK) {
      Write-Output $dlg.SelectedPath
    }
  `;
  const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
  exec(`powershell.exe -NoProfile -NonInteractive -STA -EncodedCommand ${encoded}`, { encoding: 'utf8' }, (err, stdout) => {
    res.setHeader('Content-Type', 'application/json');
    if (err) {
      res.end(JSON.stringify({ ok: false, error: err.message }));
      return;
    }
    const selected = (stdout || '').trim();
    if (selected) {
      res.end(JSON.stringify({ ok: true, canceled: false, path: selected }));
    } else {
      res.end(JSON.stringify({ ok: true, canceled: true, path: '' }));
    }
  });
}

function handleOpenExternal(req: any, res: any) {
  const reqUrl = new URL(req.url || '', 'http://localhost:5173');
  const targetUrl = (reqUrl.searchParams.get('url') || '').trim();
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Valid http/https URL is required' }));
    return;
  }

  try {
    exec(`start "" "${targetUrl.replace(/"/g, '')}"`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, url: targetUrl }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: err?.message || 'Error opening URL' }));
  }
}

// Middleware to actually open folder/file in Windows Explorer and save audiobooks to disk
const localFolderOpenerPlugin = {
  name: 'local-folder-opener',
  configureServer(server: any) {
    server.middlewares.use('/api/open-folder', handleOpenFolder);
    server.middlewares.use('/api/open-external', handleOpenExternal);
    server.middlewares.use('/api/select-folder', handleSelectFolderDialog);
    server.middlewares.use('/api/save-audiobook', handleSaveAudiobook);
    server.middlewares.use('/api/scan-library-folder', handleScanFolder);
    server.middlewares.use('/api/get-audio-file', handleGetAudioFile);
  },
  configurePreviewServer(server: any) {
    server.middlewares.use('/api/open-folder', handleOpenFolder);
    server.middlewares.use('/api/open-external', handleOpenExternal);
    server.middlewares.use('/api/select-folder', handleSelectFolderDialog);
    server.middlewares.use('/api/save-audiobook', handleSaveAudiobook);
    server.middlewares.use('/api/scan-library-folder', handleScanFolder);
    server.middlewares.use('/api/get-audio-file', handleGetAudioFile);
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  // Caminhos relativos: o app funciona na raiz de um domínio ou numa subpasta
  // (ex.: GitHub Pages em https://usuario.github.io/repositorio/)
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    localFolderOpenerPlugin,
    // Títulos e descrições para buscadores, com uma página por idioma
    seoPlugin(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('motion')) {
              return 'vendor-motion';
            }
            if (
              id.includes('/react/') || 
              id.includes('\\react\\') || 
              id.includes('/react-dom/') || 
              id.includes('\\react-dom\\') || 
              id.includes('/scheduler/') || 
              id.includes('\\scheduler\\')
            ) {
              return 'vendor-react';
            }
            return 'vendor-utils';
          }
          if (id.includes('helpData') || id.includes('helpTranslations')) {
            return 'data-help';
          }
          if (id.includes('translations') || id.includes('genreTranslations') || id.includes('nationalityTranslations')) {
            return 'data-translations';
          }
          if (id.includes('/data.ts') || id.includes('\\data.ts')) {
            return 'data-catalog';
          }
        }
      }
    }
  }
})
