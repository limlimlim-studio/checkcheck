import { create } from 'zustand';

interface PremiumState {
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  setIsPremium: (value) => set({ isPremium: value }),
}));
