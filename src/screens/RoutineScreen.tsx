import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import TodoTabRoutine from '../components/TodoTabRoutine';
import BannerAdView from '../components/BannerAdView';
import PageHelpModal from '../components/PageHelpModal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RoutineScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="CheckCheck"
          titleStyle={{ fontWeight: '700' }}
          subtitle={t('help.routine_subtitle')}
          subtitleStyle={styles.subtitle}
        />
        <Appbar.Action icon="help-circle-outline" onPress={() => setHelpVisible(true)} />
        <Appbar.Action icon="cog-outline" onPress={() => navigation.navigate('SettingsRoot' as never)} />
      </Appbar.Header>
      <PageHelpModal
        visible={helpVisible}
        onDismiss={() => setHelpVisible(false)}
        title={t('help.routine_title')}
        body={t('help.routine_body')}
      />
      <TodoTabRoutine />
      <BannerAdView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 88 },
  subtitle: { fontSize: 11, color: Colors.textMuted },
});
