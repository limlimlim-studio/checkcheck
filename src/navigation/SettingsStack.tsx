import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import CategoryFormScreen from '../screens/CategoryFormScreen';
import RoutineManagementScreen from '../screens/RoutineManagementScreen';
import RoutineFormScreen from '../screens/RoutineFormScreen';
import PremiumScreen from '../screens/PremiumScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  CategoryManagement: undefined;
  CategoryForm: {
    category?: {
      id: number;
      name: string;
      description?: string | null;
      color: string;
    };
  } | undefined;
  RoutineManagement: undefined;
  RoutineForm: {
    routine?: {
      id: number;
      categoryId: number;
      title: string;
      description?: string | null;
      repeatType: string;
      repeatValue?: string | null;
      urgency: number | null;
      importance: number | null;
      sortOrder: number;
      isActive: number;
      createdAt: number;
      updatedAt: number;
    };
  } | undefined;
  Premium: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
      <Stack.Screen name="CategoryForm" component={CategoryFormScreen} />
      <Stack.Screen name="RoutineManagement" component={RoutineManagementScreen} />
      <Stack.Screen name="RoutineForm" component={RoutineFormScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
    </Stack.Navigator>
  );
}
