// Símbolo do Audiobook Generator numa cor só (a do texto, então acompanha o tema): as barras de som e as estrelas
// do ícone, o mesmo desenho do app. `size` é a altura; a largura acompanha a proporção
const VIEWBOX = '258 253 812 692';
const PATH = 'M261 652a35 35 0 0 1 70 0v55a35 35 0 0 1 -70 0zM365 588a35 35 0 0 1 70 0v179a35 35 0 0 1 -70 0zM478 511a35 35 0 0 1 70 0v324a35 35 0 0 1 -70 0zM592 432a35 35 0 0 1 70 0v476a35 35 0 0 1 -70 0zM707 511a35 35 0 0 1 70 0v324a35 35 0 0 1 -70 0zM820 588a35 35 0 0 1 70 0v179a35 35 0 0 1 -70 0zM923 652a35 35 0 0 1 70 0v55a35 35 0 0 1 -70 0zM898 255Q913.73 364.62 1019 381Q913.73 397.38 898 507Q882.27 397.38 777 381Q882.27 364.62 898 255zM1007 475Q1015.06 528.94 1069 537Q1015.06 545.06 1007 599Q998.94 545.06 945 537Q998.94 528.94 1007 475z';

export function GeneratorGlyph({ size, className }: { size?: number | string; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={VIEWBOX} style={{ height: size ?? 16, width: 'auto' }} fill="currentColor" className={className} aria-hidden="true">
      <path d={PATH} />
    </svg>
  );
}
