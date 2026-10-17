#!/usr/bin/env bash
# Story hero: code-rendered form intro (crisp text) -> crossfade -> slowed, softened handshake -> loop crossfade.
# Usage: ./scripts/build-hero-story.sh <intro_landscape_frames_dir> <intro_portrait_frames_dir> <handshake.mp4>
# Frames: render with /workspace/hero-video/form-scene/render_frames.py {landscape|portrait} (30fps PNG @2x).
# Writes src/assets/hero/hero-story{,-phone}.{mp4,webm} + posters (or to $OUT).
set -euo pipefail
IL="$1"; IP="$2"; HS="$3"
OUT="${OUT:-$(cd "$(dirname "$0")/.." && pwd)/src/assets/hero}"; mkdir -p "$OUT"
INTRO=4.5; HSRC=5.2; SPEED=0.7; X1=0.8; X2=0.8; HOLD_POSTER=2.4   # poster time in the final loop (stamp settled)
HL=$(python3 -c "print(round($HSRC/$SPEED,3))"); L=$(python3 -c "print(round($INTRO+$HL-$X1,3))")
O1=$(python3 -c "print(round($INTRO-$X1,3))"); O2=$(python3 -c "print(round($L-2*$X2,3))")
SOFT="trim=0:${HSRC},setpts=(PTS-STARTPTS)/${SPEED},minterpolate=fps=30:mi_mode=blend,gblur=sigma=0.7,eq=saturation=0.92:brightness=-0.02"
build() { # $1=name $2=W $3=H $4=handshake crop/scale
  local F="[0:v]scale=$2:$3:flags=lanczos,fps=30,format=yuv420p,setsar=1[i];[1:v]${SOFT},$4,fps=30,format=yuv420p,setsar=1,trim=0:${HL},setpts=PTS-STARTPTS,fps=30[h];\
[i][h]xfade=transition=fade:duration=${X1}:offset=${O1},split[a][b];[a]trim=start=${X2},setpts=PTS-STARTPTS,fps=30[m];[b]trim=0:${X2},setpts=PTS-STARTPTS,fps=30[hd];\
[m][hd]xfade=transition=fade:duration=${X2}:offset=${O2},format=yuv420p[v]"
  local SRC=$([ "$1" = hero-story ] && echo "$IL" || echo "$IP")
  ffmpeg -v error -y -framerate 30 -i "$SRC/f%04d.png" -i "$HS" -an -filter_complex "$F" -map "[v]" -r 30 -c:v libx264 -preset veryslow -crf "$5" -profile:v high -tune film -movflags +faststart "$OUT/$1.mp4"
  ffmpeg -v error -y -i "$OUT/$1.mp4" -an -c:v libvpx-vp9 -crf "$6" -b:v 0 -row-mt 1 -deadline good -cpu-used 2 "$OUT/$1.webm"
  ffmpeg -v error -y -ss $HOLD_POSTER -i "$OUT/$1.mp4" -frames:v 1 -c:v libwebp -quality 80 "$OUT/$1-poster.webp"
}
build hero-story 1280 720 "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" 20 31
build hero-story-phone 720 1280 "${PHONE_CROP:-crop=405:720:738:0},scale=720:1280:flags=lanczos" 22 33
ffmpeg -v error -y -ss $HOLD_POSTER -i "$OUT/hero-story.mp4" -frames:v 1 -vf scale=640:-1 -c:v libwebp -quality 74 "$OUT/hero-story-poster-640.webp"
echo "intro ${INTRO}s, handshake ${HL}s, total sequence ${L}s, loop length $(python3 -c "print(round($L-$X2,3))")s"
ls -la "$OUT"/hero-story*
