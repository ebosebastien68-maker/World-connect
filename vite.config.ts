import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Serveur de développement
  server: {
    port: 5173,
    open: true, // ouvre automatiquement le navigateur
  },

  // Build pour production
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // minification rapide et performante
    rollupOptions: {
      output: {
        // Séparer les dépendances dans un chunk vendor pour cache optimal
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },

  // Résolution d’alias pour imports plus propres
  resolve: {
    alias: {
      '@': '/src', // permet import depuis '@/components/...'
    },
  },

  // Optimisation du cache et dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
});
