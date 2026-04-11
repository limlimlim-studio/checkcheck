import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { initDb } from './src/db';
import TabNavigator from './src/navigation/TabNavigator';
import { AppTheme, NavTheme } from './src/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const MIN_SPLASH_MS = 1500;

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = Date.now();
    initDb()
      .then(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
        setTimeout(() => setReady(true), remaining);
      })
      .catch((e) => console.error('[initDb error]', e));
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider theme={AppTheme}>
            <NavigationContainer theme={NavTheme}>
              <StatusBar style="light" />
              <TabNavigator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
