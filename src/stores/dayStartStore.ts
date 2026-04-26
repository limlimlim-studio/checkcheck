import { create } from 'zustand';

interface DayStartState {
  dayStartMinutes: number;
  setDayStartMinutes: (minutes: number) => void;
}

export const useDayStartStore = create<DayStartState>((set) => ({
  dayStartMinutes: 0,
  setDayStartMinutes: (minutes) => set({ dayStartMinutes: minutes }),
}));
