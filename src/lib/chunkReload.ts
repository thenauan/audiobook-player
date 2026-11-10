// Telas carregadas sob demanda (Ajustes, Ajuda, recorte de imagem…) ficam em arquivos com o nome da versão.
// Se o app ficou aberto desde uma versão anterior (comum no app da tela de início), esses arquivos já não existem
// no site depois de uma publicação nova, e a tela não abria. Nesse caso, o app recarrega uma vez para pegar a
// versão atual (no máximo uma vez a cada 15 s, para nunca entrar em ciclo sem conexão).
const KEY = 'app_chunk_reload_at';

export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 15000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function withChunkReload<T>(loader: () => Promise<T>): () => Promise<T> {
  return () => loader().catch((err) => {
    reloadForNewVersion();
    throw err;
  });
}

// O Vite avisa quando um arquivo pré-carregado de uma tela não pôde ser baixado
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForNewVersion()) event.preventDefault();
  });
}
