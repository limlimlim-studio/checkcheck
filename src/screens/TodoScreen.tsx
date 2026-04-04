import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function TodoScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">할일</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
