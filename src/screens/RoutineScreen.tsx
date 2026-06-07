import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>CheckCheck</Text>
          <TouchableOpacity style={styles.subtitleRow} onPress={() => setHelpVisible(true)} activeOpacity={0.6}>
            <Text style={styles.headerSubtitle}>{t('help.routine_subtitle')}</Text>
            <MaterialCommunityIcons name="help-circle-outline" size={13} color={Colors.textMuted} style={styles.helpIcon} />
          </TouchableOpacity>
        </View>
        <Appbar.Action icon="cog-outline" onPress={() => navigation.navigate('SettingsRoot' as never)} style={styles.action} />
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
  action: { marginHorizontal: -2 },
  headerContent: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted },
  helpIcon: { marginLeft: 4 },
});
