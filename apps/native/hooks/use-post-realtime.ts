import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { refreshPostQueries } from "@/lib/post-query";
import { supabase } from "@/utils/supabase";

type UsePostRealtimeOptions = {
  enabled?: boolean;
  postId?: string | null;
};

export function usePostRealtime({
  enabled = true,
  postId,
}: UsePostRealtimeOptions = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase
      .channel(postId ? `posts:${postId}` : "posts:feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: postId ? `id=eq.${postId}` : undefined,
          schema: "public",
          table: "posts",
        },
        () => {
          void refreshPostQueries(queryClient);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: postId ? `post_id=eq.${postId}` : undefined,
          schema: "public",
          table: "post_comments",
        },
        () => {
          void refreshPostQueries(queryClient);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: postId ? `post_id=eq.${postId}` : undefined,
          schema: "public",
          table: "post_reactions",
        },
        () => {
          void refreshPostQueries(queryClient);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
        },
        () => {
          void refreshPostQueries(queryClient);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, postId, queryClient]);
}
