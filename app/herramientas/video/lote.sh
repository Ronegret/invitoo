#!/usr/bin/env bash
# Invitoo · V1 · vía B en lote: fotograma → cine.py → codificar.sh, estilo a estilo.
#   herramientas/video/lote.sh <fuentes> <trabajo> <public> [id ...]
# Las fuentes son <fuentes>/<id>.png (preparar.py) o, si existen, <fuentes>/<id>-v.png y <id>-h.png
# (los fotogramas nuevos del PC) o <fuentes>/<id>-v.mp4 / -h.mp4 (clips de Wan, vía A).
set -uo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
FU="$1"; TR="$2"; PUB="$3"; shift 3
ORDEN="sobre floracion mar velo constelacion tinta aire cuento festival vinilo neon fuego bachata lupulo estadio meta riviera regencia blason memorias pasaporte orilla pinar orbita brazada carta registro azulejo invitoo"
IDS="${*:-$ORDEN}"
tipo() { python3 -c "import json,sys;print({e['id']:e['tipo'] for e in json.load(open('$AQUI/../imagenes/encargos-video.json'))['encargos']}['$1'])"; }
for id in $IDS; do
  T=$(tipo "$id")
  for o in v h; do
    base="$FU/$id.png"
    for c in "$FU/$id-$o.mp4" "$FU/$id-$o.png"; do [ -f "$c" ] && base="$c" && break; done
    [ -f "$base" ] || { echo "FALTA $id $o"; continue; }
    [ -f "$TR/hecho/$id-$o" ] && [ -z "${REHACER:-}" ] && { echo "YA $id $o"; continue; }
    t0=$(date +%s)
    python3 "$AQUI/cine.py" --id "$id" --orientacion "$o" --base "$base" --salida "$TR/$id-$o" || { echo "FALLO cine $id $o"; continue; }
    t1=$(date +%s)
    "$AQUI/codificar.sh" "$TR/$id-$o" "$id" "$o" "$T" "$PUB" || echo "FALLO codificar $id $o"
    t2=$(date +%s)
    mkdir -p "$TR/muestras"
    for i in 0000 0078 0150; do cp "$TR/$id-$o/apertura/$i.png" "$TR/muestras/$id-$o-ap-$i.png"; done
    cp "$TR/$id-$o/bucle/0072.png" "$TR/muestras/$id-$o-bu-0072.png"
    rm -rf "$TR/$id-$o"
    mkdir -p "$TR/hecho"; echo "$base" > "$TR/hecho/$id-$o"
    echo "HECHO $id $o (render $((t1-t0)) s, codificar $((t2-t1)) s)"
  done
done
echo FIN
