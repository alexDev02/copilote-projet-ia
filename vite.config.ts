import { defineConfig } from 'vite';

// ⚠️ Adapter "base" avec le nom exact du dépôt GitHub Pages avant le premier déploiement
// (ex: dépôt "copilote-projet-ia" servi sur https://<user>.github.io/copilote-projet-ia/)
export default defineConfig({
  base: '/copilote-projet-ia/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
  },
});
