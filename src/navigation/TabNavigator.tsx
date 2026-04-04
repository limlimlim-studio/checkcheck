import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TodoScreen from '../screens/TodoScreen';
import RecordScreen from '../screens/RecordScreen';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="할일" component={TodoScreen} />
      <Tab.Screen name="기록" component={RecordScreen} />
      <Tab.Screen name="설정" component={SettingsStack} />
    </Tab.Navigator>
  );
}
