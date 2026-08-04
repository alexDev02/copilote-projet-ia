/**
 * Retourne une version "debounced" de `fn` : les appels rapprochés sont
 * regroupés, seul le dernier s'exécute après `delayMs` de silence.
 * Utilisé pour ne pas réécrire dans localStorage à chaque frappe clavier
 * (RG_M2_03) tout en gardant l'aperçu du prompt instantané (RG_M2_02),
 * qui lui n'est jamais debounced.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}
