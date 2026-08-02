/**
 * Constantes globales de l'application.
 * Toute clé localStorage ou valeur de config en dur DOIT vivre ici,
 * jamais recopiée en chaîne littérale ailleurs dans le code
 * (cf. ARCHITECTURE.md — state/storage.ts).
 */

import type { IaCible } from './types/livrable';

/** Clés localStorage — un seul point de vérité, consommé uniquement par state/storage.ts */
export const STORAGE_KEYS = {
  iaCible: 'copilote_ia_cible',
  onboardingComplete: 'copilote_onboarding_complete',
  draftPrefix: 'copilote_draft_',
} as const;

/** Construit la clé localStorage d'un brouillon de livrable donné. */
export function draftStorageKey(livrableId: string): string {
  return `${STORAGE_KEYS.draftPrefix}${livrableId}`;
}

/** Liste des IA supportées, dans l'ordre d'affichage du sélecteur du header. */
export const IA_CIBLES: readonly IaCible[] = ['chatgpt', 'claude', 'gemini'] as const;

/** Libellés affichés pour chaque IA cible (évite de dupliquer la casse un peu partout). */
export const IA_LABELS: Record<IaCible, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
};

/** IA sélectionnée par défaut si aucune préférence n'est encore enregistrée. */
export const DEFAULT_IA_CIBLE: IaCible = 'chatgpt';

/** Chemin du référentiel de livrables statique (Lot 4). */
export const LIVRABLES_JSON_PATH = '/data/livrables.json';
