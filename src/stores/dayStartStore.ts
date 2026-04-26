import { create } from 'zustand';

interface DayStartState {
  dayStartHour: number;
  setDayStartHour: (hour: number) => void;
}

export const useDayStartStore = create<DayStartState>((set) => ({
  dayStartHour: 0,
  setDayStartHour: (hour) => set({ dayStartHour: hour }),
}));
