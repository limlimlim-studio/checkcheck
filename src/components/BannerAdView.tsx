import { Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { getAdFreeUntil } from '../db';

const PROD_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-9156090950228888/1226497541',
  // TODO: AdMob에 Android 앱 등록 후 아래 ID 교체
  android: TestIds.BANNER,
  default: TestIds.BANNER,
});

const adUnitId = __DEV__ ? TestIds.BANNER : PROD_AD_UNIT_ID!;

export default function BannerAdView() {
  if (getAdFreeUntil() > Date.now()) return null;

  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      onAdLoaded={() => console.log('[BannerAd] 로드 성공')}
      onAdFailedToLoad={(error) => console.warn('[BannerAd] 로드 실패 코드', error.code, error.message)}
    />
  );
}
