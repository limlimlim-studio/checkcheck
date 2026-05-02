import { useState } from 'react';
import { Platform } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { getAdFreeUntil, setAdFreeUntil } from '../db';

const PROD_REWARDED_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-9156090950228888/3269553980',
  // TODO: AdMob에 Android 앱 등록 후 아래 ID 교체
  android: TestIds.REWARDED,
  default: TestIds.REWARDED,
});

const adUnitId = __DEV__ ? TestIds.REWARDED : PROD_REWARDED_AD_UNIT_ID!;

const AD_FREE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30일
export const REQUIRED_AD_COUNT = 2;

const AD_LOAD_TIMEOUT_MS = 30_000;

export function useAdFree() {
  const [adFreeUntil, setAdFreeUntilState] = useState(() => getAdFreeUntil());
  const [watchedCount, setWatchedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const isAdFree = adFreeUntil > Date.now();

  const watchAd = () => {
    if (isLoading) return;
    setIsLoading(true);

    const rewarded = RewardedAd.createForAdRequest(adUnitId);

    const unsubs: Array<() => void> = [];
    let cleanedUp = false;
    let loadTimeoutId: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearTimeout(loadTimeoutId);
      unsubs.forEach(fn => fn());
    };

    loadTimeoutId = setTimeout(() => {
      if (__DEV__) console.warn('[AdFree] 광고 로드 타임아웃');
      cleanup();
      setIsLoading(false);
    }, AD_LOAD_TIMEOUT_MS);

    unsubs.push(rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      clearTimeout(loadTimeoutId);
      setIsLoading(false);
      rewarded.show().catch(() => cleanup());
    }));

    unsubs.push(rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
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
    }));

    unsubs.push(rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      cleanup();
    }));

    unsubs.push(rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[AdFree] 광고 로드 실패:', error);
      cleanup();
      setIsLoading(false);
    }));

    rewarded.load();
  };

  const resetAdFree = () => {
    setAdFreeUntil(0);
    setAdFreeUntilState(0);
    setWatchedCount(0);
  };

  return { isAdFree, adFreeUntil, watchedCount, watchAd, isLoading, resetAdFree };
}
