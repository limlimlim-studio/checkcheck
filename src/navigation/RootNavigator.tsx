import { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import CategoryStack, { CategoryStackParamList } from './CategoryStack';
import RoutineStack, { RoutineStackParamList } from './RoutineStack';
import OnboardingScreen from '../screens/OnboardingScreen';
import { getOnboardingCompleted } from '../db';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  CategoryRoot: NavigatorScreenParams<CategoryStackParamList>;
  RoutineRoot: NavigatorScreenParams<RoutineStackParamList>;
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
      <Stack.Screen name="CategoryRoot" component={CategoryStack} />
      <Stack.Screen name="RoutineRoot" component={RoutineStack} />
    </Stack.Navigator>
  );
}
