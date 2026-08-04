/**
 * Rendu du layout global : header (sélecteur IA), sidebar (3 sections de
 * navigation) et panneau principal. Construit exclusivement via l'API DOM
 * (createElement/textContent) — jamais `innerHTML`, y compris pour du
 * contenu jugé "sûr" (règle ESLint no-restricted-syntax, cf. ARCHITECTURE.md).
 *
 * Le panneau du Module 2 (générateur de prompts) est le cœur applicatif :
 * il gère son propre état local de formulaire (voir renderLivrablePanel),
 * délibérément en dehors du store applicatif pour ne jamais perdre le focus
 * d'un champ en cours de saisie (cf. state/store.ts, note du Lot 7).
 */

import { IA_LABELS, IA_CIBLES } from '../constants';
import { buildPrompt, buildUsageInstructions, describeVariable } from '../prompt/builder';
import { renderOnboarding } from '../onboarding/gate';
import { getDraft, saveDraft } from '../state/storage';
import { store } from '../state/store';
import { copyToClipboard } from '../utils/clipboard';
import { debounce } from '../utils/debounce';
import type { Livrable, LivrableDraft, TemplateOption } from '../types/livrable';

const DRAFT_SAVE_DELAY_MS = 400;

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

/** Initialise le sélecteur d'IA du header (options + valeur courante). */
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
 * Rend le Module 2 complet pour un livrable donné : viewer de prompt sticky,
 * formulaire de paramètres, choix de template, documents d'entrée et
 * consignes d'utilisation.
 *
 * État de formulaire tenu localement (fermeture de fonction), jamais dans le
 * store applicatif : chaque frappe met à jour l'aperçu instantanément
 * (RG_M2_02) et déclenche une sauvegarde debouncée (RG_M2_03), sans jamais
 * déclencher de re-rendu global qui ferait perdre le focus du champ actif.
 */
function renderLivrablePanel(livrable: Livrable, main: HTMLElement): void {
  const initialDraft: LivrableDraft = getDraft(livrable.id);
  const values: Record<string, string> = { ...initialDraft };
  if (!values['templateOption']) {
    values['templateOption'] = 'defaut';
  }

  const persist = debounce(() => {
    saveDraft(livrable.id, values);
  }, DRAFT_SAVE_DELAY_MS);

  const promptOutput = el('pre', { className: 'prompt-viewer-output' });

  function refreshPrompt(): void {
    promptOutput.textContent = buildPrompt({ livrable, values });
  }

  function setValue(key: string, value: string): void {
    values[key] = value;
    refreshPrompt();
    persist();
  }

  // --- Viewer sticky ---
  const copyButton = el('button', { className: 'btn btn-accent', text: 'Copier le prompt' });
  copyButton.type = 'button';
  copyButton.style.padding = '6px 14px';
  copyButton.style.fontSize = '0.8rem';
  copyButton.addEventListener('click', () => {
    copyToClipboard(promptOutput.textContent ?? '')
      .then((success) => {
        const original = copyButton.textContent;
        copyButton.textContent = success ? 'Copié !' : 'Échec de la copie';
        setTimeout(() => {
          copyButton.textContent = original;
        }, 1500);
      })
      .catch(() => {
        copyButton.textContent = 'Échec de la copie';
      });
  });

  const viewerHeader = el('div', { className: 'prompt-viewer-header' });
  viewerHeader.append(
    el('span', { className: 'prompt-viewer-label', text: 'Prompt généré' }),
    copyButton,
  );

  const viewer = el('section', { className: 'prompt-viewer' });
  viewer.append(viewerHeader, promptOutput);

  // --- Formulaire ---
  const card = el('section', { className: 'card' });
  const workflowHeader = el('div', { className: 'workflow-header' });
  const headerText = el('div');
  const title = el('h2', { text: livrable.nom });
  const description = el('p', { className: 'text-muted', text: livrable.description });
  headerText.append(title, description);
  workflowHeader.append(headerText);

  const form = el('form');
  form.addEventListener('submit', (event) => event.preventDefault());

  for (const key of livrable.variables) {
    const group = el('div', { className: 'form-group' });
    const label = el('label', { className: 'form-label', text: describeVariable(key) });
    const textarea = el('textarea', { className: 'form-control' });
    textarea.rows = 2;
    textarea.value = values[key] ?? '';
    textarea.addEventListener('input', () => setValue(key, textarea.value));
    group.append(label, textarea);
    form.append(group);
  }

  // Champ générique "Documents d'entrée" — seulement s'il n'est pas déjà
  // couvert par une variable du livrable (ex: SFD, Cahier de Recette).
  if (!livrable.variables.includes('inputDocs')) {
    const group = el('div', { className: 'form-group' });
    const label = el('label', { className: 'form-label', text: describeVariable('inputDocs') });
    const input = el('input', { className: 'form-control' });
    input.type = 'text';
    input.placeholder = 'ex : Spécifications fonctionnelles, Cahier des charges';
    input.value = values['inputDocs'] ?? '';
    input.addEventListener('input', () => setValue('inputDocs', input.value));
    group.append(label, input);
    form.append(group);
  }

  // Choix du document modèle (Option A / Option B, cf. SFD Module 2).
  const templateGroup = el('div', { className: 'form-group' });
  const templateLabel = el('label', { className: 'form-label', text: 'Document modèle' });
  const templateChoice = el('div', { className: 'template-choice' });

  const templateOptions: readonly TemplateOption[] = ['defaut', 'personnel'];
  templateOptions.forEach((option) => {
    const optionLabel = el('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `template-${livrable.id}`;
    radio.value = option;
    radio.checked = values['templateOption'] === option;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        setValue('templateOption', option);
      }
    });
    const text =
      option === 'defaut'
        ? 'Utiliser le modèle de structure par défaut'
        : 'Utiliser mon propre modèle (en pièce jointe)';
    optionLabel.append(radio, document.createTextNode(` ${text}`));
    templateChoice.append(optionLabel);
  });

  templateGroup.append(templateLabel, templateChoice);
  form.append(templateGroup);

  // Consignes d'utilisation, adaptées à l'IA sélectionnée dans le header.
  const usage = el('p', { className: 'text-muted' });
  usage.style.whiteSpace = 'pre-line';
  usage.style.marginTop = 'var(--space-5)';
  usage.textContent = buildUsageInstructions(store.getState().iaCible);

  card.append(workflowHeader, form, usage);
  main.replaceChildren(viewer, card);

  refreshPrompt();
}

/** Rend le panneau principal en fonction de la vue active du store. */
export function renderMainPlaceholder(livrables: readonly Livrable[]): void {
  const main = requireElementById('main-content');
  const activeView = store.getState().activeView;

  if (activeView.type === 'onboarding') {
    renderOnboarding(main);
    return;
  }

  if (activeView.type === 'outils') {
    const title = el('h2', { text: 'Autres outils utiles' });
    const body = el('p', {
      className: 'text-muted',
      text: 'Contenu du Module 3 (outils) — arrive au Lot 8.',
    });
    body.style.marginTop = 'var(--space-3)';
    const card = el('section', { className: 'card' });
    card.append(title, body);
    main.replaceChildren(card);
    return;
  }

  const livrable = livrables.find((l) => l.id === activeView.livrableId);
  if (!livrable) {
    const title = el('h2', { text: 'Livrable introuvable' });
    const body = el('p', {
      className: 'text-muted',
      text: "Ce livrable n'existe pas dans le référentiel chargé.",
    });
    body.style.marginTop = 'var(--space-3)';
    const card = el('section', { className: 'card' });
    card.append(title, body);
    main.replaceChildren(card);
    return;
  }

  renderLivrablePanel(livrable, main);
}

/** Rend l'intégralité du layout dépendant de l'état courant du store. */
export function renderAll(livrables: readonly Livrable[]): void {
  renderHeader();
  renderSidebar(livrables);
  renderMainPlaceholder(livrables);
}
