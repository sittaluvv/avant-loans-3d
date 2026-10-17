#!/usr/bin/env bash
# Encode a hero clip for the homepage: slowed, softened, silent, seamless loop, MP4 + WebM + posters.
# Usage: ./scripts/encode-hero.sh input.mp4 [pingpong|crossfade] [speed=0.7]
#   pingpong  - forward then reverse (best for a single continuous camera move)
#   crossfade - fades the end into the start (best for a story clip, e.g. form -> handshake)
set -euo pipefail
IN="$1"; MODE="${2:-pingpong}"; SPEED="${3:-0.7}"
OUT="${OUT:-$(cd "$(dirname "$0")/.." && pwd)/src/assets/hero}"; mkdir -p "$OUT"
BASE="setpts=PTS/${SPEED},minterpolate=fps=24:mi_mode=blend,gblur=sigma=0.7,eq=saturation=0.92:brightness=-0.02,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720"
if [ "$MODE" = "pingpong" ]; then
  F="[0:v]${BASE},split[f][r0];[r0]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[f][r]concat=n=2:v=1:a=0,format=yuv420p[v]"
else
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN"); L=$(python3 -c "print(round($D/$SPEED,3))"); X=1.0
  F="[0:v]${BASE},split[a][b];[a]trim=start=${X},setpts=PTS-STARTPTS,fps=24[main];[b]trim=0:${X},setpts=PTS-STARTPTS,fps=24[head];[main][head]xfade=transition=fade:duration=${X}:offset=$(python3 -c "print(round($L-2*$X,3))"),format=yuv420p[v]"
fi
ffmpeg -v error -y -i "$IN" -an -filter_complex "$F" -map "[v]" -c:v libx264 -preset veryslow -crf 24 -profile:v high -tune film -movflags +faststart "$OUT/hero-loop.mp4"
ffmpeg -v error -y -i "$IN" -an -filter_complex "$F" -map "[v]" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 "$OUT/hero-loop.webm"
ffmpeg -v error -y -i "$OUT/hero-loop.mp4" -frames:v 1 -c:v libwebp -quality 78 "$OUT/hero-poster.webp"
ffmpeg -v error -y -i "$OUT/hero-loop.mp4" -frames:v 1 -vf scale=640:-1 -c:v libwebp -quality 72 "$OUT/hero-poster-640.webp"
ffmpeg -v error -y -i "$OUT/hero-loop.mp4" -frames:v 1 -q:v 3 "$OUT/hero-poster.jpg"
ls -la "$OUT"
