#!/bin/bash
set -e

echo "🍎 iOS App Store 업로드 시작..."

eas submit --platform ios --latest --profile production --non-interactive

echo ""
echo "✅ iOS 업로드 완료"
echo "🔗 App Store Connect: https://appstoreconnect.apple.com"
