// ===== Importar audiobooks de um link do Google Drive =====
// Cola-se o link de um arquivo ou de uma pasta compartilhada ("qualquer pessoa com o link") e o app baixa
// os áudios. No app instalado (computador), o download é feito pelo próprio app (Electron), sem chave.
// No site e no celular, o navegador não pode baixar direto do drive.google.com (bloqueio de CORS): usa-se
// a API oficial do Drive com uma chave de API pública (VITE_GOOGLE_API_KEY, restrita ao endereço do site).
import { desktop } from './desktopBridge';

export type DriveLink = { kind: 'file' | 'folder'; id: string };
export type DriveEntry = { id: string; name: string; size?: number };
export type DriveProgress = { index: number; total: number; name: string; received: number; size?: number };

const AUDIO_EXT = /\.(mp3|m4a|m4b|mp4|aac|wav|flac|ogg|opus|wma|webm)$/i;
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const API_KEY: string = (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';
const API = 'https://www.googleapis.com/drive/v3/files';

// Lê o id do arquivo/pasta em qualquer formato de link do Drive (ou o próprio id colado)
export function parseDriveLink(raw: string): DriveLink | null {
  const text = (raw || '').trim();
  if (!text) return null;
  const folder = text.match(/\/folders\/([\w-]{10,})/);
  if (folder) return { kind: 'folder', id: folder[1] };
  const file = text.match(/\/file\/d\/([\w-]{10,})/) || text.match(/\/d\/([\w-]{10,})/);
  if (file) return { kind: 'file', id: file[1] };
  const param = text.match(/[?&]id=([\w-]{10,})/);
  if (param) return { kind: /folderview|folders/.test(text) ? 'folder' : 'file', id: param[1] };
  if (/^[\w-]{20,}$/.test(text)) return { kind: 'file', id: text };
  return null;
}

// O Drive pode ser usado aqui? (app instalado sempre; site/celular só com a chave configurada)
export const DRIVE_IMPORT_AVAILABLE = Boolean(desktop?.gdriveList) || Boolean(API_KEY);

const isAudioName = (name: string, mime?: string) => AUDIO_EXT.test(name) || Boolean(mime && mime.startsWith('audio/'));

async function apiJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404 || res.status === 403) throw new Error('not-shared');
    throw new Error(`http-${res.status}`);
  }
  return res.json();
}

// Lista os áudios do link (pasta: inclui subpastas, até 3 níveis)
export async function listDriveAudio(link: DriveLink): Promise<DriveEntry[]> {
  if (desktop?.gdriveList) {
    const items = await desktop.gdriveList(link.kind, link.id);
    return items.filter(i => !i.name || isAudioName(i.name));
  }
  if (!API_KEY) throw new Error('no-key');
  const common = `supportsAllDrives=true&key=${encodeURIComponent(API_KEY)}`;
  if (link.kind === 'file') {
    const meta = await apiJson(`${API}/${link.id}?fields=id,name,mimeType,size&${common}`);
    if (meta.mimeType === FOLDER_MIME) return listDriveAudio({ kind: 'folder', id: link.id });
    return isAudioName(meta.name, meta.mimeType) ? [{ id: meta.id, name: meta.name, size: Number(meta.size) || undefined }] : [];
  }
  const out: DriveEntry[] = [];
  const walk = async (folderId: string, depth: number) => {
    let pageToken = '';
    do {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const data = await apiJson(`${API}?q=${q}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=1000&includeItemsFromAllDrives=true&orderBy=name&${common}${pageToken ? `&pageToken=${pageToken}` : ''}`);
      for (const f of data.files || []) {
        if (f.mimeType === FOLDER_MIME) { if (depth < 3) await walk(f.id, depth + 1); }
        else if (isAudioName(f.name, f.mimeType)) out.push({ id: f.id, name: f.name, size: Number(f.size) || undefined });
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);
  };
  await walk(link.id, 0);
  return out;
}

const mimeFor = (name: string) => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return ext === 'mp3' ? 'audio/mpeg' : ['m4a', 'm4b', 'mp4', 'aac'].includes(ext) ? 'audio/mp4' : ext === 'ogg' || ext === 'opus' ? 'audio/ogg' : ext === 'wav' ? 'audio/wav' : ext === 'flac' ? 'audio/flac' : 'audio/*';
};

// Baixa um áudio. No app instalado, ele vai direto para a pasta da biblioteca (o File devolvido aponta
// para o arquivo salvo, sem uma segunda cópia)
export async function downloadDriveAudio(entry: DriveEntry, libraryFolder: string, onProgress: (received: number, size?: number) => void): Promise<File> {
  if (desktop?.gdriveDownload) {
    const off = desktop.onGdriveProgress?.((p) => { if (p.id === entry.id) onProgress(p.received, p.total || entry.size); });
    try {
      const saved = await desktop.gdriveDownload(entry.id, libraryFolder);
      const bytes = await desktop.readAudioFile(saved.path);
      if (!bytes) throw new Error('read-failed');
      const file = new File([bytes as BlobPart], saved.name, { type: mimeFor(saved.name) });
      (file as any).__diskPath = saved.path;
      return file;
    } finally {
      off?.();
    }
  }
  const res = await fetch(`${API}/${entry.id}?alt=media&supportsAllDrives=true&key=${encodeURIComponent(API_KEY)}`);
  if (!res.ok || !res.body) throw new Error(res.status === 403 || res.status === 404 ? 'not-shared' : `http-${res.status}`);
  const size = Number(res.headers.get('content-length')) || entry.size;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(received, size);
  }
  return new File(chunks as BlobPart[], entry.name, { type: mimeFor(entry.name) });
}
