import { TRPCError } from "@trpc/server";
import { db, messages, userBlocks } from "@wheresmydorm/db";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index.js";

const threadIdSeparator = "__";

const threadIdInputSchema = z.object({
  threadId: z.string().min(1),
});

const sendMessageSchema = z
  .object({
    listingId: z.string().uuid(),
    receiverId: z.string().uuid(),
    body: z.string().trim().max(2000).default(""),
    mediaUrl: z.string().url().optional(),
  })
  .refine((value) => value.body.length > 0 || value.mediaUrl, {
    message: "A message needs text or an attachment.",
  });

const blockUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().max(300).optional(),
});

function encodeThreadId(listingId: string, otherUserId: string) {
  return `${listingId}${threadIdSeparator}${otherUserId}`;
}

function decodeThreadId(threadId: string) {
  const [listingId, otherUserId] = threadId.split(threadIdSeparator);

  if (!listingId || !otherUserId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid thread id." });
  }

  return {
    listingId,
    otherUserId,
  };
}

export const messagesRouter = router({
  getThreads: protectedProcedure.query(async ({ ctx }) => {
    const messageList = await db.query.messages.findMany({
      where: and(
        eq(messages.isDeleted, false),
        or(
          eq(messages.senderId, ctx.userId),
          eq(messages.receiverId, ctx.userId),
        ),
      ),
      orderBy: [desc(messages.createdAt)],
      limit: 300,
      with: {
        listing: {
          columns: {
            id: true,
            title: true,
          },
        },
        sender: {
          columns: {
            id: true,
            avatarUrl: true,
            displayName: true,
          },
        },
        receiver: {
          columns: {
            id: true,
            avatarUrl: true,
            displayName: true,
          },
        },
      },
    });

    const threadMap = new Map<
      string,
      {
        threadId: string;
        listing: { id: string; title: string };
        otherUser: {
          id: string;
          displayName: string;
          avatarUrl: string | null;
        };
        lastMessage: {
          id: string;
          body: string;
          mediaUrl: string | null;
          createdAt: Date;
          senderId: string;
        };
        unreadCount: number;
      }
    >();

    for (const message of messageList) {
      const otherUser =
        message.senderId === ctx.userId ? message.receiver : message.sender;
      const threadId = encodeThreadId(message.listingId, otherUser.id);
      const currentThread = threadMap.get(threadId);

      if (!currentThread) {
        threadMap.set(threadId, {
          threadId,
          listing: message.listing,
          otherUser,
          lastMessage: {
            id: message.id,
            body: message.body,
            mediaUrl: message.mediaUrl,
            createdAt: message.createdAt,
            senderId: message.senderId,
          },
          unreadCount:
            message.receiverId === ctx.userId && !message.isRead ? 1 : 0,
        });
        continue;
      }

      if (message.receiverId === ctx.userId && !message.isRead) {
        currentThread.unreadCount += 1;
      }
    }

    return [...threadMap.values()].sort(
      (left, right) =>
        right.lastMessage.createdAt.getTime() -
        left.lastMessage.createdAt.getTime(),
    );
  }),

  getMessages: protectedProcedure
    .input(threadIdInputSchema)
    .query(async ({ ctx, input }) => {
      const { listingId, otherUserId } = decodeThreadId(input.threadId);

      const threadMessages = await db.query.messages.findMany({
        where: and(
          eq(messages.listingId, listingId),
          eq(messages.isDeleted, false),
          or(
            and(
              eq(messages.senderId, ctx.userId),
              eq(messages.receiverId, otherUserId),
            ),
            and(
              eq(messages.senderId, otherUserId),
              eq(messages.receiverId, ctx.userId),
            ),
          ),
        ),
        orderBy: [asc(messages.createdAt)],
        with: {
          listing: {
            columns: {
              id: true,
              title: true,
            },
          },
          sender: {
            columns: {
              id: true,
              avatarUrl: true,
              displayName: true,
            },
          },
          receiver: {
            columns: {
              id: true,
              avatarUrl: true,
              displayName: true,
            },
          },
        },
      });

      return {
        threadId: input.threadId,
        listing: threadMessages[0]?.listing ?? null,
        otherUser:
          threadMessages[0] == null
            ? null
            : threadMessages[0].senderId === ctx.userId
              ? threadMessages[0].receiver
              : threadMessages[0].sender,
        items: threadMessages,
      };
    }),

  send: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const existingBlock = await db.query.userBlocks.findFirst({
        where: and(
          eq(userBlocks.blockerId, input.receiverId),
          eq(userBlocks.blockedId, ctx.userId),
        ),
      });

      if (existingBlock) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can no longer message this user.",
        });
      }

      const [message] = await db
        .insert(messages)
        .values({
          listingId: input.listingId,
          senderId: ctx.userId,
          receiverId: input.receiverId,
          body: input.body,
          mediaUrl: input.mediaUrl,
        })
        .returning();

      return {
        ...message,
        threadId: encodeThreadId(input.listingId, input.receiverId),
      };
    }),

  markRead: protectedProcedure
    .input(threadIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, otherUserId } = decodeThreadId(input.threadId);

      await db
        .update(messages)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(messages.listingId, listingId),
            eq(messages.receiverId, ctx.userId),
            eq(messages.senderId, otherUserId),
            eq(messages.isRead, false),
          ),
        );

      return { success: true };
    }),

  blockUser: protectedProcedure
    .input(blockUserSchema)
    .mutation(async ({ ctx, input }) => {
      const existingBlock = await db.query.userBlocks.findFirst({
        where: and(
          eq(userBlocks.blockerId, ctx.userId),
          eq(userBlocks.blockedId, input.userId),
        ),
      });

      if (existingBlock) {
        return existingBlock;
      }

      const [block] = await db
        .insert(userBlocks)
        .values({
          blockerId: ctx.userId,
          blockedId: input.userId,
          reason: input.reason,
        })
        .returning();

      return block;
    }),
});
