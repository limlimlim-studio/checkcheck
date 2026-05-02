import { create } from 'zustand';

interface DayStartState {
  dayStartMinutes: number;
  setDayStartMinutes: (minutes: number) => void;
  /** 하루 시작 시간 기준 유효 오늘 날짜 (YYYY-MM-DD) */
  effectiveToday: string;
  setEffectiveToday: (date: string) => void;
}

export const useDayStartStore = create<DayStartState>((set) => ({
  dayStartMinutes: 0,
  setDayStartMinutes: (minutes) => set({ dayStartMinutes: minutes }),
  effectiveToday: new Date().toISOString().split('T')[0],
  setEffectiveToday: (date) => set({ effectiveToday: date }),
}));
