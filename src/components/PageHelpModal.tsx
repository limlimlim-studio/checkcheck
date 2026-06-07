import { ScrollView } from 'react-native';
import { Dialog, Portal, Text, Button } from 'react-native-paper';
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
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 300, paddingHorizontal: 0 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}>
            <Text variant="bodyMedium" style={{ color: Colors.textSecondary, lineHeight: 22 }}>
              {body}
            </Text>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('help.close')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
