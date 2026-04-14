import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

/** Unix timestamp(ms)를 'YYYY-MM-DD' 문자열로 변환 */
export function toDateString(ts: number): string {
  return dayjs(ts).format('YYYY-MM-DD');
}

/** Unix timestamp(ms)를 날짜 그룹 키로 변환 (완료 목록 섹션 헤더용) */
export function toDateKey(ts: number | null | undefined): string {
  if (!ts) return 'none';
  return dayjs(ts).format('YYYY-M-D');
}

/** Unix timestamp(ms)를 한국어 날짜 레이블로 변환 (오늘/어제/날짜) */
export function formatDateLabel(ts: number | null | undefined): string {
  if (!ts) return '날짜 없음';
  const d = dayjs(ts).startOf('day');
  const today = dayjs().startOf('day');

  if (d.isSame(today)) return '오늘';
  if (d.isSame(today.subtract(1, 'day'))) return '어제';
  return d.format('YYYY년 M월 D일');
}
