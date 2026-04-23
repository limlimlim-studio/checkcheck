import { useState } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { getAdFreeUntil, setAdFreeUntil } from '../db';

// TODO: AdMob 콘솔에서 리워드 광고 단위 ID 생성 후 교체
const PROD_REWARDED_AD_UNIT_ID = 'ca-app-pub-9156090950228888/3269553980';
const adUnitId = __DEV__ ? TestIds.REWARDED : PROD_REWARDED_AD_UNIT_ID;

const AD_FREE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30일
export const REQUIRED_AD_COUNT = 2;

export function useAdFree() {
  const [adFreeUntil, setAdFreeUntilState] = useState(() => getAdFreeUntil());
  const [watchedCount, setWatchedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const isAdFree = adFreeUntil > Date.now();

  const watchAd = () => {
    if (isLoading) return;
    setIsLoading(true);

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoading(false);
      rewarded.show().catch(() => setIsLoading(false));
    });

    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        unsubLoaded();
        unsubEarned();
        unsubError();
        setWatchedCount((prev) => {
          const next = prev + 1;
          if (next >= REQUIRED_AD_COUNT) {
            const until = Date.now() + AD_FREE_DURATION_MS;
            setAdFreeUntil(until);
            setAdFreeUntilState(until);
            return 0;
          }
          return next;
        });
      }
    );

    const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      unsubLoaded();
      unsubEarned();
      unsubError();
      setIsLoading(false);
    });

    rewarded.load();
  };

  const resetAdFree = () => {
    setAdFreeUntil(0);
    setAdFreeUntilState(0);
    setWatchedCount(0);
  };

  return { isAdFree, adFreeUntil, watchedCount, watchAd, isLoading, resetAdFree };
}
