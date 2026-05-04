#!/bin/bash
set -e

echo "🍎 iOS App Store 업로드 시작..."

# 최신 ipa 파일 탐색
IPA_FILE=$(ls -t *.ipa 2>/dev/null | head -1)

if [ -z "$IPA_FILE" ]; then
  echo "❌ ipa 파일을 찾을 수 없습니다. 먼저 빌드를 실행하세요:"
  echo "   npm run build:ios"
  exit 1
fi

echo "📦 업로드 파일: $IPA_FILE"
echo ""

eas submit --platform ios --path "$IPA_FILE" --profile production --non-interactive

echo ""
echo "✅ iOS 업로드 완료"
echo "🔗 App Store Connect: https://appstoreconnect.apple.com"
