import { useId } from 'react';

// Ícone do app em uma cor só: segue a cor do texto (branco no tema escuro, preto no claro). O recorte é justo nas
// formas, para o nome ficar colado nele. Sem "height", tem a altura das letras do texto ao lado (com o contêiner em
// items-baseline, a base do ícone fica na linha do texto), como o logo do Apple Music.
export function AppLogo({ height, className }: { height?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const mirror = 'matrix(-1 0 0 1 1254 0)';
  const cut = { fill: '#000', stroke: '#000', strokeWidth: 20 };
  return (
    <svg viewBox="80 150 1094 876" style={{ height: height ?? '0.76em', width: 'auto' }} fill="currentColor" className={className} aria-hidden="true">
      <defs>
        <path id={`${id}f`} d="M620 640C555 548 405 496 270 495Q214 496 212 552L199 866Q198 912 242 904C372 874 535 866 620 985Z" />
        <path id={`${id}m`} d="M212 553Q145 566 141 612L141 918Q141 970 194 965C340 947 500 945 604 1012L620 1012L620 700Z" />
        <path id={`${id}b`} d="M141 615Q90 622 88 668L88 955Q88 1013 148 1013L620 1013L620 700Z" />
        <mask id={`${id}1`}>
          <rect width="1254" height="1254" fill="#fff" />
          <use href={`#${id}m`} {...cut} />
          <use href={`#${id}m`} transform={mirror} {...cut} />
          <use href={`#${id}f`} {...cut} />
          <use href={`#${id}f`} transform={mirror} {...cut} />
        </mask>
        <mask id={`${id}2`}>
          <rect width="1254" height="1254" fill="#fff" />
          <use href={`#${id}f`} {...cut} />
          <use href={`#${id}f`} transform={mirror} {...cut} />
        </mask>
      </defs>
      <rect x="265" y="306" width="56" height="96" rx="28" />
      <rect x="358" y="270" width="64" height="164" rx="32" />
      <rect x="458" y="210" width="80" height="258" rx="40" />
      <rect x="583" y="156" width="88" height="357" rx="44" />
      <rect x="717" y="210" width="80" height="258" rx="40" />
      <rect x="833" y="270" width="64" height="164" rx="32" />
      <rect x="933" y="306" width="56" height="96" rx="28" />
      <g mask={`url(#${id}1)`}>
        <use href={`#${id}b`} />
        <use href={`#${id}b`} transform={mirror} />
      </g>
      <g mask={`url(#${id}2)`}>
        <use href={`#${id}m`} />
        <use href={`#${id}m`} transform={mirror} />
      </g>
      <use href={`#${id}f`} />
      <use href={`#${id}f`} transform={mirror} />
    </svg>
  );
}
