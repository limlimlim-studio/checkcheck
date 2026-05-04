#!/bin/bash
set -e

echo "🤖 Android Play Store 업로드 시작..."

# Play Store 설정 확인
# eas.json submit.production에 androidCredentials 또는 serviceAccountKeyPath 설정 필요
# 참고: https://docs.expo.dev/submit/android/

# 최신 aab 파일 탐색
BUILD_FILE=$(ls -t *.aab 2>/dev/null | head -1)

if [ -z "$BUILD_FILE" ]; then
  BUILD_FILE=$(ls -t *.apk 2>/dev/null | head -1)
fi

if [ -z "$BUILD_FILE" ]; then
  echo "❌ aab/apk 파일을 찾을 수 없습니다. 먼저 빌드를 실행하세요:"
  echo "   npm run build:android"
  exit 1
fi

echo "📦 업로드 파일: $BUILD_FILE"
echo ""

eas submit --platform android --path "$BUILD_FILE" --profile production

echo ""
echo "✅ Android 업로드 완료"
echo "🔗 Google Play Console: https://play.google.com/console"
