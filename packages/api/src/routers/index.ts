import { publicProcedure, router } from "../index.js";
import { listingsRouter } from "./listings.js";
import { messagesRouter } from "./messages.js";
import { postsRouter } from "./posts.js";
import { profilesRouter } from "./profiles.js";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  profiles: profilesRouter,
  listings: listingsRouter,
  messages: messagesRouter,
  posts: postsRouter,
});
export type AppRouter = typeof appRouter;
