#!/usr/bin/env bash
# Télécharge les polices de la charte (Fraunces, IBM Plex Sans, JetBrains Mono)
# en woff2 et les place dans public/fonts, pour un usage self-hosted compatible
# avec la CSP stricte (default-src 'self') de index.html.
#
# À exécuter dans le Codespace (accès réseau), pas dans l'environnement de
# génération de code qui est sandboxé sans sortie internet.
#
# Usage : bash scripts/fetch-fonts.sh

set -euo pipefail

OUT_DIR="public/fonts"
mkdir -p "$OUT_DIR"

UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

python3 - "$OUT_DIR" "$UA" << 'PYEOF'
import re
import sys
import urllib.request

out_dir, ua = sys.argv[1], sys.argv[2]

# (query pour l'API Google Fonts, slug de fichier, graisses attendues)
families = [
    ("Fraunces:wght@500;600;700", "fraunces", [500, 600, 700]),
    ("IBM+Plex+Sans:wght@400;500;600;700", "ibm-plex-sans", [400, 500, 600, 700]),
    ("JetBrains+Mono:wght@400;500", "jetbrains-mono", [400, 500]),
]

def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    with urllib.request.urlopen(req) as resp:
        return resp.read()

for query, slug, weights in families:
    css_url = f"https://fonts.googleapis.com/css2?family={query}&display=swap"
    css = fetch(css_url).decode("utf-8")
    blocks = css.split("@font-face")[1:]

    seen = set()
    for block in blocks:
        weight_match = re.search(r"font-weight:\s*(\d+)", block)
        url_match = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", block)
        range_match = re.search(r"unicode-range:\s*([^;]+);", block)
        if not (weight_match and url_match):
            continue

        weight = int(weight_match.group(1))
        if weight not in weights or weight in seen:
            continue

        # Chaque graisse peut avoir plusieurs blocs (un par jeu de caractères :
        # latin, latin-ext, vietnamese...). On ne garde que le sous-ensemble
        # latin de base, suffisant pour le français, quand il est identifiable ;
        # sinon (police mono-subset) on prend le premier bloc rencontré.
        unicode_range = (range_match.group(1) if range_match else "").replace(" ", "").upper()
        if range_match and "U+0000-00FF" not in unicode_range:
            continue

        font_url = url_match.group(1)
        out_path = f"{out_dir}/{slug}-{weight}.woff2"
        with open(out_path, "wb") as f:
            f.write(fetch(font_url))
        print(f"  ✓ {out_path}")
        seen.add(weight)

    missing = set(weights) - seen
    if missing:
        print(f"  ⚠ {slug} : graisses manquantes {sorted(missing)} — vérifier manuellement.")
PYEOF

echo ""
echo "Terminé. Vérifie le contenu de $OUT_DIR :"
ls -la "$OUT_DIR"
echo ""
echo "Les noms doivent correspondre exactement à ceux référencés dans"
echo "style/tokens.css (fraunces-600.woff2, ibm-plex-sans-400.woff2, etc.)."
