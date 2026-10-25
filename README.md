# Audiobook Player

Reprodutor de audiobooks com visual inspirado na Apple (iOS 26 / Apple Music). Funciona no navegador, pode ser instalado como app no celular (PWA) e tem versão para computador que roda **offline**, com instaladores para Windows, macOS e Linux.

- **Usar no navegador:** https://thenauan.github.io/audiobook-player/
- **Baixar para o computador:** [Releases](https://github.com/thenauan/audiobook-player/releases/latest)

## Recursos

- **Biblioteca**: importe arquivos de áudio (MP3, M4A, M4B, AAC, WAV, OGG, FLAC, OPUS…) e navegue por favoritos, coleções, gêneros, autores e idiomas.
- **Player completo**: miniplayer e player em tela cheia, capítulos, fila (reordenar e remover), velocidade, temporizador para dormir e realce de voz.
- **Texto sincronizado**: o texto acompanha o áudio frase a frase. Segure uma frase (ou clique com o botão direito) para criar uma marcação, ouvir a partir dela, copiá-la ou compartilhá-la.
- **Compartilhar**: gera imagens no formato de story (Instagram, WhatsApp…) com a capa do audiobook ou com um trecho do texto.
- **Marcações** por capítulo, **coleções** personalizadas e **pesquisa** com histórico.
- **Ajustes**: tema claro/escuro/automático, cor de destaque, tamanho do texto, 5 idiomas (português, inglês, espanhol, russo e árabe), reprodução, notificações e backup da biblioteca.
- **Celular e tablet**: gestos (segurar para opções, deslizar da borda para voltar, deslizar o player para baixo), folhas no estilo iOS e adaptação a notch, Dynamic Island, celular deitado, iPad e dobráveis.
- Seus dados ficam **no próprio aparelho**; nada é enviado para servidores.

## Instalar no computador (offline)

Baixe o instalador do seu sistema na página de [Releases](https://github.com/thenauan/audiobook-player/releases/latest):

| Sistema | Arquivo | Como instalar |
| --- | --- | --- |
| **Windows** | `Audiobook-Player-…-win-x64.exe` | Abra o instalador, escolha o idioma e a pasta. Ele cria o atalho na área de trabalho e no menu Iniciar e pode abrir o app ao concluir. |
| **macOS** | `Audiobook-Player-…-mac-arm64.dmg` (Apple Silicon) ou `…-mac-x64.dmg` (Intel) | Abra o `.dmg` e arraste o app para **Aplicativos**. |
| **Linux** | `…-linux-x86_64.AppImage` ou `…-linux-amd64.deb` | AppImage: dê permissão de execução e abra. `.deb`: `sudo apt install ./arquivo.deb`. |

> Os instaladores ainda não têm assinatura digital. No Windows, se aparecer o aviso do SmartScreen, clique em **Mais informações → Executar assim mesmo**. No macOS, na primeira vez clique com o botão direito no app e escolha **Abrir** (ou, no Terminal: `xattr -cr "/Applications/Audiobook Player.app"`).

## Instalar no celular (PWA)

Abra https://thenauan.github.io/audiobook-player/ e:

- **iPhone/iPad (Safari)**: Compartilhar → *Adicionar à Tela de Início*.
- **Android (Chrome)**: menu ⋮ → *Instalar app*.

## Desenvolvimento

Requer [Node.js](https://nodejs.org/) 20 ou mais recente.

```bash
npm install
npm run dev        # abre no navegador (no Windows, também dá para usar iniciar.bat)
```

| Comando | O que faz |
| --- | --- |
| `npm run build` | Verifica os tipos e gera o site em `dist/` |
| `npm test` | Roda os testes |
| `npm run desktop` | Gera o site e abre o app de computador (Electron) |
| `npm run dist:win` / `dist:mac` / `dist:linux` | Gera o instalador do sistema em `release/` |

Para ver o app com dados de exemplo, digite `//dev` na pesquisa e use **Injetar audiobooks de teste**; ao sair do modo de desenvolvedor, os dados de teste são removidos.

## Publicação

- **Site (GitHub Pages):** o workflow `.github/workflows/deploy.yml` publica a cada `push` na branch `main`. No repositório, em **Settings → Pages → Source**, escolha **GitHub Actions** (só na primeira vez).
- **Instaladores (Releases):** o workflow `.github/workflows/release.yml` gera os instaladores de Windows, macOS e Linux e cria o Release ao enviar uma tag de versão:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Tecnologias

React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion, Electron e electron-builder.

## Licença

[MIT](LICENSE) © 2026 Nauan
