import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme';

// hex 색상의 채도를 낮춰 반환 (amount: 0~1, 낮출수록 무채색에 가까워짐)
function desaturate(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  const newS = Math.max(0, s - amount);

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + newS) : l + newS - l * newS;
  const p = 2 * l - q;
  const nr = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const ng = Math.round(hue2rgb(p, q, h) * 255);
  const nb = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

type Segment = {
  categoryId: number;
  color: string;
  count: number;
};

type Props = {
  segments: Segment[];   // 카테고리별 완료 수
  totalCompleted: number;
  total: number;
};

export default function TodayProgressBar({ segments, totalCompleted, total }: Props) {
  if (total === 0) return null;

  const uncompleted = total - totalCompleted;
  const percent = Math.round((totalCompleted / total) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <View
              key={seg.categoryId}
              style={[
                styles.segment,
                { flex: seg.count, backgroundColor: desaturate(seg.color, 0.2) },
                isLast && uncompleted > 0 && styles.segmentRoundedEnd,
              ]}
            />
          );
        })}
        {uncompleted > 0 && (
          <View style={[styles.segment, { flex: uncompleted, backgroundColor: Colors.surfaceVariant }]} />
        )}
        <Text style={styles.percentLabel}>{percent}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: Colors.background,
    gap: 6,
  },
  bar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
  },
  segment: {
    height: '100%',
  },
  segmentRoundedEnd: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  percentLabel: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
