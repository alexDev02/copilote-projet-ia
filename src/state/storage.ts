/**
 * Seul point d'accès autorisé à `localStorage` dans toute l'application
 * (cf. ARCHITECTURE.md — state/storage.ts). Aucun autre fichier ne doit
 * appeler `localStorage.getItem` / `setItem` directement.
 *
 * Chaque lecture est défensive : un localStorage vide, corrompu, ou modifié
 * manuellement par l'utilisateur ne doit jamais faire planter l'application —
 * on retombe systématiquement sur une valeur par défaut sûre.
 */

import { DEFAULT_IA_CIBLE, IA_CIBLES, STORAGE_KEYS, draftStorageKey } from '../constants';
import type { IaCible, LivrableDraft } from '../types/livrable';

function isIaCible(value: unknown): value is IaCible {
  return typeof value === 'string' && (IA_CIBLES as readonly string[]).includes(value);
}

/** Lit l'IA cible mémorisée, ou l'IA par défaut si absente/invalide. */
export function getIaCible(): IaCible {
  const raw = localStorage.getItem(STORAGE_KEYS.iaCible);
  return isIaCible(raw) ? raw : DEFAULT_IA_CIBLE;
}

/** Mémorise l'IA cible sélectionnée (RG_M2_01). */
export function setIaCible(ia: IaCible): void {
  localStorage.setItem(STORAGE_KEYS.iaCible, ia);
}

/** Indique si l'onboarding a déjà été acquitté (RG_M1_01). */
export function isOnboardingComplete(): boolean {
  return localStorage.getItem(STORAGE_KEYS.onboardingComplete) === 'true';
}

/** Enregistre l'acquittement (ou non) de l'onboarding. */
export function setOnboardingComplete(complete: boolean): void {
  localStorage.setItem(STORAGE_KEYS.onboardingComplete, String(complete));
}

/**
 * Sauvegarde le brouillon de saisie d'un livrable (RG_M2_03).
 * `data` doit déjà être composé de chaînes simples ; aucune sanitisation
 * n'est faite ici (ce n'est pas le rôle de la couche stockage) — voir
 * prompt/sanitize.ts pour l'échappement avant tout affichage DOM (Lot 7).
 */
export function saveDraft(livrableId: string, data: LivrableDraft): void {
  try {
    localStorage.setItem(draftStorageKey(livrableId), JSON.stringify(data));
  } catch {
    // Quota localStorage dépassé ou navigateur en mode privé restrictif :
    // on échoue silencieusement plutôt que de casser la saisie en cours.
  }
}

/** Relit le brouillon d'un livrable, ou un objet vide si absent/corrompu. */
export function getDraft(livrableId: string): LivrableDraft {
  const raw = localStorage.getItem(draftStorageKey(livrableId));
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecordOfStrings(parsed)) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((v) => typeof v === 'string');
}
