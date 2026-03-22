import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@wheresmydorm/api/routers/index";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type FeedPost = RouterOutputs["posts"]["list"]["items"][number];
export type PostComment = RouterOutputs["posts"]["getComments"][number];
export type MessageThread = RouterOutputs["messages"]["getThreads"][number];
export type ThreadMessage =
  RouterOutputs["messages"]["getMessages"]["items"][number];
