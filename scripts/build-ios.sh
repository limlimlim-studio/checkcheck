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

eas build --platform ios --profile production --local

# 빌드 결과물 확인
IPA_FILE=$(ls *.ipa 2>/dev/null | head -1)
END=$(date +%s)
ELAPSED=$((END - START))

if [ -n "$IPA_FILE" ]; then
  echo ""
  echo "✅ iOS 빌드 완료 (${ELAPSED}초)"
  echo "📦 결과물: $IPA_FILE"
else
  echo ""
  echo "❌ ipa 파일을 찾을 수 없습니다."
  exit 1
fi
