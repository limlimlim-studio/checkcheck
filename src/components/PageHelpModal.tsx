import { StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  body: string;
}

export default function PageHelpModal({ visible, onDismiss, title, body }: Props) {
  const { t } = useTranslation();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.title}>{title}</Text>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text variant="bodyMedium" style={styles.body}>{body}</Text>
        </ScrollView>
        <Button mode="text" onPress={onDismiss} style={styles.closeBtn} labelStyle={styles.closeBtnLabel}>
          {t('help.close')}
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    maxHeight: '70%',
  },
  title: {
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  body: {
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  closeBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  closeBtnLabel: {
    color: Colors.primary,
  },
});
