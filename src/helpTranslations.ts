import { HELP_THEMES, type HelpTheme } from './helpData';
import type { SupportedLanguage } from './translations';

interface TextOverride {
  title?: string;
  subtitle?: string;
  overview?: string;
  tipTitle?: string;
  tipText?: string;
  steps?: { title: string; desc: string }[];
  highlights?: { title: string; desc: string }[];
  faq?: { q: string; a: string }[];
  shortcuts?: { action: string }[];
}

interface ThemeOverride {
  title: string;
  subtitle: string;
  subthemes: Record<string, TextOverride>;
}

const HELP_I18N: Record<'en' | 'es' | 'ru' | 'ar', Record<string, ThemeOverride>> = {
  en: {
    'help-theme-novidades': {
      title: "Sharing, Text and Mobile",
      subtitle: "Story images, text excerpts, gestures and installing the app",
      subthemes: {
        'sub-share-story': { title: "Share audiobooks and excerpts", subtitle: "Create a story-format image with the cover or lines from the text", overview: "The app creates an image ready for Instagram Stories and other apps: the cover, title and author on a glass card over the cover colors — or, for an excerpt, the lines in quotes with a small cover next to the title.", steps: [{ title: "Open the audiobook options", desc: "On mobile, tap the three dots in the audiobook page header; on desktop, use the share button in the header." }, { title: "Choose what to share", desc: "\"Share audiobook\" creates the image with the cover. \"Share excerpt\" opens the text so you can pick up to 5 lines." }, { title: "Save or share", desc: "The image opens full screen. Tap \"Share\" to pick Instagram (Story), WhatsApp, etc., or \"Save image\"." }], tipTitle: "Tip", tipText: "The image follows the app theme: a light card in light mode and a dark card in dark mode." },
        'sub-text-excerpts': { title: "Lines of the audiobook text", subtitle: "Hold a line to bookmark, play, copy or share it", overview: "With the text open in the full-screen player, each line follows the audio. Tap a line to jump to it; hold it (mobile) or right-click it (desktop) to open the options.", steps: [{ title: "Add as bookmark", desc: "The line becomes a bookmark of the chapter, at the exact moment it starts." }, { title: "Play from here", desc: "Audio jumps to the start of the line and plays." }, { title: "Share or copy", desc: "\"Share excerpt\" creates the story image with the line; \"Copy text\" copies it." }], tipTitle: "Tip", tipText: "To share several lines at once (up to 5), use \"Share excerpt\" in the audiobook options." },
        'sub-mobile-gestures': { title: "Gestures on phones and tablets", subtitle: "Touch shortcuts to use the app with one hand", overview: "On phones and tablets, the app responds to gestures like iPhone and Android apps.", steps: [{ title: "Hold to see options", desc: "Hold an audiobook, author or app to highlight it and open its options. In the queue, hold an item to move it." }, { title: "Go back and minimize", desc: "Drag from the left edge to the center (or use the system back) to go back. Swipe the full-screen player down to minimize it." }, { title: "Queue and tab bar", desc: "In the queue, swipe an item left to remove it. While scrolling, the tab bar and mini player shrink; tap them to restore." }], tipTitle: "Tip", tipText: "Bookmarks and \"Add to collection\" open as sheets from the bottom of the screen; drag them down to close." },
        'sub-install-app': { title: "Install as an app", subtitle: "Use Audiobook Player from your home screen or desktop", overview: "Audiobook Player can be installed as an app (PWA): it opens full screen, has its own icon and keeps your library on the device.", steps: [{ title: "iPhone and iPad", desc: "In Safari, tap Share and then \"Add to Home Screen\"." }, { title: "Android", desc: "In Chrome, open the ⋮ menu and tap \"Install app\"." }, { title: "Desktop", desc: "In Chrome or Edge, click the install icon in the address bar." }], tipTitle: "Your data", tipText: "Imported audiobooks and your progress are saved on the device. Use \"Export library\" in Settings to back up." }
      }
    },
    'help-theme-biblioteca': {
      title: 'Library and Files',
      subtitle: 'How to add, organize, edit, and save your audiobooks',
      subthemes: {
        'sub-add-audiobooks': {
          title: 'How to add audiobooks',
          subtitle: 'Import folders and audio files from your computer',
          overview: 'You can import audio files or entire folders directly from your computer. The app automatically reads tags and metadata to identify title, author, chapters, and duration.',
          steps: [
            { title: 'Go to Library', desc: 'In the left sidebar, click "Library" to open your bookshelf.' },
            { title: 'Click Add', desc: 'In the top right header, click "+ Add" or the folder button.' },
            { title: 'Choose Files or Folder', desc: 'Select your audio folder or multiple audio files (.mp3, .m4b, .m4a, .flac, .ogg).' },
            { title: 'Ready to listen!', desc: 'New titles appear immediately with their organized chapters.' }
          ],
          tipTitle: 'Pro-Tip for Perfect Organization',
          tipText: 'Keep each book in a folder formatted as "Author - Title" with numbered chapters (e.g., "01 - Intro.mp3") for 100% accurate ordering.'
        },
        'sub-organize-library': {
          title: 'Organizing and custom categories',
          subtitle: 'Filters, status, favorites, and genre categorization',
          overview: 'Manage your library easily using status filters (In Progress, Completed, Unstarted, Favorites), authors, genres, and languages.'
        },
        'sub-edit-metadata': {
          title: 'Editing covers, title, text, and metadata',
          subtitle: 'Customize images, names, narrators, synopsis, and synchronized text',
          overview: 'You can customize all information for any audiobook or author: replace the cover image, pick custom palette colors, manage synchronized text files, and edit title, narrator, year, genre, and synopsis.',
          steps: [
            { title: 'Open book options', desc: 'Click the three dots "•••" on the card or open the book detail screen and click Edit.' },
            { title: 'Change cover image or color', desc: 'Click "Change cover" to upload an image (.jpg, .png, .webp) with the built-in cropper, or pick one of the 24 palette colors.' },
            { title: 'Manage synchronized text', desc: 'Under "Audiobook text", check if text was found in metadata or use "Upload text", "Change text", or "Remove text" (.epub, .json, .xml, .smil, .ts, .vtt, .srt, .lrc).' },
            { title: 'Edit fields and save', desc: 'Update Title, Author, Narrator, Year, Language, Genre, Subgenre, and Synopsis, then click the checkmark in the top right to save.' }
          ],
          highlights: [
            { title: 'Adaptive Covers and Colors', desc: 'The player extracts the dominant cover color to illuminate buttons, progress bars, and ambient backgrounds.' },
            { title: 'Synchronized Text Management', desc: 'Add, replace, or remove synchronized transcript files directly from the audiobook edit screen.' },
            { title: 'Author Editing', desc: 'You can also edit the photo, profile color, nationality, and biography of any author on their author page!' }
          ],
          tipTitle: 'Web Images',
          tipText: 'If you prefer a cover from the web, save the image to your computer and select it via "Change cover" to crop it cleanly.'
        },
        'sub-multi-select': {
          title: 'Multi-selection and batch actions',
          subtitle: 'Select multiple books to mark or delete together',
          overview: 'Click "Select Multiple" in the library header to batch-mark audiobooks as completed or remove them at once.'
        },
        'sub-backup-data': {
          title: 'Data backup and folders',
          subtitle: 'Where playback progress and settings are saved',
          overview: 'Your playback progress, bookmarks, and notes are stored locally in your app data folder so you never lose your spot.'
        }
      }
    },
    'help-theme-reproducao': {
      title: 'Playback and Miniplayer',
      subtitle: 'Controls, speed, sleep timer, and screen modes',
      subthemes: {
        'sub-player-controls': {
          title: 'Player controls',
          subtitle: 'Play, pause, skip forward/backward, and timeline',
          overview: 'Control playback smoothly using the miniplayer bar at the bottom or expand it into full-screen mode.'
        },
        'sub-playback-speed': {
          title: 'Playback speed',
          subtitle: 'From 0.5x to 3.0x with pitch correction',
          overview: 'Adjust playback speed freely without distorting voice pitch. Set your preferred default speed in Settings.'
        },
        'sub-sleep-timer': {
          title: 'Sleep timer',
          subtitle: 'Stop playback after minutes or at end of chapter',
          overview: 'Set a sleep timer to pause audio automatically after a set duration or when the current chapter finishes.'
        },
        'sub-play-queue': {
          title: 'Play queue',
          subtitle: 'Add books to play next or at the end of the queue',
          overview: 'Queue up your upcoming listening list so the player moves to the next title automatically.'
        },
        'sub-player-modes': {
          title: 'Miniplayer and Fullscreen Mode',
          subtitle: 'Switch between compact player and side-by-side immersive view',
          overview: 'Use the floating Miniplayer docked at the bottom while browsing, or expand to Fullscreen Mode with high-resolution cover art and side-by-side synchronized text.',
          steps: [
            { title: 'Using the Miniplayer', desc: 'When playing audio, the bottom bar displays the cover thumbnail, title, quick controls, chapters, queue, and progress bar.' },
            { title: 'Expand to Fullscreen', desc: 'Click the expand icon on the right side of the miniplayer to open the fullscreen view.' },
            { title: 'Side-by-Side Fullscreen Reading', desc: 'When you activate the Text button in fullscreen mode, the cover, titles, progress bar, and controls keep their exact original size and smoothly slide to the side to make room for the synchronized transcript.' }
          ],
          highlights: [
            { title: 'Preserved Proportions', desc: 'In fullscreen mode, activating synchronized text slides the player block to the side without shrinking the cover or controls.' },
            { title: 'Quick Access Popups', desc: 'Access Chapters, Bookmarks, Speed, Sleep Timer, Queue, and Synchronized Text from both miniplayer and fullscreen.' }
          ]
        }
      }
    },
    'help-theme-capitulos': {
      title: 'Chapters and Notes',
      subtitle: 'Track navigation, bookmarks, and annotations',
      subthemes: {
        'sub-chapters-nav': {
          title: 'Chapter navigation',
          subtitle: 'Jump between sections and view remaining chapter time',
          overview: 'Navigate through embedded chapter markers with precise progress bars and time remaining per chapter.'
        },
        'sub-bookmarks': {
          title: 'Bookmarks and highlights',
          subtitle: 'Save important moments with one click',
          overview: 'Bookmark special quotes and key scenes to revisit them anytime from the bookmarks tab.'
        },
        'sub-notes-comments': {
          title: 'Notes and chapter bookmarks',
          subtitle: 'Write your thoughts directly attached to timestamps',
          overview: 'Add timestamped bookmarks and study notes that stay synced to exact audio positions.'
        },
        'sub-sync-transcript': {
          title: 'Synchronized Text Dynamics',
          subtitle: 'Automatic detection, manual file upload, and interactive reading',
          overview: 'The app automatically detects synchronized text embedded in audio file metadata upon import. If no embedded text is found, you can manually upload a synchronized text file either from the player text button or in the audiobook metadata editor.',
          steps: [
            { title: 'Auto-Detection or Upload via Player', desc: 'Click the Text icon in the player. If the book has metadata text, the transcript opens immediately; otherwise, a popup lets you upload a file (.epub, .json, .xml, .smil, .ts, .vtt, .srt, or .lrc).' },
            { title: 'Manage Text in Book Metadata', desc: 'When editing an audiobook, the "Audiobook text" section shows whether text was found in metadata and lets you Upload, Change, or Remove the text.' },
            { title: 'Interactive Reading & Side-by-Side Fullscreen', desc: 'The current line highlights automatically as narration progresses, and clicking any phrase jumps the audio to that exact moment. In fullscreen, the player slides to the side while keeping its original size.' },
            { title: 'Automatic Display on Play', desc: 'In "Settings > Playback", enable "Show text automatically" to open synchronized reading whenever you start a compatible audiobook.' }
          ],
          highlights: [
            { title: 'Broad Format Support', desc: 'Compatible with EPUB 3 Media Overlays (.epub, .smil, .xml), synced subtitles (.srt, .vtt, .lrc), and timestamp maps (.json, .ts).' },
            { title: 'Jump by Sentence', desc: 'Click any line in the transcript to jump immediately to that exact second of narration.' },
            { title: 'Great for Study & Languages', desc: 'Reading and listening simultaneously boosts retention and accelerates vocabulary and pronunciation learning.' }
          ],
          tipTitle: 'Tip: Generate your own synced texts',
          tipText: 'Visit "Other apps" in the left sidebar to check out the Text Generator for Audiobook Players and create synced files for your collection!'
        }
      }
    },
    'help-theme-pesquisa': {
      title: 'Search and Filters',
      subtitle: 'Find books, authors, genres, and search history',
      subthemes: {
        'sub-how-to-search': {
          title: 'How search works',
          subtitle: 'Search across titles, authors, narrators, and chapters',
          overview: 'Type in the top search bar to instantly search across all book titles, authors, narrators, and chapters.'
        },
        'sub-search-history': {
          title: 'Search history',
          subtitle: 'Quick access to recent queries and history cleanup',
          overview: 'Access recent searches quickly and remove past queries whenever you want.'
        },
        'sub-sort-filters': {
          title: 'Sorting and smart filters',
          subtitle: 'Sort alphabetically, by year, or by total duration',
          overview: 'Sort your audiobooks by title (A-Z or Z-A), release year, or duration (from shortest to longest).'
        }
      }
    },
    'help-theme-ajustes': {
      title: 'Settings and Customization',
      subtitle: 'Themes, language, notifications, and storage',
      subthemes: {
        'sub-themes-colors': {
          title: 'Theme and appearance',
          subtitle: 'Dark, light, OLED black, and accent colors',
          overview: 'Customize your visual experience with Dark, Light, or high-contrast OLED modes, and custom accent colors.'
        },
        'sub-playback-settings': {
          title: 'Playback preferences',
          subtitle: 'Default speed, skip duration, and resume playback',
          overview: 'Configure default skip intervals (10s, 30s, 60s) and automatic resume from the last heard position.'
        },
        'sub-notifications': {
          title: 'Notifications and alerts',
          subtitle: 'Chapter and book completion notifications',
          overview: 'Enable desktop notifications when chapters or entire books finish playing.'
        },
        'sub-system-cache': {
          title: 'Storage and cache',
          subtitle: 'Managing data directory and clearing cache safely',
          overview: 'View storage usage and manage your local data directory in the system settings.'
        }
      }
    },
    'help-theme-atalhos': {
      title: 'Keyboard Shortcuts',
      subtitle: 'Quick commands to control the player without a mouse',
      subthemes: {
        'sub-all-shortcuts': {
          title: 'All keyboard shortcuts',
          subtitle: 'Spacebar, arrows, speed control, and navigation',
          overview: 'Control play/pause with Spacebar, skip backward/forward with Left/Right arrows, and adjust volume with Up/Down.'
        }
      }
    },
    'help-theme-duvidas': {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions, troubleshooting, and audio formats',
      subthemes: {
        'sub-troubleshooting': {
          title: 'Troubleshooting and audio playback',
          subtitle: 'Fixing missing files or unreadable tags',
          overview: 'If an audio file does not play, ensure it is not locked by another program and is in a supported format.'
        },
        'sub-audio-formats': {
          title: 'Supported audio formats',
          subtitle: 'M4B, MP3, M4A, FLAC, OGG, and AAC details',
          overview: 'We support all major audio formats including M4B (with chapters), MP3, AAC, FLAC, and OGG.'
        },
        'sub-battery-performance': {
          title: 'Battery and performance tips',
          subtitle: 'Optimize background playback for laptops',
          overview: 'The player is highly optimized with native hardware acceleration to consume minimal CPU and battery.'
        }
      }
    },
    'help-theme-outros-apps': {
      title: 'Other Apps & Ecosystem',
      subtitle: 'Companion tools to convert e-books into audiobooks and generate synced texts',
      subthemes: {
        'sub-ebook-converter': {
          title: 'Ebook to Audiobook Converter',
          subtitle: 'Transform digital books (EPUB, PDF, MOBI, TXT) into AI-narrated audiobooks',
          overview: 'In the "Other apps" section of the left sidebar (above Help), you will find the Ebook to Audiobook Converter by thenauan: a native desktop app that transforms e-books (EPUB, PDF, MOBI, TXT) into AI-narrated audiobooks with natural neural voices.',
          steps: [
            { title: 'Open Other Apps in the Sidebar', desc: 'Click the "Other apps" button in the left sidebar, located right above the Help button.' },
            { title: 'Find the Ebook to Audiobook Converter', desc: 'View the square app card displaying the thenauan GitHub badge.' },
            { title: 'Click "Go to app"', desc: 'Clicking "Go to app" opens the official project repository on GitHub (github.com/thenauan/audiobook-generator) in your default external browser.' }
          ],
          highlights: [
            { title: 'Neural Voices & Multi-language', desc: 'Generate natural narration across multiple languages with automatic translation and chapter splitting.' },
            { title: 'Seamless Player Integration', desc: 'Generated audiobooks can be imported directly into your Library with chapters and metadata ready to play.' }
          ],
          tipTitle: 'Direct Browser Access',
          tipText: 'Links always open in your default external browser so you can download the latest release or read the documentation on GitHub.'
        },
        'sub-text-generator': {
          title: 'Text Generator for Audiobook Players',
          subtitle: 'Tool to create synchronized transcript and subtitle files',
          overview: 'Also available in the "Other apps" screen, the Text Generator for Audiobook Players is a companion tool in the thenauan ecosystem designed to generate text files synchronized to exact audio timestamps.',
          steps: [
            { title: 'Open the Other Apps Screen', desc: 'In the left sidebar, click "Other apps" to view the ecosystem tools.' },
            { title: 'Visit the Project on GitHub', desc: 'Click "Go to app" on the Text Generator card to open the repository in your default browser.' },
            { title: 'Import the Generated Text into the Player', desc: 'Once generated, upload the synced text file into Audiobook Player via the player Text button or the book metadata editor.' }
          ],
          highlights: [
            { title: 'Precise Timestamp Alignment', desc: 'Produces files compatible with sentence-by-sentence tracking in both fullscreen and miniplayer modes.' },
            { title: 'Complete Ecosystem', desc: 'Combine the Ebook Converter, Text Generator, and Audiobook Player for a complete creation and listening workflow.' }
          ]
        }
      }
    }
  },

  es: {
    'help-theme-novidades': {
      title: "Compartir, Texto y Móvil",
      subtitle: "Imágenes para historias, fragmentos del texto, gestos e instalación",
      subthemes: {
        'sub-share-story': { title: "Compartir audiolibros y fragmentos", subtitle: "Crea una imagen en formato de historia con la portada o frases del texto", overview: "La app genera una imagen lista para las Historias de Instagram y otras apps: la portada, el título y el autor sobre un recuadro de vidrio con los colores de la portada — o, en un fragmento, las frases entre comillas con la portada pequeña junto al título.", steps: [{ title: "Abre las opciones del audiolibro", desc: "En el móvil, toca los tres puntos del encabezado de la página del audiolibro; en el ordenador, usa el botón de compartir del encabezado." }, { title: "Elige qué compartir", desc: "\"Compartir audiolibro\" crea la imagen con la portada. \"Compartir fragmento\" abre el texto para marcar hasta 5 frases." }, { title: "Guarda o comparte", desc: "La imagen se abre a pantalla completa. Toca \"Compartir\" para elegir Instagram (Historia), WhatsApp, etc., o \"Guardar imagen\"." }], tipTitle: "Consejo", tipText: "La imagen sigue el tema de la app: recuadro claro en el tema claro y oscuro en el oscuro." },
        'sub-text-excerpts': { title: "Frases del texto del audiolibro", subtitle: "Mantén pulsada una frase para marcarla, escucharla, copiarla o compartirla", overview: "Con el texto abierto en el reproductor a pantalla completa, cada frase sigue al audio. Toca una frase para ir a ella; mantenla pulsada (móvil) o haz clic derecho (ordenador) para ver las opciones.", steps: [{ title: "Añadir como marcador", desc: "La frase se convierte en un marcador del capítulo, en el momento exacto en que empieza." }, { title: "Escuchar desde aquí", desc: "El audio salta al inicio de la frase y empieza a sonar." }, { title: "Compartir o copiar", desc: "\"Compartir fragmento\" genera la imagen con la frase; \"Copiar texto\" la copia." }], tipTitle: "Consejo", tipText: "Para compartir varias frases a la vez (hasta 5), usa \"Compartir fragmento\" en las opciones del audiolibro." },
        'sub-mobile-gestures': { title: "Gestos en móviles y tabletas", subtitle: "Atajos táctiles para usar la app con una sola mano", overview: "En móviles y tabletas, la app responde a gestos como las apps de iPhone y Android.", steps: [{ title: "Mantén pulsado para ver opciones", desc: "Mantén pulsado un audiolibro, autor o app para destacarlo y abrir sus opciones. En la cola, mantén pulsado un elemento para moverlo." }, { title: "Volver y minimizar", desc: "Arrastra desde el borde izquierdo hacia el centro (o usa el botón atrás del sistema) para volver. Desliza hacia abajo el reproductor a pantalla completa para minimizarlo." }, { title: "Cola y barra de menús", desc: "En la cola, desliza un elemento a la izquierda para quitarlo. Al desplazarte, la barra y el minirreproductor se reducen; tócalos para restaurarlos." }], tipTitle: "Consejo", tipText: "Los marcadores y \"Añadir a colección\" se abren como hojas desde la parte inferior; arrástralas hacia abajo para cerrarlas." },
        'sub-install-app': { title: "Instalar como app", subtitle: "Usa Audiobook Player desde la pantalla de inicio o el ordenador", overview: "Audiobook Player se puede instalar como app (PWA): se abre a pantalla completa, tiene su propio icono y guarda tu biblioteca en el dispositivo.", steps: [{ title: "iPhone y iPad", desc: "En Safari, toca Compartir y luego \"Añadir a pantalla de inicio\"." }, { title: "Android", desc: "En Chrome, abre el menú ⋮ y toca \"Instalar app\"." }, { title: "Ordenador", desc: "En Chrome o Edge, haz clic en el icono de instalar de la barra de direcciones." }], tipTitle: "Tus datos", tipText: "Los audiolibros importados y tu progreso se guardan en el dispositivo. Usa \"Exportar biblioteca\" en Ajustes para hacer una copia." }
      }
    },
    'help-theme-biblioteca': {
      title: 'Biblioteca y Archivos',
      subtitle: 'Cómo añadir, organizar, editar y guardar tus audiolibros',
      subthemes: {
        'sub-add-audiobooks': {
          title: 'Cómo añadir audiolibros',
          subtitle: 'Importar carpetas y archivos de audio de tu ordenador',
          overview: 'Puedes importar archivos o carpetas completas directamente desde tu ordenador. La aplicación lee etiquetas y metadatos para identificar título, autor, capítulos y duración.',
          steps: [
            { title: 'Abre la Biblioteca', desc: 'En la barra lateral izquierda, haz clic en "Biblioteca".' },
            { title: 'Haz clic en Añadir', desc: 'En la esquina superior derecha, haz clic en "+ Añadir".' },
            { title: 'Selecciona archivos o carpetas', desc: 'Elige la carpeta o múltiples archivos de audio (.mp3, .m4b, .m4a, .flac).' },
            { title: '¡Listo para escuchar!', desc: 'Los nuevos títulos aparecen inmediatamente con sus capítulos organizados.' }
          ]
        },
        'sub-organize-library': {
          title: 'Organización y categorías',
          subtitle: 'Filtros, estado, favoritos y géneros',
          overview: 'Organiza tu biblioteca fácilmente usando filtros de estado (En curso, Concluido, Sin empezar, Favoritos), autores y géneros.'
        },
        'sub-edit-metadata': {
          title: 'Editar portadas, título, texto y datos',
          subtitle: 'Personalizar imágenes, nombres, narradores, sinopsis y texto sincronizado',
          overview: 'Puedes personalizar toda la información de cualquier audiolibro o autor: cambiar la imagen de portada, elegir colores personalizados, gestionar el archivo de texto sincronizado y ajustar título, narrador, año, género y sinopsis.',
          steps: [
            { title: 'Abre las opciones del libro', desc: 'Haz clic en los tres puntos "•••" de la tarjeta o abre los detalles del libro y pulsa Editar.' },
            { title: 'Cambia la imagen o color de portada', desc: 'Haz clic en "Cambiar portada" para subir una imagen (.jpg, .png, .webp) con recorte ajustable o elige uno de los 24 colores de la paleta.' },
            { title: 'Gestiona el texto sincronizado', desc: 'En la sección "Texto del audiolibro", verifica si hay texto en los metadatos o usa "Subir texto", "Cambiar texto" o "Eliminar texto" (.epub, .json, .xml, .smil, .ts, .vtt, .srt, .lrc).' },
            { title: 'Ajusta los campos y guarda', desc: 'Edita Título, Autor, Narrador, Año, Idioma, Género, Subgénero y Sinopsis, y pulsa el botón de confirmar arriba a la derecha.' }
          ],
          highlights: [
            { title: 'Portadas y Colores Adaptativos', desc: 'El reproductor extrae el color predominante de la portada para iluminar botones, barras y fondos ambientales.' },
            { title: 'Gestión de Texto Sincronizado', desc: 'Añade, reemplaza o elimina archivos de transcripción sincronizada directamente al editar el audiolibro.' },
            { title: 'Edición de Autores', desc: '¡También puedes editar la foto, color de perfil, nacionalidad y biografía de cualquier autor en su página!' }
          ],
          tipTitle: 'Imágenes de la Web',
          tipText: 'Si prefieres una portada de internet, guárdala en tu ordenador y selecciónala en "Cambiar portada" para recortarla fácilmente.'
        },
        'sub-multi-select': {
          title: 'Selección múltiple',
          subtitle: 'Selecciona varios libros para acciones en lote',
          overview: 'Usa la selección múltiple en el encabezado de la biblioteca para marcar o eliminar varios audiolibros a la vez.'
        },
        'sub-backup-data': {
          title: 'Copia de seguridad y datos',
          subtitle: 'Dónde se guarda el progreso y la configuración',
          overview: 'Tu progreso de reproducción y marcadores se guardan localmente para que nunca pierdas tu posición.'
        }
      }
    },
    'help-theme-reproducao': {
      title: 'Reproducción y Miniplayer',
      subtitle: 'Controles, velocidad, temporizador y modos de pantalla',
      subthemes: {
        'sub-player-controls': {
          title: 'Controles del reproductor',
          subtitle: 'Reproducir, pausar, avanzar, retroceder y línea temporal',
          overview: 'Controla la reproducción con la barra inferior o amplíala a pantalla completa.'
        },
        'sub-playback-speed': {
          title: 'Velocidad de reproducción',
          subtitle: 'De 0.5x a 3.0x con corrección de tono',
          overview: 'Ajusta la velocidad sin alterar el tono de voz del narrador.'
        },
        'sub-sleep-timer': {
          title: 'Temporizador de apagado',
          subtitle: 'Pausa el audio tras minutos o al final del capítulo',
          overview: 'Configura un temporizador para pausar la reproducción automáticamente antes de dormir.'
        },
        'sub-play-queue': {
          title: 'Cola de reproducción',
          subtitle: 'Añade libros a la cola de espera',
          overview: 'Organiza los siguientes libros a reproducir en tu cola de escucha.'
        },
        'sub-player-modes': {
          title: 'Miniplayer y Modo Pantalla Completa',
          subtitle: 'Alternar entre el reproductor compacto y la vista inmersiva lado a lado',
          overview: 'Alterna entre el Miniplayer flotante en la parte inferior y el Modo Pantalla Completa con portada en alta resolución y panel de texto sincronizado lado a lado.',
          steps: [
            { title: 'Usando el Miniplayer', desc: 'Al reproducir cualquier audio, la barra inferior muestra la portada en miniatura, título, controles rápidos, capítulos, cola y progreso.' },
            { title: 'Expandir a Pantalla Completa', desc: 'Haz clic en el icono de expandir a la derecha del miniplayer para abrir la vista en pantalla completa.' },
            { title: 'Lectura Lado a Lado en Pantalla Completa', desc: 'Al activar el botón de Texto en pantalla completa, la portada, los textos, la barra y los botones mantienen exactamente su mismo tamaño y solo se deslizan hacia un lado para mostrar la transcripción sincronizada.' }
          ],
          highlights: [
            { title: 'Proporciones Preservadas', desc: 'En pantalla completa, activar el texto sincronizado desliza el reproductor hacia un lado sin reducir el tamaño de la portada ni de los controles.' },
            { title: 'Acceso Rápido a Ventanas', desc: 'Accede a Capítulos, Marcadores, Velocidad, Temporizador, Cola y Texto Sincronizado tanto en el miniplayer como en pantalla completa.' }
          ]
        }
      }
    },
    'help-theme-capitulos': {
      title: 'Capítulos y Notas',
      subtitle: 'Navegación por pistas, marcadores y anotaciones',
      subthemes: {
        'sub-chapters-nav': {
          title: 'Navegación de capítulos',
          subtitle: 'Salta entre secciones con tiempo restante',
          overview: 'Navega por los marcadores de capítulo con tiempos exactos y progreso por sección.'
        },
        'sub-bookmarks': {
          title: 'Marcadores y favoritos',
          subtitle: 'Guarda momentos destacados con un solo clic',
          overview: 'Guarda fragmentos importantes para volver a ellos en cualquier momento.'
        },
        'sub-notes-comments': {
          title: 'Notas y marcadores',
          subtitle: 'Escribe reflexiones vinculadas a marcas de tiempo',
          overview: 'Añade notas y marcadores sincronizados al segundo exacto de la narración.'
        },
        'sub-sync-transcript': {
          title: 'Dinámica de Texto Sincronizado',
          subtitle: 'Detección automática, subida manual de archivos y lectura interactiva',
          overview: 'La aplicación detecta automáticamente textos sincronizados incrustados en los metadatos del audio al importar el audiolibro. Si no tiene texto incrustado, puedes subir manualmente un archivo de texto sincronizado desde el botón de texto del reproductor o en la edición de metadatos del libro.',
          steps: [
            { title: 'Detección Automática o Subida desde el Reproductor', desc: 'Haz clic en el icono de Texto en el reproductor. Si el libro tiene texto en sus metadatos, se abre al instante; si no, una ventana emergente te permite subir un archivo (.epub, .json, .xml, .smil, .ts, .vtt, .srt o .lrc).' },
            { title: 'Gestionar Texto en los Metadatos del Libro', desc: 'Al editar un audiolibro, la sección "Texto del audiolibro" indica si se encontró texto en los metadatos y permite Subir, Cambiar o Eliminar el texto.' },
            { title: 'Lectura Interactiva y Pantalla Completa Lado a Lado', desc: 'La frase actual se resalta automáticamente mientras avanza la narración, y puedes hacer clic en cualquier línea para saltar a ese instante. En pantalla completa, el reproductor se desliza hacia un lado manteniendo su tamaño original.' },
            { title: 'Visualización Automática al Reproducir', desc: 'En "Ajustes > Reproducción", activa "Mostrar texto automáticamente" para abrir la transcripción al iniciar un audiolibro compatible.' }
          ],
          highlights: [
            { title: 'Amplio Soporte de Formatos', desc: 'Compatible con Media Overlays de EPUB 3 (.epub, .smil, .xml), subtítulos sincronizados (.srt, .vtt, .lrc) y mapas de tiempo (.json, .ts).' },
            { title: 'Salto por Frase', desc: 'Haz clic en cualquier línea de la transcripción para saltar inmediatamente al segundo exacto de esa frase.' },
            { title: 'Ideal para Estudio e Idiomas', desc: 'Leer y escuchar simultáneamente mejora la retención y acelera el aprendizaje de vocabulario y pronunciación.' }
          ],
          tipTitle: 'Consejo: Crea tus propios textos sincronizados',
          tipText: '¡Usa el menú "Otras apps" en la barra lateral para descubrir el Generador de Textos para Reproductores de Audiolibros!'
        }
      }
    },
    'help-theme-pesquisa': {
      title: 'Búsqueda y Filtros',
      subtitle: 'Encuentra libros, autores, géneros e historial',
      subthemes: {
        'sub-how-to-search': {
          title: 'Cómo buscar',
          subtitle: 'Busca por títulos, autores, narradores y capítulos',
          overview: 'Escribe en la barra superior para buscar al instante en toda tu colección.'
        },
        'sub-search-history': {
          title: 'Historial de búsqueda',
          subtitle: 'Acceso rápido y limpieza de búsquedas anteriores',
          overview: 'Accede a tus búsquedas recientes y borra el historial cuando desees.'
        },
        'sub-sort-filters': {
          title: 'Ordenación y filtros inteligentes',
          subtitle: 'Ordena alfabéticamente, por año o por duración',
          overview: 'Ordena por título (A-Z o Z-A), año de lanzamiento o duración total.'
        }
      }
    },
    'help-theme-ajustes': {
      title: 'Ajustes y Personalización',
      subtitle: 'Temas, idioma, notificaciones y almacenamiento',
      subthemes: {
        'sub-themes-colors': {
          title: 'Tema y apariencia',
          subtitle: 'Modo oscuro, claro, negro OLED y colores de acento',
          overview: 'Personaliza tu experiencia visual con modo claro, oscuro o colores personalizados.'
        },
        'sub-playback-settings': {
          title: 'Ajustes de reproducción',
          subtitle: 'Velocidad predeterminada y reanudación automática',
          overview: 'Configura intervalos de salto y reanudación desde la última posición.'
        },
        'sub-notifications': {
          title: 'Notificaciones',
          subtitle: 'Avisos al finalizar capítulos y libros',
          overview: 'Activa notificaciones del sistema al terminar capítulos o audiolibros.'
        },
        'sub-system-cache': {
          title: 'Almacenamiento y caché',
          subtitle: 'Gestión de la carpeta de datos y limpieza',
          overview: 'Supervisa el uso del disco y gestiona los datos de la aplicación.'
        }
      }
    },
    'help-theme-atalhos': {
      title: 'Atajos de Teclado',
      subtitle: 'Comandos rápidos para controlar el reproductor sin ratón',
      subthemes: {
        'sub-all-shortcuts': {
          title: 'Todos los atajos de teclado',
          subtitle: 'Espacio, flechas, velocidad y volumen',
          overview: 'Controla reproducción con Espacio, salta con Flechas izquierda/derecha y ajusta volumen con Arriba/Abajo.'
        }
      }
    },
    'help-theme-duvidas': {
      title: 'Preguntas Frecuentes',
      subtitle: 'Dudas comunes, solución de problemas y formatos',
      subthemes: {
        'sub-troubleshooting': {
          title: 'Solución de problemas',
          subtitle: 'Qué hacer si un archivo no reproduce',
          overview: 'Verifica que el archivo no esté bloqueado y tenga un formato de audio compatible.'
        },
        'sub-audio-formats': {
          title: 'Formatos compatibles',
          subtitle: 'Detalles de M4B, MP3, M4A, FLAC, OGG y AAC',
          overview: 'Compatible con M4B con capítulos, MP3, AAC, FLAC, OGG y WAV.'
        },
        'sub-battery-performance': {
          title: 'Consejos de batería y rendimiento',
          subtitle: 'Optimización para portátiles en segundo plano',
          overview: 'El reproductor utiliza aceleración gráfica nativa para gastar el mínimo de batería.'
        }
      }
    },
    'help-theme-outros-apps': {
      title: 'Otras Apps y Ecosistema',
      subtitle: 'Herramientas complementarias para convertir ebooks en audiolibros y generar textos sincronizados',
      subthemes: {
        'sub-ebook-converter': {
          title: 'Convertidor de Ebooks en Audiolibros',
          subtitle: 'Transforma libros digitales (EPUB, PDF, MOBI, TXT) en audiolibros narrados por IA',
          overview: 'En la pestaña "Otras apps" del menú lateral (encima de Ayuda), encontrarás el Convertidor de Ebooks en Audiolibros creado por thenauan: una aplicación de escritorio nativa que convierte e-books (EPUB, PDF, MOBI, TXT) en audiolibros narrados con voces neuronales.',
          steps: [
            { title: 'Abre Otras Apps en el Menú Lateral', desc: 'Haz clic en el botón "Otras apps" situado en la barra lateral izquierda, justo encima de Ayuda.' },
            { title: 'Localiza el Convertidor de Ebooks en Audiolibros', desc: 'Observa la tarjeta cuadrada de la aplicación con el distintivo de GitHub de thenauan.' },
            { title: 'Haz clic en "Ir a la app"', desc: 'Al pulsar "Ir a la app", se abrirá la página oficial del proyecto en GitHub (github.com/thenauan/audiobook-generator) en el navegador predeterminado de tu ordenador.' }
          ],
          highlights: [
            { title: 'Voces Neuronales y Multi-idioma', desc: 'Genera narraciones naturales en múltiples idiomas con traducción automática y división por capítulos.' },
            { title: 'Integración con el Reproductor', desc: 'Los audiolibros generados pueden importarse directamente a tu Biblioteca con capítulos y metadatos listos.' }
          ],
          tipTitle: 'Acceso Directo en tu Navegador',
          tipText: 'El enlace se abre siempre en tu navegador externo predeterminado para que puedas descargar la última versión en GitHub.'
        },
        'sub-text-generator': {
          title: 'Generador de Textos para Reproductores de Audiolibros',
          subtitle: 'Herramienta para crear archivos de transcripción y subtítulos sincronizados',
          overview: 'También disponible en la sección "Otras apps", el Generador de Textos para Reproductores de Audiolibros es la herramienta complementaria de thenauan para generar archivos de texto sincronizados con el tiempo exacto del audio.',
          steps: [
            { title: 'Abre la Pantalla Otras Apps', desc: 'En el menú lateral izquierdo, haz clic en "Otras apps" para ver las herramientas del ecosistema.' },
            { title: 'Accede al Proyecto en GitHub', desc: 'Haz clic en "Ir a la app" en la tarjeta del Generador de Textos para abrir el repositorio en tu navegador.' },
            { title: 'Importa el Texto Generado en el Reproductor', desc: 'Una vez generado el archivo sincronizado, súbelo al reproductor mediante el botón de Texto o en la edición de metadatos del libro.' }
          ],
          highlights: [
            { title: 'Alineación Precisa de Tiempo', desc: 'Produce archivos compatibles con el seguimiento frase por frase en pantalla completa y miniplayer.' },
            { title: 'Ecosistema Completo', desc: 'Combina el Convertidor de Ebooks, el Generador de Textos y el Reproductor para una experiencia completa.' }
          ]
        }
      }
    }
  },

  ru: {
    'help-theme-novidades': {
      title: "Публикация, текст и телефон",
      subtitle: "Изображения для историй, отрывки текста, жесты и установка приложения",
      subthemes: {
        'sub-share-story': { title: "Поделиться аудиокнигой или отрывком", subtitle: "Создайте изображение в формате истории с обложкой или фразами из текста", overview: "Приложение создаёт изображение для историй Instagram и других приложений: обложка, название и автор на стеклянной карточке на фоне цветов обложки — или, для отрывка, фразы в кавычках с маленькой обложкой рядом с названием.", steps: [{ title: "Откройте параметры аудиокниги", desc: "На телефоне нажмите три точки в заголовке страницы аудиокниги; на компьютере используйте кнопку «Поделиться» в заголовке." }, { title: "Выберите, чем поделиться", desc: "«Поделиться аудиокнигой» создаёт изображение с обложкой. «Поделиться отрывком» открывает текст, где можно отметить до 5 фраз." }, { title: "Сохраните или поделитесь", desc: "Изображение открывается на весь экран. Нажмите «Поделиться», чтобы выбрать Instagram (История), WhatsApp и т. д., или «Сохранить изображение»." }], tipTitle: "Совет", tipText: "Изображение следует теме приложения: светлая карточка в светлой теме и тёмная в тёмной." },
        'sub-text-excerpts': { title: "Фразы текста аудиокниги", subtitle: "Удерживайте фразу, чтобы добавить закладку, слушать, копировать или поделиться", overview: "Когда текст открыт в полноэкранном плеере, каждая фраза следует за звуком. Нажмите фразу, чтобы перейти к ней; удерживайте её (телефон) или нажмите правой кнопкой (компьютер), чтобы открыть параметры.", steps: [{ title: "Добавить в закладки", desc: "Фраза становится закладкой главы точно в момент её начала." }, { title: "Слушать отсюда", desc: "Звук переходит к началу фразы и начинает воспроизводиться." }, { title: "Поделиться или копировать", desc: "«Поделиться отрывком» создаёт изображение с фразой; «Копировать текст» копирует её." }], tipTitle: "Совет", tipText: "Чтобы поделиться несколькими фразами (до 5), используйте «Поделиться отрывком» в параметрах аудиокниги." },
        'sub-mobile-gestures': { title: "Жесты на телефоне и планшете", subtitle: "Сенсорные приёмы для управления одной рукой", overview: "На телефонах и планшетах приложение понимает жесты, как приложения iPhone и Android.", steps: [{ title: "Удерживайте для параметров", desc: "Удерживайте аудиокнигу, автора или приложение, чтобы выделить их и открыть параметры. В очереди удерживайте элемент, чтобы переместить его." }, { title: "Назад и свернуть", desc: "Проведите от левого края к центру (или используйте системную кнопку «Назад»). Смахните полноэкранный плеер вниз, чтобы свернуть его." }, { title: "Очередь и панель вкладок", desc: "В очереди смахните элемент влево, чтобы удалить его. При прокрутке панель и мини-плеер уменьшаются; нажмите на них, чтобы вернуть размер." }], tipTitle: "Совет", tipText: "Закладки и «Добавить в коллекцию» открываются как листы снизу экрана; потяните вниз, чтобы закрыть." },
        'sub-install-app': { title: "Установить как приложение", subtitle: "Используйте Audiobook Player с главного экрана или компьютера", overview: "Audiobook Player можно установить как приложение (PWA): оно открывается на весь экран, имеет свой значок и хранит библиотеку на устройстве.", steps: [{ title: "iPhone и iPad", desc: "В Safari нажмите «Поделиться», затем «На экран „Домой“»." }, { title: "Android", desc: "В Chrome откройте меню ⋮ и нажмите «Установить приложение»." }, { title: "Компьютер", desc: "В Chrome или Edge нажмите значок установки в адресной строке." }], tipTitle: "Ваши данные", tipText: "Импортированные аудиокниги и прогресс хранятся на устройстве. Для резервной копии используйте «Экспорт библиотеки» в настройках." }
      }
    },
    'help-theme-biblioteca': {
      title: 'Библиотека и файлы',
      subtitle: 'Как добавлять, упорядочивать, редактировать и сохранять книги',
      subthemes: {
        'sub-add-audiobooks': {
          title: 'Как добавить аудиокниги',
          subtitle: 'Импорт папок и аудиофайлов с компьютера',
          overview: 'Вы можете импортировать аудиофайлы или целые папки прямо с вашего компьютера. Приложение автоматически считывает метаданные для определения названия, автора, глав и длительности.',
          steps: [
            { title: 'Откройте Библиотеку', desc: 'В левом боковом меню нажмите кнопку "Библиотека".' },
            { title: 'Нажмите Добавить', desc: 'В правом верхнем углу нажмите кнопку "+ Добавить".' },
            { title: 'Выберите файлы или папку', desc: 'Выберите папку с книгой или несколько аудиофайлов (.mp3, .m4b, .m4a, .flac).' },
            { title: 'Готово к прослушиванию!', desc: 'Книги появятся в библиотеке с готовыми главами.' }
          ],
          tipTitle: 'Совет для идеального порядка',
          tipText: 'Храните каждую книгу в отдельной папке вида "Автор - Название" с пронумерованными главами.'
        },
        'sub-organize-library': {
          title: 'Организация и категории',
          subtitle: 'Фильтры статуса, избранное, авторы и жанры',
          overview: 'Управляйте библиотекой с помощью фильтров статуса (В процессе, Завершено, Не начато, Избранное), авторов и жанров.'
        },
        'sub-edit-metadata': {
          title: 'Редактирование обложек, текста и метаданных',
          subtitle: 'Изменение обложки, названия, автора, чтеца и синхронного текста',
          overview: 'Вы можете настроить любую информацию об аудиокниге или авторе: сменить обложку, выбрать цвет палитры, управлять файлом синхронизированного текста, а также изменить название, чтеца, год, жанр и описание.',
          steps: [
            { title: 'Откройте параметры книги', desc: 'Нажмите на три точки «•••» на карточке или откройте страницу книги и нажмите кнопку редактирования.' },
            { title: 'Измените обложку или цвет', desc: 'Нажмите «Изменить обложку», чтобы загрузить изображение (.jpg, .png, .webp) с кадрированием, или выберите один из 24 цветов палитры.' },
            { title: 'Управляйте синхронным текстом', desc: 'В разделе «Текст аудиокниги» проверьте наличие текста в метаданных или используйте кнопки «Загрузить текст», «Изменить текст» или «Удалить текст» (.epub, .json, .xml, .smil, .ts, .vtt, .srt, .lrc).' },
            { title: 'Сохраните изменения', desc: 'Отредактируйте поля и нажмите кнопку подтверждения в правом верхнем углу.' }
          ],
          highlights: [
            { title: 'Адаптивные обложки и цвета', desc: 'Плеер автоматически извлекает основной цвет обложки для подсветки элементов управления и фона.' },
            { title: 'Управление синхронным текстом', desc: 'Добавляйте, заменяйте или удаляйте файлы синхронизированного текста прямо в редакторе книги.' },
            { title: 'Редактирование авторов', desc: 'Вы также можете изменить фото, цвет профиля, национальность и биографию любого автора на его странице!' }
          ]
        },
        'sub-multi-select': {
          title: 'Множественный выбор',
          subtitle: 'Выбор нескольких книг для массовых действий',
          overview: 'Используйте кнопку множественного выбора в заголовке библиотеки для одновременного удаления или отметки книг.'
        },
        'sub-backup-data': {
          title: 'Хранение данных и резервные копии',
          subtitle: 'Где хранятся прогресс прослушивания и настройки',
          overview: 'Ваш прогресс прослушивания, закладки и заметки сохраняются локально на компьютере.'
        }
      }
    },
    'help-theme-reproducao': {
      title: 'Воспроизведение и миниплеер',
      subtitle: 'Управление, скорость, таймер сна и режимы экрана',
      subthemes: {
        'sub-player-controls': {
          title: 'Элементы управления плеером',
          subtitle: 'Воспроизведение, пауза, перемотка и шкала времени',
          overview: 'Управляйте воспроизведением с помощью нижней панели или разверните плеер на весь экран.'
        },
        'sub-playback-speed': {
          title: 'Скорость воспроизведения',
          subtitle: 'От 0.5x до 3.0x с сохранением высоты голоса',
          overview: 'Меняйте скорость без искажения тембра голоса диктора.'
        },
        'sub-sleep-timer': {
          title: 'Таймер сна',
          subtitle: 'Остановка через заданное время или в конце главы',
          overview: 'Настройте таймер сна для автоматической паузы перед сном.'
        },
        'sub-play-queue': {
          title: 'Очередь воспроизведения',
          subtitle: 'Добавление следующих книг в список',
          overview: 'Составляйте очередь прослушивания, чтобы плеер автоматически переходил к следующей книге.'
        },
        'sub-player-modes': {
          title: 'Миниплеер и полноэкранный режим',
          subtitle: 'Переключение между компактным плеером и полноэкранным режимом с текстом рядом',
          overview: 'Переключайтесь между плавающим миниплеером внизу экрана и полноэкранным режимом с обложкой высокого разрешения и панелью синхронного текста рядом.',
          steps: [
            { title: 'Использование миниплеера', desc: 'Во время воспроизведения нижняя панель показывает миниатюру обложки, название, управление, главы, очередь и прогресс.' },
            { title: 'Переход в полноэкранный режим', desc: 'Нажмите значок развертывания в правой части миниплеера, чтобы открыть полноэкранный режим.' },
            { title: 'Чтение бок о бок в полноэкранном режиме', desc: 'При включении кнопки «Текст» в полноэкранном режиме обложка, заголовки, полоса прогресса и кнопки сохраняют свой точный исходный размер и плавно сдвигаются в сторону, открывая панель синхронного текста.' }
          ],
          highlights: [
            { title: 'Сохранение пропорций', desc: 'В полноэкранном режиме активация текста плавно сдвигает блок плеера в сторону без уменьшения обложки и кнопок.' },
            { title: 'Быстрый доступ к меню', desc: 'Главы, комментарии, скорость, таймер сна, очередь и синхронный текст доступны как в миниплеере, так и на полном экране.' }
          ]
        }
      }
    },
    'help-theme-capitulos': {
      title: 'Главы и заметки',
      subtitle: 'Навигация по трекам, закладки и комментарии',
      subthemes: {
        'sub-chapters-nav': {
          title: 'Навигация по главам',
          subtitle: 'Переход между главами с оставшимся временем',
          overview: 'Легко переключайтесь между главами с точным отображением оставшегося времени.'
        },
        'sub-bookmarks': {
          title: 'Закладки и избранные моменты',
          subtitle: 'Сохраняйте важные фрагменты в один клик',
          overview: 'Ставьте закладки на любимые моменты, чтобы вернуться к ним позже.'
        },
        'sub-notes-comments': {
          title: 'Заметки и закладки к главам',
          subtitle: 'Записывайте мысли с привязкой к таймкодам',
          overview: 'Добавляйте закладки и конспекты с привязкой к конкретной секунде аудио.'
        },
        'sub-sync-transcript': {
          title: 'Динамика синхронизированного текста',
          subtitle: 'Автоопределение в метаданных, ручная загрузка файлов и интерактивное чтение',
          overview: 'Приложение автоматически обнаруживает синхронизированный текст в метаданных аудиофайла при импорте. Если встроенного текста нет, вы можете вручную загрузить файл синхронного текста через кнопку текста в плеере или в редакторе метаданных аудиокниги.',
          steps: [
            { title: 'Автоопределение или загрузка через плеер', desc: 'Нажмите значок «Текст» в плеере. Если в метаданных книги есть текст, он откроется сразу; иначе появится окно для загрузки файла (.epub, .json, .xml, .smil, .ts, .vtt, .srt или .lrc).' },
            { title: 'Управление текстом в метаданных книги', desc: 'При редактировании аудиокниги раздел «Текст аудиокниги» показывает, найден ли текст в метаданных, и позволяет Загрузить, Изменить или Удалить текст.' },
            { title: 'Интерактивное чтение и полный экран бок о бок', desc: 'Текущая фраза автоматически подсвечивается по ходу чтения, а клик по любой строке перематывает аудио к этому моменту. В полноэкранном режиме плеер сдвигается в сторону без изменения размера.' },
            { title: 'Автоматический показ при воспроизведении', desc: 'В «Настройки > Воспроизведение» включите «Автоматически показывать текст», чтобы текст открывался при запуске книги.' }
          ],
          highlights: [
            { title: 'Широкая поддержка форматов', desc: 'Поддерживаются Media Overlays EPUB 3 (.epub, .smil, .xml), субтитры (.srt, .vtt, .lrc) и карты таймкодов (.json, .ts).' },
            { title: 'Переход по фразам', desc: 'Нажмите на любую строку транскрипции, чтобы мгновенно перейти к соответствующей секунде аудио.' },
            { title: 'Отлично для учебы и языков', desc: 'Одновременное чтение и прослушивание улучшает запоминание и помогает изучать иностранные языки.' }
          ],
          tipTitle: 'Совет: Создавайте свои синхронные тексты',
          tipText: 'Загляните в раздел «Другие приложения» в боковом меню, чтобы открыть Генератор текстов для аудиокниг!'
        }
      }
    },
    'help-theme-pesquisa': {
      title: 'Поиск и фильтры',
      subtitle: 'Поиск книг, авторов, жанров и история',
      subthemes: {
        'sub-how-to-search': {
          title: 'Как работает поиск',
          subtitle: 'Поиск по названиям, авторам, чтецам и главам',
          overview: 'Вводите текст в верхней строке поиска для мгновенного нахождения нужных аудиокниг.'
        },
        'sub-search-history': {
          title: 'История поиска',
          subtitle: 'Быстрый доступ к прошлым запросам и очистка',
          overview: 'Повторяйте недавние запросы в один клик или очищайте историю поиска.'
        },
        'sub-sort-filters': {
          title: 'Сортировка и умные фильтры',
          subtitle: 'Сортировка по алфавиту, годам или длительности',
          overview: 'Сортируйте книги по названию (А-Я или Я-А), году выпуска или длительности.'
        }
      }
    },
    'help-theme-ajustes': {
      title: 'Настройки и персонализация',
      subtitle: 'Темы, язык, уведомления и хранилище',
      subthemes: {
        'sub-themes-colors': {
          title: 'Тема и оформление',
          subtitle: 'Темная, светлая тема, OLED и акцентные цвета',
          overview: 'Настройте цветовую схему и выберите любимый акцентный цвет интерфейса.'
        },
        'sub-playback-settings': {
          title: 'Параметры воспроизведения',
          subtitle: 'Скорость по умолчанию, шаг перемотки и автовозобновление',
          overview: 'Настройте интервалы перемотки и продолжение с места остановки.'
        },
        'sub-notifications': {
          title: 'Уведомления',
          subtitle: 'Оповещения об окончании главы или всей книги',
          overview: 'Включайте системные уведомления о завершении книг и глав.'
        },
        'sub-system-cache': {
          title: 'Хранилище и кэш',
          subtitle: 'Управление папкой данных и очистка кэша',
          overview: 'Контролируйте использование памяти и управляйте системной папкой данных.'
        }
      }
    },
    'help-theme-atalhos': {
      title: 'Горячие клавиши',
      subtitle: 'Быстрые команды для управления без мыши',
      subthemes: {
        'sub-all-shortcuts': {
          title: 'Все сочетания клавиш',
          subtitle: 'Пробел, стрелки, скорость и громкость',
          overview: 'Пробел — пауза/воспроизведение, стрелки влево/вправо — перемотка, вверх/вниз — громкость.'
        }
      }
    },
    'help-theme-duvidas': {
      title: 'Часто задаваемые вопросы',
      subtitle: 'Популярные вопросы, решение проблем и форматы',
      subthemes: {
        'sub-troubleshooting': {
          title: 'Устранение неполадок',
          subtitle: 'Что делать, если файл не воспроизводится',
          overview: 'Убедитесь, что аудиофайл не занят другой программой и поддерживается плеером.'
        },
        'sub-audio-formats': {
          title: 'Поддерживаемые форматы',
          subtitle: 'Информация о M4B, MP3, M4A, FLAC, OGG и AAC',
          overview: 'Плеер поддерживает M4B с главами, MP3, AAC, FLAC, OGG и WAV.'
        },
        'sub-battery-performance': {
          title: 'Экономия батареи и быстродействие',
          subtitle: 'Оптимизация плеера для ноутбуков в фоне',
          overview: 'Приложение использует аппаратное ускорение и потребляет минимум энергии ноутбука.'
        }
      }
    },
    'help-theme-outros-apps': {
      title: 'Другие приложения и экосистема',
      subtitle: 'Дополнительные инструменты для создания аудиокниг и генерации синхронных текстов',
      subthemes: {
        'sub-ebook-converter': {
          title: 'Конвертер электронных книг в аудиокниги',
          subtitle: 'Превращайте книги (EPUB, PDF, MOBI, TXT) в аудиокниги с ИИ-озвучкой',
          overview: 'В разделе «Другие приложения» бокового меню (над кнопкой Помощь) представлен Конвертер электронных книг в аудиокниги от thenauan — настольное приложение для превращения электронных книг (EPUB, PDF, MOBI, TXT) в аудиокниги с нейронными голосами.',
          steps: [
            { title: 'Откройте «Другие приложения» в боковом меню', desc: 'Нажмите кнопку «Другие приложения» в левой боковой панели прямо над кнопкой «Помощь».' },
            { title: 'Найдите Конвертер электронных книг', desc: 'Выберите квадратную карточку приложения со значком GitHub автора thenauan.' },
            { title: 'Нажмите «Перейти к приложению»', desc: 'При нажатии «Перейти к приложению» официальная страница проекта на GitHub (github.com/thenauan/audiobook-generator) откроется в вашем стандартном браузере.' }
          ],
          highlights: [
            { title: 'Нейронные голоса и многоязычность', desc: 'Создавайте естественную озвучку на разных языках с автопереводом и разбивкой по главам.' },
            { title: 'Полная совместимость с плеером', desc: 'Созданные аудиокниги можно сразу импортировать в вашу Библиотеку с готовыми главами и метаданными.' }
          ]
        },
        'sub-text-generator': {
          title: 'Генератор текстов для плееров аудиокниг',
          subtitle: 'Инструмент для создания файлов синхронизированных транскрипций и субтитров',
          overview: 'Также в разделе «Другие приложения» доступен Генератор текстов для плееров аудиокниг от thenauan, предназначенный для создания текстовых файлов, синхронизированных с точным временем аудио.',
          steps: [
            { title: 'Откройте экран «Другие приложения»', desc: 'В левом меню нажмите «Другие приложения», чтобы увидеть инструменты экосистемы.' },
            { title: 'Перейдите к проекту на GitHub', desc: 'Нажмите «Перейти к приложению» на карточке Генератора текстов для открытия репозитория в браузере.' },
            { title: 'Импортируйте созданный текст в плеер', desc: 'После создания файла загрузите его в Audiobook Player через кнопку «Текст» в плеере или в редакторе метаданных книги.' }
          ],
          highlights: [
            { title: 'Точная синхронизация по времени', desc: 'Создает файлы для построчного сопровождения речи в полноэкранном режиме и миниплеере.' },
            { title: 'Единая экосистема', desc: 'Используйте Конвертер книг, Генератор текстов и Плеер аудиокниг вместе для полного цикла создания и прослушивания.' }
          ]
        }
      }
    }
  },

  ar: {
    'help-theme-novidades': {
      title: "المشاركة والنص والهاتف",
      subtitle: "صور للقصص ومقتطفات النص والإيماءات وتثبيت التطبيق",
      subthemes: {
        'sub-share-story': { title: "مشاركة الكتب الصوتية والمقتطفات", subtitle: "أنشئ صورة بتنسيق القصص مع الغلاف أو جمل من النص", overview: "يُنشئ التطبيق صورة جاهزة لقصص إنستغرام وتطبيقات أخرى: الغلاف والعنوان والمؤلف على بطاقة زجاجية فوق ألوان الغلاف — أو، في حالة المقتطف، الجمل بين علامتي اقتباس مع غلاف صغير بجانب العنوان.", steps: [{ title: "افتح خيارات الكتاب الصوتي", desc: "على الهاتف، اضغط على النقاط الثلاث في رأس صفحة الكتاب؛ على الكمبيوتر، استخدم زر المشاركة في الرأس." }, { title: "اختر ما تريد مشاركته", desc: "\"مشاركة الكتاب الصوتي\" تُنشئ الصورة مع الغلاف. \"مشاركة مقتطف\" تفتح النص لاختيار حتى 5 جمل." }, { title: "احفظ أو شارك", desc: "تُفتح الصورة بملء الشاشة. اضغط \"مشاركة\" لاختيار إنستغرام (قصة) أو واتساب وغيرها، أو \"حفظ الصورة\"." }], tipTitle: "نصيحة", tipText: "تتبع الصورة سمة التطبيق: بطاقة فاتحة في السمة الفاتحة وداكنة في الداكنة." },
        'sub-text-excerpts': { title: "جمل نص الكتاب الصوتي", subtitle: "اضغط مطولًا على جملة لإضافة علامة أو الاستماع أو النسخ أو المشاركة", overview: "عند فتح النص في المشغّل بملء الشاشة، تتبع كل جملة الصوت. اضغط على جملة للانتقال إليها؛ اضغط مطولًا (الهاتف) أو انقر بزر الفأرة الأيمن (الكمبيوتر) لفتح الخيارات.", steps: [{ title: "إضافة كعلامة", desc: "تصبح الجملة علامة في الفصل عند اللحظة التي تبدأ فيها بالضبط." }, { title: "الاستماع من هنا", desc: "ينتقل الصوت إلى بداية الجملة ويبدأ التشغيل." }, { title: "المشاركة أو النسخ", desc: "\"مشاركة مقتطف\" تُنشئ صورة القصة مع الجملة؛ \"نسخ النص\" ينسخها." }], tipTitle: "نصيحة", tipText: "لمشاركة عدة جمل دفعة واحدة (حتى 5)، استخدم \"مشاركة مقتطف\" في خيارات الكتاب الصوتي." },
        'sub-mobile-gestures': { title: "الإيماءات على الهاتف والجهاز اللوحي", subtitle: "اختصارات لمسية لاستخدام التطبيق بيد واحدة", overview: "على الهواتف والأجهزة اللوحية، يستجيب التطبيق للإيماءات مثل تطبيقات آيفون وأندرويد.", steps: [{ title: "اضغط مطولًا لرؤية الخيارات", desc: "اضغط مطولًا على كتاب أو مؤلف أو تطبيق لإبرازه وفتح خياراته. في قائمة الانتظار، اضغط مطولًا على عنصر لتحريكه." }, { title: "الرجوع والتصغير", desc: "اسحب من الحافة إلى المنتصف (أو استخدم زر الرجوع في النظام). اسحب المشغّل بملء الشاشة إلى الأسفل لتصغيره." }, { title: "قائمة الانتظار وشريط القوائم", desc: "في قائمة الانتظار، اسحب عنصرًا لإزالته. أثناء التمرير يصغر الشريط والمشغّل المصغر؛ اضغط عليهما لاستعادتهما." }], tipTitle: "نصيحة", tipText: "تُفتح العلامات و\"إضافة إلى مجموعة\" كأوراق من أسفل الشاشة؛ اسحبها إلى الأسفل لإغلاقها." },
        'sub-install-app': { title: "التثبيت كتطبيق", subtitle: "استخدم Audiobook Player من الشاشة الرئيسية أو الكمبيوتر", overview: "يمكن تثبيت Audiobook Player كتطبيق (PWA): يُفتح بملء الشاشة وله أيقونته الخاصة ويحفظ مكتبتك على الجهاز.", steps: [{ title: "آيفون وآيباد", desc: "في سفاري، اضغط مشاركة ثم \"إضافة إلى الشاشة الرئيسية\"." }, { title: "أندرويد", desc: "في كروم، افتح القائمة ⋮ واضغط \"تثبيت التطبيق\"." }, { title: "الكمبيوتر", desc: "في كروم أو إيدج، انقر على أيقونة التثبيت في شريط العنوان." }], tipTitle: "بياناتك", tipText: "تُحفظ الكتب الصوتية المستوردة وتقدمك على الجهاز. استخدم \"تصدير المكتبة\" في الإعدادات للنسخ الاحتياطي." }
      }
    },
    'help-theme-biblioteca': {
      title: 'المكتبة والملفات',
      subtitle: 'كيفية إضافة وتنظيم وتعديل وحفظ كتبك الصوتية',
      subthemes: {
        'sub-add-audiobooks': {
          title: 'كيفية إضافة كتب صوتية',
          subtitle: 'استيراد المجلدات والملفات الصوتية من حاسوبك',
          overview: 'يمكنك استيراد ملفات صوتية فردية أو مجلدات كاملة مباشرة من جهازك. يقرأ التطبيق البيانات الوصفية تلقائيًا لتحديد العنوان والمؤلف والفصول والمدة.',
          steps: [
            { title: 'انتقل إلى المكتبة', desc: 'في القائمة الجانبية، انقر على "المكتبة".' },
            { title: 'انقر على إضافة', desc: 'في الزاوية العلوية، انقر على زر "+ إضافة".' },
            { title: 'اختر الملفات أو المجلد', desc: 'حدد مجلد الكتاب أو ملفات صوتية (.mp3, .m4b, .m4a, .flac).' },
            { title: 'جاهز للاستماع!', desc: 'ستظهر الكتب فورًا في مكتبتك مع فصولها المنظمة.' }
          ]
        },
        'sub-organize-library': {
          title: 'التنظيم والتصنيفات',
          subtitle: 'الفلاتر، الحالة، المفضلة، والمؤلفون والأنواع',
          overview: 'نظّم مكتبتك بسهولة باستخدام فلاتر الحالة (قيد الاستماع، مكتمل، لم يبدأ، المفضلة) والأنواع والمؤلفين.'
        },
        'sub-edit-metadata': {
          title: 'تعديل الأغلفة والعنوان والنص والبيانات',
          subtitle: 'تخصيص الصور والأسماء والرواة والملخص والنص المتزامن',
          overview: 'يمكنك تخصيص كافة معلومات أي كتاب صوتي أو مؤلف: تغيير صورة الغلاف، اختيار ألوان مخصصة، إدارة ملف النص المتزامن، وتعديل العنوان والراوي والسنة والنوع والملخص.',
          steps: [
            { title: 'افتح خيارات الكتاب', desc: 'انقر على النقاط الثلاث "•••" في البطاقة أو افتح صفحة تفاصيل الكتاب واضغط على تعديل.' },
            { title: 'غيّر صورة أو لون الغلاف', desc: 'انقر على "تغيير الغلاف" لرفع صورة (.jpg, .png, .webp) مع أداة القص المدمجة، أو اختر لونًا من لوحة الألوان الـ 24.' },
            { title: 'إدارة النص المتزامن', desc: 'في قسم "نص الكتاب الصوتي"، تحقق مما إذا كان النص موجودًا في البيانات الوصفية أو استخدم أزرار "رفع نص" أو "تغيير النص" أو "إزالة النص" (.epub, .json, .xml, .smil, .ts, .vtt, .srt, .lrc).' },
            { title: 'عدّل الحقول واحفظ', desc: 'حدّث العنوان والمؤلف والراوي والسنة واللغة والنوع والملخص، ثم اضغط على زر التأكيد في الأعلى للحفظ.' }
          ],
          highlights: [
            { title: 'أغلفة وألوان متكيفة', desc: 'يستخرج المشغل اللون السائد من الغلاف لإضاءة الأزرار وشريط التقدم والخلفية المحيطة.' },
            { title: 'إدارة النص المتزامن', desc: 'أضف أو استبدل أو أزل ملفات النص المتزامن مباشرة من شاشة تعديل الكتاب الصوتي.' },
            { title: 'تعديل المؤلفين', desc: 'يمكنك أيضًا تعديل الصورة ولون الملف الشخصي والجنسية والسيرة الذاتية لأي مؤلف في صفحته!' }
          ]
        },
        'sub-multi-select': {
          title: 'التحديد المتعدد',
          subtitle: 'تحديد عدة كتب للتحكم بها دفعة واحدة',
          overview: 'استخدم التحديد المتعدد لحذف عدة كتب أو تغيير حالتها دفعة واحدة.'
        },
        'sub-backup-data': {
          title: 'النسخ الاحتياطي والبيانات',
          subtitle: 'أين يتم حفظ تقدم الاستماع والإعدادات',
          overview: 'يتم حفظ تقدم الاستماع والإشارات المرجعية محليًا على حاسوبك بأمان.'
        }
      }
    },
    'help-theme-reproducao': {
      title: 'التشغيل والمشغل المصغر',
      subtitle: 'عناصر التحكم، السرعة، مؤقت النوم وأوضاع الشاشة',
      subthemes: {
        'sub-player-controls': {
          title: 'عناصر التحكم بالمشغل',
          subtitle: 'تشغيل، إيقاف مؤقت، تقديم، ترجيع وشريط الوقت',
          overview: 'تحكم في الاستماع بسهولة عبر الشريط السفلي أو بالتبديل إلى وضع ملء الشاشة.'
        },
        'sub-playback-speed': {
          title: 'سرعة التشغيل',
          subtitle: 'من 0.5x إلى 3.0x مع الحفاظ على نبرة الصوت',
          overview: 'غيّر سرعة الاستماع بحرية دون تشويه طبقة صوت الراوي.'
        },
        'sub-sleep-timer': {
          title: 'مؤقت النوم',
          subtitle: 'إيقاف التشغيل بعد مدة محددة أو عند نهاية الفصل',
          overview: 'اضبط مؤقت النوم لإيقاف الصوت تلقائيًا عند النوم.'
        },
        'sub-play-queue': {
          title: 'قائمة التشغيل المجدولة',
          subtitle: 'إضافة كتب للاستماع إليها تاليًا',
          overview: 'رتّب الكتب التالية في قائمة الانتظار لتشغيلها تلقائيًا.'
        },
        'sub-player-modes': {
          title: 'المشغل المصغر ووضع ملء الشاشة',
          subtitle: 'التبديل بين المشغل المدمج والعرض الغامر جنبًا إلى جنب',
          overview: 'بدّل بين المشغل المصغر العائم في الأسفل ووضع ملء الشاشة مع غلاف عالي الدقة ولوحة نص متزامن جنبًا إلى جنب.',
          steps: [
            { title: 'استخدام المشغل المصغر', desc: 'عند تشغيل أي صوت، يعرض الشريط السفلي مصغرة الغلاف والعنوان وأزرار التحكم السريعة والفصول وقائمة الانتظار والتقدم.' },
            { title: 'التوسيع إلى ملء الشاشة', desc: 'انقر على أيقونة التوسيع في الجانب الأيمن من المشغل المصغر لفتح عرض ملء الشاشة.' },
            { title: 'القراءة جنبًا إلى جنب في ملء الشاشة', desc: 'عند تفعيل زر النص في وضع ملء الشاشة، يحتفظ الغلاف والعناوين وشريط التقدم والأزرار بحجمها الأصلي تمامًا وتنزلق بسلاسة إلى الجانب لإفساح المجال للنص المتزامن.' }
          ],
          highlights: [
            { title: 'الحفاظ على الأبعاد الأصلية', desc: 'في وضع ملء الشاشة، يؤدي تفعيل النص المتزامن إلى إزاحة المشغل للجانب دون تصغير الغلاف أو الأزرار.' },
            { title: 'وصول سريع للنوافذ المنبثقة', desc: 'افتح الفصول والتعليقات والسرعة ومؤقت النوم وقائمة الانتظار والنص المتزامن من المشغل المصغر أو ملء الشاشة.' }
          ]
        }
      }
    },
    'help-theme-capitulos': {
      title: 'الفصول والملاحظات',
      subtitle: 'التنقل بين المسارات، الإشارات المرجعية والتسجيلات',
      subthemes: {
        'sub-chapters-nav': {
          title: 'التنقل بين الفصول',
          subtitle: 'الانتقال بين الأقسام وعرض الوقت المتبقي',
          overview: 'تنقّل بين علامات الفصول مع تفاصيل الوقت المتبقي لكل فصل.'
        },
        'sub-bookmarks': {
          title: 'الإشارات المرجعية',
          subtitle: 'حفظ اللحظات المميزة بنقرة واحدة',
          overview: 'احفظ المقاطع المميزة للعودة إليها والاستماع لها في أي وقت.'
        },
        'sub-notes-comments': {
          title: 'الملاحظات والعلامات المرجعية',
          subtitle: 'تدوين الأفكار المرتبطة بالثانية المحددة في الصوت',
          overview: 'أضف علاماتك المرجعية وملاحظاتك الشخصية المرتبطة بالوقت المحدد من الصوت.'
        },
        'sub-sync-transcript': {
          title: 'ديناميكية النص المتزامن',
          subtitle: 'الاكتشاف التلقائي، الرفع اليدوي للملفات والقراءة التفاعلية',
          overview: 'يكتشف التطبيق تلقائيًا النصوص المتزامنة المدمجة في البيانات الوصفية للملف الصوتي عند الاستيراد. وإذا لم يتوفر نص مدمج، يمكنك رفع ملف نص متزامن يدويًا عبر زر النص في المشغل أو من شاشة تعديل البيانات الوصفية للكتاب.',
          steps: [
            { title: 'الاكتشاف التلقائي أو الرفع عبر المشغل', desc: 'انقر على أيقونة النص في المشغل. إذا كان الكتاب يحتوي على نص في بياناته الوصفية فسيفتح فورًا؛ وإلا ستظهر نافذة لرفع ملف (.epub, .json, .xml, .smil, .ts, .vtt, .srt أو .lrc).' },
            { title: 'إدارة النص في البيانات الوصفية للكتاب', desc: 'عند تعديل كتاب صوتي، يوضح قسم "نص الكتاب الصوتي" ما إذا تم العثور على نص في البيانات الوصفية ويتيح لك رفع النص أو تغييره أو إزالته.' },
            { title: 'قراءة تفاعلية وملء الشاشة جنبًا إلى جنب', desc: 'يتم تمييز الجملة الحالية تلقائيًا مع تقدم السرد، ويمكنك النقر على أي جملة للانتقال بالصوت إلى تلك اللحظة. وفي ملء الشاشة ينزلق المشغل للجانب محتفظًا بحجمه الأصلي.' },
            { title: 'العرض التلقائي عند التشغيل', desc: 'في "الإعدادات > التشغيل"، فعّل "إظهار النص تلقائيًا" لفتح النص المتزامن تلقائيًا عند بدء تشغيل كتاب متوافق.' }
          ],
          highlights: [
            { title: 'دعم واسع للتنسيقات', desc: 'متوافق مع EPUB 3 Media Overlays (.epub, .smil, .xml) والترجمات المتزامنة (.srt, .vtt, .lrc) وخرائط التوقيت (.json, .ts).' },
            { title: 'الانتقال حسب الجملة', desc: 'انقر على أي سطر في النص للقفز فورًا إلى الثانية الدقيقة لتلك الجملة.' },
            { title: 'مثالي للدراسة وتعلم اللغات', desc: 'القراءة والاستماع في آنٍ واحد يعززان الفهم ويسرّعان تعلم المفردات والنطق.' }
          ],
          tipTitle: 'نصيحة: أنشئ نصوصك المتزامنة الخاصة',
          tipText: 'افتح قائمة "تطبيقات أخرى" في الشريط الجانبي للتعرف على مولد النصوص لمشغلات الكتب الصوتية!'
        }
      }
    },
    'help-theme-pesquisa': {
      title: 'البحث والفلاتر',
      subtitle: 'البحث عن الكتب والمؤلفين والأنواع وسجل البحث',
      subthemes: {
        'sub-how-to-search': {
          title: 'كيفية البحث',
          subtitle: 'البحث في العناوين والمؤلفين والرواة والفصول',
          overview: 'اكتب في شريط البحث العلوي للعثور فورًا على أي كتاب أو مؤلف.'
        },
        'sub-search-history': {
          title: 'سجل البحث',
          subtitle: 'الوصول السريع لعمليات البحث السابقة ومسحها',
          overview: 'كرر عمليات البحث السابقة بنقرة واحدة أو امسح السجل متى شئت.'
        },
        'sub-sort-filters': {
          title: 'الترتيب والفلاتر الذكية',
          subtitle: 'الترتيب أبجديًا أو حسب السنة أو المدة',
          overview: 'رتّب الكتب أبجديًا (أ-ي أو ي-أ) أو حسب سنة الإصدار أو المدة الكلية.'
        }
      }
    },
    'help-theme-ajustes': {
      title: 'الإعدادات والتخصيص',
      subtitle: 'المظاهر، اللغة، الإشعارات والتخزين',
      subthemes: {
        'sub-themes-colors': {
          title: 'المظهر والسمات',
          subtitle: 'الوضع الداكن، الفاتح، أسود OLED وألوان التمييز',
          overview: 'خصّص مظهر التطبيق بالاختيار بين الوضع الداكن أو الفاتح مع ألوانك المفضلة.'
        },
        'sub-playback-settings': {
          title: 'تفضيلات التشغيل',
          subtitle: 'السرعة الافتراضية ومسافة التخطي واستئناف التشغيل',
          overview: 'اضبط قفزات التقديم والترجيع واستئناف الاستماع من الموضع السابق.'
        },
        'sub-notifications': {
          title: 'الإشعارات',
          subtitle: 'تنبيهات عند إتمام الفصول أو الكتب',
          overview: 'فعّل إشعارات سطح المكتب لتنبيهك عند اكتمال الاستماع.'
        },
        'sub-system-cache': {
          title: 'التخزين والذاكرة المؤقتة',
          subtitle: 'إدارة مجلد البيانات وحذف الملفات المؤقتة بأمان',
          overview: 'راقب مساحة التخزين وتحكم في مجلد بيانات التطبيق.'
        }
      }
    },
    'help-theme-atalhos': {
      title: 'اختصارات لوحة المفاتيح',
      subtitle: 'أوامر سريعة للتحكم بالمشغل دون استخدام الفأرة',
      subthemes: {
        'sub-all-shortcuts': {
          title: 'جميع اختصارات المفاتيح',
          subtitle: 'المسافة، الأسهم، السرعة والتحكم بالصوت',
          overview: 'زر المسافة للإيقاف/التشغيل، والأسهم يمين/يسار للتخطي، وأعلى/أسفل لمستوى الصوت.'
        }
      }
    },
    'help-theme-duvidas': {
      title: 'الأسئلة الشائعة',
      subtitle: 'أسئلة متكررة، حل المشكلات وتنسيقات الصوت',
      subthemes: {
        'sub-troubleshooting': {
          title: 'حل المشكلات',
          subtitle: 'ماذا تفعل إذا لم يعمل أحد الملفات',
          overview: 'تأكد من أن الملف الصوتي ليس قيد الاستخدام من تطبيق آخر ومدعوم من المشغل.'
        },
        'sub-audio-formats': {
          title: 'تنسيقات الصوت المدعومة',
          subtitle: 'معلومات عن M4B و MP3 و M4A و FLAC و OGG',
          overview: 'يدعم المشغل ملفات M4B المزودة بالفصول، بالإضافة إلى MP3 و AAC و FLAC و OGG.'
        },
        'sub-battery-performance': {
          title: 'نصائح البطارية والأداء',
          subtitle: 'تحسين تشغيل المشغل في الخلفية للحواسيب المحمولة',
          overview: 'تم تصميم المشغل باستهلاك منخفض جدًا للمعالج والبطارية أثناء العمل في الخلفية.'
        }
      }
    },
    'help-theme-outros-apps': {
      title: 'تطبيقات أخرى والنظام البيئي',
      subtitle: 'أدوات مكملة لتحويل الكتب الإلكترونية إلى كتب صوتية وتوليد النصوص المتزامنة',
      subthemes: {
        'sub-ebook-converter': {
          title: 'محول الكتب الإلكترونية إلى كتب صوتية',
          subtitle: 'حوّل الكتب الرقمية (EPUB, PDF, MOBI, TXT) إلى كتب صوتية مروية بالذكاء الاصطناعي',
          overview: 'في قسم "تطبيقات أخرى" بالقائمة الجانبية (فوق المساعدة)، ستجد محول الكتب الإلكترونية إلى كتب صوتية من تطوير thenauan: تطبيق سطح مكتب أصلي يحول الكتب الإلكترونية (EPUB, PDF, MOBI, TXT) إلى كتب صوتية بأصوات عصبية طبيعية.',
          steps: [
            { title: 'افتح تطبيقات أخرى من القائمة الجانبية', desc: 'انقر على زر "تطبيقات أخرى" الموجود في الشريط الجانبي الأيسر فوق زر المساعدة مباشرةً.' },
            { title: 'اعثر على محول الكتب الإلكترونية إلى كتب صوتية', desc: 'شاهد البطاقة المربعة للتطبيق مع شارة GitHub الخاصة بـ thenauan.' },
            { title: 'انقر على "الذهاب إلى التطبيق"', desc: 'عند النقر على "الذهاب إلى التطبيق"، ستفتح الصفحة الرسمية للمشروع على GitHub (github.com/thenauan/audiobook-generator) في متصفحك الخارجي الافتراضي.' }
          ],
          highlights: [
            { title: 'أصوات عصبية ودعم متعدد اللغات', desc: 'أنشئ سردًا صوتيًا طبيعيًا بعدة لغات مع ترجمة تلقائية وتقسيم ذكي للفصول.' },
            { title: 'تكامل تام مع المشغل', desc: 'يمكن استيراد الكتب الصوتية الناتجة مباشرة إلى مكتبتك مع فصولها وبياناتها الوصفية جاهزة للاستماع.' }
          ]
        },
        'sub-text-generator': {
          title: 'مولد النصوص لمشغلات الكتب الصوتية',
          subtitle: 'أداة لإنشاء ملفات النصوص والترجمات المتزامنة',
          overview: 'يتوفر أيضًا في قسم "تطبيقات أخرى" مولد النصوص لمشغلات الكتب الصوتية من thenauan، المصمم لإنشاء ملفات نصية متزامنة مع التوقيت الدقيق للصوت.',
          steps: [
            { title: 'افتح شاشة تطبيقات أخرى', desc: 'في القائمة الجانبية، انقر على "تطبيقات أخرى" لعرض أدوات النظام البيئي.' },
            { title: 'افتح المشروع على GitHub', desc: 'انقر على "الذهاب إلى التطبيق" في بطاقة مولد النصوص لفتح المستودع في متصفحك الافتراضي.' },
            { title: 'استورد النص الناتج إلى المشغل', desc: 'بعد إنشاء ملف النص المتزامن، ارفعه إلى المشغل عبر زر النص في المشغل أو من محرر البيانات الوصفية للكتاب.' }
          ],
          highlights: [
            { title: 'مزامنة دقيقة للوقت', desc: 'ينتج ملفات متوافقة مع التتبع جملةً بجملة في وضع ملء الشاشة والمشغل المصغر.' },
            { title: 'نظام بيئي متكامل', desc: 'اجمع بين محول الكتب الإلكترونية ومولد النصوص ومشغل الكتب الصوتية لتجربة متكاملة.' }
          ]
        }
      }
    }
  }
};

export function getHelpThemes(lang: SupportedLanguage = 'pt'): HelpTheme[] {
  if (lang === 'pt' || !HELP_I18N[lang as 'en' | 'es' | 'ru' | 'ar']) {
    return HELP_THEMES;
  }

  const langPack = HELP_I18N[lang as 'en' | 'es' | 'ru' | 'ar'];

  return HELP_THEMES.map(theme => {
    const themeOverride = langPack[theme.id];
    if (!themeOverride) return theme;

    const translatedSubthemes = theme.subthemes.map(sub => {
      const subOverride = themeOverride.subthemes[sub.id];
      if (!subOverride) return sub;

      const art = sub.article;
      return {
        ...sub,
        title: subOverride.title || sub.title,
        subtitle: subOverride.subtitle || sub.subtitle,
        article: {
          ...art,
          title: subOverride.title || art.title,
          subtitle: subOverride.subtitle || art.subtitle,
          overview: subOverride.overview || art.overview,
          steps: subOverride.steps
            ? art.steps?.map((step, idx) => ({
                ...step,
                title: subOverride.steps![idx]?.title || step.title,
                desc: subOverride.steps![idx]?.desc || step.desc,
              }))
            : art.steps,
          highlights: subOverride.highlights
            ? art.highlights?.map((hl, idx) => ({
                ...hl,
                title: subOverride.highlights![idx]?.title || hl.title,
                desc: subOverride.highlights![idx]?.desc || hl.desc,
              }))
            : art.highlights,
          faq: subOverride.faq
            ? art.faq?.map((f, idx) => ({
                ...f,
                q: subOverride.faq![idx]?.q || f.q,
                a: subOverride.faq![idx]?.a || f.a,
              }))
            : art.faq,
          shortcuts: subOverride.shortcuts
            ? art.shortcuts?.map((sc, idx) => ({
                ...sc,
                action: subOverride.shortcuts![idx]?.action || sc.action,
              }))
            : art.shortcuts,
          tip: subOverride.tipTitle
            ? {
                title: subOverride.tipTitle,
                text: subOverride.tipText || art.tip?.text || '',
              }
            : art.tip,
        }
      };
    });

    return {
      ...theme,
      title: themeOverride.title || theme.title,
      subtitle: themeOverride.subtitle || theme.subtitle,
      subthemes: translatedSubthemes,
    };
  });
}
