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

eas build --platform android --profile production --non-interactive

END=$(date +%s)
ELAPSED=$((END - START))

echo ""
echo "✅ Android 클라우드 빌드 요청 완료 (${ELAPSED}초)"
echo "🔗 빌드 완료 후 npm run upload:android 로 업로드하세요."
