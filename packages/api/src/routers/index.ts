import { publicProcedure, router } from "../index";
import { listingsRouter } from "./listings";
import { messagesRouter } from "./messages";
import { postsRouter } from "./posts";
import { profilesRouter } from "./profiles";
import { reviewsRouter } from "./reviews";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  profiles: profilesRouter,
  listings: listingsRouter,
  messages: messagesRouter,
  posts: postsRouter,
  reviews: reviewsRouter,
});
export type AppRouter = typeof appRouter;
