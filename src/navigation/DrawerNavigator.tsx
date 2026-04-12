import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigatorScreenParams } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import SettingsStack from './SettingsStack';
import DrawerContent from '../components/DrawerContent';
import { SettingsStackParamList } from './SettingsStack';

export type DrawerParamList = {
  Main: undefined;
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
      }}
    >
      <Drawer.Screen name="Main" component={TabNavigator} />
      <Drawer.Screen name="SettingsMain" component={SettingsStack} options={{ unmountOnBlur: true }} />
    </Drawer.Navigator>
  );
}
