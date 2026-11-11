// Cor das barras do sistema (status no topo e navegação na base) no Android, via <meta name="theme-color">.
// A base é o fundo do app (preto no escuro, claro no claro); uma tela pode pedir outra cor enquanto está aberta
// (a página do audiobook pede a cor da capa). No iPhone o app instalado ignora essa cor e a barra fica transparente.
const IS_ANDROID = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

let base = '#000000';
// Pedidos das telas abertas: vale o último (na troca de páginas, a nova chega antes de a antiga sair)
const overrides: { id: number; color: string }[] = [];
let nextId = 1;

function apply() {
  const color = (IS_ANDROID && overrides.length ? overrides[overrides.length - 1].color : base);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', color));
  // Com o app desenhando atrás da barra de navegação, o fundo do documento também conta
  if (IS_ANDROID) document.documentElement.style.backgroundColor = color;
}

export function setSystemBarBase(color: string) {
  base = color;
  apply();
}

// Devolve uma função que retira o pedido (e as barras voltam à cor anterior)
export function requestSystemBarColor(color: string): () => void {
  const id = nextId++;
  overrides.push({ id, color });
  apply();
  return () => {
    const i = overrides.findIndex(o => o.id === id);
    if (i >= 0) overrides.splice(i, 1);
    apply();
  };
}
