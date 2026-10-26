#!/usr/bin/env bash
# Size of every raster asset the app actually requires (Metro bundles only these), plus the total.
cd "$(dirname "$0")/.." || exit 1
grep -rhoE "assets/[A-Za-z0-9_./ ()-]+\.(png|jpg|jpeg|webp|gif)" \
  --include=*.tsx --include=*.ts --include=*.json \
  screens components app store services constants styles app.json 2>/dev/null | sort -u |
while read -r f; do [ -f "$f" ] && printf '%s\t%s\n' "$(stat -c %s "$f")" "$f"; done | sort -rn |
awk -F'\t' '{t+=$1; printf "%7.0f KB  %s\n",$1/1024,$2} END {printf "%7.0f KB  TOTAL (budget: 1500 KB)\n",t/1024}'
