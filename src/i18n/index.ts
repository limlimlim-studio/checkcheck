import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ja';
import ko from './locales/ko';
import en from './locales/en';
import zh from './locales/zh';
import ja from './locales/ja';

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'zh', 'ja'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const DAYJS_LOCALE: Record<string, string> = {
  ko: 'ko',
  en: 'en',
  zh: 'zh-cn',
  ja: 'ja',
};

i18next
  .use(initReactI18next)
  .init({
    lng: 'ko',
    fallbackLng: 'ko',
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      zh: { translation: zh },
      ja: { translation: ja },
    },
    interpolation: { escapeValue: false },
  });

i18next.on('languageChanged', (lng) => {
  dayjs.locale(DAYJS_LOCALE[lng] ?? 'en');
});

export default i18next;
