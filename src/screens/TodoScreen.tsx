import { StyleSheet, View, FlatList } from 'react-native';
import { Appbar, Text, FAB, Button, Divider, Dialog, Portal } from 'react-native-paper';
import { Colors } from '../theme';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTodos, useToggleTodo, useClearCompleted, useReorderTodos } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';
import BannerAdView from '../components/BannerAdView';
import { usePremiumStore } from '../stores/premiumStore';
import { TodoStackParamList } from '../navigation/TodoStack';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

type Nav = NativeStackNavigationProp<TodoStackParamList, 'TodoList'>;
type Tab = 'active' | 'completed';

type Todo = {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: number | null;
  urgency?: number | null;
  importance?: number | null;
  isCompleted: number;
  completedAt?: number | null;
  categoryId: number;
  sortOrder: number;
};

type ListItem =
  | { type: 'header'; label: string; key: string }
  | { type: 'todo'; todo: Todo };

function formatDateLabel(ts: number | null | undefined): string {
  if (!ts) return '날짜 없음';
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (day.getTime() === today.getTime()) return '오늘';
  if (day.getTime() === yesterday.getTime()) return '어제';
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function toDateKey(ts: number | null | undefined): string {
  if (!ts) return 'none';
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildCompletedList(todos: Todo[]): ListItem[] {
  const result: ListItem[] = [];
  let lastKey = '';
  for (const todo of todos) {
    const key = toDateKey(todo.completedAt);
    if (key !== lastKey) {
      result.push({ type: 'header', label: formatDateLabel(todo.completedAt), key });
      lastKey = key;
    }
    result.push({ type: 'todo', todo });
  }
  return result;
}

export default function TodoScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  useEffect(() => {
    const parentNav = navigation.getParent();
    if (!parentNav) return;
    return parentNav.addListener('tabPress', () => {
      setActiveTab('active');
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'TodoList' }] }));
    });
  }, [navigation]);

  const { data: activeTodos = [] } = useTodos(0);
  const { data: completedTodos = [] } = useTodos(1);
  const { data: categories = [] } = useCategories();
  const { mutate: toggleTodo } = useToggleTodo();
  const { mutate: clearCompleted } = useClearCompleted();
  const { mutate: reorderTodos } = useReorderTodos();
  const isPremium = usePremiumStore((s) => s.isPremium);

  const getCategoryById = (id: number) => categories.find((c) => c.id === id);

  const renderActiveItem = ({ item, drag, isActive }: RenderItemParams<Todo>) => (
    <ScaleDecorator>
      <TodoItem
        todo={item}
        category={getCategoryById(item.categoryId)}
        onToggle={() => toggleTodo({ id: item.id, isCompleted: item.isCompleted })}
        onPress={() => navigation.navigate('TodoForm', { todo: item })}
        onDrag={drag}
        isDragging={isActive}
      />
    </ScaleDecorator>
  );

  const completedList = buildCompletedList(completedTodos as Todo[]);

  const renderCompletedItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return <Text style={styles.dateHeader}>{item.label}</Text>;
    }
    return (
      <>
        <TodoItem
          todo={item.todo}
          category={getCategoryById(item.todo.categoryId)}
          onToggle={() => toggleTodo({ id: item.todo.id, isCompleted: item.todo.isCompleted })}
          onPress={() => navigation.navigate('TodoForm', { todo: item.todo })}
        />
        <Divider />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="할 일" />
        {activeTab === 'completed' && completedTodos.length > 0 && (
          <Appbar.Action icon="delete-sweep" onPress={() => setClearDialogVisible(true)} />
        )}
      </Appbar.Header>

      <View style={styles.tabs}>
        <Button
          mode={activeTab === 'active' ? 'contained' : 'text'}
          onPress={() => setActiveTab('active')}
          style={styles.tabBtn}
          compact
        >
          진행 중 {activeTodos.length > 0 ? `(${activeTodos.length})` : ''}
        </Button>
        <Button
          mode={activeTab === 'completed' ? 'contained' : 'text'}
          onPress={() => setActiveTab('completed')}
          style={styles.tabBtn}
          compact
        >
          완료 {completedTodos.length > 0 ? `(${completedTodos.length})` : ''}
        </Button>
      </View>

      {activeTab === 'active' ? (
        <DraggableFlatList
          data={activeTodos as Todo[]}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <Text style={styles.empty}>할 일이 없어요</Text>
          }
          renderItem={renderActiveItem}
          onDragEnd={({ data }) => reorderTodos(data.map((t) => t.id))}
          autoscrollThreshold={80}
          autoscrollSpeed={200}
          containerStyle={{ flex: 1 }}
        />
      ) : (
        <FlatList
          data={completedList}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${item.key}` : `todo-${item.todo.id}`
          }
          renderItem={renderCompletedItem}
          ListEmptyComponent={
            <Text style={styles.empty}>완료된 항목이 없어요</Text>
          }
          style={{ flex: 1 }}
        />
      )}

      <BannerAdView />

      {activeTab === 'active' && (
        <FAB icon="plus" style={[styles.fab, !isPremium && styles.fabWithAd]} onPress={() => navigation.navigate('TodoForm')} />
      )}

      <Portal>
        <Dialog visible={clearDialogVisible} onDismiss={() => setClearDialogVisible(false)}>
          <Dialog.Title>완료 목록 비우기</Dialog.Title>
          <Dialog.Content>
            <Text>완료된 할 일이 목록에서 삭제됩니다.{'\n'}완료 기록은 기록 탭에 유지됩니다.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>취소</Button>
            <Button
              textColor={Colors.danger}
              onPress={() => { clearCompleted(); setClearDialogVisible(false); }}
            >
              비우기
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tabBorder,
  },
  tabBtn: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  fabWithAd: { bottom: 74 },
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
