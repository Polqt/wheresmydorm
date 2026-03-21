import { create } from "zustand";

type OnboardingState = {
  currentIndex: number;
  resetCurrentIndex: () => void;
  setCurrentIndex: (index: number) => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentIndex: 0,
  resetCurrentIndex: () => {
    set({ currentIndex: 0 });
  },
  setCurrentIndex: (index) => {
    set({ currentIndex: index });
  },
}));
