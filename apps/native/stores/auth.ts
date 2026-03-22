import { create } from "zustand";

type AuthFlowState = {
  pendingEmail: string | null;
  isAwaitingRoleSync: boolean;
  setPendingEmail: (email: string) => void;
  clearPendingEmail: () => void;
  setAwaitingRoleSync: () => void;
  clearAwaitingRoleSync: () => void;
};

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  pendingEmail: null,
  isAwaitingRoleSync: false,
  setPendingEmail: (email) => set({ pendingEmail: email }),
  clearPendingEmail: () => set({ pendingEmail: null }),
  setAwaitingRoleSync: () => set({ isAwaitingRoleSync: true }),
  clearAwaitingRoleSync: () => set({ isAwaitingRoleSync: false }),
}));
