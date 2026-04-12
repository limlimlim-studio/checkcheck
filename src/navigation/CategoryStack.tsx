import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import CategoryFormScreen from '../screens/CategoryFormScreen';

export type CategoryStackParamList = {
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

const Stack = createNativeStackNavigator<CategoryStackParamList>();

export default function CategoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
      <Stack.Screen name="CategoryForm" component={CategoryFormScreen} />
    </Stack.Navigator>
  );
}
