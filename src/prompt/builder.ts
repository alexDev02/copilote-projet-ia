/**
 * Assemblage du prompt final à partir du template d'un livrable et des
 * saisies utilisateur. Toute valeur passe par `sanitize.ts` avant
 * substitution — jamais l'inverse (cf. ARCHITECTURE.md).
 *
 * `values` regroupe dans un seul objet : les variables propres au livrable
 * (livrable.variables), plus deux clés génériques toujours présentes côté
 * formulaire : "inputDocs" (documents fournis en pièce jointe) et
 * "templateOption" ("defaut" ou "personnel").
 */

import { IA_LABELS } from '../constants';
import { sanitizeForPrompt } from './sanitize';
import type { IaCible, Livrable, LivrableDraft, TemplateOption } from '../types/livrable';

export interface BuildPromptParams {
  readonly livrable: Livrable;
  readonly values: LivrableDraft;
}

const TEMPLATE_INSTRUCTIONS: Record<TemplateOption, string> = {
  defaut: 'Utilise la structure de modèle standard par défaut pour ce type de livrable.',
  personnel: "Utilise et modifie l'exemple de livrable que j'ai mis en pièce jointe.",
};

function parseTemplateOption(raw: string | undefined): TemplateOption {
  return raw === 'personnel' ? 'personnel' : 'defaut';
}

/** Assemble le prompt final : substitution des variables, documents d'entrée, consigne de template. */
export function buildPrompt(params: BuildPromptParams): string {
  let result = params.livrable.promptTexte;

  for (const key of params.livrable.variables) {
    const raw = params.values[key] ?? '';
    const safe = sanitizeForPrompt(raw);
    const display = safe.length > 0 ? safe : `[${key}]`;
    result = result.split(`{{${key}}}`).join(display);
  }

  // "Documents à fournir en entrée" est un champ générique du Module 2 (SFD).
  // S'il est déjà référencé dans le template (ex: {{inputDocs}} pour la SFD
  // et le Cahier de Recette), la boucle ci-dessus l'a géré ; sinon on
  // l'ajoute en fin de prompt pour ne perdre aucune saisie utilisateur.
  const hasInputDocsPlaceholder = params.livrable.variables.includes('inputDocs');
  const safeInputDocs = sanitizeForPrompt(params.values['inputDocs'] ?? '');
  if (!hasInputDocsPlaceholder && safeInputDocs.length > 0) {
    result += `\n\nDocuments fournis en pièce jointe : ${safeInputDocs}`;
  }

  const templateOption = parseTemplateOption(params.values['templateOption']);
  result += `\n\n[Modèle de structure] ${TEMPLATE_INSTRUCTIONS[templateOption]}`;

  return result;
}

/** Consignes d'utilisation affichées sous le formulaire, adaptées à l'IA sélectionnée. */
export function buildUsageInstructions(ia: IaCible): string {
  const label = IA_LABELS[ia];
  return [
    '1. Copiez le prompt généré ci-dessus.',
    `2. Ouvrez ${label} et démarrez une nouvelle conversation.`,
    '3. Collez le prompt, puis joignez vous-même les documents mentionnés si nécessaire.',
  ].join('\n');
}

/** Libellés français des variables les plus courantes du référentiel. */
const KNOWN_VARIABLE_LABELS: Record<string, string> = {
  projectName: 'Nom du projet',
  mainObjective: 'Objectif principal',
  stakeholders: 'Parties prenantes clés',
  constraints: 'Contraintes connues',
  mainDeliverables: 'Livrables principaux visés',
  wbsDepth: 'Niveau de détail souhaité',
  activities: 'Activités ou livrables à couvrir',
  roles: 'Rôles / parties prenantes impliqués',
  projectScope: 'Périmètre fonctionnel',
  targetUsers: 'Utilisateurs cibles',
  acceptanceCriteria: "Critères d'acceptation connus",
  inputDocs: 'Documents fournis en pièce jointe',
};

/** Convertit une clé camelCase en libellé lisible, avec les libellés connus en priorité. */
export function describeVariable(key: string): string {
  const known = KNOWN_VARIABLE_LABELS[key];
  if (known) {
    return known;
  }
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
