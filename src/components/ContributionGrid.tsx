import { ScrollView, View, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import { useCompletionsByCategory } from '../hooks/useCompletions';

type Props = {
  categoryId: number;
  color: string;
  year: number;
};

const CELL_SIZE = 11;
const CELL_GAP = 2;
const DAYS_IN_WEEK = 7;

// 완료 수 → 색상 (0=빈셀, 1=20%, 2=40%, 3=65%, 4+=85%)
const OPACITY_HEX = ['', '33', '66', 'A6', 'D9'];

function getCellColor(count: number, baseColor: string): string {
  if (count === 0) return Colors.surface;
  const opacityIndex = Math.min(count, 4);
  const opacity = OPACITY_HEX[opacityIndex];
  // 4 이상은 불투명도 100% → 색상 그대로
  return opacity === 'FF' ? baseColor : baseColor + opacity;
}

const TODAY = new Date();
TODAY.setHours(23, 59, 59, 999);

function buildGrid(year: number): { date: string; isFuture: boolean }[] {
  const dates: { date: string; isFuture: boolean }[] = [];
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push({ date: `${year}-${mm}-${dd}`, isFuture: d > TODAY });
  }
  return dates;
}

type Cell = { date: string; isFuture: boolean } | null;

function groupByWeek(dates: { date: string; isFuture: boolean }[], year: number): Cell[][] {
  const jan1DayOfWeek = new Date(year, 0, 1).getDay();
  const padded: Cell[] = [...Array(jan1DayOfWeek).fill(null), ...dates];

  const weeks: Cell[][] = [];
  for (let i = 0; i < padded.length; i += DAYS_IN_WEEK) {
    const week = padded.slice(i, i + DAYS_IN_WEEK);
    while (week.length < DAYS_IN_WEEK) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

export default function ContributionGrid({ categoryId, color, year }: Props) {
  const { data: completionMap = {} } = useCompletionsByCategory(categoryId, year);

  const dates = buildGrid(year);
  const weeks = groupByWeek(dates, year);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.column}>
            {week.map((cell, di) => {
              let cellColor = 'transparent';
              if (cell) {
                cellColor = cell.isFuture
                  ? Colors.surface
                  : getCellColor(completionMap[cell.date] ?? 0, color);
              }
              return (
                <View
                  key={di}
                  style={[styles.cell, { backgroundColor: cellColor }]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: CELL_GAP,
    paddingVertical: 2,
  },
  column: {
    flexDirection: 'column',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
});
