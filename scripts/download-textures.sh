#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p public/textures

files=(
  2k_sun.jpg
  2k_mercury.jpg
  2k_venus_atmosphere.jpg
  2k_earth_daymap.jpg
  2k_earth_nightmap.jpg
  2k_earth_clouds.jpg
  2k_mars.jpg
  2k_jupiter.jpg
  2k_saturn.jpg
  2k_saturn_ring_alpha.png
  2k_uranus.jpg
  2k_neptune.jpg
  2k_stars_milky_way.jpg
)

download_one() {
  local name="$1"
  local target="public/textures/$name"
  if [[ -s "$target" ]]; then return 0; fi
  if ! curl -L --fail --silent --show-error --retry 2 --retry-delay 2 --max-time 180 \
    "https://www.solarsystemscope.com/textures/download/$name" -o "$target.part"; then
    rm -f "$target.part"
    return 1
  fi
  mv "$target.part" "$target" || return 1
  printf '%s %s bytes\n' "$name" "$(wc -c < "$target")"
}
export -f download_one
printf '%s\n' "${files[@]}" | xargs -P 3 -I '{}' bash -c 'download_one "$1"' _ '{}'
