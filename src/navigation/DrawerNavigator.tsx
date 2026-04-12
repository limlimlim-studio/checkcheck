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
      }}
    >
      <Drawer.Screen name="Main" component={TabNavigator} options={{ swipeEnabled: true }} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Drawer.Screen name="CategoryDrawer" component={CategoryStack} options={{ unmountOnBlur: true } as any} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Drawer.Screen name="RoutineDrawer" component={RoutineStack} options={{ unmountOnBlur: true } as any} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Drawer.Screen name="SettingsMain" component={SettingsStack} options={{ unmountOnBlur: true } as any} />
    </Drawer.Navigator>
  );
}
