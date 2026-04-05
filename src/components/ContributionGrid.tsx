import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import { useCompletionsByCategory } from '../hooks/useCompletions';

type Props = {
  categoryId: number;
  color: string;
  year: number;
};

const CELL_GAP = 2;
const DAYS_IN_WEEK = 7;
const NUM_WEEKS = 53;

const TODAY_STR = (() => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
})();

// 완료 수 → 색상 (0=빈셀, 1=20%, 2=40%, 3=65%, 4+=85%)
const OPACITY_HEX = ['', '33', '66', 'A6', 'D9'];

function getCellColor(count: number, baseColor: string): string {
  if (count === 0) return Colors.surface;
  const opacityIndex = Math.min(count, 4);
  return baseColor + OPACITY_HEX[opacityIndex];
}

type Cell = { date: string; isFuture: boolean } | null;

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

function groupByWeek(dates: { date: string; isFuture: boolean }[], year: number): Cell[][] {
  const jan1DayOfWeek = new Date(year, 0, 1).getDay();
  const padded: Cell[] = [...Array(jan1DayOfWeek).fill(null), ...dates];

  const weeks: Cell[][] = [];
  for (let i = 0; i < padded.length; i += DAYS_IN_WEEK) {
    const week = padded.slice(i, i + DAYS_IN_WEEK);
    while (week.length < DAYS_IN_WEEK) week.push(null);
    weeks.push(week);
  }
  while (weeks.length < NUM_WEEKS) {
    weeks.push(Array(DAYS_IN_WEEK).fill(null));
  }
  return weeks;
}

export default function ContributionGrid({ categoryId, color, year }: Props) {
  const { data: completionMap = {} } = useCompletionsByCategory(categoryId, year);

  const dates = buildGrid(year);
  const weeks = groupByWeek(dates, year);

  return (
    <View style={styles.grid}>
      {weeks.map((week, wi) => (
        <View key={wi} style={[styles.column, { gap: CELL_GAP }]}>
          {week.map((cell, di) => {
            const isToday = cell?.date === TODAY_STR;
            let cellColor = 'transparent';
            if (cell) {
              cellColor = cell.isFuture
                ? Colors.surface
                : getCellColor(completionMap[cell.date] ?? 0, color);
            }
            return (
              <View
                key={di}
                style={[
                  styles.cell,
                  { backgroundColor: cellColor },
                  isToday && styles.todayCell,
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
    paddingVertical: 2,
  },
  column: {
    flex: 1,
    flexDirection: 'column',
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 2,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF99',
  },
});
