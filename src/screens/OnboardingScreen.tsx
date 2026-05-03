import { useRef, useState } from 'react';
import { View, FlatList, Dimensions, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Colors } from '../theme';
import { setOnboardingCompleted } from '../db';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width: SW } = Dimensions.get('window');

const SS_W = 390;
const SS_H = 844;
const FOOTER_H = 140;
const IMG_SCALE = (SW - 32) / SS_W;
const FULL_IMG_H = Math.round(SS_H * IMG_SCALE);

type CardKey =
  | 'card_1' | 'card_2' | 'card_3'
  | 'card_4' | 'card_5' | 'card_6';

const CARD_IMAGES: Record<CardKey, ReturnType<typeof require>> = {
  card_1: require('../../assets/onboarding/1-todo.png'),
  card_2: require('../../assets/onboarding/2-today.png'),
  card_3: require('../../assets/onboarding/3-category-routine.png'),
  card_4: require('../../assets/onboarding/4-category.png'),
  card_5: require('../../assets/onboarding/5-routine.png'),
  card_6: require('../../assets/onboarding/6-history.png'),
};

const CARD_KEYS: CardKey[] = ['card_1', 'card_2', 'card_3', 'card_4', 'card_5', 'card_6'];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { top: safeTop } = useSafeAreaInsets();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = currentIndex === CARD_KEYS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setOnboardingCompleted();
      navigation.replace('Main');
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const renderCard = ({ item }: { item: CardKey }) => {
    const cropTopPx = 0;
    const vpH = 520 * IMG_SCALE;

    return (
      <View style={styles.card}>
        <View style={[styles.header, { paddingTop: safeTop + 24 }]}>
          <Text style={styles.title}>{t(`onboarding.${item}_title`)}</Text>
          <Text style={styles.description}>{t(`onboarding.${item}_desc`)}</Text>
        </View>

        <View style={[styles.imageViewport, { height: vpH }]}>
          <Image
            source={CARD_IMAGES[item]}
            style={{
              position: 'absolute',
              top: -cropTopPx,
              left: 0,
              width: SW - 32,
              height: FULL_IMG_H,
            }}
            resizeMode="stretch"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={CARD_KEYS}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SW);
          setCurrentIndex(index);
        }}
        renderItem={renderCard}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {CARD_KEYS.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {isLast ? t('onboarding.start') : t('onboarding.next')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flatList: { flex: 1 },
  card: {
    width: SW,
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  imageViewport: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  footer: {
    height: FOOTER_H,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 20,
    backgroundColor: Colors.background,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceVariant,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  button: {
    width: SW - 48,
    borderRadius: 12,
  },
  buttonContent: { paddingVertical: 4 },
  buttonLabel: { fontSize: 15, fontWeight: '600' },
});
