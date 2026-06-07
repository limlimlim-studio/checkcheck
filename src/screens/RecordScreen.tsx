import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Text, IconButton, TouchableRipple } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme';
import { useCategories } from '../hooks/useCategories';
import { useEarliestCompletionYear, useAllCompletionsByYear } from '../hooks/useCompletions';
import ContributionGrid from '../components/ContributionGrid';
import BannerAdView from '../components/BannerAdView';
import PageHelpModal from '../components/PageHelpModal';
import { RecordStackParamList } from '../navigation/RecordStack';

type Nav = NativeStackNavigationProp<RecordStackParamList, 'RecordHome'>;

const CURRENT_YEAR = new Date().getFullYear();

export default function RecordScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [helpVisible, setHelpVisible] = useState(false);
  const { data: categories = [] } = useCategories();
  const { data: earliestYear = CURRENT_YEAR } = useEarliestCompletionYear();
  const { data: allCellColorMap = {} } = useAllCompletionsByYear(year);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="CheckCheck"
          titleStyle={{ fontWeight: '700' }}
          subtitle={t('help.record_subtitle')}
          subtitleStyle={styles.subtitle}
        />
        <Appbar.Action icon="help-circle-outline" onPress={() => setHelpVisible(true)} />
        <Appbar.Action icon="cog-outline" onPress={() => navigation.navigate('SettingsRoot' as never)} />
      </Appbar.Header>
      <PageHelpModal
        visible={helpVisible}
        onDismiss={() => setHelpVisible(false)}
        title={t('help.record_title')}
        body={t('help.record_body')}
      />

      <View style={styles.yearRow}>
        <IconButton
          icon="chevron-left"
          iconColor={year <= earliestYear ? Colors.textMuted : Colors.text}
          disabled={year <= earliestYear}
          onPress={() => setYear((y) => y - 1)}
        />
        <Text style={styles.yearText}>{year}</Text>
        <IconButton
          icon="chevron-right"
          iconColor={year >= CURRENT_YEAR ? Colors.textMuted : Colors.text}
          disabled={year >= CURRENT_YEAR}
          onPress={() => setYear((y) => y + 1)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 전체 섹션 */}
        <View style={styles.section}>
          <TouchableRipple
            onPress={() => navigation.navigate('AllCompleted')}
            rippleColor={Colors.surfaceVariant}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.dot, { backgroundColor: Colors.textMuted }]} />
              <Text variant="titleSmall" style={styles.categoryName}>
                {t('record.all_title')}
              </Text>
              <IconButton
                icon="chevron-right"
                size={16}
                iconColor={Colors.textMuted}
                style={styles.chevron}
              />
            </View>
          </TouchableRipple>
          <ContributionGrid year={year} cellColorMap={allCellColorMap} onPress={() => navigation.navigate('AllCompleted')} />
        </View>

        {categories.map((category) => (
          <View key={category.id} style={styles.section}>
            <TouchableRipple
              onPress={() => navigation.navigate('CategoryCompleted', {
                categoryId: category.id,
                categoryName: category.name,
                categoryColor: category.color,
              })}
              rippleColor={Colors.surfaceVariant}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.dot, { backgroundColor: category.color }]} />
                <Text variant="titleSmall" style={styles.categoryName}>
                  {category.name}
                </Text>
                {category.description ? (
                  <Text variant="bodySmall" style={styles.categoryDesc} numberOfLines={1} ellipsizeMode="tail">
                    {category.description}
                  </Text>
                ) : null}
                <IconButton
                  icon="chevron-right"
                  size={16}
                  iconColor={Colors.textMuted}
                  style={styles.chevron}
                />
              </View>
            </TouchableRipple>
            <ContributionGrid categoryId={category.id} color={category.color} year={year} />
          </View>
        ))}
      </ScrollView>
      <BannerAdView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { height: 88 },
  subtitle: { fontSize: 11, color: Colors.textMuted },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  yearText: { color: Colors.text, fontWeight: '700', fontSize: 16, minWidth: 40, textAlign: 'center' },
  content: { paddingVertical: 8 },
  section: {
    paddingHorizontal: 2,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chevron: { marginLeft: 'auto', margin: 0 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { color: Colors.text },
  categoryDesc: { color: Colors.textMuted, flexShrink: 1 },
});
