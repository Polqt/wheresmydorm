import { create } from "zustand";

import type { PendingAuthEmail } from "@/types/auth";

type AuthFlowState = {
  clearPendingEmail: () => void;
  pendingEmail: PendingAuthEmail | null;
  setPendingEmail: (email: PendingAuthEmail) => void;
};

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  clearPendingEmail: () => {
    set({ pendingEmail: null });
  },
  pendingEmail: null,
  setPendingEmail: (email) => {
    set({ pendingEmail: email });
  },
}));
