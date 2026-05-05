#!/bin/bash
set -e

echo "🍎 iOS 릴리즈 빌드 시작..."

# 이전 ipa 파일 정리
IPA_COUNT=$(ls *.ipa 2>/dev/null | wc -l | tr -d ' ')
if [ "$IPA_COUNT" -gt 0 ]; then
  echo "🗑  이전 ipa 파일 삭제 중..."
  rm -f *.ipa
fi

# 빌드 시작 시간
START=$(date +%s)

eas build --platform ios --profile production --non-interactive

END=$(date +%s)
ELAPSED=$((END - START))

echo ""
echo "✅ iOS 빌드 완료 (${ELAPSED}초)"
