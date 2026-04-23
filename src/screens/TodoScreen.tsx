import { StyleSheet, View, useWindowDimensions, InteractionManager } from 'react-native';
import { Appbar, FAB, Menu } from 'react-native-paper';
import { TabView, TabBar } from 'react-native-tab-view';
import { useNavigation, useIsFocused, CommonActions } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../theme';
import { getAdFreeUntil } from '../db';
import { runDueDateCheck } from '../hooks/useTodos';
import { TodoStackParamList } from '../navigation/TodoStack';
import BannerAdView from '../components/BannerAdView';
import TodoTabToday from '../components/TodoTabToday';
import TodoTabList from '../components/TodoTabList';
import TodoTabOverdue from '../components/TodoTabOverdue';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;

const ROUTES = [
  { key: 'today', title: '오늘' },
  { key: 'list', title: '할 일' },
  { key: 'overdue', title: '미완료' },
];

const renderScene = ({ route }: { route: { key: string } }) => {
  switch (route.key) {
    case 'today': return <TodoTabToday />;
    case 'list': return <TodoTabList />;
    case 'overdue': return <TodoTabOverdue />;
    default: return null;
  }
};

export default function TodoScreen() {
  const navigation = useNavigation<Nav>();
  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const isAdFree = getAdFreeUntil() > Date.now();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();

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
      runDueDateCheck().then((changed) => {
        if (changed) queryClient.invalidateQueries({ queryKey: ['todos'] });
      });
    });
    return () => task.cancel();
  }, [isFocused, queryClient]);

  const handleTabIndexChange = (index: number) => {
    setTabIndex(index);
  };

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
          <Menu.Item
            leadingIcon="label-multiple-outline"
            title="카테고리 관리"
            onPress={() => { setMenuVisible(false); navigation.navigate('CategoryRoot' as never); }}
          />
          <Menu.Item
            leadingIcon="autorenew"
            title="루틴 관리"
            onPress={() => { setMenuVisible(false); navigation.navigate('RoutineRoot' as never); }}
          />
        </Menu>
      </Appbar.Header>

      <TabView
        navigationState={{ index: tabIndex, routes: ROUTES }}
        renderScene={renderScene}
        onIndexChange={handleTabIndexChange}
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
          onPress={() => navigation.navigate('TodoForm')}
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
