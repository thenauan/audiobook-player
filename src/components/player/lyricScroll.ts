let lyricCenterRun = 0;

export function centerLyricLine(container: HTMLElement, el: HTMLElement, instant = false) {
  const run = ++lyricCenterRun;
  const target = () => {
    const box = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return Math.max(0, container.scrollTop + (r.top - box.top) - container.clientHeight / 2 + r.height / 2);
  };
  const top = target();
  if (!instant && Math.abs(top - container.scrollTop) < 1500) {
    glide(container, top, run);
    return;
  }
  container.scrollTop = top;
  // Só confere se nada mais moveu a letra (outra frase ou a pessoa rolando)
  [50, 200, 450].forEach(ms => setTimeout(() => { if (run === lyricCenterRun) container.scrollTop = target(); }, ms));
}

// A pessoa mexeu na letra: as conferências pendentes não devem mais mover a rolagem
export function cancelLyricCentering() {
  lyricCenterRun++;
}

// Rolagem própria até a frase: rápida e assentando suave (a do navegador é lenta e muda de um navegador para outro).
// Para na hora se outra frase começar ou se a pessoa mexer na letra
const GLIDE_MS = 260;
function glide(container: HTMLElement, top: number, run: number) {
  const from = container.scrollTop;
  const distance = top - from;
  if (Math.abs(distance) < 1) return;
  const startAt = performance.now();
  const step = (now: number) => {
    if (run !== lyricCenterRun) return;
    const p = Math.min(1, (now - startAt) / GLIDE_MS);
    const eased = 1 - Math.pow(1 - p, 3);
    container.scrollTop = from + distance * eased;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
