import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import TodoStack from './TodoStack';
import RecordStack from './RecordStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

type IconProps = { color: string; size: number };

export default function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="할 일"
        component={TodoStack}
        options={{
          tabBarLabel: t('nav.todo'),
          tabBarIcon: ({ color, size }: IconProps) => (
            <MaterialCommunityIcons name="check-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="기록"
        component={RecordStack}
        options={{
          tabBarLabel: t('nav.record'),
          tabBarIcon: ({ color, size }: IconProps) => (
            <MaterialCommunityIcons name="calendar-month-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="설정"
        component={SettingsStack}
        options={{
          tabBarLabel: t('nav.settings'),
          tabBarIcon: ({ color, size }: IconProps) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
