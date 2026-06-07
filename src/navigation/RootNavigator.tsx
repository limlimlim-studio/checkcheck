import { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import RoutineStack, { RoutineStackParamList } from './RoutineStack';
import SettingsStack, { SettingsStackParamList } from './SettingsStack';
import OnboardingScreen from '../screens/OnboardingScreen';
import { getOnboardingCompleted } from '../db';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  RoutineRoot: NavigatorScreenParams<RoutineStackParamList>;
  SettingsRoot: NavigatorScreenParams<SettingsStackParamList>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute] = useState<'Onboarding' | 'Main'>(() =>
    getOnboardingCompleted() ? 'Main' : 'Onboarding',
  );

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="RoutineRoot" component={RoutineStack} />
      <Stack.Screen name="SettingsRoot" component={SettingsStack} />
    </Stack.Navigator>
  );
}
