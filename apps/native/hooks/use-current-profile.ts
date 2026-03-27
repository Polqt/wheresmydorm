import type { User } from "@supabase/supabase-js";

import { useQuery } from "@tanstack/react-query";

import { PROFILE_QUERY_KEY } from "@/lib/auth";
import { getOrCreateCurrentProfile } from "@/services/profile";

export function useCurrentProfile(user: User | null) {
  return useQuery({
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) {
        throw new Error("Missing authenticated user.");
      }

      return getOrCreateCurrentProfile(user);
    },
    queryKey: [PROFILE_QUERY_KEY, user?.id],
  });
}
