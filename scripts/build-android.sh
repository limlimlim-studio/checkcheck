#!/bin/bash
set -e

echo "🤖 Android 릴리즈 빌드 시작..."

# 이전 apk/aab 파일 정리
PREV_COUNT=$(ls *.apk *.aab 2>/dev/null | wc -l | tr -d ' ')
if [ "$PREV_COUNT" -gt 0 ]; then
  echo "🗑  이전 빌드 파일 삭제 중..."
  rm -f *.apk *.aab
fi

# 빌드 시작 시간
START=$(date +%s)

eas build --platform android --profile production --local

# 빌드 결과물 확인
BUILD_FILE=$(ls *.apk *.aab 2>/dev/null | head -1)
END=$(date +%s)
ELAPSED=$((END - START))

if [ -n "$BUILD_FILE" ]; then
  echo ""
  echo "✅ Android 빌드 완료 (${ELAPSED}초)"
  echo "📦 결과물: $BUILD_FILE"
else
  echo ""
  echo "❌ 빌드 결과물을 찾을 수 없습니다."
  exit 1
fi
