import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { seoPlugin } from './seo.config'

// Só gera os arquivos do site/app: nada roda num servidor local (fora do app instalado, tudo é web)
// https://vitejs.dev/config/
export default defineConfig({
  // Caminhos relativos: o app funciona na raiz de um domínio ou numa subpasta
  // (ex.: GitHub Pages em https://usuario.github.io/repositorio/)
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // Títulos e descrições para buscadores, com uma página por idioma
    seoPlugin(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('motion')) {
              return 'vendor-motion';
            }
            if (
              id.includes('/react/') || 
              id.includes('\\react\\') || 
              id.includes('/react-dom/') || 
              id.includes('\\react-dom\\') || 
              id.includes('/scheduler/') || 
              id.includes('\\scheduler\\')
            ) {
              return 'vendor-react';
            }
            return 'vendor-utils';
          }
          if (id.includes('helpData') || id.includes('helpTranslations')) {
            return 'data-help';
          }
          if (id.includes('translations') || id.includes('genreTranslations') || id.includes('nationalityTranslations')) {
            return 'data-translations';
          }
          if (id.includes('/data.ts') || id.includes('\\data.ts')) {
            return 'data-catalog';
          }
        }
      }
    }
  }
})
