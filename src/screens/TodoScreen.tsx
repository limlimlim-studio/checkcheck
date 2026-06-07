import { StyleSheet, View, TouchableOpacity, useWindowDimensions, InteractionManager } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TabView, TabBar } from 'react-native-tab-view';
import { useNavigation, useIsFocused, CommonActions } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { computeEffectiveToday } from '../db';
import { useDayStartStore } from '../stores/dayStartStore';
import { TodoStackParamList } from '../navigation/TodoStack';
import BannerAdView from '../components/BannerAdView';
import TodoTabList from '../components/TodoTabList';
import TodoTabOverdue from '../components/TodoTabOverdue';
import PageHelpModal from '../components/PageHelpModal';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;

const renderScene = ({ route }: { route: { key: string } }) => {
  switch (route.key) {
    case 'list': return <TodoTabList />;
    case 'overdue': return <TodoTabOverdue />;
    default: return null;
  }
};

export default function TodoScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();

  const ROUTES = [
    { key: 'list', title: t('todo.tab_list') },
    { key: 'overdue', title: t('todo.tab_overdue') },
  ];

  useEffect(() => {
    const parentNav = navigation.getParent<BottomTabNavigationProp<Record<string, undefined>>>();
    if (!parentNav) return;
    return parentNav.addListener('tabPress', () => {
      const state = navigation.getState();
      if (state && state.routes.length > 1) {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'TodoList' }] }));
      }
      setTabIndex(0);
    });
  }, [navigation]);

  useEffect(() => {
    if (!isFocused) return;
    const task = InteractionManager.runAfterInteractions(() => {
      const newEffective = computeEffectiveToday();
      if (newEffective > useDayStartStore.getState().effectiveToday) {
        useDayStartStore.getState().setEffectiveToday(newEffective);
      }
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
    });
    return () => task.cancel();
  }, [isFocused, queryClient]);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>CheckCheck</Text>
          <TouchableOpacity style={styles.subtitleRow} onPress={() => setHelpVisible(true)} activeOpacity={0.6}>
            <Text style={styles.headerSubtitle}>{t('help.todo_subtitle')}</Text>
            <MaterialCommunityIcons name="help-circle-outline" size={13} color={Colors.textMuted} style={styles.helpIcon} />
          </TouchableOpacity>
        </View>
        <Appbar.Action icon="magnify" onPress={() => navigation.navigate('Search')} style={styles.action} />
        <Appbar.Action icon="cog-outline" onPress={() => navigation.navigate('SettingsRoot' as never)} style={styles.action} />
      </Appbar.Header>

      <PageHelpModal
        visible={helpVisible}
        onDismiss={() => setHelpVisible(false)}
        title={t('help.todo_title')}
        body={t('help.todo_body')}
      />

      <TabView
        navigationState={{ index: tabIndex, routes: ROUTES }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.indicator}
            activeColor={Colors.primary}
            inactiveColor={Colors.textMuted}
            pressColor={Colors.surfaceVariant}
          />
        )}
      />

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
  tabBar: { backgroundColor: Colors.surface },
  indicator: { backgroundColor: Colors.primary },
});
