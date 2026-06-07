import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GoalScreen from '../screens/GoalScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import GoalFormScreen from '../screens/GoalFormScreen';
import GoalTodoFormScreen from '../screens/GoalTodoFormScreen';

export type GoalStackParamList = {
  GoalList: undefined;
  GoalDetail: { goalId: number };
  GoalForm: {
    goal?: {
      id: number;
      title: string;
      description?: string | null;
      dueDate?: number | null;
      categoryId: number;
    };
  } | undefined;
  GoalTodoForm: {
    goalId: number;
    todo?: {
      id: number;
      title: string;
      description?: string | null;
      urgency?: number | null;
      importance?: number | null;
    };
  };
};

const Stack = createNativeStackNavigator<GoalStackParamList>();

export default function GoalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="GoalList" component={GoalScreen} />
      <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
      <Stack.Screen name="GoalForm" component={GoalFormScreen} />
      <Stack.Screen name="GoalTodoForm" component={GoalTodoFormScreen} />
    </Stack.Navigator>
  );
}
