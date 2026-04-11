import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { usePremiumStore } from '../stores/premiumStore';

const PROD_AD_UNIT_ID = 'ca-app-pub-9156090950228888/1226497541';
const adUnitId = __DEV__ ? TestIds.BANNER : PROD_AD_UNIT_ID;

export default function BannerAdView() {
  const isPremium = usePremiumStore((s) => s.isPremium);

  if (isPremium) return null;

  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}
