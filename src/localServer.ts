// Servidor local do Vite (npm run dev / preview / iniciar.bat): salva cópias no disco e abre pastas.
// Hospedado (ex.: GitHub Pages) ele não existe — nada de áudio é enviado pela rede.
export const HAS_LOCAL_SERVER = typeof window !== 'undefined' && (
  import.meta.env.DEV ||
  ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
  /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\./.test(window.location.hostname)
);
