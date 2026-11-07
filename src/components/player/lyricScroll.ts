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
    container.scrollTo({ top, behavior: 'smooth' });
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
