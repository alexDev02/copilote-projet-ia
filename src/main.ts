/**
 * Point d'entrée de l'application.
 * Lot 0 : vérifie uniquement que le point de montage existe et que la chaîne
 * de build (tsc → eslint → vite) fonctionne de bout en bout.
 * Le rendu réel (header, sidebar, modules) sera branché ici à partir du Lot 5.
 */

function mountPlaceholder(rootId: string): void {
  const root = document.getElementById(rootId);
  if (!root) {
    throw new Error(`Point de montage #${rootId} introuvable dans index.html`);
  }
  root.textContent = 'Copilote Projet IA — socle technique en place (Lot 0).';
}

mountPlaceholder('app');
