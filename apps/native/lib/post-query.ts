import type { Query, QueryClient } from "@tanstack/react-query";

function isPostQuery(query: Query) {
  const [scope, routerName] = query.queryKey;

  return scope === "trpc" && routerName === "posts";
}

export async function refreshPostQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    predicate: isPostQuery,
  });

  await queryClient.refetchQueries({
    predicate: isPostQuery,
    type: "active",
  });
}
