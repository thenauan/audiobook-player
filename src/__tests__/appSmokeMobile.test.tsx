// @vitest-environment happy-dom
// Monta o app como num celular (tela estreita + toque) e percorre a navegação mobile:
// barra de abas, tela "Outros" com submenus, e abrir/voltar de um audiobook.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import App from '../App';
import { BOOKS_DATABASE, AUTHORS_DATABASE } from '../data';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const FATAL = /ReferenceError|TypeError|before initialization|is not defined|Maximum update depth/;

describe('App mobile (smoke)', { timeout: 60000 }, () => {
  let el: HTMLDivElement;
  let root: Root;
  const errors: string[] = [];
  const originalError = console.error;
  const originalMatchMedia = window.matchMedia;

  beforeAll(async () => {
    console.error = (...args: any[]) => { errors.push(args.map(String).join(' ')); };
    // Simula celular: max-width < 768px e ponteiro de toque
    window.matchMedia = ((q: string) => ({
      matches: /max-width:\s*1023px/.test(q) || /pointer:\s*coarse/.test(q),
      media: q, onchange: null,
      addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
      dispatchEvent: () => false,
    })) as any;
    if (!(window as any).ResizeObserver) {
      (window as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    }
    localStorage.setItem('app_language', 'pt');
    localStorage.setItem('app_has_been_opened_before', 'true');
    localStorage.setItem('app_onboarding_completed_v1', 'true');
    // O app começa vazio para o usuário final: os testes usam o catálogo de exemplo (modo dev)
    localStorage.setItem('app_dev_mode', 'true');
    localStorage.setItem('app_books', JSON.stringify(BOOKS_DATABASE));
    localStorage.setItem('app_authors', JSON.stringify(AUTHORS_DATABASE));
    el = document.createElement('div');
    document.body.appendChild(el);
    root = createRoot(el);
    await act(async () => { root.render(<App />); await wait(300); });
  });

  afterAll(() => {
    console.error = originalError;
    window.matchMedia = originalMatchMedia;
    act(() => root.unmount());
  });

  const tab = (label: string) => el.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null;

  it('mostra a barra de abas com Início, Biblioteca, Outros e Pesquisa', () => {
    for (const label of ['Início', 'Biblioteca', 'Mais', 'Pesquisa']) {
      expect(tab(label), label).toBeTruthy();
    }
    expect(errors.filter(e => FATAL.test(e))).toEqual([]);
  });

  it('navega pelas abas e abre Configurações como submenu de Outros', async () => {
    for (const label of ['Biblioteca', 'Pesquisa', 'Início', 'Mais']) {
      await act(async () => { tab(label)!.click(); await wait(200); });
    }
    const settingsRow = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Ajustes')) as HTMLButtonElement | undefined;
    expect(settingsRow).toBeTruthy();
    await act(async () => { settingsRow!.click(); await wait(400); });
    const back = Array.from(el.querySelectorAll('button')).find(b => b.querySelector('.lucide-chevron-left') && b.textContent?.includes('Mais'));
    expect(back).toBeTruthy();
    expect(errors.filter(e => FATAL.test(e))).toEqual([]);
  });

  it('abre um audiobook pelo card e volta', async () => {
    await act(async () => { tab('Início')!.click(); await wait(300); });
    const cover = el.querySelector('[data-zoom-key^="book-"]') as HTMLElement | null;
    expect(cover).toBeTruthy();
    await act(async () => { cover!.click(); await wait(700); });
    const back = Array.from(el.querySelectorAll('button')).find(b => b.querySelector('.lucide-chevron-left')) as HTMLButtonElement | undefined;
    expect(back).toBeTruthy();
    await act(async () => { back!.click(); await wait(1500); });
    expect(errors.filter(e => FATAL.test(e))).toEqual([]);
  });
});
