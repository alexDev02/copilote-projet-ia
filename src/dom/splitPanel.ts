/**
 * Layout générique "sommaire à gauche / contenu à droite", consommé par
 * onboarding/gate.ts (Module 1) et tools/render.ts (Module 3, Lot 8).
 * Ne pas dupliquer ce pattern ailleurs — cf. ARCHITECTURE.md.
 *
 * Volontairement sans dépendance au store applicatif : ce composant ne connaît
 * que des items génériques et des callbacks, pour rester réutilisable tel quel.
 */

export interface SplitPanelItem {
  readonly id: string;
  readonly label: string;
  /** Index affiché à gauche du label (ex: "01", ou "—" si non pertinent). */
  readonly index: string;
}

export interface SplitPanelOptions {
  readonly items: readonly SplitPanelItem[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
  /** Rend le contenu associé à `activeId` dans le conteneur fourni. */
  readonly renderContent: (activeId: string, container: HTMLElement) => void;
}

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

/**
 * Construit le layout dans `container` et retourne une fonction `update`
 * à appeler pour changer l'item actif sans reconstruire toute la navigation.
 */
export function renderSplitPanel(
  container: HTMLElement,
  options: SplitPanelOptions,
): { update: (activeId: string) => void } {
  const nav = el('nav', { className: 'split-panel-nav' });
  const content = el('div', { className: 'split-panel-content' });

  function buildNavButton(item: SplitPanelItem, active: boolean): HTMLButtonElement {
    const button = el('button', { className: 'split-panel-nav-item' });
    button.type = 'button';
    if (active) {
      button.classList.add('active');
    }
    button.dataset['id'] = item.id;
    button.append(
      el('span', { className: 'split-panel-nav-index', text: item.index }),
      document.createTextNode(item.label),
    );
    return button;
  }

  function renderNav(activeId: string): void {
    nav.replaceChildren(...options.items.map((item) => buildNavButton(item, item.id === activeId)));
  }

  nav.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const button = target.closest<HTMLButtonElement>('[data-id]');
    const id = button?.dataset['id'];
    if (id) {
      options.onSelect(id);
    }
  });

  renderNav(options.activeId);
  options.renderContent(options.activeId, content);

  const panel = el('div', { className: 'split-panel' });
  panel.append(nav, content);
  container.replaceChildren(panel);

  return {
    update(activeId: string): void {
      renderNav(activeId);
      content.replaceChildren();
      options.renderContent(activeId, content);
    },
  };
}
