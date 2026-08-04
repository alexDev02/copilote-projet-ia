/**
 * Rendu du layout global : header (sélecteur IA), sidebar (3 sections de
 * navigation) et panneau principal. Construit exclusivement via l'API DOM
 * (createElement/textContent) — jamais `innerHTML`, y compris pour du
 * contenu jugé "sûr" (règle ESLint no-restricted-syntax, cf. ARCHITECTURE.md).
 *
 * Le rendu du contenu réel des modules (onboarding, formulaire de livrable,
 * outils) arrive aux Lots 6/7/8 — ce fichier ne fait ici qu'un placeholder
 * explicite pour que le Lot 5 reste testable de façon autonome.
 */

import { IA_LABELS, IA_CIBLES } from '../constants';
import { store } from '../state/store';
import type { Livrable } from '../types/livrable';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: { className?: string; text?: string },
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options?.className) {
    node.className = options.className;
  }
  if (options?.text !== undefined) {
    node.textContent = options.text;
  }
  return node;
}

function requireElementById(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Élément #${id} introuvable dans index.html`);
  }
  return node;
}

/** Initialise le sélecteur d'IA du header (options + valeur courante) et le bouton Formations. */
export function renderHeader(): void {
  const select = requireElementById('ia-select') as HTMLSelectElement;
  select.replaceChildren(
    ...IA_CIBLES.map((ia) => {
      const option = el('option', { text: IA_LABELS[ia] });
      option.value = ia;
      return option;
    }),
  );
  select.value = store.getState().iaCible;
}

function buildNavItem(params: {
  index: string;
  label: string;
  active: boolean;
  dataset: Record<string, string>;
}): HTMLButtonElement {
  const button = el('button', { className: 'deliverable-item' });
  if (params.active) {
    button.classList.add('active');
  }
  Object.entries(params.dataset).forEach(([key, value]) => {
    button.dataset[key] = value;
  });
  button.append(
    el('span', { className: 'deliverable-index', text: params.index }),
    el('span', { className: 'deliverable-label', text: params.label }),
  );
  return button;
}

function buildSidebarSection(title: string, items: readonly HTMLButtonElement[]): HTMLDivElement {
  const section = el('div', { className: 'sidebar-section' });
  const heading = el('p', { className: 'label-caps', text: title });
  heading.style.marginBottom = 'var(--space-3)';
  const nav = el('div', { className: 'sidebar-nav' });
  nav.append(...items);
  section.append(heading, nav);
  return section;
}

/** Construit la sidebar complète (3 sections) à partir de l'état courant du store. */
export function renderSidebar(livrables: readonly Livrable[]): void {
  const sidebar = requireElementById('sidebar');
  const activeView = store.getState().activeView;

  const onboardingItem = buildNavItem({
    index: '—',
    label: 'Prise en main',
    active: activeView.type === 'onboarding',
    dataset: { nav: 'onboarding' },
  });

  const livrableItems = livrables.map((livrable, i) =>
    buildNavItem({
      index: String(i + 1).padStart(2, '0'),
      label: livrable.nom,
      active: activeView.type === 'livrable' && activeView.livrableId === livrable.id,
      dataset: { nav: 'livrable', livrableId: livrable.id },
    }),
  );

  const outilsItem = buildNavItem({
    index: '—',
    label: 'Vérificateur & ressources',
    active: activeView.type === 'outils',
    dataset: { nav: 'outils' },
  });

  sidebar.replaceChildren(
    buildSidebarSection('Avant de commencer', [onboardingItem]),
    buildSidebarSection('Générateur de prompts', livrableItems),
    buildSidebarSection('Autres outils utiles', [outilsItem]),
  );
}

/**
 * Placeholder du panneau principal — remplacé par le contenu réel de chaque
 * module aux Lots 6 (onboarding), 7 (générateur) et 8 (outils).
 */
export function renderMainPlaceholder(livrables: readonly Livrable[]): void {
  const main = requireElementById('main-content');
  const activeView = store.getState().activeView;

  const title = el('h2');
  const body = el('p', { className: 'text-muted' });
  body.style.marginTop = 'var(--space-3)';

  if (activeView.type === 'onboarding') {
    title.textContent = 'Avant de commencer';
    body.textContent = 'Contenu du Module 1 (onboarding) — arrive au Lot 6.';
  } else if (activeView.type === 'outils') {
    title.textContent = 'Autres outils utiles';
    body.textContent = 'Contenu du Module 3 (outils) — arrive au Lot 8.';
  } else {
    const livrable = livrables.find((l) => l.id === activeView.livrableId);
    title.textContent = livrable?.nom ?? 'Livrable introuvable';
    body.textContent = livrable
      ? 'Formulaire de configuration et viewer de prompt (Module 2) — arrivent au Lot 7.'
      : "Ce livrable n'existe pas dans le référentiel chargé.";
  }

  const card = el('section', { className: 'card' });
  card.append(title, body);
  main.replaceChildren(card);
}

/** Rend l'intégralité du layout dépendant de l'état courant du store. */
export function renderAll(livrables: readonly Livrable[]): void {
  renderHeader();
  renderSidebar(livrables);
  renderMainPlaceholder(livrables);
}
