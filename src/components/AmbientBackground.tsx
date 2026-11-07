// Fundo animado das telas de ajustes iniciais, novidades e erro: manchas em amarelo, marrom e laranja sobre preto (tema
// escuro) ou branco (tema claro). O movimento roda no CSS, sem custo de JavaScript a cada quadro.
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="ambient-orb ambient-orb-1 absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[780px] max-h-[780px] rounded-full blur-[110px]" />
      <div className="ambient-orb ambient-orb-2 absolute top-[10%] -right-[12%] w-[60vw] h-[60vw] max-w-[740px] max-h-[740px] rounded-full blur-[115px]" />
      <div className="ambient-orb ambient-orb-3 absolute -bottom-[18%] left-[15%] w-[65vw] h-[65vw] max-w-[760px] max-h-[760px] rounded-full blur-[115px]" />
      <div className="ambient-veil absolute inset-0" />
    </div>
  );
}
