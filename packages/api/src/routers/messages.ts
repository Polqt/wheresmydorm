import { TRPCError } from "@trpc/server";
import {
  conversationReports,
  db,
  inquiryStatuses,
  listings,
  messages,
  profiles,
  userBlocks,
} from "@wheresmydorm/db";
import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { reportReasonValues } from "../lib/moderation";
import { createNotification } from "../lib/notifications";
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

const reportConversationSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  reason: z.enum(reportReasonValues),
  threadId: z.string().min(1),
});

const setInquiryStatusSchema = z.object({
  status: z.enum(["pending", "responded", "closed"]),
  threadId: z.string().min(1),
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
    // Step 1: find the latest message id per thread using a subquery.
    // A thread is (listingId, otherUserId) — we store the smaller/larger
    // participant as the canonical key via LEAST/GREATEST so both directions
    // of a conversation collapse to one row.
    const latestMessageIds = await db.execute<{ id: string }>(sql`
      SELECT DISTINCT ON (m.listing_id, LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id))
        m.id
      FROM messages m
      WHERE m.is_deleted = false
        AND (m.sender_id = ${ctx.userId} OR m.receiver_id = ${ctx.userId})
      ORDER BY
        m.listing_id,
        LEAST(m.sender_id, m.receiver_id),
        GREATEST(m.sender_id, m.receiver_id),
        m.created_at DESC
    `);

    if (latestMessageIds.rows.length === 0) {
      return [];
    }

    const ids = latestMessageIds.rows.map((r) => r.id);

    // Step 2: fetch those messages with their relations in one query.
    const latestMessages = await db.query.messages.findMany({
      where: inArray(messages.id, ids),
      with: {
        listing: { columns: { id: true, title: true } },
        sender: { columns: { id: true, avatarUrl: true, firstName: true, lastName: true } },
        receiver: { columns: { id: true, avatarUrl: true, firstName: true, lastName: true } },
      },
    });

    // Step 3: unread counts — one aggregate query.
    const unreadRows = await db.execute<{ listing_id: string; other_user_id: string; cnt: string }>(sql`
      SELECT listing_id, sender_id AS other_user_id, COUNT(*)::int AS cnt
      FROM messages
      WHERE receiver_id = ${ctx.userId}
        AND is_read = false
        AND is_deleted = false
      GROUP BY listing_id, sender_id
    `);
    const unreadMap = new Map(
      unreadRows.rows.map((r) => [encodeThreadId(r.listing_id, r.other_user_id), Number(r.cnt)]),
    );

    // Step 4: inquiry statuses (lister-only).
    const inquiryRows =
      ctx.role === "lister" || ctx.role === "admin"
        ? await db.query.inquiryStatuses.findMany({
            where: eq(inquiryStatuses.listerId, ctx.userId),
            columns: { finderId: true, listingId: true, status: true },
          })
        : [];
    const inquiryStatusMap = new Map(
      inquiryRows.map((row) => [
        encodeThreadId(row.listingId, row.finderId),
        row.status,
      ]),
    );

    return latestMessages
      .map((message) => {
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

        return {
          inquiryStatus: inquiryStatusMap.get(threadId) ?? ("pending" as const),
          lastMessage: {
            id: message.id,
            body: message.body,
            mediaUrl: message.mediaUrl,
            createdAt: message.createdAt,
            isRead: message.isRead,
            readAt: message.readAt,
            senderId: message.senderId,
          },
          listing: message.listing,
          otherUser,
          threadId,
          unreadCount: unreadMap.get(threadId) ?? 0,
        };
      })
      .sort(
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

      const listingOwner = await db.query.listings.findFirst({
        where: eq(listings.id, listingId),
        columns: { listerId: true },
      });
      const inquiryStatus =
        listingOwner?.listerId === ctx.userId
          ? await db.query.inquiryStatuses.findFirst({
              where: and(
                eq(inquiryStatuses.finderId, otherUserId),
                eq(inquiryStatuses.listerId, ctx.userId),
                eq(inquiryStatuses.listingId, listingId),
              ),
              columns: { status: true },
            })
          : null;

      return {
        inquiryStatus: inquiryStatus?.status ?? null,
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

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, input.listingId),
        columns: { id: true, listerId: true },
      });
      const senderProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, ctx.userId),
        columns: { role: true },
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found.",
        });
      }

      const senderIsLister = listing.listerId === ctx.userId;
      const receiverIsLister = listing.listerId === input.receiverId;

      if (
        senderProfile?.role !== "admin" &&
        (!receiverIsLister || senderIsLister)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Messaging is only for finder-to-lister listing inquiries.",
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

      if (!message) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Message could not be created.",
        });
      }

      if (!existingThread) {
        await db
          .update(listings)
          .set({ inquiryCount: sql`${listings.inquiryCount} + 1` })
          .where(eq(listings.id, input.listingId));

        await db.insert(inquiryStatuses).values({
          finderId: ctx.userId,
          listingId: input.listingId,
          listerId: input.receiverId,
          status: "pending",
        });
      }

      await createNotification({
        body: input.body.length > 0 ? input.body : "You received a new attachment.",
        referenceId: encodeThreadId(input.listingId, ctx.userId),
        referenceType: "thread",
        title: "New message",
        type: "new_message",
        userId: input.receiverId,
      });

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

  reportConversation: protectedProcedure
    .input(reportConversationSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, otherUserId } = decodeThreadId(input.threadId);

      const [report] = await db
        .insert(conversationReports)
        .values({
          listingId,
          notes: input.notes,
          reason: input.reason,
          reportedUserId: otherUserId,
          reporterId: ctx.userId,
        })
        .returning();

      return report;
    }),

  setInquiryStatus: protectedProcedure
    .input(setInquiryStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, otherUserId } = decodeThreadId(input.threadId);
      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, listingId),
        columns: { listerId: true },
      });

      if (!listing || listing.listerId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the lister can update inquiry status.",
        });
      }

      const existing = await db.query.inquiryStatuses.findFirst({
        where: and(
          eq(inquiryStatuses.finderId, otherUserId),
          eq(inquiryStatuses.listerId, ctx.userId),
          eq(inquiryStatuses.listingId, listingId),
        ),
        columns: { id: true },
      });

      if (!existing) {
        const [created] = await db
          .insert(inquiryStatuses)
          .values({
            finderId: otherUserId,
            listingId,
            listerId: ctx.userId,
            status: input.status,
          })
          .returning();

        return created;
      }

      const [updated] = await db
        .update(inquiryStatuses)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(inquiryStatuses.id, existing.id))
        .returning();

      return updated;
    }),
});
