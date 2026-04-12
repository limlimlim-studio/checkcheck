import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MobileAds from 'react-native-google-mobile-ads';
import { initDb } from './src/db';
import { loadPremiumStatus } from './src/hooks/usePremiumStatus';
import { configurePurchases } from './src/screens/PremiumScreen';
import TabNavigator from './src/navigation/TabNavigator';
import { AppTheme, NavTheme } from './src/theme';

const queryClient = new QueryClient();

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    configurePurchases();
    MobileAds().initialize()
      .then(() => initDb())
      .then(() => loadPremiumStatus())
      .then(() => setReady(true))
      .catch((e) => console.error('[init error]', e));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111111' }}>
        <ActivityIndicator color="#A78BFA" />
      </View>
    );
  }

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
