// @vitest-environment happy-dom
// Monta o app inteiro e percorre as telas principais para pegar erros que só aparecem em execução
// (ex.: variável usada antes de ser definida), que os testes de unidade não detectam.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import App from '../App';
import { BOOKS_DATABASE, AUTHORS_DATABASE } from '../data';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const FATAL = /ReferenceError|TypeError|before initialization|is not defined|Maximum update depth/;

describe('App (smoke)', { timeout: 60000 }, () => {
  let el: HTMLDivElement;
  let root: Root;
  const errors: string[] = [];
  const originalError = console.error;

  beforeAll(async () => {
    console.error = (...args: any[]) => { errors.push(args.map(String).join(' ')); };
    if (!window.matchMedia) {
      window.matchMedia = ((q: string) => ({
        matches: false, media: q, onchange: null,
        addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
        dispatchEvent: () => false,
      })) as any;
    }
    if (!(window as any).ResizeObserver) {
      (window as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    }
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
    act(() => root.unmount());
  });

  it('renderiza a tela inicial', () => {
    expect(el.querySelector('main')).toBeTruthy();
    expect(errors.filter(e => FATAL.test(e))).toEqual([]);
  });

  it('navega por todas as telas do menu lateral', async () => {
    const buttons = Array.from(el.querySelectorAll('aside button')) as HTMLButtonElement[];
    expect(buttons.length).toBeGreaterThan(3);
    for (const b of buttons) {
      await act(async () => { b.click(); await wait(150); });
    }
    expect(errors.filter(e => FATAL.test(e))).toEqual([]);
  });

  it('abre um audiobook pelo card e volta', async () => {
    const buttons = Array.from(el.querySelectorAll('aside button')) as HTMLButtonElement[];
    await act(async () => { buttons[1]?.click(); await wait(300); });
    const cover = el.querySelector('[data-zoom-key^="book-"]') as HTMLElement | null;
    expect(cover).toBeTruthy();
    await act(async () => { cover!.click(); await wait(700); });
    const back = Array.from(el.querySelectorAll('button')).find(b => b.querySelector('.lucide-chevron-left')) as HTMLButtonElement | undefined;
    expect(back).toBeTruthy();
    await act(async () => { back!.click(); await wait(1500); });
    expect(errors.filter(e => FATAL.test(e))).toEqual([]);
  });
});
