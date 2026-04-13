import {
  db,
  inquiryStatuses,
  listings,
  messages,
  profiles,
} from "@wheresmydorm/db";
import { and, asc, eq, inArray, or, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import {
  decodeThreadId,
  encodeThreadId,
  threadIdInputSchema,
} from "../lib/messages";
import { formatProfileName } from "../lib/profile";

export const messageThreadProcedures = {
  getThreads: protectedProcedure.query(async ({ ctx }) => {
    // Step 1: latest message id per thread via DISTINCT ON
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

    if (latestMessageIds.rows.length === 0) return [];

    const ids = latestMessageIds.rows.map((r) => r.id);

    // Step 2: batch fetch with relations
    const latestMessages = await db.query.messages.findMany({
      where: inArray(messages.id, ids),
      with: {
        listing: { columns: { id: true, title: true } },
        sender: { columns: { id: true, avatarUrl: true, firstName: true, lastName: true } },
        receiver: { columns: { id: true, avatarUrl: true, firstName: true, lastName: true } },
      },
    });

    // Step 3: unread counts — one aggregate query
    const unreadRows = await db.execute<{
      listing_id: string;
      other_user_id: string;
      cnt: string;
    }>(sql`
      SELECT listing_id, sender_id AS other_user_id, COUNT(*)::int AS cnt
      FROM messages
      WHERE receiver_id = ${ctx.userId}
        AND is_read = false
        AND is_deleted = false
      GROUP BY listing_id, sender_id
    `);
    const unreadMap = new Map(
      unreadRows.rows.map((r) => [
        encodeThreadId(r.listing_id, r.other_user_id),
        Number(r.cnt),
      ]),
    );

    // Step 4: inquiry statuses (lister-only)
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
        (l, r) => r.lastMessage.createdAt.getTime() - l.lastMessage.createdAt.getTime(),
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
            and(eq(messages.senderId, ctx.userId), eq(messages.receiverId, otherUserId)),
            and(eq(messages.senderId, otherUserId), eq(messages.receiverId, ctx.userId)),
          ),
        ),
        orderBy: [asc(messages.createdAt)],
        with: {
          listing: { columns: { id: true, title: true } },
          sender: { columns: { id: true, avatarUrl: true, firstName: true, lastName: true } },
          receiver: { columns: { id: true, avatarUrl: true, firstName: true, lastName: true } },
        },
      });

      const fallbackListing =
        threadMessages[0]?.listing ??
        (await db.query.listings.findFirst({
          where: eq(listings.id, listingId),
          columns: { id: true, title: true },
        })) ??
        null;

      const fallbackOtherUser =
        threadMessages[0] == null
          ? await db.query.profiles.findFirst({
              where: eq(profiles.id, otherUserId),
              columns: { id: true, avatarUrl: true, firstName: true, lastName: true },
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

  markRead: protectedProcedure
    .input(threadIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, otherUserId } = decodeThreadId(input.threadId);

      await db
        .update(messages)
        .set({ isRead: true, readAt: new Date() })
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
};
