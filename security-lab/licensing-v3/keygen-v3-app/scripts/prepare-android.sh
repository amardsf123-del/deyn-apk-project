#!/usr/bin/env bash
set -euo pipefail
MAN=android/app/src/main/AndroidManifest.xml
if [ -f "$MAN" ] && ! grep -q 'android:allowBackup="false"' "$MAN"; then
  sed -i 's/android:allowBackup="true"/android:allowBackup="false"/' "$MAN"
fi
