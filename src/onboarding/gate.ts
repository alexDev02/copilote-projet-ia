/**
 * Module 1 — Onboarding ("Avant de commencer").
 * Gate UX uniquement, pas un contrôle de sécurité (cf. ARCHITECTURE.md) :
 * ne bloque rien côté données, se contente de proposer l'onboarding en
 * premier tant qu'il n'a pas été acquitté (RG_M1_01), et reste réouvrable
 * à tout moment via le bouton "Formations" du header (RG_M1_02).
 */

import { renderSplitPanel } from '../dom/splitPanel';
import { store } from '../state/store';
import type { SplitPanelItem } from '../dom/splitPanel';

interface Slide {
  readonly id: string;
  readonly titre: string;
  readonly corps: string;
}

/**
 * Contenu statique des slides. Volume trop faible pour justifier un JSON
 * externe au stade du MVP (cf. note Module 3 d'ARCHITECTURE.md, même logique).
 */
const SLIDES: readonly Slide[] = [
  {
    id: 'bienvenue',
    titre: 'Bienvenue sur Copilote Projet IA',
    corps:
      "Cet outil vous aide à construire des prompts prêts à l'emploi pour vos livrables de gestion de projet, à coller directement dans votre IA préférée.",
  },
  {
    id: 'choisir-ia',
    titre: 'Choisissez votre IA',
    corps:
      "Sélectionnez ChatGPT, Claude ou Gemini dans le header. Ce choix est mémorisé automatiquement et adapte les consignes d'utilisation affichées.",
  },
  {
    id: 'generer',
    titre: 'Générez votre prompt',
    corps:
      'Dans le Générateur de Prompts, remplissez les paramètres du livrable choisi : le prompt se met à jour en temps réel dans le viewer fixe en haut de la page.',
  },
  {
    id: 'pieces-jointes',
    titre: 'Pensez aux pièces jointes',
    corps:
      "L'application ne stocke aucun fichier. Préparez vos documents d'entrée (SFD, cahier des charges...) pour les joindre vous-même dans votre IA au moment de coller le prompt.",
  },
];

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

function renderSlideContent(activeId: string, container: HTMLElement): void {
  const slide = SLIDES.find((s) => s.id === activeId) ?? SLIDES[0];
  if (!slide) {
    return;
  }
  const title = el('h3', { text: slide.titre });
  title.style.marginBottom = 'var(--space-3)';
  const body = el('p', { className: 'text-muted', text: slide.corps });
  container.append(title, body);
}

function buildAcknowledgeRow(): HTMLLabelElement {
  const label = el('label');
  label.style.display = 'flex';
  label.style.alignItems = 'center';
  label.style.gap = 'var(--space-2)';
  label.style.marginTop = 'var(--space-6)';
  label.style.cursor = 'pointer';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = store.getState().onboardingComplete;
  checkbox.addEventListener('change', () => {
    store.setOnboardingComplete(checkbox.checked);
  });

  label.append(
    checkbox,
    document.createTextNode('J’ai terminé ce module de formation (ne plus afficher)'),
  );
  return label;
}

/** Rend le Module 1 complet dans `container` (généralement #main-content). */
export function renderOnboarding(container: HTMLElement): void {
  const card = el('section', { className: 'card' });
  const heading = el('h2', { text: 'Avant de commencer' });
  heading.style.marginBottom = 'var(--space-5)';

  const panelHost = el('div');
  const items: readonly SplitPanelItem[] = SLIDES.map((slide, i) => ({
    id: slide.id,
    label: slide.titre,
    index: String(i + 1).padStart(2, '0'),
  }));

  const firstSlide = SLIDES[0];
  if (!firstSlide) {
    return;
  }

  const panel = renderSplitPanel(panelHost, {
    items,
    activeId: firstSlide.id,
    onSelect: (id) => panel.update(id),
    renderContent: renderSlideContent,
  });

  card.append(heading, panelHost, buildAcknowledgeRow());
  container.replaceChildren(card);
}
