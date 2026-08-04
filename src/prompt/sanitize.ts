/**
 * Sanitisation des saisies utilisateur. Obligatoire avant tout appel à
 * prompt/builder.ts, et avant toute insertion DOM qui ne passerait pas déjà
 * par `textContent` (cf. ARCHITECTURE.md).
 */

/**
 * Neutralise les séquences `{{` / `}}` qu'un utilisateur pourrait saisir.
 *
 * Pourquoi : builder.ts substitue les variables une par une par simple
 * remplacement de texte dans le template. Si la VALEUR saisie par
 * l'utilisateur contient elle-même un `{{autreVariable}}`, une substitution
 * ultérieure pourrait la réinterpréter comme un vrai placeholder et
 * l'écraser silencieusement. On neutralise donc ce motif à la source.
 */
export function sanitizeForPrompt(raw: string): string {
  return raw.trim().replace(/\{\{/g, '{ {').replace(/\}\}/g, '} }');
}

/**
 * Échappe les caractères HTML spéciaux. L'application n'insère du texte
 * dynamique que via `textContent` (jamais `innerHTML`, interdit par ESLint),
 * donc ce cas ne devrait normalement jamais se présenter — mais toute future
 * insertion HTML DOIT passer par ici, sans exception.
 */
export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
