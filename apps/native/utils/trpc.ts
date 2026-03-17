import type { AppRouter } from "@wheresmydorm/api/routers/index";

import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { env } from "@wheresmydorm/env/native";

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.EXPO_PUBLIC_SERVER_URL}/api/trpc`,
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
