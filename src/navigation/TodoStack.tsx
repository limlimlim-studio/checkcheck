import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodoScreen from '../screens/TodoScreen';
import TodoFormScreen from '../screens/TodoFormScreen';

export type TodoStackParamList = {
  TodoList: undefined;
  TodoForm: {
    todo?: {
      id: number;
      title: string;
      description?: string | null;
      dueDate?: number | null;
      urgency?: number | null;
      importance?: number | null;
      categoryId: number;
      isCompleted: number;
    };
  } | undefined;
};

const Stack = createNativeStackNavigator<TodoStackParamList>();

export default function TodoStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TodoList" component={TodoScreen} />
      <Stack.Screen name="TodoForm" component={TodoFormScreen} />
    </Stack.Navigator>
  );
}
