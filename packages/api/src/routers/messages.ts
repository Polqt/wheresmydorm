import { TRPCError } from "@trpc/server";
import { db, listings, messages, profiles, userBlocks } from "@wheresmydorm/db";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { formatProfileName } from "../lib/profile";

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
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          columns: {
            id: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
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
        message.senderId === ctx.userId
          ? {
              avatarUrl: message.receiver.avatarUrl,
              displayName: formatProfileName({
                firstName: message.receiver.firstName,
                lastName: message.receiver.lastName,
              }),
              id: message.receiver.id,
            }
          : {
              avatarUrl: message.sender.avatarUrl,
              displayName: formatProfileName({
                firstName: message.sender.firstName,
                lastName: message.sender.lastName,
              }),
              id: message.sender.id,
            };
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
              firstName: true,
              lastName: true,
            },
          },
          receiver: {
            columns: {
              id: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const fallbackListing =
        threadMessages[0]?.listing ??
        (await db.query.listings.findFirst({
          where: eq(listings.id, listingId),
          columns: {
            id: true,
            title: true,
          },
        })) ??
        null;

      const fallbackOtherUser =
        threadMessages[0] == null
          ? await db.query.profiles.findFirst({
              where: eq(profiles.id, otherUserId),
              columns: {
                id: true,
                avatarUrl: true,
                firstName: true,
                lastName: true,
              },
            })
          : null;

      return {
        threadId: input.threadId,
        listing: fallbackListing,
        otherUser:
          threadMessages[0] == null
            ? fallbackOtherUser
              ? {
                  avatarUrl: fallbackOtherUser.avatarUrl,
                  displayName: formatProfileName({
                    firstName: fallbackOtherUser.firstName,
                    lastName: fallbackOtherUser.lastName,
                  }),
                  id: fallbackOtherUser.id,
                }
              : null
            : threadMessages[0].senderId === ctx.userId
              ? {
                  avatarUrl: threadMessages[0].receiver.avatarUrl,
                  displayName: formatProfileName({
                    firstName: threadMessages[0].receiver.firstName,
                    lastName: threadMessages[0].receiver.lastName,
                  }),
                  id: threadMessages[0].receiver.id,
                }
              : {
                  avatarUrl: threadMessages[0].sender.avatarUrl,
                  displayName: formatProfileName({
                    firstName: threadMessages[0].sender.firstName,
                    lastName: threadMessages[0].sender.lastName,
                  }),
                  id: threadMessages[0].sender.id,
                },
        items: threadMessages.map((message) => ({
          ...message,
          receiver: {
            avatarUrl: message.receiver.avatarUrl,
            displayName: formatProfileName({
              firstName: message.receiver.firstName,
              lastName: message.receiver.lastName,
            }),
            id: message.receiver.id,
          },
          sender: {
            avatarUrl: message.sender.avatarUrl,
            displayName: formatProfileName({
              firstName: message.sender.firstName,
              lastName: message.sender.lastName,
            }),
            id: message.sender.id,
          },
        })),
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

      const existingThread = await db.query.messages.findFirst({
        where: and(
          eq(messages.listingId, input.listingId),
          or(
            and(
              eq(messages.senderId, ctx.userId),
              eq(messages.receiverId, input.receiverId),
            ),
            and(
              eq(messages.senderId, input.receiverId),
              eq(messages.receiverId, ctx.userId),
            ),
          ),
        ),
        columns: { id: true },
      });

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

      if (!existingThread) {
        await db
          .update(listings)
          .set({ inquiryCount: sql`${listings.inquiryCount} + 1` })
          .where(eq(listings.id, input.listingId));
      }

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
