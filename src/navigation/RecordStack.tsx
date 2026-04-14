import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RecordScreen from '../screens/RecordScreen';
import CategoryCompletedScreen from '../screens/CategoryCompletedScreen';

export type RecordStackParamList = {
  RecordHome: undefined;
  CategoryCompleted: {
    categoryId: number;
    categoryName: string;
    categoryColor: string;
  };
};

const Stack = createNativeStackNavigator<RecordStackParamList>();

export default function RecordStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="RecordHome" component={RecordScreen} />
      <Stack.Screen name="CategoryCompleted" component={CategoryCompletedScreen} />
    </Stack.Navigator>
  );
}
