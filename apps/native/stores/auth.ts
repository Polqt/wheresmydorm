import { create } from "zustand";

import type { PendingAuthEmail } from "@/types/auth";

type AuthFlowState = {
  clearAwaitingRoleSync: () => void;
  clearOtpCooldown: () => void;
  clearPendingEmail: () => void;
  isAwaitingRoleSync: boolean;
  pendingEmail: PendingAuthEmail | null;
  resendAvailableAt: number | null;
  setAwaitingRoleSync: () => void;
  setOtpCooldown: (resendAvailableAt: number) => void;
  setPendingEmail: (email: PendingAuthEmail) => void;
};

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  clearAwaitingRoleSync: () => {
    set({ isAwaitingRoleSync: false });
  },
  clearOtpCooldown: () => {
    set({ resendAvailableAt: null });
  },
  clearPendingEmail: () => {
    set({ pendingEmail: null });
  },
  isAwaitingRoleSync: false,
  pendingEmail: null,
  resendAvailableAt: null,
  setAwaitingRoleSync: () => {
    set({ isAwaitingRoleSync: true });
  },
  setOtpCooldown: (resendAvailableAt) => {
    set({ resendAvailableAt });
  },
  setPendingEmail: (email) => {
    set({ pendingEmail: email });
  },
}));
