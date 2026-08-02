/**
 * Types du domaine "livrable de gestion de projet".
 * Reflète strictement le schéma JSON défini dans specifications-fonctionnelles.md
 * (section 3 — Schéma de données). Ne jamais élargir ce schéma sans mettre à
 * jour la SFD en parallèle.
 */

/** Les trois IA cibles supportées par le générateur de prompts. */
export type IaCible = 'chatgpt' | 'claude' | 'gemini';

/** Les deux options de gestion du document modèle (Module 2, formulaire). */
export type TemplateOption = 'defaut' | 'personnel';

/**
 * Un livrable du référentiel (ex : Charte de Projet, Cahier de Recette).
 * Correspond à un objet du fichier public/data/livrables.json.
 */
export interface Livrable {
  /** Identifiant unique, ex: "prompt-cahier-recette". */
  readonly id: string;
  /** Titre affiché dans la barre latérale. */
  readonly nom: string;
  /** Phase du projet (ex: "Cadrage", "Conception", "Qualité"). */
  readonly categorie: string;
  /** Résumé du rôle du livrable, affiché sous le titre du formulaire. */
  readonly description: string;
  /** Clés dynamiques à saisir dans le formulaire (ex: ["projectScope", "inputDocs"]). */
  readonly variables: readonly string[];
  /** Structure brute du prompt, avec balises d'injection {{variable}}. */
  readonly promptTexte: string;
}

/** Valeurs saisies par l'utilisateur pour un livrable donné (brouillon persisté). */
export type LivrableDraft = Readonly<Record<string, string>>;

/**
 * Représente le résultat d'une validation de livrable brut issu du JSON,
 * utilisé par data/livrables.ts (Lot 4) pour ne jamais laisser un objet
 * malformé entrer dans l'application sous le type `Livrable`.
 */
export type LivrableParseResult =
  | { readonly ok: true; readonly livrable: Livrable }
  | { readonly ok: false; readonly raison: string };
