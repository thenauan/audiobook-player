// Tokens de movimento do app (Guia de movimento e layout). Seis molas cobrem tudo que se move ou muda de tamanho;
// fades com duração fixa só para opacidade e cor. As mesmas molas existem em CSS (--spring-*) no index.css.
const spring = (stiffness: number, damping: number) => ({ type: 'spring' as const, stiffness, damping, mass: 1 });

export const SPRING = {
  press: spring(816, 57), // toque em botão
  snappy: spring(322, 30.5), // menus, pop-ups pequenos, avançar e voltar
  sheet: spring(224, 26.3), // folhas
  smooth: spring(158, 25.1), // mudanças grandes sem quique
  // Tela que abre de um ícone, miniplayer e player. Mais rápida que a do guia: com ela, abrir o player levava até 0,9 s
  zoom: spring(1360, 104),
  bouncy: spring(195, 19.5), // ícones que trocam, confirmações
  // Barra de abas e miniplayer trocando de lugar (como no Apple Music): rápida, passa ~4% do ponto e assenta.
  // A mesma curva está em CSS (--spring-morph) para o miniplayer chegar junto com a barra
  morph: spring(260, 23.2),
};

const FADE_EASE = [0.2, 0, 0, 1] as [number, number, number, number];
// Abrir e fechar o player: duração curta e fixa. Mola sempre tem uma cauda longa e o player ficava montado até ela acabar
export const PLAYER_MOTION = { type: 'tween' as const, duration: 0.16, ease: FADE_EASE };

export const FADE_IN = { duration: 0.2, ease: FADE_EASE };
export const FADE_OUT = { duration: 0.15, ease: FADE_EASE };

// Curvas das molas para animações fora do motion (toque nos botões)
export const CSS_SPRING = {
  press: { ms: 360, curve: 'linear(0, 0.121, 0.326, 0.523, 0.675, 0.786, 0.861, 0.912, 0.944, 0.966, 0.979, 0.987, 0.992, 0.995, 0.997, 0.998, 0.999, 0.999, 1)' },
  bouncy: { ms: 770, curve: 'linear(0, 0.137, 0.397, 0.653, 0.846, 0.964, 1.024, 1.044, 1.042, 1.032, 1.02, 1.01, 1.003, 1, 0.998, 0.998, 0.998, 0.999, 1)' },
};
