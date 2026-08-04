/**
 * Point d'entrée de l'application.
 * Charge le référentiel de livrables, effectue le rendu initial du layout,
 * s'abonne au store pour se re-rendre à chaque changement d'état, et
 * attache les événements globaux (sélecteur IA, navigation sidebar).
 */

import { loadLivrables } from './data/livrables';
import { bindLayoutEvents } from './dom/events';
import { renderAll } from './dom/render';
import { store } from './state/store';

async function bootstrap(): Promise<void> {
  const livrables = await loadLivrables();

  renderAll(livrables);
  bindLayoutEvents();

  store.subscribe(() => {
    renderAll(livrables);
  });
}

bootstrap().catch((error: unknown) => {
  console.error('Échec du démarrage de l’application :', error);
});
