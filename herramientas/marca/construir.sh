#!/usr/bin/env bash
# Reconstruye toda la marca: SVG, variantes de color, iconos, favicon, texturas.
set -e
cd "$(dirname "$0")"
S="${TMPDIR:-/tmp}/invitoo-marca"; mkdir -p "$S"
python3 trazar.py
python3 exportar.py
python3 sello_tsx.py >/dev/null
node iconos.mjs "$S" ../../app/public/marca ../../app
python3 - "$S" <<'PY'
import sys
from PIL import Image
S=sys.argv[1]
ims=[Image.open(f'{S}/fav-{w}.png').convert('RGBA') for w in (16,32,48)]
ims[2].save('../../app/src/app/favicon.ico',sizes=[(16,16),(32,32),(48,48)],append_images=ims[:2])
PY
[ "$1" = "--texturas" ] && python3 texturas.py
echo "Marca reconstruida."
