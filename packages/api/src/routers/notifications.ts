import { db, notifications } from "@wheresmydorm/db";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const listNotificationsSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

const notificationIdSchema = z.object({
  notificationId: z.string().uuid(),
});

export const notificationsRouter = router({
  list: protectedProcedure
    .input(listNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const cursorDate = input.cursor ? new Date(input.cursor) : null;

      const rows = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, ctx.userId),
          cursorDate ? lt(notifications.createdAt, cursorDate) : undefined,
        ),
        orderBy: [desc(notifications.createdAt)],
        limit: input.limit + 1,
      });

      const hasNextPage = rows.length > input.limit;
      const items = hasNextPage ? rows.slice(0, input.limit) : rows;

      return {
        items,
        nextCursor: hasNextPage
          ? (items[items.length - 1]?.createdAt.toISOString() ?? null)
          : null,
      };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const unreadItems = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.userId),
          eq(notifications.isRead, false),
        ),
      );

    return { count: unreadItems[0]?.count ?? 0 };
  }),

  markRead: protectedProcedure
    .input(notificationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.userId),
          ),
        )
        .returning();

      return updated ?? null;
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, ctx.userId),
          eq(notifications.isRead, false),
        ),
      );

    return { success: true };
  }),
});
