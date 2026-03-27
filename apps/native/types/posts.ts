import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@wheresmydorm/api/routers/index";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type FeedPage = RouterOutputs["posts"]["list"];
export type FeedItem = FeedPage["items"][number];
export type PostDetail = RouterOutputs["posts"]["getById"];
export type PostComment = RouterOutputs["posts"]["getComments"][number];
export type PostReaction = RouterInputs["posts"]["react"]["reaction"];
