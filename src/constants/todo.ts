import i18next from 'i18next';

export const LEVEL_LABELS = ['', '낮음', '보통', '높음'] as const;

export function getLevelOptions() {
  return [
    { value: '0', label: i18next.t('level.none') },
    { value: '1', label: i18next.t('level.low') },
    { value: '2', label: i18next.t('level.medium') },
    { value: '3', label: i18next.t('level.high') },
  ];
}

export const LEVEL_OPTIONS = getLevelOptions();
