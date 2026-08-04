/**
 * État runtime de l'application. C'est la source de vérité pour le rendu
 * (dom/render.ts, Lot 5+) — jamais l'inverse. `storage.ts` sert uniquement
 * à persister/relire, il n'est jamais lu directement par les vues.
 *
 * Pattern pub/sub minimal (pas de framework, cf. ARCHITECTURE.md) :
 * les vues s'abonnent avec `subscribe`, et sont notifiées à chaque mutation.
 */

import * as storage from './storage';
import type { IaCible, LivrableDraft } from '../types/livrable';

/** Identifie le panneau actuellement affiché dans la zone de travail. */
export type ActiveView =
  | { readonly type: 'onboarding' }
  | { readonly type: 'livrable'; readonly livrableId: string }
  | { readonly type: 'outils' };

interface AppState {
  iaCible: IaCible;
  onboardingComplete: boolean;
  activeView: ActiveView;
  /** Brouillon du livrable actuellement affiché, tenu en mémoire pour un accès synchrone. */
  currentDraft: LivrableDraft;
}

type Listener = () => void;

interface Store {
  subscribe(listener: Listener): () => void;
  getState(): Readonly<AppState>;
  setIaCible(ia: IaCible): void;
  setOnboardingComplete(complete: boolean): void;
  showOnboarding(): void;
  showOutils(): void;
  selectLivrable(livrableId: string): void;
  updateDraftValue(livrableId: string, key: string, value: string): void;
}

function createStore(): Store {
  const onboardingComplete = storage.isOnboardingComplete();

  let state: AppState = {
    iaCible: storage.getIaCible(),
    onboardingComplete,
    activeView: onboardingComplete ? { type: 'outils' } : { type: 'onboarding' },
    currentDraft: {},
  };

  const listeners = new Set<Listener>();

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    /** Abonne une vue aux changements d'état. Retourne une fonction de désabonnement. */
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getState(): Readonly<AppState> {
      return state;
    },

    setIaCible(ia: IaCible): void {
      state = { ...state, iaCible: ia };
      storage.setIaCible(ia);
      notify();
    },

    setOnboardingComplete(complete: boolean): void {
      state = { ...state, onboardingComplete: complete };
      storage.setOnboardingComplete(complete);
      notify();
    },

    showOnboarding(): void {
      state = { ...state, activeView: { type: 'onboarding' } };
      notify();
    },

    showOutils(): void {
      state = { ...state, activeView: { type: 'outils' } };
      notify();
    },

    /** Change de livrable actif et recharge son brouillon persisté en mémoire. */
    selectLivrable(livrableId: string): void {
      state = {
        ...state,
        activeView: { type: 'livrable', livrableId },
        currentDraft: storage.getDraft(livrableId),
      };
      notify();
    },

    /** Met à jour une variable du brouillon courant et persiste immédiatement. */
    updateDraftValue(livrableId: string, key: string, value: string): void {
      const nextDraft: LivrableDraft = { ...state.currentDraft, [key]: value };
      state = { ...state, currentDraft: nextDraft };
      storage.saveDraft(livrableId, nextDraft);
      notify();
    },
  };
}

/** Instance unique du store applicatif. */
export const store = createStore();
