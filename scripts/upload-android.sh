#!/bin/bash
set -e

echo "🤖 Android Play Store 업로드 시작..."

eas submit --platform android --latest --profile production

echo ""
echo "✅ Android 업로드 완료"
echo "🔗 Google Play Console: https://play.google.com/console"
