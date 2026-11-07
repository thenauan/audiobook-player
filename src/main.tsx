import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';

import App from './App';
import './index.css';
// Modo leve: aplicado antes de desenhar a interface (sem piscar o desfoque ao abrir)
import './lib/liteMode';

import './lib/appBootstrap';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* Respeita "Reduzir movimento" do sistema (iOS/Android) */}
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>
);
