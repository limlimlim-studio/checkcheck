import './src/i18n';
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
import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initDb, getDayStartMinutes, getAppLanguage } from './src/db';
import { requestNotificationPermission } from './src/utils/notifications';
import RootNavigator from './src/navigation/RootNavigator';
import { AppTheme, NavTheme } from './src/theme';
import { useDayStartStore } from './src/stores/dayStartStore';
import { useLanguageStore } from './src/stores/languageStore';
import { useDayStartTimer } from './src/hooks/useDayStartTimer';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}
AppState.addEventListener('change', onAppStateChange);

const SPLASH_MIN_DURATION = 1500;

function getDeviceLanguage(): string {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  if (code === 'ko') return 'ko';
  if (code === 'ja') return 'ja';
  if (code === 'zh') return 'zh';
  return 'en';
}

function AppTimers() {
  const dayStartMinutes = useDayStartStore(s => s.dayStartMinutes);
  useDayStartTimer(dayStartMinutes);
  return null;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = Date.now();

    MobileAds().initialize()
      .then(() => initDb())
      .then(() => {
        useDayStartStore.getState().setDayStartMinutes(getDayStartMinutes());

        const savedLang = getAppLanguage();
        const resolvedLang = savedLang === 'auto' ? getDeviceLanguage() : savedLang;
        i18next.changeLanguage(resolvedLang);
        useLanguageStore.getState().setLanguage(savedLang);
      })
      .then(() => requestNotificationPermission())
      .then(async () => {
        const elapsed = Date.now() - start;
        const remaining = SPLASH_MIN_DURATION - elapsed;
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
        setReady(true);
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
        <AppTimers />
        <SafeAreaProvider>
          <PaperProvider theme={AppTheme}>
            <NavigationContainer theme={NavTheme}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
