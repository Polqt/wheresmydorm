import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { useAuth } from "@/providers/auth-provider";
import type { RoleFilter } from "@/services/admin";
import { trpc } from "@/utils/api-client";

type Feedback = {
  tone: "error" | "success";
  message: string;
};

const USERS_QUERY_KEY = ["trpc", "admin", "listUsers"];

export function useAdminUsers() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    ...trpc.admin.listUsers.queryOptions({
      limit: 50,
      role: roleFilter === "all" ? undefined : roleFilter,
    }),
    enabled: role === "admin",
  });

  const banUser = useMutation(
    trpc.admin.banUser.mutationOptions({
      onError: (error) => {
        setFeedback({ tone: "error", message: error.message || "Ban action failed." });
        setActiveUserId(null);
      },
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
        setFeedback({
          tone: "success",
          message: data.banned ? "User banned." : "User unbanned.",
        });
        setActiveUserId(null);
      },
    }),
  );

  const setFinderPaid = useMutation(
    trpc.admin.setFinderPaid.mutationOptions({
      onError: (error) => {
        setFeedback({ tone: "error", message: error.message || "Update failed." });
        setActiveUserId(null);
      },
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
        setFeedback({
          tone: "success",
          message: data.isPaidFinder ? "Finder upgraded to paid." : "Finder downgraded to free.",
        });
        setActiveUserId(null);
      },
    }),
  );

  const handleBanUser = useCallback(
    (userId: string, banned: boolean) => {
      setFeedback(null);
      setActiveUserId(userId);
      banUser.mutate({ userId, banned });
    },
    [banUser],
  );

  const handleToggleFinderPaid = useCallback(
    (userId: string, currentIsPaid: boolean) => {
      setFeedback(null);
      setActiveUserId(userId);
      setFinderPaid.mutate({ userId, isPaidFinder: !currentIsPaid });
    },
    [setFinderPaid],
  );

  const dismissFeedback = useCallback(() => setFeedback(null), []);

  return {
    activeUserId,
    feedback,
    isBusy: banUser.isPending || setFinderPaid.isPending,
    isBanPending: banUser.isPending,
    isFinderPaidPending: setFinderPaid.isPending,
    isLoading: usersQuery.isLoading,
    items: usersQuery.data?.items ?? [],
    roleFilter,
    setRoleFilter,
    onBanUser: handleBanUser,
    onToggleFinderPaid: handleToggleFinderPaid,
    onDismissFeedback: dismissFeedback,
  };
}
