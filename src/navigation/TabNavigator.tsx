import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import TodoStack from './TodoStack';
import RecordStack from './RecordStack';
import GoalStack from './GoalStack';
import RoutineScreen from '../screens/RoutineScreen';

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
        name="루틴"
        component={RoutineScreen}
        options={{
          tabBarLabel: t('nav.routine'),
          tabBarIcon: ({ color, size }: IconProps) => (
            <MaterialCommunityIcons name="repeat" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="목표"
        component={GoalStack}
        options={{
          tabBarLabel: t('nav.goal'),
          tabBarIcon: ({ color, size }: IconProps) => (
            <MaterialCommunityIcons name="flag-outline" size={size} color={color} />
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
    </Tab.Navigator>
  );
}
