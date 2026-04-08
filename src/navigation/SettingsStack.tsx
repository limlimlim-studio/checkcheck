import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import CategoryFormScreen from '../screens/CategoryFormScreen';

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
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
      <Stack.Screen name="CategoryForm" component={CategoryFormScreen} />
    </Stack.Navigator>
  );
}
