import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import CategoryStack, { CategoryStackParamList } from './CategoryStack';
import RoutineStack, { RoutineStackParamList } from './RoutineStack';

export type RootStackParamList = {
  Main: undefined;
  CategoryRoot: NavigatorScreenParams<CategoryStackParamList>;
  RoutineRoot: NavigatorScreenParams<RoutineStackParamList>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="CategoryRoot" component={CategoryStack} />
      <Stack.Screen name="RoutineRoot" component={RoutineStack} />
    </Stack.Navigator>
  );
}
