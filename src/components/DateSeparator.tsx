import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme';

type Props = { label: string };

export default function DateSeparator({ label }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
    backgroundColor: Colors.background,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
