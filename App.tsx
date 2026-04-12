import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MobileAds from 'react-native-google-mobile-ads';
import { initDb } from './src/db';
import { loadPremiumStatus } from './src/hooks/usePremiumStatus';
import { configurePurchases } from './src/screens/PremiumScreen';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import { AppTheme, NavTheme } from './src/theme';

// JS 로드 직후 스플래시를 자동으로 숨기지 않도록 유지
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// 앱이 포그라운드로 돌아올 때 TanStack Query 자동 갱신
function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}
AppState.addEventListener('change', onAppStateChange);

// 스플래시 최소 유지 시간 (ms)
const SPLASH_MIN_DURATION = 1500;

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = Date.now();

    configurePurchases();
    MobileAds().initialize()
      .then(() => initDb())
      .then(() => loadPremiumStatus())
      .then(async () => {
        // 최소 유지 시간 보장 후 앱 렌더링 → 스플래시 숨김
        const elapsed = Date.now() - start;
        const remaining = SPLASH_MIN_DURATION - elapsed;
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
        setReady(true);
        // 컴포넌트 트리가 그려진 다음 프레임에 숨겨서 흰 화면 방지
        requestAnimationFrame(() => SplashScreen.hideAsync());
      })
      .catch((e) => {
        console.error('[init error]', e);
        setReady(true);
        requestAnimationFrame(() => SplashScreen.hideAsync());
      });
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#111111' }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider theme={AppTheme}>
            <NavigationContainer theme={NavTheme}>
              <StatusBar style="light" />
              <DrawerNavigator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
