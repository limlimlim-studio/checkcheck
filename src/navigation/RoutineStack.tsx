import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoutineManagementScreen from '../screens/RoutineManagementScreen';
import RoutineFormScreen from '../screens/RoutineFormScreen';

export type RoutineStackParamList = {
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
};

const Stack = createNativeStackNavigator<RoutineStackParamList>();

export default function RoutineStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="RoutineManagement" component={RoutineManagementScreen} />
      <Stack.Screen name="RoutineForm" component={RoutineFormScreen} />
    </Stack.Navigator>
  );
}
