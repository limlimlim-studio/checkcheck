import { create } from 'zustand';

interface UIState {
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedCategoryId: null,
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
}));
