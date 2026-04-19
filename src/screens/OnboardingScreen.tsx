import { useRef, useState } from 'react';
import { View, FlatList, Dimensions, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Colors } from '../theme';
import { setOnboardingCompleted } from '../db';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width: SW, height: SH } = Dimensions.get('window');

// 스크린샷 논리 해상도 (iPhone 기준)
const SS_W = 390;
const SS_H = 844;

const FOOTER_H = 140;

// 이미지 가로를 화면에 꽉 차게 (좌우 16px 여백)
const IMG_SCALE = (SW - 32) / SS_W;
const FULL_IMG_H = Math.round(SS_H * IMG_SCALE);

type Card = {
  image: ReturnType<typeof require>;
  title: string;
  description: string;
  cropTop?: number;    // 스크린샷 픽셀 기준 (기본 0)
  cropBottom?: number; // 스크린샷 픽셀 기준 (기본 SS_H)
};

const CARDS: Card[] = [
  {
    image: require('../../assets/onboarding/1-todo.png'),
    title: '할 일 관리',
    description: '탭을 눌러 오늘·기한별 할 일을 구분하고\n정렬로 우선순위를 정리하세요',
    cropTop: 0,
    cropBottom: 520,
  },
  {
    image: require('../../assets/onboarding/2-today.png'),
    title: '오늘 탭',
    description: '루틴과 오늘 마감 할 일을 한 화면에서\n확인하고 완료 체크하세요',
    cropTop: 0,
    cropBottom: 520,
  },
  {
    image: require('../../assets/onboarding/3-category-routine.png'),
    title: '카테고리 · 루틴 진입',
    description: '오른쪽 상단 ⋮ 버튼을 눌러\n카테고리와 루틴을 관리하세요',
    cropTop: 0,
    cropBottom: 520,
  },
  {
    image: require('../../assets/onboarding/4-category.png'),
    title: '카테고리',
    description: '색상으로 할 일을 분류하고\n드래그로 순서를 변경할 수 있어요',
    cropTop: 0,
    cropBottom: 520,
  },
  {
    image: require('../../assets/onboarding/5-routine.png'),
    title: '루틴',
    description: '매일·매주·매월 반복할 습관을\n루틴으로 등록하고 관리하세요',
    cropTop: 0,
    cropBottom: 520,
  },
  {
    image: require('../../assets/onboarding/6-history.png'),
    title: '완료 기록',
    description: '카테고리별 완료 이력을\n날짜 격자로 한눈에 확인하세요',
    cropTop: 0,
    cropBottom: 520,
  },
];


export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { top: safeTop } = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = currentIndex === CARDS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setOnboardingCompleted();
      navigation.replace('Main');
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const renderCard = ({ item }: { item: Card }) => {
    const cropTop = item.cropTop ?? 0;
    const cropBottom = item.cropBottom ?? SS_H;
    const cropTopPx = cropTop * IMG_SCALE;
    const vpH = (cropBottom - cropTop) * IMG_SCALE;

    return (
      <View style={styles.card}>
        {/* 제목 · 설명 */}
        <View style={[styles.header, { paddingTop: safeTop + 24 }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        {/* 크롭된 스크린샷 뷰포트 */}
        <View style={[styles.imageViewport, { height: vpH }]}>
          <Image
            source={item.image}
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
        data={CARDS}
        keyExtractor={(_, i) => String(i)}
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
          {CARDS.map((_, i) => (
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
          {isLast ? '시작하기' : '다음'}
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
