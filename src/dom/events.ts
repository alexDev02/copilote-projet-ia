/**
 * Délégation d'événements du layout global. Un seul listener par zone
 * (sidebar) plutôt qu'un listener par item, pour rester simple et
 * performant même quand la liste de livrables grandit.
 */

import { store } from '../state/store';
import type { IaCible } from '../types/livrable';

function requireElementById(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Élément #${id} introuvable dans index.html`);
  }
  return node;
}

function isIaCible(value: string): value is IaCible {
  return value === 'chatgpt' || value === 'claude' || value === 'gemini';
}

function bindIaSelect(): void {
  const select = requireElementById('ia-select') as HTMLSelectElement;
  select.addEventListener('change', () => {
    if (isIaCible(select.value)) {
      store.setIaCible(select.value);
    }
  });
}

function bindFormationsButton(): void {
  const button = requireElementById('btn-formations');
  button.addEventListener('click', () => {
    store.showOnboarding();
  });
}

function bindSidebarNavigation(): void {
  const sidebar = requireElementById('sidebar');
  sidebar.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const navButton = target.closest<HTMLButtonElement>('[data-nav]');
    if (!navButton) {
      return;
    }

    const navType = navButton.dataset['nav'];
    if (navType === 'onboarding') {
      store.showOnboarding();
    } else if (navType === 'outils') {
      store.showOutils();
    } else if (navType === 'livrable') {
      const livrableId = navButton.dataset['livrableId'];
      if (livrableId) {
        store.selectLivrable(livrableId);
      }
    }
  });
}

/** Attache tous les listeners du layout global. À appeler une seule fois au bootstrap. */
export function bindLayoutEvents(): void {
  bindIaSelect();
  bindFormationsButton();
  bindSidebarNavigation();
}
