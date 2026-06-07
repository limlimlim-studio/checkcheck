import { StyleSheet, View, useWindowDimensions, InteractionManager } from 'react-native';
import { Appbar } from 'react-native-paper';
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
        <Appbar.Content title="CheckCheck" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="magnify" onPress={() => navigation.navigate('Search')} style={{ marginRight: -8 }} />
        <Appbar.Action icon="cog-outline" onPress={() => navigation.navigate('SettingsRoot' as never)} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 72 },
  tabBar: { backgroundColor: Colors.surface },
  indicator: { backgroundColor: Colors.primary },
});
