#!/usr/bin/env bash
# Télécharge les polices de la charte (Fraunces, IBM Plex Sans, JetBrains Mono)
# en woff2 et les place dans public/fonts, pour un usage self-hosted compatible
# avec la CSP stricte (default-src 'self') de index.html.
#
# À exécuter dans le Codespace (qui a accès réseau), pas dans l'environnement
# de génération de code qui, lui, est sandboxé sans sortie internet.
#
# Usage : bash scripts/fetch-fonts.sh

set -euo pipefail

OUT_DIR="public/fonts"
mkdir -p "$OUT_DIR"

UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

fetch_family() {
  local family_query="$1"
  local css_url="https://fonts.googleapis.com/css2?family=${family_query}&display=swap"
  curl -s -A "$UA" "$css_url"
}

download_woff2_urls() {
  # Le user-agent moderne ci-dessus force Google à renvoyer du woff2 directement.
  grep -oE "url\(https://fonts.gstatic.com/[^)]+\)" | sed -E 's/url\((.*)\)/\1/'
}

echo "→ Fraunces (500, 600, 700)"
fetch_family "Fraunces:wght@500;600;700" | download_woff2_urls | while read -r url; do
  weight=$(echo "$url" | grep -oE '[0-9]{3}(?=\.)' || true)
  echo "  - $url"
done

# Les URLs Google Fonts n'exposent pas la graisse dans le nom de fichier de
# façon fiable pour un script simple : on télécharge dans l'ordre d'apparition
# du CSS, qui correspond à l'ordre des graisses demandées dans la query.
fetch_and_save() {
  local family_query="$1"
  shift
  local weights=("$@")
  local css
  css=$(fetch_family "$family_query")
  local i=0
  echo "$css" | grep -oE "url\(https://fonts.gstatic.com/[^)]+\)" | sed -E 's/url\((.*)\)/\1/' | while read -r url; do
    weight="${weights[$i]}"
    slug=$(echo "$family_query" | cut -d: -f1 | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    out="$OUT_DIR/${slug}-${weight}.woff2"
    curl -s -A "$UA" "$url" -o "$out"
    echo "  ✓ $out"
    i=$((i + 1))
  done
}

fetch_and_save "Fraunces:wght@500;600;700" 500 600 700
fetch_and_save "IBM+Plex+Sans:wght@400;500;600;700" 400 500 600 700
fetch_and_save "JetBrains+Mono:wght@400;500" 400 500

echo ""
echo "Terminé. Vérifie le contenu de $OUT_DIR :"
ls -la "$OUT_DIR"
echo ""
echo "Les noms de fichiers doivent correspondre exactement à ceux référencés"
echo "dans style/tokens.css (fraunces-600.woff2, ibm-plex-sans-400.woff2, etc.)."
echo "Si un nom diffère, renomme le fichier plutôt que de modifier tokens.css."
