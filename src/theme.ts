import { MD3DarkTheme } from 'react-native-paper';
import { DarkTheme as NavDarkTheme } from '@react-navigation/native';

export const AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A78BFA',
    secondary: '#7C3AED',
    background: '#111111',
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    onBackground: '#F2F2F7',
    onSurface: '#F2F2F7',
    onSurfaceVariant: '#AEAEB2',
    outline: '#3A3A3C',
    elevation: {
      level0: 'transparent',
      level1: '#1C1C1E',
      level2: '#242426',
      level3: '#2C2C2E',
      level4: '#2E2E30',
      level5: '#323234',
    },
  },
};

export const NavTheme = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    background: '#111111',
    card: '#1C1C1E',
    text: '#F2F2F7',
    border: '#3A3A3C',
  },
};

// 공통으로 쓰이는 색상 상수
export const Colors = {
  background: '#111111',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  text: '#F2F2F7',
  textSecondary: '#AEAEB2',
  textMuted: '#636366',
  border: '#3A3A3C',
  danger: '#FF453A',
  dangerDark: '#B03A2E',
  tabBorder: '#2C2C2E',
  primary: '#A78BFA',
  urgency: '#FF6B6B',
  importance: '#4ECDC4',
};
