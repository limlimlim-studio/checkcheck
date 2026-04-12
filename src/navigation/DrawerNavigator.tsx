import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigatorScreenParams } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import SettingsStack, { SettingsStackParamList } from './SettingsStack';
import CategoryStack, { CategoryStackParamList } from './CategoryStack';
import RoutineStack, { RoutineStackParamList } from './RoutineStack';
import DrawerContent from '../components/DrawerContent';

export type DrawerParamList = {
  Main: undefined;
  CategoryDrawer: NavigatorScreenParams<CategoryStackParamList> | undefined;
  RoutineDrawer: NavigatorScreenParams<RoutineStackParamList> | undefined;
  SettingsMain: NavigatorScreenParams<SettingsStackParamList> | undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEnabled: false,
        drawerStyle: { width: '62%' },
      }}
    >
      <Drawer.Screen name="Main" component={TabNavigator} />
      <Drawer.Screen name="CategoryDrawer" component={CategoryStack} />
      <Drawer.Screen name="RoutineDrawer" component={RoutineStack} />
      <Drawer.Screen name="SettingsMain" component={SettingsStack} />
    </Drawer.Navigator>
  );
}
