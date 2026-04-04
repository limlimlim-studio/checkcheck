import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  CategoryManagement: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
    </Stack.Navigator>
  );
}
