import { StyleSheet, View, useWindowDimensions, InteractionManager } from 'react-native';
import { Appbar, FAB, Menu } from 'react-native-paper';
import { TabView, TabBar } from 'react-native-tab-view';
import { useNavigation, useIsFocused, CommonActions } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { getAdFreeUntil, computeEffectiveToday } from '../db';
import { useDayStartStore } from '../stores/dayStartStore';
import { runDueDateCheck, useFlushTodayCompleted } from '../hooks/useTodos';
import { TodoStackParamList } from '../navigation/TodoStack';
import BannerAdView from '../components/BannerAdView';
import TodoTabList from '../components/TodoTabList';
import TodoTabRoutine from '../components/TodoTabRoutine';
import TodoTabOverdue from '../components/TodoTabOverdue';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;

const renderScene = ({ route }: { route: { key: string } }) => {
  switch (route.key) {
    case 'list': return <TodoTabList />;
    case 'routine': return <TodoTabRoutine />;
    case 'overdue': return <TodoTabOverdue />;
    default: return null;
  }
};

export default function TodoScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const isAdFree = getAdFreeUntil() > Date.now();
  const { mutate: flushTodayCompleted } = useFlushTodayCompleted();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();

  const ROUTES = [
    { key: 'list', title: t('todo.tab_list') },
    { key: 'routine', title: t('todo.tab_routine') },
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
      // effectiveToday를 앞으로만 갱신 (뒤로 돌아가지 않음)
      const newEffective = computeEffectiveToday();
      if (newEffective > useDayStartStore.getState().effectiveToday) {
        useDayStartStore.getState().setEffectiveToday(newEffective);
      }
      runDueDateCheck().then(() => {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
      });
    });
    return () => task.cancel();
  }, [isFocused, queryClient]);

  const showFab = tabIndex === 0 || tabIndex === 1;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="CheckCheck" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="magnify" onPress={() => navigation.navigate('Search')} style={{ marginRight: -8 }} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
          }
        >
          {tabIndex === 0 && (
            <Menu.Item
              leadingIcon="broom"
              title={t('todo.menu_clear')}
              onPress={() => { setMenuVisible(false); flushTodayCompleted(); }}
            />
          )}
          <Menu.Item
            leadingIcon="label-multiple-outline"
            title={t('todo.menu_category')}
            onPress={() => { setMenuVisible(false); navigation.navigate('CategoryRoot' as never); }}
          />
          <Menu.Item
            leadingIcon="autorenew"
            title={t('todo.menu_routine')}
            onPress={() => { setMenuVisible(false); navigation.navigate('RoutineRoot' as never); }}
          />
        </Menu>
      </Appbar.Header>

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

      {showFab && (
        <FAB
          icon="plus"
          style={[styles.fab, !isAdFree && styles.fabWithAd]}
          onPress={() => {
            if (tabIndex === 0) navigation.navigate('TodoForm');
            else navigation.navigate('RoutineRoot' as never);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 72 },
  tabBar: { backgroundColor: Colors.surface },
  indicator: { backgroundColor: Colors.primary },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  fabWithAd: { bottom: 74 },
});
