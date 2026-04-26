#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 iOS + Android 릴리즈 빌드 시작..."
echo ""

# iOS 빌드
bash "$SCRIPT_DIR/build-ios.sh"
echo ""

# Android 빌드
bash "$SCRIPT_DIR/build-android.sh"
echo ""

echo "🎉 전체 빌드 완료!"
echo "📦 iOS:     $(ls *.ipa 2>/dev/null | head -1)"
echo "📦 Android: $(ls *.apk *.aab 2>/dev/null | head -1)"
