var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// ===== Títulos, descrições e dados para buscadores (Google, Bing etc.) =====
// O site tem uma página de entrada por idioma: português na raiz e /en/, /es/, /ru/, /ar/. Cada uma tem
// título, descrição e palavras-chave no próprio idioma; as versões se apontam entre si (hreflang) e o
// sitemap lista todas. As páginas de idioma abrem o mesmo app, já no idioma da página (se o usuário
// ainda não escolheu outro).
import fs from 'node:fs';
import path from 'node:path';
export var SITE_URL = 'https://thenauan.github.io/audiobook-player/';
var REPO_URL = 'https://github.com/thenauan/audiobook-player';
export var SEO = {
    pt: {
        htmlLang: 'pt-BR',
        ogLocale: 'pt_BR',
        path: '',
        title: 'Audiobook Player – Ouvir audiolivros grátis online, com texto e capítulos',
        description: 'Reprodutor de audiobooks e audiolivros gratuito: ouça MP3, M4A e M4B com capítulos, texto sincronizado, marcações, fila, timer e velocidade. Funciona no navegador, celular (iPhone e Android), Windows, macOS e Linux. Disponível em português, inglês, espanhol, russo e árabe.',
        keywords: 'audiobook player, player de audiobook, reprodutor de audiobook, ouvir audiobook, audiolivro, audiolivros grátis, ouvir audiolivros online, livro falado, app de audiobook, leitor de audiobook, m4b player, mp3 audiobook, audiobook com texto, letra sincronizada, capítulos, marcadores, timer de sono, velocidade de reprodução, audiobook iphone, audiobook android, audiobook windows, audiobook mac, audiobook linux, pwa',
        noscript: 'Audiobook Player é um reprodutor de audiobooks gratuito para ouvir audiolivros em MP3, M4A e M4B, com capítulos, texto sincronizado, marcações, fila, timer de sono e controle de velocidade. Use no navegador, instale no celular (iPhone e Android) ou baixe para Windows, macOS e Linux. Idiomas: português, inglês, espanhol, russo e árabe. Ative o JavaScript para usar o app.',
    },
    en: {
        htmlLang: 'en',
        ogLocale: 'en_US',
        path: 'en/',
        title: 'Audiobook Player – Free online audiobook player with synced text & chapters',
        description: 'Free audiobook player: listen to MP3, M4A and M4B audiobooks with chapters, synced text, bookmarks, queue, sleep timer and playback speed. Works in the browser, on phones (iPhone and Android), Windows, macOS and Linux. Available in English, Portuguese, Spanish, Russian and Arabic.',
        keywords: 'audiobook player, free audiobook player, online audiobook player, listen to audiobooks, audiobook app, m4b player, mp3 audiobook player, audiobooks with text, synced lyrics, chapters, bookmarks, sleep timer, playback speed, audiobook player for iphone, audiobook player for android, audiobook player windows, audiobook player mac, audiobook player linux, spoken word, pwa',
        noscript: 'Audiobook Player is a free audiobook player for MP3, M4A and M4B audiobooks with chapters, synced text, bookmarks, a queue, sleep timer and speed control. Use it in the browser, install it on your phone (iPhone and Android) or download it for Windows, macOS and Linux. Languages: English, Portuguese, Spanish, Russian and Arabic. Enable JavaScript to use the app.',
    },
    es: {
        htmlLang: 'es',
        ogLocale: 'es_ES',
        path: 'es/',
        title: 'Audiobook Player – Reproductor de audiolibros gratis online con texto y capítulos',
        description: 'Reproductor de audiolibros gratuito: escucha audiolibros MP3, M4A y M4B con capítulos, texto sincronizado, marcadores, cola, temporizador y velocidad. Funciona en el navegador, en el móvil (iPhone y Android), Windows, macOS y Linux. Disponible en español, inglés, portugués, ruso y árabe.',
        keywords: 'reproductor de audiolibros, audiolibros gratis, escuchar audiolibros online, audiobook player, app de audiolibros, reproductor m4b, audiolibro mp3, audiolibros con texto, letra sincronizada, capítulos, marcadores, temporizador de sueño, velocidad de reproducción, audiolibros iphone, audiolibros android, audiolibros windows, audiolibros mac, audiolibros linux, pwa',
        noscript: 'Audiobook Player es un reproductor de audiolibros gratuito para MP3, M4A y M4B con capítulos, texto sincronizado, marcadores, cola, temporizador y control de velocidad. Úsalo en el navegador, instálalo en el móvil (iPhone y Android) o descárgalo para Windows, macOS y Linux. Idiomas: español, inglés, portugués, ruso y árabe. Activa JavaScript para usar la app.',
    },
    ru: {
        htmlLang: 'ru',
        ogLocale: 'ru_RU',
        path: 'ru/',
        title: 'Audiobook Player – бесплатный онлайн-плеер аудиокниг с текстом и главами',
        description: 'Бесплатный плеер аудиокниг: слушайте аудиокниги MP3, M4A и M4B с главами, синхронным текстом, закладками, очередью, таймером сна и выбором скорости. Работает в браузере, на телефоне (iPhone и Android), в Windows, macOS и Linux. Доступен на русском, английском, португальском, испанском и арабском.',
        keywords: 'плеер аудиокниг, аудиокниги бесплатно, слушать аудиокниги онлайн, audiobook player, приложение для аудиокниг, m4b плеер, аудиокниги mp3, аудиокниги с текстом, синхронный текст, главы, закладки, таймер сна, скорость воспроизведения, аудиокниги iphone, аудиокниги android, аудиокниги windows, аудиокниги mac, аудиокниги linux, pwa',
        noscript: 'Audiobook Player — бесплатный плеер аудиокниг в форматах MP3, M4A и M4B с главами, синхронным текстом, закладками, очередью, таймером сна и регулировкой скорости. Используйте его в браузере, установите на телефон (iPhone и Android) или скачайте для Windows, macOS и Linux. Языки: русский, английский, португальский, испанский и арабский. Включите JavaScript, чтобы пользоваться приложением.',
    },
    ar: {
        htmlLang: 'ar',
        ogLocale: 'ar_AR',
        dir: 'rtl',
        path: 'ar/',
        title: 'Audiobook Player – مشغل كتب صوتية مجاني على الإنترنت مع النص والفصول',
        description: 'مشغل كتب صوتية مجاني: استمع إلى الكتب الصوتية بصيغ MP3 وM4A وM4B مع الفصول والنص المتزامن والإشارات المرجعية وقائمة التشغيل ومؤقت النوم وسرعة التشغيل. يعمل في المتصفح وعلى الهاتف (iPhone وAndroid) وWindows وmacOS وLinux. متوفر بالعربية والإنجليزية والبرتغالية والإسبانية والروسية.',
        keywords: 'مشغل كتب صوتية, كتب صوتية مجانية, الاستماع إلى الكتب الصوتية, كتب مسموعة, audiobook player, تطبيق كتب صوتية, مشغل m4b, كتب صوتية mp3, كتب صوتية مع النص, نص متزامن, فصول, إشارات مرجعية, مؤقت النوم, سرعة التشغيل, كتب صوتية iphone, كتب صوتية android, كتب صوتية windows, كتب صوتية mac, كتب صوتية linux, pwa',
        noscript: 'Audiobook Player مشغل مجاني للكتب الصوتية بصيغ MP3 وM4A وM4B مع الفصول والنص المتزامن والإشارات المرجعية وقائمة التشغيل ومؤقت النوم والتحكم في السرعة. استخدمه في المتصفح أو ثبّته على هاتفك (iPhone وAndroid) أو نزّله لأنظمة Windows وmacOS وLinux. اللغات: العربية والإنجليزية والبرتغالية والإسبانية والروسية. فعّل JavaScript لاستخدام التطبيق.',
    },
};
var LANGS = Object.keys(SEO);
var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
function headTags(lang) {
    var t = SEO[lang];
    var url = SITE_URL + t.path;
    var alternates = LANGS.map(function (l) { return "    <link rel=\"alternate\" hreflang=\"".concat(SEO[l].htmlLang, "\" href=\"").concat(SITE_URL + SEO[l].path, "\" />"); });
    var jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Audiobook Player',
        alternateName: ['AudiobookPlayer', 'Audiobook Player PWA'],
        url: url,
        description: t.description,
        inLanguage: LANGS.map(function (l) { return SEO[l].htmlLang; }),
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, iOS, Android, Windows, macOS, Linux',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        downloadUrl: "".concat(REPO_URL, "/releases/latest"),
        image: "".concat(SITE_URL, "icons/icon-512.png"),
        author: { '@type': 'Person', name: 'Nauan', url: 'https://github.com/thenauan' },
        keywords: t.keywords,
    };
    return __spreadArray(__spreadArray(__spreadArray(__spreadArray([
        "<title>".concat(esc(t.title), "</title>"),
        "    <meta name=\"description\" content=\"".concat(esc(t.description), "\" />"),
        "    <meta name=\"keywords\" content=\"".concat(esc(t.keywords), "\" />"),
        "    <meta name=\"author\" content=\"Nauan\" />",
        "    <meta name=\"robots\" content=\"index, follow, max-image-preview:large\" />",
        "    <link rel=\"canonical\" href=\"".concat(url, "\" />")
    ], alternates, true), [
        "    <link rel=\"alternate\" hreflang=\"x-default\" href=\"".concat(SITE_URL, "\" />"),
        "    <meta property=\"og:type\" content=\"website\" />",
        "    <meta property=\"og:site_name\" content=\"Audiobook Player\" />",
        "    <meta property=\"og:title\" content=\"".concat(esc(t.title), "\" />"),
        "    <meta property=\"og:description\" content=\"".concat(esc(t.description), "\" />"),
        "    <meta property=\"og:url\" content=\"".concat(url, "\" />"),
        "    <meta property=\"og:image\" content=\"".concat(SITE_URL, "icons/icon-512.png\" />"),
        "    <meta property=\"og:locale\" content=\"".concat(t.ogLocale, "\" />")
    ], false), LANGS.filter(function (l) { return l !== lang; }).map(function (l) { return "    <meta property=\"og:locale:alternate\" content=\"".concat(SEO[l].ogLocale, "\" />"); }), true), [
        "    <meta name=\"twitter:card\" content=\"summary\" />",
        "    <meta name=\"twitter:title\" content=\"".concat(esc(t.title), "\" />"),
        "    <meta name=\"twitter:description\" content=\"".concat(esc(t.description), "\" />"),
        "    <meta name=\"twitter:image\" content=\"".concat(SITE_URL, "icons/icon-512.png\" />"),
        "    <script type=\"application/ld+json\">".concat(JSON.stringify(jsonLd), "</script>"),
    ], false).join('\n');
}
var START = '<!--seo:start-->';
var END = '<!--seo:end-->';
var NS_START = '<!--seo-noscript:start-->';
var NS_END = '<!--seo-noscript:end-->';
function replaceBetween(html, start, end, content) {
    var i = html.indexOf(start);
    var j = html.indexOf(end);
    if (i < 0 || j < 0)
        return html;
    return html.slice(0, i + start.length) + content + html.slice(j);
}
function localize(html, lang) {
    var t = SEO[lang];
    var out = replaceBetween(html, START, END, '\n    ' + headTags(lang) + '\n    ');
    out = replaceBetween(out, NS_START, NS_END, "<noscript><p>".concat(esc(t.noscript), "</p></noscript>"));
    out = out.replace(/<html lang="[^"]*"( dir="[^"]*")?>/, "<html lang=\"".concat(t.htmlLang, "\"").concat(t.dir ? " dir=\"".concat(t.dir, "\"") : '', ">"));
    return out;
}
export function seoPlugin() {
    var outDir = 'dist';
    return {
        name: 'seo-pages',
        configResolved: function (config) {
            outDir = path.resolve(config.root, config.build.outDir);
        },
        // Página principal (português)
        transformIndexHtml: function (html) {
            return localize(html, 'pt');
        },
        // Depois do build: páginas de cada idioma, sitemap e robots.txt
        closeBundle: function () {
            var indexPath = path.join(outDir, 'index.html');
            if (!fs.existsSync(indexPath))
                return;
            var base = fs.readFileSync(indexPath, 'utf8');
            for (var _i = 0, LANGS_1 = LANGS; _i < LANGS_1.length; _i++) {
                var lang = LANGS_1[_i];
                if (!SEO[lang].path)
                    continue;
                var html = localize(base, lang);
                // Os arquivos do app ficam na raiz: os endereços relativos partem de lá
                html = html.replace('<head>', '<head>\n    <base href="../" />');
                // Abre no idioma da página, se o usuário ainda não escolheu outro
                html = html.replace('</head>', "  <script>try{if(!localStorage.getItem('app_language'))localStorage.setItem('app_language','".concat(lang, "')}catch(e){}</script>\n  </head>"));
                var dir = path.join(outDir, SEO[lang].path);
                fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(path.join(dir, 'index.html'), html);
            }
            var today = new Date().toISOString().slice(0, 10);
            var sitemap = __spreadArray(__spreadArray([
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
            ], LANGS.map(function (lang) { return __spreadArray(__spreadArray([
                '  <url>',
                "    <loc>".concat(SITE_URL + SEO[lang].path, "</loc>"),
                "    <lastmod>".concat(today, "</lastmod>")
            ], LANGS.map(function (l) { return "    <xhtml:link rel=\"alternate\" hreflang=\"".concat(SEO[l].htmlLang, "\" href=\"").concat(SITE_URL + SEO[l].path, "\" />"); }), true), [
                "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"".concat(SITE_URL, "\" />"),
                '  </url>',
            ], false).join('\n'); }), true), [
                '</urlset>',
                '',
            ], false).join('\n');
            fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap);
            fs.writeFileSync(path.join(outDir, 'robots.txt'), "User-agent: *\nAllow: /\n\nSitemap: ".concat(SITE_URL, "sitemap.xml\n"));
        },
    };
}
