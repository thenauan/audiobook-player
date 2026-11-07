// Ajustes da página feitos uma vez ao abrir o app, antes de desenhar a interface
// App instalado (tela de início): ao voltar para o app, confere se há uma versão nova publicada e, se nada
// estiver tocando, recarrega para usá-la (o app aberto em segundo plano não recarrega sozinho)
if (typeof document !== 'undefined' && window.location.protocol.startsWith('http')) {
  const currentScript = () => document.querySelector<HTMLScriptElement>('script[type="module"][src*="assets/"]')?.getAttribute('src') || '';
  let checking = false;
  const checkForUpdate = async () => {
    if (checking || document.visibilityState !== 'visible') return;
    checking = true;
    try {
      const res = await fetch(`./index.html?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const html = await res.text();
      const latest = (html.match(/<script[^>]+type="module"[^>]+src="([^"]*assets\/[^"]+)"/) || [])[1];
      const mine = currentScript();
      if (!latest || !mine || latest === mine) return;
      const audio = document.querySelector('audio');
      if (audio && !audio.paused) return; // não interrompe o que está tocando
      window.location.reload();
    } catch { /* sem conexão: fica na versão atual */ } finally {
      checking = false;
    }
  };
  document.addEventListener('visibilitychange', checkForUpdate);
}

// Barras de rolagem aparecem só enquanto algo é rolado e somem logo depois
if (typeof document !== 'undefined') {
  const scrollTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>();
  document.addEventListener('scroll', (e) => {
    const target = e.target instanceof Element ? e.target : document.scrollingElement;
    if (!target) return;
    target.classList.add('is-scrolling');
    const prev = scrollTimers.get(target);
    if (prev) clearTimeout(prev);
    scrollTimers.set(target, setTimeout(() => target.classList.remove('is-scrolling'), 800));
  }, { capture: true, passive: true });
}

// Teclado virtual aberto: esconde barra de abas e miniplayer assim que um campo de texto ganha foco. Não depende
// da altura da janela: no iOS ela às vezes encolhe junto com o teclado, e a barra subia para cima dele.
if (typeof document !== 'undefined') {
  const isTextField = (el: EventTarget | null) =>
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement && !['checkbox', 'radio', 'range', 'file', 'button', 'submit'].includes(el.type));
  const isTouch = () => !!window.matchMedia?.('(pointer: coarse)').matches;
  const updateKeyboard = () => {
    document.documentElement.classList.toggle('keyboard-open', isTouch() && isTextField(document.activeElement));
  };
  document.addEventListener('focusin', updateKeyboard);
  document.addEventListener('focusout', () => setTimeout(updateKeyboard, 50));
  // O iOS desloca a página para mostrar o campo: a interface é fixa, então ela volta ao lugar
  window.visualViewport?.addEventListener('scroll', () => {
    if (document.documentElement.classList.contains('keyboard-open') && window.scrollY !== 0) window.scrollTo(0, 0);
  });
}

// Ao girar o aparelho, a interface some e reaparece rapidamente enquanto os itens se reorganizam
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(orientation: portrait)');
  let rotateTimer: ReturnType<typeof setTimeout> | null = null;
  const onRotate = () => {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    const root = document.documentElement;
    root.classList.remove('is-rotating');
    void root.offsetWidth;
    root.classList.add('is-rotating');
    if (rotateTimer) clearTimeout(rotateTimer);
    rotateTimer = setTimeout(() => root.classList.remove('is-rotating'), 420);
  };
  mq.addEventListener?.('change', onRotate);
}

// Celular deitado com proporção de aparelho com notch/Dynamic Island (≈ 19,5:9): marca o lado do recorte
// (landscape-primary: topo do aparelho à esquerda; landscape-secondary: à direita)
if (typeof window !== 'undefined') {
  const updateNotchSide = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPhoneLandscape = w > h && h <= 600 && w / h >= 1.9 && !!window.matchMedia?.('(pointer: coarse)').matches;
    const type = (screen.orientation && screen.orientation.type) || '';
    const side = !isPhoneLandscape ? '' : type === 'landscape-secondary' ? 'right' : 'left';
    if (side) document.documentElement.setAttribute('data-notch', side);
    else document.documentElement.removeAttribute('data-notch');
  };
  updateNotchSide();
  window.addEventListener('resize', updateNotchSide);
  screen.orientation?.addEventListener?.('change', updateNotchSide);
}

// iPhone/iPad no Safari (não instalado): a barra de status fica sobre a página com um desfoque do sistema,
// mas a área segura do topo vem zerada. Reserva essa faixa para o cabeçalho não ficar por baixo dela.
if (typeof window !== 'undefined') {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isStandalone = (navigator as any).standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
  if (isIOS && !isStandalone) {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;visibility:hidden;padding-top:env(safe-area-inset-top);';
    document.documentElement.appendChild(probe);
    const top = parseFloat(getComputedStyle(probe).paddingTop) || 0;
    probe.remove();
    if (top < 20) document.documentElement.classList.add('ios-safari');
  }
}

// App instalado (aberto pela tela de início)
if (typeof window !== 'undefined') {
  const standalone = (navigator as any).standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
  if (standalone) document.documentElement.classList.add('standalone');
}

// iOS Safari só aplica o estado :active (destaque ao tocar) se houver um ouvinte de toque
if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', () => {}, { passive: true });
}
