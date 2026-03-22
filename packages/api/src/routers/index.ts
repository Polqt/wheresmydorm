import { publicProcedure, router } from "../index.js";
import { messagesRouter } from "./messages.js";
import { postsRouter } from "./posts.js";
import { profilesRouter } from "./profiles.js";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  profiles: profilesRouter,
  messages: messagesRouter,
  posts: postsRouter,
});
export type AppRouter = typeof appRouter;
