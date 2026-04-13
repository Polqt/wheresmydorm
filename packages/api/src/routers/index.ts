import { publicProcedure, router } from "../index";
import { adminRouter } from "./admin";
import { listingsRouter } from "./listings";
import { messagesRouter } from "./messages";
import { notificationsRouter } from "./notifications";
import { paymentsRouter } from "./payments";
import { postsRouter } from "./posts";
import { profilesRouter } from "./profiles";
import { reviewsRouter } from "./reviews";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  admin: adminRouter,
  profiles: profilesRouter,
  listings: listingsRouter,
  messages: messagesRouter,
  notifications: notificationsRouter,
  payments: paymentsRouter,
  posts: postsRouter,
  reviews: reviewsRouter,
});
export type AppRouter = typeof appRouter;
