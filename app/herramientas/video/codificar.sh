#!/usr/bin/env bash
# Invitoo · V1 · codifica los cuadros de cine.py en H.264 (MP4) + VP9 (WebM) y saca el póster AVIF.
#
#   herramientas/video/codificar.sh <trabajo>/<id>-<v|h> <id> <v|h> <tipo: casa|tematica|sitio> <public/>
#
# Apertura → public/aperturas/<id>/{vertical,horizontal}.{mp4,webm} + poster.avif / poster-h.avif
# Bucle (solo temáticas) → public/tematicas/<id>/hero-{v,h}.{mp4,webm} + poster-{v,h}.avif
#   y además public/tematicas/<id>/apertura.avif (póster de la apertura, el que usa catalogo.ts).
# Topes: vertical ≤ 1,5 MB por archivo; si se pasa, se repite con menos bitrate.
set -euo pipefail
SRC="$1"; ID="$2"; OR="$3"; TIPO="$4"; PUB="$5"
FPS=24
if [ "$OR" = v ]; then NOMBRE=vertical; SUF=v; MAXKB=1450; else NOMBRE=horizontal; SUF=h; MAXKB=1450; fi

enc() { # enc <carpeta cuadros> <salida sin extensión> <kbps>
  local IN="$1" OUT="$2" K="$3"
  ffmpeg -v error -y -framerate $FPS -i "$IN/%04d.png" -c:v libx264 -preset faster -profile:v high -pix_fmt yuv420p \
    -b:v ${K}k -maxrate $((K * 3 / 2))k -bufsize $((K * 2))k -x264-params "keyint=48:min-keyint=24" \
    -tune film -movflags +faststart -an "$OUT.mp4"
  # VP9 en una pasada, calidad constante con techo de bitrate.
  ffmpeg -v error -y -framerate $FPS -i "$IN/%04d.png" -c:v libvpx-vp9 -pix_fmt yuv420p -crf 32 -b:v ${K}k \
    -deadline realtime -cpu-used 7 -row-mt 1 -tile-columns 1 -g 48 -an "$OUT.webm"
}

ajustar() { # baja el bitrate hasta que los dos archivos quepan
  local IN="$1" OUT="$2" K="$3"
  while :; do
    enc "$IN" "$OUT" "$K"
    local A B; A=$(( $(stat -c %s "$OUT.mp4") / 1024 )); B=$(( $(stat -c %s "$OUT.webm") / 1024 ))
    if [ $A -le $MAXKB ] && [ $B -le $MAXKB ]; then break; fi
    K=$(( K * 85 / 100 )); [ $K -lt 500 ] && break
  done
}

poster() { # poster <png> <avif>
  # Póster limpio: el mismo cuadro sin el grano de película (pesa la mitad y es el LCP).
  ffmpeg -v error -y -i "$1" -vf "hqdn3d=4:3:0:0" -c:v libaom-av1 -still-picture 1 -crf 38 -cpu-used 4 -pix_fmt yuv420p "$2"
}

AP="$PUB/aperturas/$ID"; mkdir -p "$AP"
ajustar "$SRC/apertura" "$AP/$NOMBRE" 1500
poster "$SRC/apertura/0000.png" "$AP/$([ $OR = v ] && echo poster || echo poster-h).avif"

if [ "$TIPO" = tematica ]; then
  TE="$PUB/tematicas/$ID"; mkdir -p "$TE"
  ajustar "$SRC/bucle" "$TE/hero-$SUF" 1400
  poster "$SRC/bucle/0000.png" "$TE/poster-$SUF.avif"
  [ "$OR" = v ] && cp "$AP/poster.avif" "$TE/apertura.avif"
fi
echo "OK $ID $OR"
