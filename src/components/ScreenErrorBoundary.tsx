import React from 'react';
import { AlertTriangle, ChevronLeft, RefreshCw } from 'lucide-react';

// ===== Proteção por tela =====
// Se uma tela der erro, só ela mostra um aviso (com "Voltar" e "Tentar de novo"); o resto do app — abas,
// cabeçalho, player e reprodução — continua funcionando. Trocar de tela limpa o erro.
interface Props {
  resetKey: string;
  onBack?: () => void;
  labels: { title: string; description: string; back: string; retry: string };
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ScreenErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro em uma tela (o restante do app continua funcionando):', error, info?.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { labels, onBack } = this.props;
    return (
      <div role="alert" className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center gap-4 px-6">
        <div className="w-14 h-14 rounded-full bg-card/70 border border-[var(--text-main)]/10 flex items-center justify-center text-amber-400">
          <AlertTriangle size={26} />
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--text-main)]">{labels.title}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">{labels.description}</p>
        </div>
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="mobile-press h-11 px-5 rounded-full bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] text-sm font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft size={16} className="rtl:rotate-180" />
              <span>{labels.back}</span>
            </button>
          )}
          <button
            onClick={() => this.setState({ error: null })}
            className="mobile-press h-11 px-5 rounded-full bg-winblue/20 border border-winblue/45 text-winblue text-sm font-semibold flex items-center gap-1.5"
          >
            <RefreshCw size={15} />
            <span>{labels.retry}</span>
          </button>
        </div>
      </div>
    );
  }
}

export default ScreenErrorBoundary;
