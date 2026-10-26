#!/usr/bin/env bash
# Usage: bash scripts/perf-frames.sh <label>
# Start with the app signed in on Home (a customer that has orders). Coordinates are for the
# 1080x2400 SM-A057F: tab bar y=2143, tab x = 141 / 340 / 540 / 740 / 938.
ADB="${ADB:-$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe}"
PKG=host.exp.exponent
"$ADB" shell dumpsys gfxinfo "$PKG" reset >/dev/null
down() { "$ADB" shell input swipe 540 1700 540 600 250; sleep 0.4; }
up()   { "$ADB" shell input swipe 540 600 540 1700 250; sleep 0.4; }
tab()  { "$ADB" shell input tap "$1" 2143; sleep 2; }
for _ in 1 2 3 4; do down; done
for _ in 1 2 3 4; do up; done
tab 340; down; up; tab 540; down; up; tab 740; down; up; tab 938; down; up; tab 141
echo "== $1"
"$ADB" shell dumpsys gfxinfo "$PKG" | grep -E "Total frames rendered|Janky frames|50th percentile|90th percentile|95th percentile|99th percentile"
