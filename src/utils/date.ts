import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ja';
import i18next from 'i18next';

export function toDateString(ts: number): string {
  return dayjs(ts).format('YYYY-MM-DD');
}

export function toDateKey(ts: number | null | undefined): string {
  if (!ts) return 'none';
  return dayjs(ts).format('YYYY-M-D');
}

export function formatDateLabel(ts: number | null | undefined): string {
  if (!ts) return i18next.t('date.no_date');
  const d = dayjs(ts).startOf('day');
  const today = dayjs().startOf('day');

  if (d.isSame(today)) return i18next.t('date.today');
  if (d.isSame(today.subtract(1, 'day'))) return i18next.t('date.yesterday');
  return d.format(i18next.t('date.format_year_month_day'));
}

export function formatDueDateLabel(ts: number | null | undefined): string {
  if (!ts) return i18next.t('date.no_date');
  const d = dayjs(ts).startOf('day');
  const today = dayjs().startOf('day');
  const diff = d.diff(today, 'day');

  if (diff === 0) return i18next.t('date.today');
  if (diff === 1) return i18next.t('date.tomorrow');
  if (diff === -1) return i18next.t('date.yesterday');
  if (d.year() === today.year()) return d.format(i18next.t('date.format_month_day'));
  return d.format(i18next.t('date.format_year_month_day_ddd'));
}
