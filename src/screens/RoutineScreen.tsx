import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import TodoTabRoutine from '../components/TodoTabRoutine';
import BannerAdView from '../components/BannerAdView';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RoutineScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="CheckCheck" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="cog-outline" onPress={() => navigation.navigate('SettingsRoot' as never)} />
      </Appbar.Header>
      <TodoTabRoutine />
      <BannerAdView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 72 },
});
