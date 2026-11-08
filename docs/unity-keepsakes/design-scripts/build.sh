#!/usr/bin/env bash
# Rebuilds every Unity Keepsakes ornament design as 3000x3000 px, 300 DPI PNGs.
# Needs: python3 + Pillow, node + playwright (Chromium), internet access to fonts.googleapis.com.
# Usage: bash build.sh <output-dir>
set -euo pipefail
OUT="${1:?usage: build.sh <output-dir>}"; OUT="$(mkdir -p "$OUT" && cd "$OUT" && pwd)"
HERE="$(cd "$(dirname "$0")" && pwd)"

# 1) Fixed-language ornaments (16 files): 12 Latin-script + 4 Chinese
F="$OUT/fixed-language-ornaments"; mkdir -p "$F"
N1=$(python3 "$HERE/fixed-language-ornaments/gen.py" "$F")
node "$HERE/fixed-language-ornaments/render.js" "$F" $N1
N2=$(python3 "$HERE/fixed-language-ornaments/gen.py" "$F" cjk)   # 2nd arg = Chinese set only
node "$HERE/fixed-language-ornaments/render.js" "$F" $N2

# 2) Universal personalized templates (12 colorways x BASE + SAMPLE)
U="$OUT/universal-personalized"; mkdir -p "$U"
python3 "$HERE/universal-personalized/gen.py" "$U"
node "$HERE/universal-personalized/render.js" "$U"
mkdir -p "$U/print-bases" "$U/product-photos"
mv "$U"/BASE_*.png "$U/print-bases/"; mv "$U"/SAMPLE_*.png "$U/product-photos/"

# 3) Stamp 300 DPI (keep transparency on CLEAR-ACRYLIC files only)
python3 - "$OUT" <<'PY'
import sys,glob
from PIL import Image
for p in glob.glob(sys.argv[1]+'/**/*.png',recursive=True):
    im=Image.open(p); (im if 'CLEAR-ACRYLIC' in p else im.convert('RGB')).save(p,dpi=(300,300))
PY
rm -rf "$F/html" "$U/html" "$U/jobs.json"
echo "Done -> $OUT"
