/**
 * Chargement et validation du référentiel de livrables (public/data/livrables.json).
 * Aucune donnée ne doit entrer dans l'application sous le type `Livrable`
 * sans être passée par `parseLivrable` — cf. ARCHITECTURE.md (typage strict,
 * jamais de `any` sur les données JSON).
 */

import { LIVRABLES_JSON_PATH } from '../constants';
import type { Livrable, LivrableParseResult } from '../types/livrable';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Valide un objet brut issu du JSON et le convertit en `Livrable` typé.
 * Ne lève jamais d'exception : retourne un résultat explicite (ok / raison).
 */
export function parseLivrable(raw: unknown): LivrableParseResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, raison: 'Entrée non objet' };
  }

  const candidate = raw as Record<string, unknown>;

  if (!isNonEmptyString(candidate['id'])) {
    return { ok: false, raison: "Champ 'id' manquant ou invalide" };
  }
  if (!isNonEmptyString(candidate['nom'])) {
    return { ok: false, raison: `Champ 'nom' manquant ou invalide pour id="${candidate['id']}"` };
  }
  if (!isNonEmptyString(candidate['categorie'])) {
    return { ok: false, raison: `Champ 'categorie' manquant ou invalide pour id="${candidate['id']}"` };
  }
  if (!isNonEmptyString(candidate['description'])) {
    return { ok: false, raison: `Champ 'description' manquant ou invalide pour id="${candidate['id']}"` };
  }
  if (!isStringArray(candidate['variables'])) {
    return { ok: false, raison: `Champ 'variables' manquant ou invalide pour id="${candidate['id']}"` };
  }
  if (!isNonEmptyString(candidate['promptTexte'])) {
    return { ok: false, raison: `Champ 'promptTexte' manquant ou invalide pour id="${candidate['id']}"` };
  }

  const livrable: Livrable = {
    id: candidate['id'],
    nom: candidate['nom'],
    categorie: candidate['categorie'],
    description: candidate['description'],
    variables: candidate['variables'],
    promptTexte: candidate['promptTexte'],
  };

  return { ok: true, livrable };
}

let cache: readonly Livrable[] | null = null;

/**
 * Charge et valide le référentiel de livrables depuis le JSON statique.
 * Les entrées malformées sont ignorées et journalisées (console.warn),
 * plutôt que de faire échouer le chargement de toute l'application.
 */
export async function loadLivrables(): Promise<readonly Livrable[]> {
  if (cache) {
    return cache;
  }

  const response = await fetch(LIVRABLES_JSON_PATH);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${LIVRABLES_JSON_PATH} (HTTP ${response.status})`);
  }

  const data: unknown = await response.json();
  const rawList =
    typeof data === 'object' && data !== null && Array.isArray((data as { livrables?: unknown }).livrables)
      ? (data as { livrables: unknown[] }).livrables
      : [];

  const livrables: Livrable[] = [];
  for (const raw of rawList) {
    const result = parseLivrable(raw);
    if (result.ok) {
      livrables.push(result.livrable);
    } else {
      console.warn(`[livrables.json] entrée ignorée : ${result.raison}`);
    }
  }

  cache = livrables;
  return livrables;
}

/** Retourne un livrable par son id, ou `undefined` s'il est absent du référentiel chargé. */
export function getLivrableById(id: string): Livrable | undefined {
  return cache?.find((livrable) => livrable.id === id);
}
