import { TRPCError } from "@trpc/server";
import {
  conversationReports,
  db,
  inquiryStatuses,
  listings,
  messages,
  userBlocks,
} from "@wheresmydorm/db";
import { and, eq, or, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { createNotification } from "../lib/notifications";
import {
  blockUserSchema,
  decodeThreadId,
  encodeThreadId,
  reportConversationSchema,
  sendMessageSchema,
  setInquiryStatusSchema,
} from "../lib/messages";

export const messageActionProcedures = {
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

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      const senderIsLister = listing.listerId === ctx.userId;
      const receiverIsLister = listing.listerId === input.receiverId;

      const senderProfile = await db.query.profiles.findFirst({
        where: (p, { eq: deq }) => deq(p.id, ctx.userId),
        columns: { role: true },
      });

      if (senderProfile?.role !== "admin" && (!receiverIsLister || senderIsLister)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Messaging is only for finder-to-lister listing inquiries.",
        });
      }

      const existingThread = await db.query.messages.findFirst({
        where: and(
          eq(messages.listingId, input.listingId),
          or(
            and(eq(messages.senderId, ctx.userId), eq(messages.receiverId, input.receiverId)),
            and(eq(messages.senderId, input.receiverId), eq(messages.receiverId, ctx.userId)),
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

  blockUser: protectedProcedure
    .input(blockUserSchema)
    .mutation(async ({ ctx, input }) => {
      const existingBlock = await db.query.userBlocks.findFirst({
        where: and(
          eq(userBlocks.blockerId, ctx.userId),
          eq(userBlocks.blockedId, input.userId),
        ),
      });

      if (existingBlock) return existingBlock;

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
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(inquiryStatuses.id, existing.id))
        .returning();

      return updated;
    }),
};
