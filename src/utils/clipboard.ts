/**
 * Copie du texte dans le presse-papier. Utilise l'API moderne quand elle est
 * disponible (contexte sécurisé HTTPS), avec un fallback `execCommand` pour
 * les cas où elle ne l'est pas.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // On retente avec le fallback plutôt que d'abandonner.
    }
  }
  return copyWithFallback(text);
}

function copyWithFallback(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }

  document.body.removeChild(textarea);
  return success;
}
